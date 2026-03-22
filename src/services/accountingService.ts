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
  },

  // Helper method to get account ID by code
  async getAccountIdByCode(code: string): Promise<string | null> {
    const { data, error } = await supabase
      .from("chart_of_accounts")
      .select("id")
      .eq("account_code", code)
      .single();

    if (error) {
      console.error(`Error fetching account with code ${code}:`, error);
      return null;
    }

    return data?.id;
  },

  // Create journal entry from Sales Invoice
  async createJournalEntryFromSale(invoice: any): Promise<void> {
    try {
      // Get necessary account IDs
      const cashAccountId = await this.getAccountIdByCode("1100"); // Cash
      const arAccountId = await this.getAccountIdByCode("1200"); // Accounts Receivable
      const salesRevenueAccountId = await this.getAccountIdByCode("4100"); // Sales Revenue
      const vatPayableAccountId = await this.getAccountIdByCode("2200"); // VAT Payable

      if (!salesRevenueAccountId || !vatPayableAccountId || (!cashAccountId && !arAccountId)) {
        throw new Error("Required accounts not found in chart of accounts");
      }

      // Determine debit account based on payment status/type
      const isPaid = invoice.payment_status === "paid" || invoice.payment_type === "cash";
      const debitAccountId = isPaid ? cashAccountId : arAccountId;
      
      if (!debitAccountId) throw new Error("Debit account not found");

      // Calculate amounts
      const totalAmount = Number(invoice.total_amount || 0);
      const taxAmount = Number(invoice.tax_amount || 0);
      const subtotal = totalAmount - taxAmount;

      const lines = [
        // Debit: Cash or A/R (Total Amount)
        {
          account_id: debitAccountId,
          description: `Sales Invoice ${invoice.invoice_number}`,
          debit: totalAmount,
          credit: 0
        },
        // Credit: Sales Revenue (Subtotal)
        {
          account_id: salesRevenueAccountId,
          description: `Sales Revenue - Inv ${invoice.invoice_number}`,
          debit: 0,
          credit: subtotal
        }
      ];

      // Credit: VAT Payable (Tax Amount) - only if there's tax
      if (taxAmount > 0) {
        lines.push({
          account_id: vatPayableAccountId,
          description: `VAT on Sales - Inv ${invoice.invoice_number}`,
          debit: 0,
          credit: taxAmount
        });
      }

      await this.createJournalEntry({
        entry_date: invoice.invoice_date || new Date().toISOString().split('T')[0],
        description: `Sales Invoice ${invoice.invoice_number} to ${invoice.customer_name}`,
        reference_type: "sale",
        reference_id: invoice.id,
        status: "posted"
      }, lines);

    } catch (error) {
      console.error("Error creating journal entry from sale:", error);
      throw error;
    }
  },

  // Create journal entry from Purchase Invoice
  async createJournalEntryFromPurchase(purchase: any): Promise<void> {
    try {
      const cashAccountId = await this.getAccountIdByCode("1100"); // Cash
      const apAccountId = await this.getAccountIdByCode("2100"); // Accounts Payable
      const inventoryAccountId = await this.getAccountIdByCode("1300"); // Inventory / Purchases
      const vatPayableAccountId = await this.getAccountIdByCode("2200"); // VAT Payable (Input VAT)

      if (!inventoryAccountId || !vatPayableAccountId || (!cashAccountId && !apAccountId)) {
        throw new Error("Required accounts not found in chart of accounts");
      }

      const isPaid = purchase.payment_status === "paid";
      const creditAccountId = isPaid ? cashAccountId : apAccountId;

      if (!creditAccountId) throw new Error("Credit account not found");

      const totalAmount = Number(purchase.total_amount || 0);
      const taxAmount = Number(purchase.tax_amount || 0);
      const subtotal = totalAmount - taxAmount;

      const lines = [
        // Debit: Inventory / Purchases (Subtotal)
        {
          account_id: inventoryAccountId,
          description: `Purchase Invoice ${purchase.invoice_number}`,
          debit: subtotal,
          credit: 0
        },
        // Credit: Cash or A/P (Total Amount)
        {
          account_id: creditAccountId,
          description: `Payment for Purchase Inv ${purchase.invoice_number}`,
          debit: 0,
          credit: totalAmount
        }
      ];

      // Debit: VAT Payable (Tax Amount)
      if (taxAmount > 0) {
        lines.push({
          account_id: vatPayableAccountId,
          description: `Input VAT - Purchase Inv ${purchase.invoice_number}`,
          debit: taxAmount,
          credit: 0
        });
      }

      await this.createJournalEntry({
        entry_date: purchase.invoice_date || new Date().toISOString().split('T')[0],
        description: `Purchase Invoice ${purchase.invoice_number}`,
        reference_type: "purchase",
        reference_id: purchase.id,
        status: "posted"
      }, lines);

    } catch (error) {
      console.error("Error creating journal entry from purchase:", error);
      throw error;
    }
  },

  // Create journal entry from Sales Return
  async createJournalEntryFromSalesReturn(salesReturn: any): Promise<void> {
    try {
      const cashAccountId = await this.getAccountIdByCode("1100"); // Cash
      const arAccountId = await this.getAccountIdByCode("1200"); // Accounts Receivable
      const salesReturnsAccountId = await this.getAccountIdByCode("4300"); // Sales Returns
      const vatPayableAccountId = await this.getAccountIdByCode("2200"); // VAT Payable

      if (!salesReturnsAccountId || !vatPayableAccountId || (!cashAccountId && !arAccountId)) {
        throw new Error("Required accounts not found in chart of accounts");
      }

      const creditAccountId = salesReturn.refund_method === "cash" ? cashAccountId : arAccountId;
      
      if (!creditAccountId) throw new Error("Credit account not found");

      const totalAmount = Number(salesReturn.total_amount || 0);
      const taxAmount = Number(salesReturn.tax_amount || 0);
      const subtotal = totalAmount - taxAmount;

      const lines = [
        // Debit: Sales Returns (Subtotal)
        {
          account_id: salesReturnsAccountId,
          description: `Sales Return ${salesReturn.return_number}`,
          debit: subtotal,
          credit: 0
        },
        // Credit: Cash or A/R (Total Amount)
        {
          account_id: creditAccountId,
          description: `Refund for Sales Return ${salesReturn.return_number}`,
          debit: 0,
          credit: totalAmount
        }
      ];

      // Debit: VAT Payable (Tax Amount)
      if (taxAmount > 0) {
        lines.push({
          account_id: vatPayableAccountId,
          description: `VAT Adjustment - Sales Return ${salesReturn.return_number}`,
          debit: taxAmount,
          credit: 0
        });
      }

      await this.createJournalEntry({
        entry_date: salesReturn.return_date || new Date().toISOString().split('T')[0],
        description: `Sales Return ${salesReturn.return_number}`,
        reference_type: "sales_return",
        reference_id: salesReturn.id,
        status: "posted"
      }, lines);

    } catch (error) {
      console.error("Error creating journal entry from sales return:", error);
      throw error;
    }
  },

  // Create journal entry from Purchase Return
  async createJournalEntryFromPurchaseReturn(purchaseReturn: any): Promise<void> {
    try {
      const cashAccountId = await this.getAccountIdByCode("1100"); // Cash
      const apAccountId = await this.getAccountIdByCode("2100"); // Accounts Payable
      const inventoryAccountId = await this.getAccountIdByCode("1300"); // Inventory / Purchases
      const vatPayableAccountId = await this.getAccountIdByCode("2200"); // VAT Payable

      if (!inventoryAccountId || !vatPayableAccountId || (!cashAccountId && !apAccountId)) {
        throw new Error("Required accounts not found in chart of accounts");
      }

      const debitAccountId = purchaseReturn.refund_method === "cash" ? cashAccountId : apAccountId;
      
      if (!debitAccountId) throw new Error("Debit account not found");

      const totalAmount = Number(purchaseReturn.total_amount || 0);
      const taxAmount = Number(purchaseReturn.tax_amount || 0);
      const subtotal = totalAmount - taxAmount;

      const lines = [
        // Debit: Cash or A/P (Total Amount)
        {
          account_id: debitAccountId,
          description: `Refund for Purchase Return ${purchaseReturn.return_number}`,
          debit: totalAmount,
          credit: 0
        },
        // Credit: Inventory / Purchases (Subtotal)
        {
          account_id: inventoryAccountId,
          description: `Purchase Return ${purchaseReturn.return_number}`,
          debit: 0,
          credit: subtotal
        }
      ];

      // Credit: VAT Payable (Tax Amount)
      if (taxAmount > 0) {
        lines.push({
          account_id: vatPayableAccountId,
          description: `VAT Adjustment - Purchase Return ${purchaseReturn.return_number}`,
          debit: 0,
          credit: taxAmount
        });
      }

      await this.createJournalEntry({
        entry_date: purchaseReturn.return_date || new Date().toISOString().split('T')[0],
        description: `Purchase Return ${purchaseReturn.return_number}`,
        reference_type: "purchase_return",
        reference_id: purchaseReturn.id,
        status: "posted"
      }, lines);

    } catch (error) {
      console.error("Error creating journal entry from purchase return:", error);
      throw error;
    }
  },

  // Sync all existing transactions to create missing journal entries
  async syncAllTransactions(): Promise<{
    salesSynced: number;
    purchasesSynced: number;
    salesReturnsSynced: number;
    purchaseReturnsSynced: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let salesSynced = 0;
    let purchasesSynced = 0;
    let salesReturnsSynced = 0;
    let purchaseReturnsSynced = 0;

    try {
      // Get all existing journal entries to check which transactions already have entries
      const { data: existingEntries } = await supabase
        .from("journal_entries")
        .select("reference_type, reference_id");

      const existingRefs = new Set(
        existingEntries?.map(e => `${e.reference_type}-${e.reference_id}`) || []
      );

      // Sync Sales Invoices
      const { data: sales } = await supabase
        .from("sales_invoices")
        .select("*")
        .order("created_at");

      if (sales) {
        for (const invoice of sales) {
          const refKey = `sale-${invoice.id}`;
          if (!existingRefs.has(refKey)) {
            try {
              await this.createJournalEntryFromSale(invoice);
              salesSynced++;
            } catch (error) {
              errors.push(`Sales Invoice ${invoice.invoice_number}: ${error}`);
            }
          }
        }
      }

      // Sync Purchases
      const { data: purchases } = await supabase
        .from("purchase_invoices")
        .select("*")
        .order("created_at");

      if (purchases) {
        for (const purchase of purchases) {
          const refKey = `purchase-${purchase.id}`;
          if (!existingRefs.has(refKey)) {
            try {
              await this.createJournalEntryFromPurchase(purchase);
              purchasesSynced++;
            } catch (error) {
              errors.push(`Purchase ${purchase.invoice_number}: ${error}`);
            }
          }
        }
      }

      // Sync Sales Returns
      const { data: salesReturns } = await supabase
        .from("sales_returns")
        .select("*")
        .order("created_at");

      if (salesReturns) {
        for (const salesReturn of salesReturns) {
          const refKey = `sales_return-${salesReturn.id}`;
          if (!existingRefs.has(refKey)) {
            try {
              await this.createJournalEntryFromSalesReturn(salesReturn);
              salesReturnsSynced++;
            } catch (error) {
              errors.push(`Sales Return ${salesReturn.return_number}: ${error}`);
            }
          }
        }
      }

      // Sync Purchase Returns
      const { data: purchaseReturns } = await supabase
        .from("purchase_returns")
        .select("*")
        .order("created_at");

      if (purchaseReturns) {
        for (const purchaseReturn of purchaseReturns) {
          const refKey = `purchase_return-${purchaseReturn.id}`;
          if (!existingRefs.has(refKey)) {
            try {
              await this.createJournalEntryFromPurchaseReturn(purchaseReturn);
              purchaseReturnsSynced++;
            } catch (error) {
              errors.push(`Purchase Return ${purchaseReturn.return_number}: ${error}`);
            }
          }
        }
      }

      return {
        salesSynced,
        purchasesSynced,
        salesReturnsSynced,
        purchaseReturnsSynced,
        errors
      };
    } catch (error) {
      console.error("Error syncing transactions:", error);
      throw error;
    }
  }
};