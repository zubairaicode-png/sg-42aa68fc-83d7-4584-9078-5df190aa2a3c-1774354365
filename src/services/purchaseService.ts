import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type PurchaseInvoice = Database["public"]["Tables"]["purchase_invoices"]["Row"];
type PurchaseInvoiceInsert = Database["public"]["Tables"]["purchase_invoices"]["Insert"];
type PurchaseInvoiceItem = Database["public"]["Tables"]["purchase_invoice_items"]["Row"];
type PurchaseInvoiceItemInsert = Database["public"]["Tables"]["purchase_invoice_items"]["Insert"];

export const purchaseService = {
  // Create new purchase invoice with items
  async createInvoice(
    invoiceData: Omit<PurchaseInvoiceInsert, "id" | "created_at" | "updated_at">,
    items: Omit<PurchaseInvoiceItemInsert, "id" | "invoice_id" | "created_at">[]
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Insert invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("purchase_invoices")
      .insert({
        ...invoiceData,
        created_by: user.id,
      })
      .select()
      .single();

    if (invoiceError) {
      console.error("Error creating purchase invoice:", invoiceError);
      throw new Error(invoiceError.message);
    }

    // Insert items
    if (items.length > 0) {
      const itemsWithInvoiceId = items.map(item => ({
        ...item,
        invoice_id: invoice.id,
      }));

      const { error: itemsError } = await supabase
        .from("purchase_invoice_items")
        .insert(itemsWithInvoiceId);

      if (itemsError) {
        console.error("Error creating purchase invoice items:", itemsError);
        throw new Error(itemsError.message);
      }
    }

    return invoice;
  },

  // Get all purchase invoices
  async getAll() {
    const { data, error } = await supabase
      .from("purchase_invoices")
      .select(`
        *,
        purchase_invoice_items(*)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching purchase invoices:", error);
      throw new Error(error.message);
    }

    return data || [];
  },

  // Get purchase invoice by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from("purchase_invoices")
      .select(`
        *,
        purchase_invoice_items(*)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching purchase invoice:", error);
      throw new Error(error.message);
    }

    return data;
  },

  // Update purchase invoice
  async updateInvoice(
    id: string,
    invoiceData: Partial<PurchaseInvoiceInsert>,
    items?: Omit<PurchaseInvoiceItemInsert, "id" | "invoice_id" | "created_at">[]
  ) {
    // Update invoice
    const { error: invoiceError } = await supabase
      .from("purchase_invoices")
      .update({
        ...invoiceData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (invoiceError) {
      console.error("Error updating purchase invoice:", invoiceError);
      throw new Error(invoiceError.message);
    }

    // Update items if provided
    if (items) {
      // Delete existing items
      await supabase
        .from("purchase_invoice_items")
        .delete()
        .eq("invoice_id", id);

      // Insert new items
      if (items.length > 0) {
        const itemsWithInvoiceId = items.map(item => ({
          ...item,
          invoice_id: id,
        }));

        const { error: itemsError } = await supabase
          .from("purchase_invoice_items")
          .insert(itemsWithInvoiceId);

        if (itemsError) {
          console.error("Error updating purchase invoice items:", itemsError);
          throw new Error(itemsError.message);
        }
      }
    }
  },

  // Delete purchase invoice
  async delete(id: string) {
    const { error } = await supabase
      .from("purchase_invoices")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting purchase invoice:", error);
      throw new Error(error.message);
    }
  },
};