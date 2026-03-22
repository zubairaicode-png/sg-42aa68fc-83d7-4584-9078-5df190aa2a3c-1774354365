import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { accountingService } from "./accountingService";

export const salesService = {
  // Get all sales invoices
  async getAllInvoices() {
    try {
      console.log("Fetching all sales invoices...");
      
      const { data, error } = await supabase
        .from("sales_invoices")
        .select(`
          *,
          items:sales_invoice_items(*)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching sales invoices:", error);
        throw error;
      }

      console.log("Sales invoices loaded:", data);
      return data || [];
    } catch (error: any) {
      console.error("Error in getAllInvoices:", error);
      throw error;
    }
  },

  // Create new sales invoice with items
  async createInvoice(invoice: any, items: any[]) {
    // 1. Start a transaction by using RPC or sequential inserts
    const { data: newInvoice, error: invoiceError } = await supabase
      .from("sales_invoices")
      .insert({
        customer_id: invoice.customer_id,
        customer_name: invoice.customer_name || "Unknown Customer",
        customer_vat: invoice.customer_vat,
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        subtotal: invoice.subtotal || invoice.total_amount - invoice.tax_amount,
        total_amount: invoice.total_amount,
        tax_amount: invoice.tax_amount,
        payment_status: invoice.status === "paid" ? "paid" : "unpaid",
        po_number: invoice.po_number,
        payment_type: invoice.payment_type || "cash",
        notes: invoice.notes,
        created_by: invoice.created_by
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // 2. Insert items
    const itemsToInsert = items.map(item => ({
      invoice_id: newInvoice.id,
      product_id: item.product_id && !item.product_id.startsWith('manual') ? item.product_id : null,
      product_name: item.product_name,
      product_code: item.product_code || null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate,
      tax_amount: item.tax_amount,
      line_total: item.total_amount,
      discount_amount: item.discount_amount || 0,
      discount_percentage: item.discount_percentage || 0
    }));

    const { error: itemsError } = await supabase
      .from("sales_invoice_items")
      .insert(itemsToInsert);

    if (itemsError) {
      console.error("Error inserting items:", itemsError);
      // We should ideally rollback the invoice here if this fails
    }
    
    // Create journal entry for the sale
    try {
      await accountingService.createJournalEntryFromSale(newInvoice);
      console.log("Journal entry created for sale");
    } catch (error) {
      console.error("Error creating journal entry for sale:", error);
      // Continue even if journal entry fails - user can manually create it
    }

    return newInvoice;
  },

  // Update invoice status
  async updateStatus(id: string, status: "unpaid" | "partial" | "paid") {
    const { data, error } = await supabase
      .from("sales_invoices")
      .update({ payment_status: status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};