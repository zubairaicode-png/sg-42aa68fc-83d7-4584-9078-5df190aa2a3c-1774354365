import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Expense = Database["public"]["Tables"]["expenses"]["Row"];
type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"];
type ExpenseUpdate = Database["public"]["Tables"]["expenses"]["Update"];

export const expenseService = {
  // Get all expenses
  async getAll(): Promise<Expense[]> {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("expense_date", { ascending: false });

    if (error) {
      console.error("Error fetching expenses:", error);
      throw error;
    }

    return data || [];
  },

  // Get expense by ID
  async getById(id: string): Promise<Expense | null> {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching expense:", error);
      throw error;
    }

    return data;
  },

  // Create new expense
  async create(expense: ExpenseInsert): Promise<Expense> {
    const { data, error } = await supabase
      .from("expenses")
      .insert(expense)
      .select()
      .single();

    if (error) {
      console.error("Error creating expense:", error);
      throw error;
    }

    return data;
  },

  // Update expense
  async update(id: string, updates: ExpenseUpdate): Promise<Expense> {
    const { data, error } = await supabase
      .from("expenses")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating expense:", error);
      throw error;
    }

    return data;
  },

  // Delete expense
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting expense:", error);
      throw error;
    }
  },

  // Get expense statistics
  async getStatistics(): Promise<{
    totalExpenses: number;
    pendingApproval: number;
    approvedThisMonth: number;
    paidThisMonth: number;
  }> {
    const { data, error } = await supabase
      .from("expenses")
      .select("amount, status, expense_date");

    if (error) {
      console.error("Error fetching expense statistics:", error);
      throw error;
    }

    const expenses = data || [];
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      totalExpenses: expenses.reduce((sum, exp) => sum + exp.amount, 0),
      pendingApproval: expenses.filter(exp => exp.status === "pending_approval").length,
      approvedThisMonth: expenses.filter(exp => 
        exp.status === "approved" && new Date(exp.expense_date) >= firstDayOfMonth
      ).reduce((sum, exp) => sum + exp.amount, 0),
      paidThisMonth: expenses.filter(exp => 
        exp.status === "paid" && new Date(exp.expense_date) >= firstDayOfMonth
      ).reduce((sum, exp) => sum + exp.amount, 0),
    };
  },

  // Get expenses by category
  async getByCategory(): Promise<Array<{ category: string; total: number; count: number }>> {
    const { data, error } = await supabase
      .from("expenses")
      .select("category, amount");

    if (error) {
      console.error("Error fetching expenses by category:", error);
      throw error;
    }

    const expenses = data || [];
    const categoryMap = new Map<string, { total: number; count: number }>();

    expenses.forEach(exp => {
      const current = categoryMap.get(exp.category) || { total: 0, count: 0 };
      categoryMap.set(exp.category, {
        total: current.total + exp.amount,
        count: current.count + 1,
      });
    });

    return Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      ...stats,
    }));
  },
};