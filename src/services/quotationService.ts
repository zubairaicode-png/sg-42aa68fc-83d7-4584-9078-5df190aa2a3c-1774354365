import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Quotation = Database["public"]["Tables"]["quotations"]["Row"];
type QuotationInsert = Database["public"]["Tables"]["quotations"]["Insert"];
type QuotationUpdate = Database["public"]["Tables"]["quotations"]["Update"];
type QuotationItem = Database["public"]["Tables"]["quotation_items"]["Row"];
type QuotationItemInsert = Database["public"]["Tables"]["quotation_items"]["Insert"];

export interface QuotationWithItems extends Quotation {
  quotation_items: (QuotationItem & { products?: { name: string } })[];
  customers?: {
    name: string;
    email: string | null;
    phone: string | null;
    vat_number: string | null;
  };
}

export interface CreateQuotationData {
  customer_id: string;
  quotation_date: string;
  valid_until: string;
  status?: string;
  notes?: string;
  discount_amount?: number;
  vat_amount?: number;
  items: {
    product_id: string;
    description?: string;
    quantity: number;
    unit_price: number;
    vat_rate: number;
    discount_amount?: number;
  }[];
}

export const quotationService = {
  async getAll(): Promise<QuotationWithItems[]> {
    const { data, error } = await supabase
      .from("quotations")
      .select(`
        *,
        quotation_items(*, products(name)),
        customers(name, email, phone, vat_number)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching quotations:", error);
      throw error;
    }

    return (data || []) as unknown as QuotationWithItems[];
  },

  async getById(id: string): Promise<QuotationWithItems | null> {
    const { data, error } = await supabase
      .from("quotations")
      .select(`
        *,
        quotation_items(*, products(name)),
        customers(name, email, phone, vat_number)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching quotation:", error);
      throw error;
    }

    return data as unknown as QuotationWithItems;
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
    const totalTax = quotationData.vat_amount || 0;
    const total_amount = subtotal - totalDiscount + totalTax;

    // Create quotation
    const { data: quotation, error: quotationError } = await supabase
      .from("quotations")
      .insert({
        quotation_number: "TBD", // Will be overwritten by database trigger
        customer_id: quotationData.customer_id,
        quotation_date: quotationData.quotation_date,
        valid_until: quotationData.valid_until,
        status: quotationData.status || "draft",
        subtotal,
        discount_amount: totalDiscount,
        vat_amount: totalTax,
        total_amount,
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
    const items: QuotationItemInsert[] = quotationData.items.map((item) => {
      const itemSubtotal = (item.quantity * item.unit_price) - (item.discount_amount || 0);
      const itemVat = itemSubtotal * (item.vat_rate / 100);
      
      return {
        quotation_id: quotation.id,
        product_id: item.product_id,
        description: item.description || "",
        quantity: item.quantity,
        unit_price: item.unit_price,
        vat_rate: item.vat_rate,
        vat_amount: itemVat,
        discount_amount: item.discount_amount || 0,
        total_amount: itemSubtotal + itemVat,
      };
    });

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
      .from("sales_invoices")
      .insert({
        customer_id: quotation.customer_id,
        customer_name: quotation.customers?.name || "Unknown Customer",
        invoice_number: `INV-${Date.now()}`,
        invoice_date: new Date().toISOString().split("T")[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        subtotal: quotation.subtotal,
        discount_amount: quotation.discount_amount,
        tax_amount: quotation.vat_amount,
        total_amount: quotation.total_amount,
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
      invoice_id: invoice.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.vat_rate,
      tax_amount: item.vat_amount,
      discount_amount: item.discount_amount,
      total: item.total_amount,
    }));

    const { error: itemsError } = await supabase
      .from("sales_invoice_items")
      .insert(invoiceItems);

    if (itemsError) {
      console.error("Error creating invoice items:", itemsError);
      // Rollback invoice
      await supabase.from("sales_invoices").delete().eq("id", invoice.id);
      throw itemsError;
    }

    // Update quotation status to converted
    await this.update(quotationId, { 
      status: "converted",
      converted_to_invoice_id: invoice.id,
      converted_at: new Date().toISOString()
    });

    return invoice.id;
  },
};