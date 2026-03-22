import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { accountingService } from "./accountingService";

export const salesReturnService = {
  // Get all sales returns with customer and items
  async getAll() {
    const { data, error } = await supabase
      .from("sales_returns")
      .select(`
        *,
        customer:customers(name, name_ar),
        items:sales_return_items(*)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching sales returns:", error);
      throw error;
    }

    console.log("Sales returns loaded:", data);
    return data || [];
  },

  // Get single sales return by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from("sales_returns")
      .select(`
        *,
        customer:customers(name, name_ar, email, phone, vat_number),
        items:sales_return_items(*)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching sales return:", error);
      throw error;
    }

    return data;
  },

  // Create new sales return with items
  async create(returnData: any, items: any[]) {
    try {
      console.log("Creating sales return with data:", returnData);

      // Insert the sales return
      const { data: salesReturn, error: returnError } = await supabase
        .from("sales_returns")
        .insert([returnData])
        .select()
        .single();

      if (returnError) {
        console.error("Error creating sales return:", returnError);
        throw new Error(`Failed to create sales return: ${returnError.message}`);
      }

      if (!salesReturn) {
        throw new Error("Sales return creation returned no data");
      }

      console.log("Sales return created:", salesReturn);

      // Prepare items with return ID
      const itemsWithReturnId = items.map(item => ({
        ...item,
        return_id: salesReturn.id,
      }));

      console.log("Creating sales return items:", itemsWithReturnId);

      // Insert the items
      const { data: returnItems, error: itemsError } = await supabase
        .from("sales_return_items")
        .insert(itemsWithReturnId)
        .select();

      if (itemsError) {
        console.error("Error creating sales return items:", itemsError);
        // Try to delete the return if items failed
        await supabase.from("sales_returns").delete().eq("id", salesReturn.id);
        throw new Error(`Failed to create sales return items: ${itemsError.message}`);
      }

      console.log("Sales return items created:", returnItems);
      
      // Create journal entry for the sales return
      try {
        await accountingService.createJournalEntryFromSalesReturn(salesReturn);
        console.log("Journal entry created for sales return");
      } catch (error) {
        console.error("Error creating journal entry for sales return:", error);
        // Continue even if journal entry fails
      }

      return salesReturn;
    } catch (error: any) {
      console.error("Error in create:", error);
      throw error;
    }
  },

  // Update sales return status
  async updateStatus(id: string, status: "pending" | "approved" | "refunded" | "cancelled") {
    const { data, error } = await supabase
      .from("sales_returns")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating sales return status:", error);
      throw error;
    }

    return data;
  },

  // Update refund information
  async updateRefund(id: string, refundAmount: number, refundMethod: "cash" | "credit" | "bank") {
    const { data, error } = await supabase
      .from("sales_returns")
      .update({ 
        refund_amount: refundAmount,
        refund_method: refundMethod,
        status: "refunded"
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating sales return refund:", error);
      throw error;
    }

    return data;
  },

  // Delete sales return
  async delete(id: string) {
    try {
      const { error } = await supabase
        .from("sales_returns")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting sales return:", error);
        throw error;
      }

      return true;
    } catch (error: any) {
      console.error("Error in delete:", error);
      throw error;
    }
  },
};