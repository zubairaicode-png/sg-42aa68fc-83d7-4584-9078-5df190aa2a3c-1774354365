import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type User = Database["public"]["Tables"]["profiles"]["Row"];

export const userService = {
  async getAll() {
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        *,
        user_locations (
          id,
          location_id,
          is_primary,
          business_locations (
            id,
            location_name,
            city,
            country
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      throw error;
    }

    return data || [];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        *,
        user_locations (
          id,
          location_id,
          is_primary,
          business_locations (
            id,
            location_name,
            city,
            country
          )
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching user:", error);
      throw error;
    }

    return data;
  },

  async update(id: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating user:", error);
      throw error;
    }

    return data;
  },

  async assignLocations(userId: string, locationIds: string[], primaryLocationId: string) {
    // Delete existing location assignments
    await supabase
      .from("user_locations")
      .delete()
      .eq("user_id", userId);

    // Insert new location assignments
    const userLocations = locationIds.map(locationId => ({
      user_id: userId,
      location_id: locationId,
      is_primary: locationId === primaryLocationId
    }));

    const { error } = await supabase
      .from("user_locations")
      .insert(userLocations);

    if (error) {
      console.error("Error assigning locations:", error);
      throw error;
    }
  },

  async delete(id: string) {
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }
};