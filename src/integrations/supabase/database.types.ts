 
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
      bank_accounts: {
        Row: {
          account_name: string
          account_number: string
          bank_name: string
          created_at: string | null
          created_by: string | null
          currency: string | null
          current_balance: number | null
          iban: string | null
          id: string
          notes: string | null
          opening_balance: number | null
          opening_date: string | null
          status: string | null
          swift_code: string | null
          updated_at: string | null
        }
        Insert: {
          account_name: string
          account_number: string
          bank_name: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          current_balance?: number | null
          iban?: string | null
          id?: string
          notes?: string | null
          opening_balance?: number | null
          opening_date?: string | null
          status?: string | null
          swift_code?: string | null
          updated_at?: string | null
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_name?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          current_balance?: number | null
          iban?: string | null
          id?: string
          notes?: string | null
          opening_balance?: number | null
          opening_date?: string | null
          status?: string | null
          swift_code?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bank_reconciliations: {
        Row: {
          account_id: string | null
          approved_by: string | null
          book_balance: number
          created_at: string | null
          difference: number
          id: string
          notes: string | null
          reconciled_by: string | null
          reconciliation_date: string
          statement_balance: number
          statement_date: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          approved_by?: string | null
          book_balance: number
          created_at?: string | null
          difference: number
          id?: string
          notes?: string | null
          reconciled_by?: string | null
          reconciliation_date: string
          statement_balance: number
          statement_date: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          approved_by?: string | null
          book_balance?: number
          created_at?: string | null
          difference?: number
          id?: string
          notes?: string | null
          reconciled_by?: string | null
          reconciliation_date?: string
          statement_balance?: number
          statement_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_reconciliations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          account_id: string | null
          amount: number
          balance_after: number | null
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string
          id: string
          matched_transaction_id: string | null
          matched_transaction_type: string | null
          notes: string | null
          reconciled: boolean | null
          reconciled_by: string | null
          reconciled_date: string | null
          reference_number: string | null
          transaction_date: string
          transaction_type: string
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          balance_after?: number | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          id?: string
          matched_transaction_id?: string | null
          matched_transaction_type?: string | null
          notes?: string | null
          reconciled?: boolean | null
          reconciled_by?: string | null
          reconciled_date?: string | null
          reference_number?: string | null
          transaction_date: string
          transaction_type: string
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          balance_after?: number | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          id?: string
          matched_transaction_id?: string | null
          matched_transaction_type?: string | null
          notes?: string | null
          reconciled?: boolean | null
          reconciled_by?: string | null
          reconciled_date?: string | null
          reference_number?: string | null
          transaction_date?: string
          transaction_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      business_locations: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          is_default: boolean | null
          location_code: string
          location_name: string
          phone: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          is_default?: boolean | null
          location_code: string
          location_name: string
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          is_default?: boolean | null
          location_code?: string
          location_name?: string
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_locations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_of_accounts: {
        Row: {
          account_code: string
          account_name: string
          account_type: string
          created_at: string | null
          current_balance: number | null
          id: string
          is_active: boolean | null
          opening_balance: number | null
          parent_account_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_code: string
          account_name: string
          account_type: string
          created_at?: string | null
          current_balance?: number | null
          id?: string
          is_active?: boolean | null
          opening_balance?: number | null
          parent_account_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_code?: string
          account_name?: string
          account_type?: string
          created_at?: string | null
          current_balance?: number | null
          id?: string
          is_active?: boolean | null
          opening_balance?: number | null
          parent_account_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_subscriptions: {
        Row: {
          auto_renew: boolean | null
          created_at: string | null
          customer_id: string
          discount_percent: number | null
          end_date: string | null
          id: string
          last_invoice_date: string | null
          last_invoice_id: string | null
          next_billing_date: string | null
          notes: string | null
          plan_id: string
          price: number
          start_date: string
          status: string
          trial_end_date: string | null
          updated_at: string | null
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string | null
          customer_id: string
          discount_percent?: number | null
          end_date?: string | null
          id?: string
          last_invoice_date?: string | null
          last_invoice_id?: string | null
          next_billing_date?: string | null
          notes?: string | null
          plan_id: string
          price: number
          start_date: string
          status: string
          trial_end_date?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string | null
          customer_id?: string
          discount_percent?: number | null
          end_date?: string | null
          id?: string
          last_invoice_date?: string | null
          last_invoice_id?: string | null
          next_billing_date?: string | null
          notes?: string | null
          plan_id?: string
          price?: number
          start_date?: string
          status?: string
          trial_end_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_subscriptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_subscriptions_last_invoice_id_fkey"
            columns: ["last_invoice_id"]
            isOneToOne: false
            referencedRelation: "sales_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          additional_number: string | null
          address: string | null
          balance: number | null
          building_number: string | null
          city: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          credit_limit: number | null
          customer_number: string
          district: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          opening_balance: number | null
          payment_terms: number | null
          phone: string | null
          postal_code: string | null
          short_address: string | null
          status: string | null
          street_name: string | null
          unit_number: string | null
          updated_at: string | null
          vat_number: string | null
        }
        Insert: {
          additional_number?: string | null
          address?: string | null
          balance?: number | null
          building_number?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          customer_number: string
          district?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          opening_balance?: number | null
          payment_terms?: number | null
          phone?: string | null
          postal_code?: string | null
          short_address?: string | null
          status?: string | null
          street_name?: string | null
          unit_number?: string | null
          updated_at?: string | null
          vat_number?: string | null
        }
        Update: {
          additional_number?: string | null
          address?: string | null
          balance?: number | null
          building_number?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          customer_number?: string
          district?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          opening_balance?: number | null
          payment_terms?: number | null
          phone?: string | null
          postal_code?: string | null
          short_address?: string | null
          status?: string | null
          street_name?: string | null
          unit_number?: string | null
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
      invoice_design_settings: {
        Row: {
          available_fields: Json | null
          created_at: string | null
          created_by: string | null
          footer_layout: Json | null
          footer_text: string | null
          header_layout: Json | null
          id: string
          layout_name: string | null
          organization_id: string | null
          primary_color: string | null
          secondary_color: string | null
          show_company_details: boolean | null
          template_style: string
          updated_at: string | null
        }
        Insert: {
          available_fields?: Json | null
          created_at?: string | null
          created_by?: string | null
          footer_layout?: Json | null
          footer_text?: string | null
          header_layout?: Json | null
          id?: string
          layout_name?: string | null
          organization_id?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          show_company_details?: boolean | null
          template_style?: string
          updated_at?: string | null
        }
        Update: {
          available_fields?: Json | null
          created_at?: string | null
          created_by?: string | null
          footer_layout?: Json | null
          footer_text?: string | null
          header_layout?: Json | null
          id?: string
          layout_name?: string | null
          organization_id?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          show_company_details?: boolean | null
          template_style?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string
          entry_date: string
          entry_number: string
          id: string
          reference_id: string | null
          reference_type: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description: string
          entry_date: string
          entry_number: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string
          entry_date?: string
          entry_number?: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entry_lines: {
        Row: {
          account_id: string
          created_at: string | null
          credit: number | null
          debit: number | null
          description: string | null
          id: string
          journal_entry_id: string
        }
        Insert: {
          account_id: string
          created_at?: string | null
          credit?: number | null
          debit?: number | null
          description?: string | null
          id?: string
          journal_entry_id: string
        }
        Update: {
          account_id?: string
          created_at?: string | null
          credit?: number | null
          debit?: number | null
          description?: string | null
          id?: string
          journal_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
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
          serial_number: string | null
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
          serial_number?: string | null
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
          serial_number?: string | null
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
      purchase_invoice_items: {
        Row: {
          created_at: string | null
          discount_amount: number | null
          discount_percentage: number | null
          id: string
          invoice_id: string | null
          line_total: number
          product_id: string | null
          product_name: string
          quantity: number
          tax_amount: number
          tax_rate: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          invoice_id?: string | null
          line_total?: number
          product_id?: string | null
          product_name: string
          quantity?: number
          tax_amount?: number
          tax_rate?: number
          unit_price?: number
        }
        Update: {
          created_at?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          invoice_id?: string | null
          line_total?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
          tax_amount?: number
          tax_rate?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "purchase_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_invoices: {
        Row: {
          created_at: string | null
          created_by: string | null
          due_date: string
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          payment_status: string | null
          subtotal: number
          supplier_id: string | null
          supplier_name: string
          supplier_vat: string | null
          tax_amount: number
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          due_date: string
          id?: string
          invoice_date: string
          invoice_number: string
          notes?: string | null
          payment_status?: string | null
          subtotal?: number
          supplier_id?: string | null
          supplier_name: string
          supplier_vat?: string | null
          tax_amount?: number
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          due_date?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          payment_status?: string | null
          subtotal?: number
          supplier_id?: string | null
          supplier_name?: string
          supplier_vat?: string | null
          tax_amount?: number
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_items: {
        Row: {
          created_at: string | null
          discount_amount: number | null
          discount_percentage: number | null
          id: string
          line_total: number
          product_code: string | null
          product_id: string | null
          product_name: string
          purchase_id: string | null
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
          line_total: number
          product_code?: string | null
          product_id?: string | null
          product_name: string
          purchase_id?: string | null
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
          line_total?: number
          product_code?: string | null
          product_id?: string | null
          product_name?: string
          purchase_id?: string | null
          quantity?: number
          tax_amount?: number
          tax_rate?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_return_items: {
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
            foreignKeyName: "purchase_return_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_return_items_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "purchase_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_returns: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          original_purchase_id: string | null
          original_purchase_number: string
          payment_date: string | null
          payment_method: string | null
          payment_notes: string | null
          payment_reference: string | null
          reason: string
          refund_amount: number | null
          refund_method: string | null
          return_date: string
          return_number: string
          status: string | null
          subtotal: number
          supplier_id: string | null
          supplier_name: string
          tax_amount: number
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          original_purchase_id?: string | null
          original_purchase_number: string
          payment_date?: string | null
          payment_method?: string | null
          payment_notes?: string | null
          payment_reference?: string | null
          reason: string
          refund_amount?: number | null
          refund_method?: string | null
          return_date: string
          return_number: string
          status?: string | null
          subtotal: number
          supplier_id?: string | null
          supplier_name: string
          tax_amount: number
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          original_purchase_id?: string | null
          original_purchase_number?: string
          payment_date?: string | null
          payment_method?: string | null
          payment_notes?: string | null
          payment_reference?: string | null
          reason?: string
          refund_amount?: number | null
          refund_method?: string | null
          return_date?: string
          return_number?: string
          status?: string | null
          subtotal?: number
          supplier_id?: string | null
          supplier_name?: string
          tax_amount?: number
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_returns_original_purchase_id_fkey"
            columns: ["original_purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_returns_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          created_at: string | null
          created_by: string | null
          discount_amount: number | null
          due_date: string | null
          id: string
          notes: string | null
          paid_amount: number | null
          payment_method: string | null
          payment_status: string | null
          purchase_date: string
          purchase_number: string
          status: string | null
          subtotal: number
          supplier_id: string | null
          supplier_name: string
          supplier_vat: string | null
          tax_amount: number
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          discount_amount?: number | null
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number | null
          payment_method?: string | null
          payment_status?: string | null
          purchase_date: string
          purchase_number: string
          status?: string | null
          subtotal: number
          supplier_id?: string | null
          supplier_name: string
          supplier_vat?: string | null
          tax_amount: number
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          discount_amount?: number | null
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number | null
          payment_method?: string | null
          payment_status?: string | null
          purchase_date?: string
          purchase_number?: string
          status?: string | null
          subtotal?: number
          supplier_id?: string | null
          supplier_name?: string
          supplier_vat?: string | null
          tax_amount?: number
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
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
          payment_type: string | null
          po_number: string | null
          subscription_id: string | null
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
          payment_type?: string | null
          po_number?: string | null
          subscription_id?: string | null
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
          payment_type?: string | null
          po_number?: string | null
          subscription_id?: string | null
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
          {
            foreignKeyName: "sales_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "customer_subscriptions"
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
          payment_date: string | null
          payment_method: string | null
          payment_notes: string | null
          payment_reference: string | null
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
          payment_date?: string | null
          payment_method?: string | null
          payment_notes?: string | null
          payment_reference?: string | null
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
          payment_date?: string | null
          payment_method?: string | null
          payment_notes?: string | null
          payment_reference?: string | null
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
      subscription_invoices: {
        Row: {
          amount: number
          billing_period_end: string
          billing_period_start: string
          created_at: string | null
          customer_id: string
          due_date: string
          id: string
          invoice_number: string
          paid_date: string | null
          status: string
          subscription_id: string
          total_amount: number
          vat_amount: number
        }
        Insert: {
          amount: number
          billing_period_end: string
          billing_period_start: string
          created_at?: string | null
          customer_id: string
          due_date: string
          id?: string
          invoice_number: string
          paid_date?: string | null
          status: string
          subscription_id: string
          total_amount: number
          vat_amount: number
        }
        Update: {
          amount?: number
          billing_period_end?: string
          billing_period_start?: string
          created_at?: string | null
          customer_id?: string
          due_date?: string
          id?: string
          invoice_number?: string
          paid_date?: string | null
          status?: string
          subscription_id?: string
          total_amount?: number
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "subscription_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "customer_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          billing_cycle: string
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          resource_limits: Json | null
          setup_fee: number | null
          trial_days: number | null
          updated_at: string | null
        }
        Insert: {
          billing_cycle: string
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          resource_limits?: Json | null
          setup_fee?: number | null
          trial_days?: number | null
          updated_at?: string | null
        }
        Update: {
          billing_cycle?: string
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          resource_limits?: Json | null
          setup_fee?: number | null
          trial_days?: number | null
          updated_at?: string | null
        }
        Relationships: []
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
          opening_balance: number | null
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
          opening_balance?: number | null
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
          opening_balance?: number | null
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
      tax_settings: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_tax_inclusive: boolean | null
          organization_id: string | null
          tax_name: string
          tax_rate: number
          tax_registration_number: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_tax_inclusive?: boolean | null
          organization_id?: string | null
          tax_name?: string
          tax_rate?: number
          tax_registration_number?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_tax_inclusive?: boolean | null
          organization_id?: string | null
          tax_name?: string
          tax_rate?: number
          tax_registration_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_locations: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean | null
          location_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          location_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          location_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "business_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_locations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_system_role: boolean | null
          permissions: Json | null
          role_code: string
          role_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system_role?: boolean | null
          permissions?: Json | null
          role_code: string
          role_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system_role?: boolean | null
          permissions?: Json | null
          role_code?: string
          role_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          pdf_template: string | null
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
          pdf_template?: string | null
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
          pdf_template?: string | null
          private_key?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      zatca_invoice_pdfs: {
        Row: {
          created_at: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          invoice_id: string
          invoice_type: string
          pdf_template: string
          pdf_url: string | null
          qr_code: string | null
        }
        Insert: {
          created_at?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          invoice_id: string
          invoice_type: string
          pdf_template: string
          pdf_url?: string | null
          qr_code?: string | null
        }
        Update: {
          created_at?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          invoice_id?: string
          invoice_type?: string
          pdf_template?: string
          pdf_url?: string | null
          qr_code?: string | null
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
