import { supabase } from "@/integrations/supabase/client";

export interface FixedAsset {
  id?: string;
  asset_name: string;
  asset_code: string;
  category: string;
  purchase_date: string;
  purchase_cost: number;
  salvage_value: number;
  useful_life_years: number;
  depreciation_method: "straight_line" | "declining_balance" | "units_of_production";
  current_value: number;
  accumulated_depreciation: number;
  location?: string;
  status: "active" | "disposed" | "sold" | "retired";
  notes?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DepreciationSchedule {
  id?: string;
  asset_id: string;
  period_date: string;
  depreciation_amount: number;
  accumulated_depreciation: number;
  book_value: number;
  is_posted: boolean;
  created_at?: string;
}

export const fixedAssetsService = {
  async getAll() {
    const { data, error } = await ((supabase as any).from("fixed_assets"))
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as FixedAsset[];
  },

  async getById(id: string) {
    const { data, error } = await ((supabase as any).from("fixed_assets"))
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as FixedAsset;
  },

  async create(asset: Omit<FixedAsset, "id" | "created_at" | "updated_at" | "created_by">) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await ((supabase as any).from("fixed_assets"))
      .insert({
        ...asset,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, asset: Partial<FixedAsset>) {
    const { data, error } = await ((supabase as any).from("fixed_assets"))
      .update({ ...asset, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await ((supabase as any).from("fixed_assets"))
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  calculateDepreciation(asset: FixedAsset, periods: number): DepreciationSchedule[] {
    const schedule: DepreciationSchedule[] = [];
    let accumulatedDepreciation = asset.accumulated_depreciation || 0;
    let bookValue = asset.current_value;

    const purchaseDate = new Date(asset.purchase_date);

    for (let i = 0; i < periods; i++) {
      const periodDate = new Date(purchaseDate);
      periodDate.setFullYear(periodDate.getFullYear() + i + 1);

      let depreciationAmount = 0;

      if (asset.depreciation_method === "straight_line") {
        depreciationAmount = (asset.purchase_cost - asset.salvage_value) / asset.useful_life_years;
      } else if (asset.depreciation_method === "declining_balance") {
        const rate = 2 / asset.useful_life_years;
        depreciationAmount = bookValue * rate;
      }

      // Don't depreciate below salvage value
      if (bookValue - depreciationAmount < asset.salvage_value) {
        depreciationAmount = bookValue - asset.salvage_value;
      }

      accumulatedDepreciation += depreciationAmount;
      bookValue -= depreciationAmount;

      schedule.push({
        asset_id: asset.id!,
        period_date: periodDate.toISOString().split("T")[0],
        depreciation_amount: depreciationAmount,
        accumulated_depreciation: accumulatedDepreciation,
        book_value: bookValue,
        is_posted: false,
      });

      if (bookValue <= asset.salvage_value) break;
    }

    return schedule;
  },

  async saveDepreciationSchedule(schedule: DepreciationSchedule[]) {
    const { data, error } = await ((supabase as any).from("depreciation_schedule"))
      .insert(schedule)
      .select();

    if (error) throw error;
    return data;
  },

  async getDepreciationSchedule(assetId: string) {
    const { data, error } = await ((supabase as any).from("depreciation_schedule"))
      .select("*")
      .eq("asset_id", assetId)
      .order("period_date", { ascending: true });

    if (error) throw error;
    return data as DepreciationSchedule[];
  },

  async postDepreciation(scheduleId: string) {
    const { data, error } = await ((supabase as any).from("depreciation_schedule"))
      .update({ is_posted: true })
      .eq("id", scheduleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};