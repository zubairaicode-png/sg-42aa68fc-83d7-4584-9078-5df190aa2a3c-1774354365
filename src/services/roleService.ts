import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];
type UserRoleInsert = Database["public"]["Tables"]["user_roles"]["Insert"];
type UserRoleUpdate = Database["public"]["Tables"]["user_roles"]["Update"];

// Helper function to generate role_code from role_name
const generateRoleCode = (roleName: string): string => {
  return roleName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
};

export const roleService = {
  async getAll(): Promise<UserRole[]> {
    console.log("Fetching all roles from user_roles table...");
    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .order("created_at", { ascending: false });

    console.log("Roles query result:", { data, error });

    if (error) {
      console.error("Error fetching roles:", error);
      throw error;
    }

    return data || [];
  },

  async getById(id: string): Promise<UserRole | null> {
    console.log("Fetching role by id:", id);
    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .eq("id", id)
      .single();

    console.log("Role by id result:", { data, error });

    if (error) {
      console.error("Error fetching role:", error);
      throw error;
    }

    return data;
  },

  async create(roleData: { name: string; description?: string; permissions?: Record<string, boolean> }): Promise<UserRole> {
    console.log("Creating new role with data:", roleData);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    console.log("Current user:", user);

    const insertData: UserRoleInsert = {
      role_name: roleData.name,
      role_code: generateRoleCode(roleData.name),
      description: roleData.description || null,
      permissions: roleData.permissions || {},
      is_system_role: false,
      is_active: true,
      created_by: user?.id || null,
    };

    console.log("Insert data prepared:", insertData);

    const { data, error } = await supabase
      .from("user_roles")
      .insert(insertData)
      .select()
      .single();

    console.log("Insert result:", { data, error });

    if (error) {
      console.error("Error creating role:", error);
      throw error;
    }

    return data;
  },

  async update(id: string, roleData: { name?: string; description?: string; permissions?: Record<string, boolean> }): Promise<UserRole> {
    console.log("Updating role:", id, "with data:", roleData);

    const updateData: UserRoleUpdate = {
      ...(roleData.name && { 
        role_name: roleData.name,
        role_code: generateRoleCode(roleData.name)
      }),
      ...(roleData.description !== undefined && { description: roleData.description }),
      ...(roleData.permissions && { permissions: roleData.permissions }),
      updated_at: new Date().toISOString(),
    };

    console.log("Update data prepared:", updateData);

    const { data, error } = await supabase
      .from("user_roles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    console.log("Update result:", { data, error });

    if (error) {
      console.error("Error updating role:", error);
      throw error;
    }

    return data;
  },

  async delete(id: string): Promise<void> {
    console.log("Deleting role:", id);

    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("id", id);

    console.log("Delete result:", { error });

    if (error) {
      console.error("Error deleting role:", error);
      throw error;
    }
  }
};