import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Quotation = Database["public"]["Tables"]["quotations"]["Row"];
type QuotationInsert = Database["public"]["Tables"]["quotations"]["Insert"];
type QuotationUpdate = Database["public"]["Tables"]["quotations"]["Update"];
type QuotationItem = Database["public"]["Tables"]["quotation_items"]["Row"];
type QuotationItemInsert = Database["public"]["Tables"]["quotation_items"]["Insert"];

export interface QuotationWithItems extends Quotation {
  quotation_items: QuotationItem[];
  customers?: {
    name: string;
    email: string | null;
    phone: string | null;
  };
}

export interface CreateQuotationData {
  customer_id: string;
  quotation_date: string;
  valid_until: string;
  status?: string;
  notes?: string;
  discount_amount?: number;
  tax_amount?: number;
  items: {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    discount_amount?: number;
  }[];
}

export const quotationService = {
  async getAll(): Promise<QuotationWithItems[]> {
    const { data, error } = await supabase
      .from("quotations")
      .select(`
        *,
        quotation_items(*),
        customers(name, email, phone)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching quotations:", error);
      throw error;
    }

    return (data || []) as QuotationWithItems[];
  },

  async getById(id: string): Promise<QuotationWithItems | null> {
    const { data, error } = await supabase
      .from("quotations")
      .select(`
        *,
        quotation_items(*),
        customers(name, email, phone)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching quotation:", error);
      throw error;
    }

    return data as QuotationWithItems;
  },

  async create(quotationData: CreateQuotationData): Promise<Quotation> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) {
      throw new Error("User not authenticated");
    }

    // Calculate totals
    const subtotal = quotationData.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);

    const totalDiscount = quotationData.discount_amount || 0;
    const totalTax = quotationData.tax_amount || 0;
    const total = subtotal - totalDiscount + totalTax;

    // Create quotation
    const { data: quotation, error: quotationError } = await supabase
      .from("quotations")
      .insert({
        customer_id: quotationData.customer_id,
        quotation_date: quotationData.quotation_date,
        valid_until: quotationData.valid_until,
        status: quotationData.status || "draft",
        subtotal,
        discount_amount: totalDiscount,
        tax_amount: totalTax,
        total,
        notes: quotationData.notes,
        created_by: session.session.user.id,
      })
      .select()
      .single();

    if (quotationError) {
      console.error("Error creating quotation:", quotationError);
      throw quotationError;
    }

    // Create quotation items
    const items: QuotationItemInsert[] = quotationData.items.map((item) => ({
      quotation_id: quotation.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate,
      discount_amount: item.discount_amount || 0,
      total: (item.quantity * item.unit_price) - (item.discount_amount || 0) + 
             (item.quantity * item.unit_price * item.tax_rate / 100),
    }));

    const { error: itemsError } = await supabase
      .from("quotation_items")
      .insert(items);

    if (itemsError) {
      console.error("Error creating quotation items:", itemsError);
      // Rollback quotation if items fail
      await supabase.from("quotations").delete().eq("id", quotation.id);
      throw itemsError;
    }

    return quotation;
  },

  async update(id: string, updates: Partial<QuotationUpdate>): Promise<Quotation> {
    const { data, error } = await supabase
      .from("quotations")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating quotation:", error);
      throw error;
    }

    return data;
  },

  async updateStatus(id: string, status: string): Promise<Quotation> {
    return this.update(id, { status });
  },

  async delete(id: string): Promise<void> {
    // Delete quotation items first (due to foreign key)
    const { error: itemsError } = await supabase
      .from("quotation_items")
      .delete()
      .eq("quotation_id", id);

    if (itemsError) {
      console.error("Error deleting quotation items:", itemsError);
      throw itemsError;
    }

    // Delete quotation
    const { error } = await supabase
      .from("quotations")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting quotation:", error);
      throw error;
    }
  },

  async convertToInvoice(quotationId: string): Promise<string> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) {
      throw new Error("User not authenticated");
    }

    // Get quotation with items
    const quotation = await this.getById(quotationId);
    if (!quotation) {
      throw new Error("Quotation not found");
    }

    if (quotation.status === "converted") {
      throw new Error("Quotation already converted to invoice");
    }

    // Create sales invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("sales")
      .insert({
        customer_id: quotation.customer_id,
        invoice_date: new Date().toISOString().split("T")[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        subtotal: quotation.subtotal,
        discount_amount: quotation.discount_amount,
        tax_amount: quotation.tax_amount,
        total: quotation.total,
        paid_amount: 0,
        payment_status: "unpaid",
        notes: `Converted from Quotation ${quotation.quotation_number}\n${quotation.notes || ""}`,
        created_by: session.session.user.id,
      })
      .select()
      .single();

    if (invoiceError) {
      console.error("Error creating invoice:", invoiceError);
      throw invoiceError;
    }

    // Create invoice items
    const invoiceItems = quotation.quotation_items.map((item) => ({
      sale_id: invoice.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate,
      discount_amount: item.discount_amount,
      total: item.total,
    }));

    const { error: itemsError } = await supabase
      .from("sale_items")
      .insert(invoiceItems);

    if (itemsError) {
      console.error("Error creating invoice items:", itemsError);
      // Rollback invoice
      await supabase.from("sales").delete().eq("id", invoice.id);
      throw itemsError;
    }

    // Update quotation status to converted
    await this.updateStatus(quotationId, "converted");

    return invoice.id;
  },
};