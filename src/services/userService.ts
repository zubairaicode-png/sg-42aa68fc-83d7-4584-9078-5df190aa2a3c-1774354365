import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export const userService = {
  // Get all users with their profiles
  async getAll() {
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        *,
        user_locations!user_locations_user_id_fkey(
          id,
          is_primary,
          location_id,
          business_locations!user_locations_location_id_fkey(
            id,
            location_code,
            location_name
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      throw new Error(error.message);
    }

    return data || [];
  },

  // Get user by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        *,
        user_locations!user_locations_user_id_fkey(
          id,
          is_primary,
          location_id,
          business_locations!user_locations_location_id_fkey(
            id,
            location_code,
            location_name
          )
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching user:", error);
      throw new Error(error.message);
    }

    return data;
  },

  // Update user profile
  async update(id: string, data: ProfileUpdate) {
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: data.full_name,
        email: data.email,
        role: data.role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Error updating user:", error);
      throw new Error(error.message);
    }
  },

  // Assign locations to user
  async assignLocations(userId: string, locationIds: string[], primaryLocationId?: string) {
    // First, delete existing locations
    const { error: deleteError } = await supabase
      .from("user_locations")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Error deleting user locations:", deleteError);
      throw new Error(deleteError.message);
    }

    // Then insert new locations
    if (locationIds.length > 0) {
      const userLocations = locationIds.map(locationId => ({
        user_id: userId,
        location_id: locationId,
        is_primary: locationId === primaryLocationId,
      }));

      const { error: insertError } = await supabase
        .from("user_locations")
        .insert(userLocations);

      if (insertError) {
        console.error("Error assigning locations:", insertError);
        throw new Error(insertError.message);
      }
    }
  },

  // Get user's assigned locations
  async getUserLocations(userId: string) {
    const { data, error } = await supabase
      .from("user_locations")
      .select(`
        *,
        business_locations!user_locations_location_id_fkey(*)
      `)
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching user locations:", error);
      throw new Error(error.message);
    }

    return data || [];
  },

  // Get current user's primary location
  async getCurrentUserPrimaryLocation() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data, error } = await supabase
      .from("user_locations")
      .select(`
        business_locations!user_locations_location_id_fkey(*)
      `)
      .eq("user_id", user.id)
      .eq("is_primary", true)
      .single();

    if (error) {
      console.error("Error fetching primary location:", error);
      return null;
    }

    return data?.business_locations || null;
  },

  // Check if user has access to location
  async hasLocationAccess(userId: string, locationId: string) {
    const { data, error } = await supabase
      .from("user_locations")
      .select("id")
      .eq("user_id", userId)
      .eq("location_id", locationId)
      .single();

    if (error) return false;
    return !!data;
  },
};