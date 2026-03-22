import { supabase } from "@/integrations/supabase/client";
import type { SubscriptionPlan, CustomerSubscription } from "@/types/subscription";

export const subscriptionService = {
  // ============ SUBSCRIPTION PLANS ============
  
  async getPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .order("price", { ascending: true });

    if (error) {
      console.error("Error fetching subscription plans:", error);
      throw error;
    }

    return (data as unknown) as SubscriptionPlan[];
  },

  async getPlanById(id: string): Promise<SubscriptionPlan | null> {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching subscription plan:", error);
      throw error;
    }

    return (data as unknown) as SubscriptionPlan | null;
  },

  async createPlan(plan: Omit<SubscriptionPlan, "id" | "created_at" | "updated_at">): Promise<SubscriptionPlan> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("subscription_plans")
      .insert([plan as any])
      .select()
      .single();

    if (error) {
      console.error("Error creating subscription plan:", error);
      throw error;
    }

    return (data as unknown) as SubscriptionPlan;
  },

  async updatePlan(id: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const { data, error } = await supabase
      .from("subscription_plans")
      .update(updates as any)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating subscription plan:", error);
      throw error;
    }

    return (data as unknown) as SubscriptionPlan;
  },

  async deletePlan(id: string): Promise<void> {
    const { error } = await supabase
      .from("subscription_plans")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting subscription plan:", error);
      throw error;
    }
  },

  // ============ CUSTOMER SUBSCRIPTIONS ============

  async getSubscriptions(): Promise<CustomerSubscription[]> {
    const { data, error } = await supabase
      .from("customer_subscriptions")
      .select(`
        *,
        customer:customers(id, name, email),
        plan:subscription_plans(id, name, billing_cycle)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching subscriptions:", error);
      throw error;
    }

    return (data as unknown) as CustomerSubscription[];
  },

  async getSubscriptionById(id: string): Promise<CustomerSubscription | null> {
    const { data, error } = await supabase
      .from("customer_subscriptions")
      .select(`
        *,
        customer:customers(id, name, email, phone),
        plan:subscription_plans(*)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching subscription:", error);
      throw error;
    }

    return (data as unknown) as CustomerSubscription | null;
  },

  async getCustomerSubscriptions(customerId: string): Promise<CustomerSubscription[]> {
    const { data, error } = await supabase
      .from("customer_subscriptions")
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching customer subscriptions:", error);
      throw error;
    }

    return (data as unknown) as CustomerSubscription[];
  },

  async createSubscription(subscription: Omit<CustomerSubscription, "id" | "created_at" | "updated_at">): Promise<CustomerSubscription> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("customer_subscriptions")
      .insert([subscription as any])
      .select()
      .single();

    if (error) {
      console.error("Error creating subscription:", error);
      throw error;
    }

    return (data as unknown) as CustomerSubscription;
  },

  async updateSubscription(id: string, updates: Partial<CustomerSubscription>): Promise<CustomerSubscription> {
    const { data, error } = await supabase
      .from("customer_subscriptions")
      .update(updates as any)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating subscription:", error);
      throw error;
    }

    return (data as unknown) as CustomerSubscription;
  },

  async cancelSubscription(id: string): Promise<CustomerSubscription> {
    return this.updateSubscription(id, {
      status: "cancelled",
      auto_renew: false,
      end_date: new Date().toISOString(),
    });
  },

  async suspendSubscription(id: string): Promise<CustomerSubscription> {
    return this.updateSubscription(id, { status: "suspended" });
  },

  async activateSubscription(id: string): Promise<CustomerSubscription> {
    return this.updateSubscription(id, { status: "active" });
  },

  // ============ SUBSCRIPTION METRICS ============

  async getMetrics() {
    const { data: subscriptions, error } = await supabase
      .from("customer_subscriptions")
      .select(`
        status, 
        price,
        plan:subscription_plans(billing_cycle)
      `);

    if (error) {
      console.error("Error fetching subscription metrics:", error);
      throw error;
    }

    const total = subscriptions?.length || 0;
    const active = subscriptions?.filter((s: any) => s.status === "active").length || 0;
    const trial = subscriptions?.filter((s: any) => s.status === "trial").length || 0;
    const suspended = subscriptions?.filter((s: any) => s.status === "suspended").length || 0;
    const cancelled = subscriptions?.filter((s: any) => s.status === "cancelled").length || 0;

    // Calculate MRR (Monthly Recurring Revenue)
    let mrr = 0;
    subscriptions?.forEach((sub: any) => {
      if (sub.status === "active" || sub.status === "trial") {
        const cycle = sub.plan?.billing_cycle || "monthly";
        const monthlyPrice = cycle === "monthly" ? Number(sub.price) :
                           cycle === "quarterly" ? Number(sub.price) / 3 :
                           Number(sub.price) / 12;
        mrr += monthlyPrice;
      }
    });

    const arr = mrr * 12;
    const arpu = active > 0 ? mrr / active : 0;
    const churnRate = total > 0 ? (cancelled / total) * 100 : 0;

    return {
      total_subscriptions: total,
      active_subscriptions: active,
      trial_subscriptions: trial,
      suspended_subscriptions: suspended,
      cancelled_subscriptions: cancelled,
      mrr,
      arr,
      average_revenue_per_user: arpu,
      churn_rate: churnRate,
    };
  },
};