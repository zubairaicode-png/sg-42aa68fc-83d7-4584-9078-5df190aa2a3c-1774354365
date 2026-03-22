import { supabase } from "@/integrations/supabase/client";

export interface UserRole {
  id: string;
  role_name: string;
  role_code: string;
  description: string | null;
  permissions: Record<string, any>;
  is_system_role: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const roleService = {
  async getAll() {
    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .eq("is_active", true)
      .order("role_name");

    if (error) {
      console.error("Error fetching roles:", error);
      throw error;
    }

    return data as UserRole[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching role:", error);
      throw error;
    }

    return data as UserRole;
  },

  async create(role: Partial<UserRole>) {
    const { data, error } = await supabase
      .from("user_roles")
      .insert({
        role_name: role.role_name,
        role_code: role.role_code,
        description: role.description,
        permissions: role.permissions || {},
        is_system_role: false,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating role:", error);
      throw error;
    }

    return data as UserRole;
  },

  async update(id: string, updates: Partial<UserRole>) {
    const { data, error } = await supabase
      .from("user_roles")
      .update({
        role_name: updates.role_name,
        description: updates.description,
        permissions: updates.permissions,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating role:", error);
      throw error;
    }

    return data as UserRole;
  },

  async delete(id: string) {
    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from("user_roles")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      console.error("Error deleting role:", error);
      throw error;
    }
  }
};