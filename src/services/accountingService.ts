import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ChartOfAccount = Database["public"]["Tables"]["chart_of_accounts"]["Row"];
type ChartOfAccountInsert = Database["public"]["Tables"]["chart_of_accounts"]["Insert"];
type ChartOfAccountUpdate = Database["public"]["Tables"]["chart_of_accounts"]["Update"];

type JournalEntry = Database["public"]["Tables"]["journal_entries"]["Row"];
type JournalEntryInsert = Database["public"]["Tables"]["journal_entries"]["Insert"];

type JournalEntryLine = Database["public"]["Tables"]["journal_entry_lines"]["Row"];
type JournalEntryLineInsert = Database["public"]["Tables"]["journal_entry_lines"]["Insert"];

export interface AccountWithBalance extends ChartOfAccount {
  debit: number;
  credit: number;
}

export interface JournalEntryWithLines extends JournalEntry {
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
}

export const accountingService = {
  // Get all accounts
  async getAllAccounts(): Promise<ChartOfAccount[]> {
    const { data, error } = await supabase
      .from("chart_of_accounts")
      .select("*")
      .eq("is_active", true)
      .order("account_code");

    if (error) {
      console.error("Error fetching accounts:", error);
      throw error;
    }

    return data || [];
  },

  // Get accounts with balances
  async getAccountsWithBalances(): Promise<AccountWithBalance[]> {
    const accounts = await this.getAllAccounts();

    // Get all journal entry lines to calculate balances
    const { data: lines, error } = await supabase
      .from("journal_entry_lines")
      .select("account_id, debit, credit");

    if (error) {
      console.error("Error fetching journal entry lines:", error);
      throw error;
    }

    // Calculate balances for each account
    return accounts.map(account => {
      const accountLines = lines?.filter(line => line.account_id === account.id) || [];
      const debit = accountLines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
      const credit = accountLines.reduce((sum, line) => sum + Number(line.credit || 0), 0);

      return {
        ...account,
        debit,
        credit,
        current_balance: Number(account.opening_balance || 0) + debit - credit
      };
    });
  },

  // Get account by ID
  async getAccountById(id: string): Promise<ChartOfAccount | null> {
    const { data, error } = await supabase
      .from("chart_of_accounts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching account:", error);
      return null;
    }

    return data;
  },

  // Create account
  async createAccount(account: ChartOfAccountInsert): Promise<ChartOfAccount> {
    const { data, error } = await supabase
      .from("chart_of_accounts")
      .insert(account)
      .select()
      .single();

    if (error) {
      console.error("Error creating account:", error);
      throw error;
    }

    return data;
  },

  // Update account
  async updateAccount(id: string, account: ChartOfAccountUpdate): Promise<ChartOfAccount> {
    const { data, error } = await supabase
      .from("chart_of_accounts")
      .update({ ...account, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating account:", error);
      throw error;
    }

    return data;
  },

  // Get all journal entries
  async getAllJournalEntries(): Promise<JournalEntryWithLines[]> {
    const { data: entries, error: entriesError } = await supabase
      .from("journal_entries")
      .select("*")
      .order("entry_date", { ascending: false });

    if (entriesError) {
      console.error("Error fetching journal entries:", entriesError);
      throw entriesError;
    }

    if (!entries) return [];

    // Get all lines for these entries
    const { data: lines, error: linesError } = await supabase
      .from("journal_entry_lines")
      .select("*")
      .in("journal_entry_id", entries.map(e => e.id));

    if (linesError) {
      console.error("Error fetching journal entry lines:", linesError);
      throw linesError;
    }

    // Combine entries with their lines
    return entries.map(entry => {
      const entryLines = lines?.filter(line => line.journal_entry_id === entry.id) || [];
      const totalDebit = entryLines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
      const totalCredit = entryLines.reduce((sum, line) => sum + Number(line.credit || 0), 0);

      return {
        ...entry,
        lines: entryLines,
        totalDebit,
        totalCredit
      };
    });
  },

  // Create journal entry
  async createJournalEntry(
    entry: Omit<JournalEntryInsert, "entry_number">,
    lines: Omit<JournalEntryLineInsert, "journal_entry_id">[]
  ): Promise<JournalEntry> {
    // Generate entry number
    const { data: lastEntry } = await supabase
      .from("journal_entries")
      .select("entry_number")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    let entryNumber = "JE-0001";
    if (lastEntry?.entry_number) {
      const lastNum = parseInt(lastEntry.entry_number.split("-")[1]);
      if (!isNaN(lastNum)) {
        entryNumber = `JE-${String(lastNum + 1).padStart(4, "0")}`;
      }
    }

    // Create entry
    const { data: newEntry, error: entryError } = await supabase
      .from("journal_entries")
      .insert({ ...entry, entry_number: entryNumber } as JournalEntryInsert)
      .select()
      .single();

    if (entryError) {
      console.error("Error creating journal entry:", entryError);
      throw entryError;
    }

    // Create lines
    const linesWithEntryId = lines.map(line => ({
      ...line,
      journal_entry_id: newEntry.id
    })) as JournalEntryLineInsert[];

    const { error: linesError } = await supabase
      .from("journal_entry_lines")
      .insert(linesWithEntryId);

    if (linesError) {
      console.error("Error creating journal entry lines:", linesError);
      throw linesError;
    }

    return newEntry;
  },

  // Calculate financial summaries
  async getFinancialSummary() {
    const accounts = await this.getAccountsWithBalances();

    const totalAssets = accounts
      .filter(a => a.account_type === "asset")
      .reduce((sum, a) => sum + Number(a.current_balance || 0), 0);

    const totalLiabilities = accounts
      .filter(a => a.account_type === "liability")
      .reduce((sum, a) => sum + Number(a.current_balance || 0), 0);

    const totalEquity = accounts
      .filter(a => a.account_type === "equity")
      .reduce((sum, a) => sum + Number(a.current_balance || 0), 0);

    const totalRevenue = accounts
      .filter(a => a.account_type === "revenue")
      .reduce((sum, a) => sum + Number(a.current_balance || 0), 0);

    const totalExpenses = accounts
      .filter(a => a.account_type === "expense")
      .reduce((sum, a) => sum + Number(a.current_balance || 0), 0);

    const netIncome = totalRevenue - totalExpenses;

    return {
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalRevenue,
      totalExpenses,
      netIncome
    };
  }
};