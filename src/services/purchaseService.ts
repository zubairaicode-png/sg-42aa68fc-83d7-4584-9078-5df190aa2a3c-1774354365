import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { accountingService } from "./accountingService";

type PurchaseInvoice = Database["public"]["Tables"]["purchase_invoices"]["Row"];
type PurchaseInvoiceInsert = Database["public"]["Tables"]["purchase_invoices"]["Insert"];
type PurchaseInvoiceItem = Database["public"]["Tables"]["purchase_invoice_items"]["Row"];
type PurchaseInvoiceItemInsert = Database["public"]["Tables"]["purchase_invoice_items"]["Insert"];

export const purchaseService = {
  // Create purchase invoice with items
  async createInvoice(purchaseData: any, itemsData: any[]) {
    try {
      console.log("Creating purchase invoice with data:", purchaseData);

      // Insert the invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("purchase_invoices")
        .insert([purchaseData])
        .select()
        .single();

      if (invoiceError) {
        console.error("Error creating invoice:", invoiceError);
        throw new Error(`Failed to create invoice: ${invoiceError.message}`);
      }

      if (!invoice) {
        throw new Error("Invoice creation returned no data");
      }

      console.log("Invoice created:", invoice);

      // Prepare items with invoice ID
      const itemsWithInvoiceId = itemsData.map(item => ({
        ...item,
        invoice_id: invoice.id,
      }));

      console.log("Creating invoice items:", itemsWithInvoiceId);

      // Insert the items
      const { data: items, error: itemsError } = await supabase
        .from("purchase_invoice_items")
        .insert(itemsWithInvoiceId)
        .select();

      if (itemsError) {
        console.error("Error creating invoice items:", itemsError);
        // Try to delete the invoice if items failed
        await supabase.from("purchase_invoices").delete().eq("id", invoice.id);
        throw new Error(`Failed to create invoice items: ${itemsError.message}`);
      }

      console.log("Invoice items created:", items);

      // Create journal entry for the purchase
      try {
        await accountingService.createJournalEntryFromPurchase(invoice);
        console.log("Journal entry created for purchase");
      } catch (error) {
        console.error("Error creating journal entry for purchase:", error);
        // Continue even if journal entry fails
      }

      return invoice;
    } catch (error: any) {
      console.error("Error in createInvoice:", error);
      throw error;
    }
  },

  // Get all purchase invoices
  async getAll() {
    try {
      const { data, error } = await supabase
        .from("purchase_invoices")
        .select(`
          *,
          purchase_invoice_items (*)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching purchase invoices:", error);
        throw new Error(error.message);
      }

      return data || [];
    } catch (error: any) {
      console.error("Error in getAll:", error);
      throw error;
    }
  },

  // Get invoice by ID
  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from("purchase_invoices")
        .select(`
          *,
          purchase_invoice_items (*)
        `)
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching purchase invoice:", error);
        throw new Error(error.message);
      }

      return data;
    } catch (error: any) {
      console.error("Error in getById:", error);
      throw error;
    }
  },

  // Update invoice
  async update(id: string, updates: any) {
    try {
      const { error } = await supabase
        .from("purchase_invoices")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        console.error("Error updating purchase invoice:", error);
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error("Error in update:", error);
      throw error;
    }
  },

  // Delete invoice
  async delete(id: string) {
    try {
      const { error } = await supabase
        .from("purchase_invoices")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting purchase invoice:", error);
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error("Error in delete:", error);
      throw error;
    }
  },
};