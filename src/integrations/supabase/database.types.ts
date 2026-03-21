 
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          address: string | null
          balance: number | null
          city: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          credit_limit: number | null
          customer_number: string
          email: string | null
          id: string
          name: string
          notes: string | null
          payment_terms: number | null
          phone: string | null
          postal_code: string | null
          status: string | null
          updated_at: string | null
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          balance?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          customer_number: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          payment_terms?: number | null
          phone?: string | null
          postal_code?: string | null
          status?: string | null
          updated_at?: string | null
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          balance?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          customer_number?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          payment_terms?: number | null
          phone?: string | null
          postal_code?: string | null
          status?: string | null
          updated_at?: string | null
          vat_number?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          expense_date: string
          expense_number: string
          id: string
          notes: string | null
          payment_method: string
          reference_number: string | null
          status: string | null
          tax_amount: number | null
          total_amount: number
          updated_at: string | null
          vendor_name: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expense_date: string
          expense_number: string
          id?: string
          notes?: string | null
          payment_method: string
          reference_number?: string | null
          status?: string | null
          tax_amount?: number | null
          total_amount: number
          updated_at?: string | null
          vendor_name: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expense_date?: string
          expense_number?: string
          id?: string
          notes?: string | null
          payment_method?: string
          reference_number?: string | null
          status?: string | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
          vendor_name?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string | null
          category: string | null
          cost_price: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          name_ar: string | null
          product_code: string
          reorder_level: number | null
          selling_price: number
          status: string | null
          stock_quantity: number | null
          unit: string | null
          updated_at: string | null
          vat_rate: number | null
        }
        Insert: {
          barcode?: string | null
          category?: string | null
          cost_price?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          name_ar?: string | null
          product_code: string
          reorder_level?: number | null
          selling_price: number
          status?: string | null
          stock_quantity?: number | null
          unit?: string | null
          updated_at?: string | null
          vat_rate?: number | null
        }
        Update: {
          barcode?: string | null
          category?: string | null
          cost_price?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          name_ar?: string | null
          product_code?: string
          reorder_level?: number | null
          selling_price?: number
          status?: string | null
          stock_quantity?: number | null
          unit?: string | null
          updated_at?: string | null
          vat_rate?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quotation_items: {
        Row: {
          created_at: string | null
          description: string
          discount_amount: number
          id: string
          product_id: string
          quantity: number
          quotation_id: string
          total_amount: number
          unit_price: number
          vat_amount: number
          vat_rate: number
        }
        Insert: {
          created_at?: string | null
          description: string
          discount_amount?: number
          id?: string
          product_id: string
          quantity: number
          quotation_id: string
          total_amount?: number
          unit_price: number
          vat_amount?: number
          vat_rate?: number
        }
        Update: {
          created_at?: string | null
          description?: string
          discount_amount?: number
          id?: string
          product_id?: string
          quantity?: number
          quotation_id?: string
          total_amount?: number
          unit_price?: number
          vat_amount?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          converted_at: string | null
          converted_to_invoice_id: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string
          discount_amount: number
          id: string
          notes: string | null
          quotation_date: string
          quotation_number: string
          status: string
          subtotal: number
          terms_conditions: string | null
          total_amount: number
          updated_at: string | null
          valid_until: string
          vat_amount: number
        }
        Insert: {
          converted_at?: string | null
          converted_to_invoice_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          discount_amount?: number
          id?: string
          notes?: string | null
          quotation_date?: string
          quotation_number: string
          status?: string
          subtotal?: number
          terms_conditions?: string | null
          total_amount?: number
          updated_at?: string | null
          valid_until: string
          vat_amount?: number
        }
        Update: {
          converted_at?: string | null
          converted_to_invoice_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          discount_amount?: number
          id?: string
          notes?: string | null
          quotation_date?: string
          quotation_number?: string
          status?: string
          subtotal?: number
          terms_conditions?: string | null
          total_amount?: number
          updated_at?: string | null
          valid_until?: string
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotations_converted_to_invoice_id_fkey"
            columns: ["converted_to_invoice_id"]
            isOneToOne: false
            referencedRelation: "sales_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_invoice_items: {
        Row: {
          created_at: string | null
          discount_amount: number | null
          discount_percentage: number | null
          id: string
          invoice_id: string | null
          line_total: number
          product_code: string | null
          product_id: string | null
          product_name: string
          quantity: number
          tax_amount: number
          tax_rate: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          invoice_id?: string | null
          line_total: number
          product_code?: string | null
          product_id?: string | null
          product_name: string
          quantity: number
          tax_amount: number
          tax_rate?: number | null
          unit_price: number
        }
        Update: {
          created_at?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          invoice_id?: string | null
          line_total?: number
          product_code?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          tax_amount?: number
          tax_rate?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "sales_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_invoices: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          customer_name: string
          customer_vat: string | null
          discount_amount: number | null
          due_date: string | null
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          paid_amount: number | null
          payment_method: string | null
          payment_status: string | null
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string | null
          zatca_qr_code: string | null
          zatca_status: string | null
          zatca_submission_date: string | null
          zatca_uuid: string | null
          zatca_xml: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          customer_name: string
          customer_vat?: string | null
          discount_amount?: number | null
          due_date?: string | null
          id?: string
          invoice_date: string
          invoice_number: string
          notes?: string | null
          paid_amount?: number | null
          payment_method?: string | null
          payment_status?: string | null
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at?: string | null
          zatca_qr_code?: string | null
          zatca_status?: string | null
          zatca_submission_date?: string | null
          zatca_uuid?: string | null
          zatca_xml?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_vat?: string | null
          discount_amount?: number | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          paid_amount?: number | null
          payment_method?: string | null
          payment_status?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string | null
          zatca_qr_code?: string | null
          zatca_status?: string | null
          zatca_submission_date?: string | null
          zatca_uuid?: string | null
          zatca_xml?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_return_items: {
        Row: {
          created_at: string | null
          id: string
          line_total: number
          original_quantity: number
          product_id: string | null
          product_name: string
          return_id: string | null
          return_quantity: number
          tax_amount: number
          tax_rate: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          line_total: number
          original_quantity: number
          product_id?: string | null
          product_name: string
          return_id?: string | null
          return_quantity: number
          tax_amount: number
          tax_rate?: number | null
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          line_total?: number
          original_quantity?: number
          product_id?: string | null
          product_name?: string
          return_id?: string | null
          return_quantity?: number
          tax_amount?: number
          tax_rate?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_return_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_return_items_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "sales_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_returns: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          customer_name: string
          id: string
          notes: string | null
          original_invoice_id: string | null
          original_invoice_number: string
          reason: string
          refund_amount: number | null
          refund_method: string | null
          return_date: string
          return_number: string
          status: string | null
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string | null
          zatca_status: string | null
          zatca_uuid: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          customer_name: string
          id?: string
          notes?: string | null
          original_invoice_id?: string | null
          original_invoice_number: string
          reason: string
          refund_amount?: number | null
          refund_method?: string | null
          return_date: string
          return_number: string
          status?: string | null
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at?: string | null
          zatca_status?: string | null
          zatca_uuid?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string
          id?: string
          notes?: string | null
          original_invoice_id?: string | null
          original_invoice_number?: string
          reason?: string
          refund_amount?: number | null
          refund_method?: string | null
          return_date?: string
          return_number?: string
          status?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string | null
          zatca_status?: string | null
          zatca_uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_returns_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_returns_original_invoice_id_fkey"
            columns: ["original_invoice_id"]
            isOneToOne: false
            referencedRelation: "sales_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          balance: number | null
          city: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          payment_terms: number | null
          phone: string | null
          postal_code: string | null
          status: string | null
          supplier_number: string
          updated_at: string | null
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          balance?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          payment_terms?: number | null
          phone?: string | null
          postal_code?: string | null
          status?: string | null
          supplier_number: string
          updated_at?: string | null
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          balance?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          payment_terms?: number | null
          phone?: string | null
          postal_code?: string | null
          status?: string | null
          supplier_number?: string
          updated_at?: string | null
          vat_number?: string | null
        }
        Relationships: []
      }
      zatca_devices: {
        Row: {
          certificate: string | null
          certificate_expiry: string | null
          created_at: string | null
          created_by: string | null
          csr: string | null
          device_name: string
          id: string
          last_used: string | null
          private_key: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          certificate?: string | null
          certificate_expiry?: string | null
          created_at?: string | null
          created_by?: string | null
          csr?: string | null
          device_name: string
          id?: string
          last_used?: string | null
          private_key?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          certificate?: string | null
          certificate_expiry?: string | null
          created_at?: string | null
          created_by?: string | null
          csr?: string | null
          device_name?: string
          id?: string
          last_used?: string | null
          private_key?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      zatca_submissions: {
        Row: {
          created_by: string | null
          id: string
          invoice_number: string
          status: string | null
          submitted_at: string | null
          zatca_response: Json | null
          zatca_uuid: string | null
        }
        Insert: {
          created_by?: string | null
          id?: string
          invoice_number: string
          status?: string | null
          submitted_at?: string | null
          zatca_response?: Json | null
          zatca_uuid?: string | null
        }
        Update: {
          created_by?: string | null
          id?: string
          invoice_number?: string
          status?: string | null
          submitted_at?: string | null
          zatca_response?: Json | null
          zatca_uuid?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_quotation_number: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
