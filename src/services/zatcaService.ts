import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ZatcaDevice = Database["public"]["Tables"]["zatca_devices"]["Row"];
type ZatcaDeviceInsert = Database["public"]["Tables"]["zatca_devices"]["Insert"];
type ZatcaSubmission = Database["public"]["Tables"]["zatca_submissions"]["Row"];
type ZatcaSubmissionInsert = Database["public"]["Tables"]["zatca_submissions"]["Insert"];

export const zatcaService = {
  // Device Management
  devices: {
    async getAll(): Promise<ZatcaDevice[]> {
      const { data, error } = await supabase
        .from("zatca_devices")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching ZATCA devices:", error);
        throw error;
      }

      return data || [];
    },

    async create(device: ZatcaDeviceInsert): Promise<ZatcaDevice> {
      const { data, error } = await supabase
        .from("zatca_devices")
        .insert(device)
        .select()
        .single();

      if (error) {
        console.error("Error creating ZATCA device:", error);
        throw error;
      }

      return data;
    },

    async update(id: string, updates: Partial<ZatcaDeviceInsert>): Promise<ZatcaDevice> {
      const { data, error } = await supabase
        .from("zatca_devices")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating ZATCA device:", error);
        throw error;
      }

      return data;
    },
  },

  // Invoice Submissions
  submissions: {
    async getAll(): Promise<any[]> {
      const { data, error } = await supabase
        .from("zatca_submissions")
        .select(`
          *,
          invoice:sales_invoices(invoice_number, customer:customers(name))
        `)
        .order("submitted_at", { ascending: false });

      if (error) {
        console.error("Error fetching ZATCA submissions:", error);
        throw error;
      }

      return data || [];
    },

    async create(submission: ZatcaSubmissionInsert): Promise<ZatcaSubmission> {
      const { data, error } = await supabase
        .from("zatca_submissions")
        .insert(submission)
        .select()
        .single();

      if (error) {
        console.error("Error creating ZATCA submission:", error);
        throw error;
      }

      return data;
    },

    async updateStatus(
      id: string, 
      status: string, 
      response?: any, 
      zatcaUuid?: string
    ): Promise<ZatcaSubmission> {
      const updates: any = { 
        status,
        zatca_response: response,
      };

      if (zatcaUuid) {
        updates.zatca_uuid = zatcaUuid;
      }

      const { data, error } = await supabase
        .from("zatca_submissions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating ZATCA submission:", error);
        throw error;
      }

      return data;
    },

    async getStatistics(): Promise<{
      totalSubmissions: number;
      cleared: number;
      pending: number;
      rejected: number;
    }> {
      const { data, error } = await supabase
        .from("zatca_submissions")
        .select("status");

      if (error) {
        console.error("Error fetching ZATCA statistics:", error);
        throw error;
      }

      const submissions = data || [];

      return {
        totalSubmissions: submissions.length,
        cleared: submissions.filter(s => s.status === "cleared").length,
        pending: submissions.filter(s => s.status === "pending").length,
        rejected: submissions.filter(s => s.status === "rejected").length,
      };
    },
  },

  // Generate QR Code data
  generateQRCode(invoice: any): string {
    // TLV (Tag-Length-Value) encoding for ZATCA QR
    const seller = invoice.company_name || "Your Company";
    const vat = invoice.vat_number || "300000000000003";
    const timestamp = new Date(invoice.invoice_date).toISOString();
    const total = invoice.total.toFixed(2);
    const taxAmount = invoice.tax_amount.toFixed(2);

    // Simplified QR generation (in production, use proper TLV encoding)
    const qrData = JSON.stringify({
      seller,
      vat,
      timestamp,
      total,
      tax: taxAmount,
    });

    return Buffer.from(qrData).toString("base64");
  },
};