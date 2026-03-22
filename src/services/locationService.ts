import { supabase } from "@/integrations/supabase/client";

export interface BusinessLocation {
  id: string;
  location_code: string;
  location_name: string;
  address?: string;
  city?: string;
  country: string;
  phone?: string;
  email?: string;
  is_default: boolean;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export const locationService = {
  // Get all business locations
  async getAll() {
    const { data, error } = await supabase
      .from("business_locations")
      .select("*")
      .order("location_name", { ascending: true });

    if (error) {
      console.error("Error fetching locations:", error);
      throw new Error(error.message);
    }

    return data || [];
  },

  // Get location by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from("business_locations")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching location:", error);
      throw new Error(error.message);
    }

    return data;
  },

  // Create new location
  async create(location: Omit<BusinessLocation, "id" | "created_at" | "updated_at">) {
    const { data: { user } } = await supabase.auth.getUser();

    // If this is set as default, unset other defaults first
    if (location.is_default) {
      await supabase
        .from("business_locations")
        .update({ is_default: false })
        .eq("is_default", true);
    }

    const { data, error } = await supabase
      .from("business_locations")
      .insert({
        ...location,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating location:", error);
      throw new Error(error.message);
    }

    return data;
  },

  // Update location
  async update(id: string, location: Partial<BusinessLocation>) {
    // If this is set as default, unset other defaults first
    if (location.is_default) {
      await supabase
        .from("business_locations")
        .update({ is_default: false })
        .eq("is_default", true)
        .neq("id", id);
    }

    const { data, error } = await supabase
      .from("business_locations")
      .update({
        ...location,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating location:", error);
      throw new Error(error.message);
    }

    return data;
  },

  // Delete location
  async delete(id: string) {
    const { error } = await supabase
      .from("business_locations")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting location:", error);
      throw new Error(error.message);
    }
  },

  // Get default location
  async getDefault() {
    const { data, error } = await supabase
      .from("business_locations")
      .select("*")
      .eq("is_default", true)
      .eq("status", "active")
      .single();

    if (error) {
      console.error("Error fetching default location:", error);
      return null;
    }

    return data;
  },

  // Set default location
  async setDefault(id: string) {
    // Unset all defaults first
    await supabase
      .from("business_locations")
      .update({ is_default: false })
      .eq("is_default", true);

    // Set new default
    const { error } = await supabase
      .from("business_locations")
      .update({ is_default: true })
      .eq("id", id);

    if (error) {
      console.error("Error setting default location:", error);
      throw new Error(error.message);
    }
  },
};