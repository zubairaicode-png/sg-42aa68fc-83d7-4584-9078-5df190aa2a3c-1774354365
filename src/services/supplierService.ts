import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Supplier = Database["public"]["Tables"]["suppliers"]["Row"];
type SupplierInsert = Database["public"]["Tables"]["suppliers"]["Insert"];
type SupplierUpdate = Database["public"]["Tables"]["suppliers"]["Update"];

export const supplierService = {
  // Get all suppliers
  async getAll(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching suppliers:", error);
      throw error;
    }

    return data || [];
  },

  // Get supplier by ID
  async getById(id: string): Promise<Supplier | null> {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching supplier:", error);
      throw error;
    }

    return data;
  },

  // Create new supplier
  async create(supplier: SupplierInsert): Promise<Supplier> {
    const { data, error } = await supabase
      .from("suppliers")
      .insert(supplier)
      .select()
      .single();

    if (error) {
      console.error("Error creating supplier:", error);
      throw error;
    }

    return data;
  },

  // Update supplier
  async update(id: string, updates: SupplierUpdate): Promise<Supplier> {
    const { data, error } = await supabase
      .from("suppliers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating supplier:", error);
      throw error;
    }

    return data;
  },

  // Delete supplier
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("suppliers")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting supplier:", error);
      throw error;
    }
  },

  // Search suppliers
  async search(query: string): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error searching suppliers:", error);
      throw error;
    }

    return data || [];
  },
};