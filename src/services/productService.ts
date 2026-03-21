import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];
type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

export const productService = {
  // Get all products
  async getAll(): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products:", error);
      throw error;
    }

    return data || [];
  },

  // Get product by ID
  async getById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching product:", error);
      throw error;
    }

    return data;
  },

  // Create new product
  async create(product: ProductInsert): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .insert(product)
      .select()
      .single();

    if (error) {
      console.error("Error creating product:", error);
      throw error;
    }

    return data;
  },

  // Update product
  async update(id: string, updates: ProductUpdate): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating product:", error);
      throw error;
    }

    return data;
  },

  // Delete product
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  },

  // Update product stock
  async updateStock(id: string, quantity: number): Promise<Product> {
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Error fetching product stock:", fetchError);
      throw fetchError;
    }

    const newQuantity = (product?.stock_quantity || 0) + quantity;

    const { data, error } = await supabase
      .from("products")
      .update({ stock_quantity: newQuantity })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating product stock:", error);
      throw error;
    }

    return data;
  },

  // Search products
  async search(query: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%,barcode.ilike.%${query}%`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error searching products:", error);
      throw error;
    }

    return data || [];
  },

  // Get low stock products
  async getLowStock(): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("stock_quantity", { ascending: true });

    if (error) {
      console.error("Error fetching low stock products:", error);
      throw error;
    }

    // Filter in memory since comparing two columns requires RPC in standard supabase-js
    const lowStock = (data || []).filter(
      product => (product.stock_quantity || 0) <= (product.reorder_level || 0)
    );

    return lowStock;
  },
};