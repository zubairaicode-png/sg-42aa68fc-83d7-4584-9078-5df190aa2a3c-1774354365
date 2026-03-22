import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Role = Database["public"]["Tables"]["roles"]["Row"];
type RoleInsert = Database["public"]["Tables"]["roles"]["Insert"];
type RoleUpdate = Database["public"]["Tables"]["roles"]["Update"];

export const roleService = {
  async getAll() {
    const { data, error } = await supabase
      .from("roles")
      .select("*")
      .order("created_at", { ascending: false });

    console.log("Role service getAll:", { data, error });

    if (error) {
      console.error("Error fetching roles:", error);
      throw error;
    }

    return data || [];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("roles")
      .select("*")
      .eq("id", id)
      .single();

    console.log("Role service getById:", { data, error });

    if (error) {
      console.error("Error fetching role:", error);
      throw error;
    }

    return data;
  },

  async create(role: RoleInsert) {
    const { data, error } = await supabase
      .from("roles")
      .insert(role)
      .select()
      .single();

    console.log("Role service create:", { data, error });

    if (error) {
      console.error("Error creating role:", error);
      throw error;
    }

    return data;
  },

  async update(id: string, updates: RoleUpdate) {
    const { data, error } = await supabase
      .from("roles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    console.log("Role service update:", { data, error });

    if (error) {
      console.error("Error updating role:", error);
      throw error;
    }

    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from("roles")
      .delete()
      .eq("id", id);

    console.log("Role service delete:", { error });

    if (error) {
      console.error("Error deleting role:", error);
      throw error;
    }
  }
};