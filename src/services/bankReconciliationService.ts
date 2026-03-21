import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type BankAccount = Database["public"]["Tables"]["bank_accounts"]["Row"];
type BankReconciliation = Database["public"]["Tables"]["bank_reconciliations"]["Row"];
type BankTransaction = Database["public"]["Tables"]["bank_transactions"]["Row"];

export interface BankAccountWithBalance extends BankAccount {
  current_balance: number;
}

export interface ReconciliationWithTransactions extends BankReconciliation {
  matched_count: number;
  unmatched_count: number;
  total_matched_amount: number;
}

export interface BankTransactionWithMatching extends BankTransaction {
  is_matched: boolean;
  matched_journal_id?: string;
}

export const bankReconciliationService = {
  // Bank Accounts
  async getBankAccounts(): Promise<BankAccountWithBalance[]> {
    const { data, error } = await supabase
      .from("bank_accounts")
      .select("*")
      .order("account_name");

    if (error) throw error;
    return (data || []) as BankAccountWithBalance[];
  },

  async createBankAccount(account: Omit<BankAccount, "id" | "created_at" | "updated_at" | "created_by">) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await (supabase.from("bank_accounts") as any)
      .insert({
        ...account,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateBankAccount(id: string, updates: Partial<BankAccount>) {
    const { data, error } = await (supabase.from("bank_accounts") as any)
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Bank Transactions
  async getBankTransactions(bankAccountId: string, startDate?: string, endDate?: string): Promise<BankTransactionWithMatching[]> {
    let query = (supabase.from("bank_transactions") as any)
      .select("*")
      .eq("account_id", bankAccountId)
      .order("transaction_date", { ascending: false });

    if (startDate) query = query.gte("transaction_date", startDate);
    if (endDate) query = query.lte("transaction_date", endDate);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as BankTransactionWithMatching[];
  },

  async importBankTransactions(bankAccountId: string, transactions: Array<Omit<BankTransaction, "id" | "account_id" | "created_at" | "created_by">>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const transactionsToInsert = transactions.map(t => ({
      ...t,
      account_id: bankAccountId,
      created_by: user.id,
    }));

    const { data, error } = await (supabase.from("bank_transactions") as any)
      .insert(transactionsToInsert)
      .select();

    if (error) throw error;
    return data;
  },

  // Reconciliation
  async createReconciliation(reconciliation: Omit<BankReconciliation, "id" | "created_at" | "updated_at" | "created_by">) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await (supabase.from("bank_reconciliations") as any)
      .insert({
        ...reconciliation,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getReconciliations(bankAccountId?: string): Promise<ReconciliationWithTransactions[]> {
    let query = (supabase.from("bank_reconciliations") as any)
      .select("*")
      .order("reconciliation_date", { ascending: false });

    if (bankAccountId) query = query.eq("account_id", bankAccountId);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as ReconciliationWithTransactions[];
  },

  async matchTransaction(transactionId: string, journalEntryId: string) {
    const { data, error } = await (supabase.from("bank_transactions") as any)
      .update({ 
        reconciled: true,
        matched_transaction_id: journalEntryId 
      })
      .eq("id", transactionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async unmatchTransaction(transactionId: string) {
    const { data, error } = await (supabase.from("bank_transactions") as any)
      .update({ 
        reconciled: false,
        matched_transaction_id: null 
      })
      .eq("id", transactionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};