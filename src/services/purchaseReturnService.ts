import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { accountingService } from "./accountingService";

type PurchaseReturn = Database["public"]["Tables"]["purchase_returns"]["Row"];
type PurchaseReturnItem = Database["public"]["Tables"]["purchase_return_items"]["Row"];

export interface PurchaseReturnWithItems extends PurchaseReturn {
  purchase_return_items: PurchaseReturnItem[];
  suppliers?: {
    id: string;
    name: string;
    vat_number?: string;
  };
}

export const purchaseReturnService = {
  async getAll(): Promise<PurchaseReturnWithItems[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("purchase_returns")
      .select(`
        *,
        purchase_return_items (*),
        suppliers (id, name, vat_number)
      `)
      .eq("created_by", user.id)
      .order("return_date", { ascending: false });

    if (error) {
      console.error("Error fetching purchase returns:", error);
      throw error;
    }

    return data || [];
  },

  async getById(id: string): Promise<PurchaseReturnWithItems> {
    const { data, error } = await supabase
      .from("purchase_returns")
      .select(`
        *,
        purchase_return_items (*),
        suppliers (id, name, vat_number)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching purchase return:", error);
      throw error;
    }

    return data;
  },

  async create(
    purchaseReturn: Omit<PurchaseReturn, "id" | "created_at" | "updated_at" | "created_by">,
    items: Array<Omit<PurchaseReturnItem, "id" | "return_id" | "created_at">>
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Create purchase return
    const { data: returnData, error: returnError } = await (supabase.from("purchase_returns") as any)
      .insert({
        ...purchaseReturn,
        created_by: user.id,
      })
      .select()
      .single();

    if (returnError) throw returnError;

    // Create return items
    const itemsToInsert = items.map(item => ({
      ...item,
      return_id: returnData.id,
    }));

    const { error: itemsError } = await (supabase.from("purchase_return_items") as any)
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    // Create journal entry for the purchase return
    try {
      await accountingService.createJournalEntryFromPurchaseReturn(returnData);
      console.log("Journal entry created for purchase return");
    } catch (error) {
      console.error("Error creating journal entry for purchase return:", error);
      // Continue even if journal entry fails
    }

    return returnData;
  },

  async updateStatus(id: string, status: string) {
    const { data, error } = await (supabase.from("purchase_returns") as any)
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    // Delete items first (foreign key constraint)
    const { error: itemsError } = await (supabase.from("purchase_return_items") as any)
      .delete()
      .eq("return_id", id);

    if (itemsError) throw itemsError;

    // Delete return
    const { error } = await (supabase.from("purchase_returns") as any)
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};