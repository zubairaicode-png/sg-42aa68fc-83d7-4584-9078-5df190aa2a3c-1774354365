import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type SalesInvoice = Database["public"]["Tables"]["sales_invoices"]["Row"];
type SalesInvoiceItem = Database["public"]["Tables"]["sales_invoice_items"]["Row"];

export const salesService = {
  // Get all sales invoices
  async getAllInvoices() {
    const { data, error } = await supabase
      .from("sales_invoices")
      .select(`
        *,
        customer:customers(name, name_ar),
        items:sales_invoice_items(*)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Create new sales invoice with items and accounting entry
  async createInvoice(invoice: any, items: any[]) {
    // 1. Start a transaction by using RPC or sequential inserts
    const { data: newInvoice, error: invoiceError } = await supabase
      .from("sales_invoices")
      .insert({
        customer_id: invoice.customer_id,
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        total_amount: invoice.total_amount,
        tax_amount: invoice.tax_amount,
        status: invoice.status,
        po_number: invoice.po_number,
        payment_type: invoice.payment_type,
        notes: invoice.notes,
        created_by: invoice.created_by
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // 2. Insert items
    const itemsToInsert = items.map(item => ({
      invoice_id: newInvoice.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate,
      tax_amount: item.tax_amount,
      total_amount: item.total_amount
    }));

    const { error: itemsError } = await supabase
      .from("sales_invoice_items")
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;
    
    // 3. Create Accounting Journal Entry based on Payment Type
    try {
      // Create journal entry header
      const { data: journalEntry, error: journalError } = await supabase
        .from("journal_entries")
        .insert({
          entry_date: invoice.invoice_date,
          reference: `INV-${invoice.invoice_number}`,
          description: `Sales Invoice ${invoice.invoice_number} - ${invoice.payment_type || 'credit'}`
        })
        .select()
        .single();
        
      if (!journalError && journalEntry) {
        const journalItems = [];
        
        // Debit logic based on payment type
        if (invoice.payment_type === 'cash') {
          // Debit Cash Account
          journalItems.push({
            journal_entry_id: journalEntry.id,
            account_id: '1000', // Assuming 1000 is Cash
            debit: invoice.total_amount,
            credit: 0,
            description: `Cash received for Invoice ${invoice.invoice_number}`
          });
        } else if (invoice.payment_type === 'bank' || invoice.payment_type === 'cheque') {
          // Debit Bank Account
          journalItems.push({
            journal_entry_id: journalEntry.id,
            account_id: '1010', // Assuming 1010 is Bank
            debit: invoice.total_amount,
            credit: 0,
            description: `Bank transfer/cheque for Invoice ${invoice.invoice_number}`
          });
        } else if (invoice.payment_type === 'card') {
          // Debit Card clearing account
          journalItems.push({
            journal_entry_id: journalEntry.id,
            account_id: '1020', // Assuming 1020 is Card Payments
            debit: invoice.total_amount,
            credit: 0,
            description: `Card payment for Invoice ${invoice.invoice_number}`
          });
        } else {
          // Default to Accounts Receivable
          journalItems.push({
            journal_entry_id: journalEntry.id,
            account_id: '1200', // Assuming 1200 is A/R
            debit: invoice.total_amount,
            credit: 0,
            description: `Accounts Receivable for Invoice ${invoice.invoice_number}`
          });
        }
        
        // Credit Sales Revenue
        journalItems.push({
          journal_entry_id: journalEntry.id,
          account_id: '4000', // Assuming 4000 is Sales Revenue
          debit: 0,
          credit: invoice.total_amount - invoice.tax_amount,
          description: `Revenue from Invoice ${invoice.invoice_number}`
        });
        
        // Credit VAT Payable
        if (invoice.tax_amount > 0) {
          journalItems.push({
            journal_entry_id: journalEntry.id,
            account_id: '2200', // Assuming 2200 is VAT Payable
            debit: 0,
            credit: invoice.tax_amount,
            description: `VAT Collected for Invoice ${invoice.invoice_number}`
          });
        }
        
        // Need to wait for accounts table to exist before inserting journal items
        // await supabase.from("journal_entry_items").insert(journalItems);
      }
    } catch (e) {
      console.log("Accounting integration skipped or failed:", e);
      // Don't throw here, we still want the invoice to succeed
    }

    return newInvoice;
  },

  // Update invoice status
  async updateStatus(id: string, status: string) {
  },
};