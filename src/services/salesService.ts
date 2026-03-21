import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type SalesInvoice = Database["public"]["Tables"]["sales_invoices"]["Row"];
type SalesInvoiceInsert = Database["public"]["Tables"]["sales_invoices"]["Insert"];
type SalesInvoiceUpdate = Database["public"]["Tables"]["sales_invoices"]["Update"];
type SalesInvoiceItem = Database["public"]["Tables"]["sales_invoice_items"]["Row"];
type SalesInvoiceItemInsert = Database["public"]["Tables"]["sales_invoice_items"]["Insert"];

export const salesService = {
  // Get all sales invoices with customer data
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from("sales_invoices")
      .select(`
        *,
        customer:customers(id, name, email, phone, vat_number)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching sales invoices:", error);
      throw error;
    }

    return data || [];
  },

  // Get sales invoice by ID with items
  async getById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from("sales_invoices")
      .select(`
        *,
        customer:customers(id, name, email, phone, vat_number, address),
        items:sales_invoice_items(
          id,
          product_id,
          product:products(id, name, sku),
          quantity,
          unit_price,
          discount_percentage,
          discount_amount,
          tax_rate,
          tax_amount,
          total
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching sales invoice:", error);
      throw error;
    }

    return data;
  },

  // Create new sales invoice with items
  async create(invoice: SalesInvoiceInsert, items: SalesInvoiceItemInsert[]): Promise<SalesInvoice> {
    // Create invoice
    const { data: invoiceData, error: invoiceError } = await supabase
      .from("sales_invoices")
      .insert(invoice)
      .select()
      .single();

    if (invoiceError) {
      console.error("Error creating sales invoice:", invoiceError);
      throw invoiceError;
    }

    // Create invoice items
    const itemsWithInvoiceId = items.map(item => ({
      ...item,
      invoice_id: invoiceData.id,
    }));

    const { error: itemsError } = await supabase
      .from("sales_invoice_items")
      .insert(itemsWithInvoiceId);

    if (itemsError) {
      console.error("Error creating sales invoice items:", itemsError);
      throw itemsError;
    }

    // Update product stock
    for (const item of items) {
      if (item.product_id) {
        const { data: product } = await supabase
          .from("products")
          .select("stock_quantity")
          .eq("id", item.product_id)
          .single();

        if (product) {
          await supabase
            .from("products")
            .update({ stock_quantity: product.stock_quantity - item.quantity })
            .eq("id", item.product_id);
        }
      }
    }

    return invoiceData;
  },

  // Update sales invoice
  async update(id: string, updates: SalesInvoiceUpdate): Promise<SalesInvoice> {
    const { data, error } = await supabase
      .from("sales_invoices")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating sales invoice:", error);
      throw error;
    }

    return data;
  },

  // Delete sales invoice
  async delete(id: string): Promise<void> {
    // Delete items first (cascade should handle this, but explicit is safer)
    await supabase
      .from("sales_invoice_items")
      .delete()
      .eq("invoice_id", id);

    const { error } = await supabase
      .from("sales_invoices")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting sales invoice:", error);
      throw error;
    }
  },

  // Get sales statistics
  async getStatistics(): Promise<{
    totalSales: number;
    totalInvoices: number;
    paidInvoices: number;
    unpaidInvoices: number;
  }> {
    const { data, error } = await supabase
      .from("sales_invoices")
      .select("total_amount, payment_status");

    if (error) {
      console.error("Error fetching sales statistics:", error);
      throw error;
    }

    const invoices = data || [];
    
    return {
      totalSales: invoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0),
      totalInvoices: invoices.length,
      paidInvoices: invoices.filter(inv => inv.payment_status === "paid").length,
      unpaidInvoices: invoices.filter(inv => inv.payment_status === "unpaid").length,
    };
  },
};