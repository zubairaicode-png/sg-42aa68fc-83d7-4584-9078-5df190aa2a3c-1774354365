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

  // ============ INVOICE GENERATION ============

  async generateInvoiceForSubscription(subscriptionId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Get subscription with customer and plan details
    const subscription = await this.getSubscriptionById(subscriptionId);
    if (!subscription) throw new Error("Subscription not found");

    if (subscription.status !== "active" && subscription.status !== "trial") {
      throw new Error("Cannot generate invoice for inactive subscription");
    }

    // Calculate invoice details based on plan
    const plan = subscription.plan;
    if (!plan) throw new Error("Subscription plan not found");

    const today = new Date();
    const invoiceNumber = `INV-${today.getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, "0")}`;

    // Create invoice items from subscription plan
    const items = [
      {
        product_id: null, // No product for subscription invoices
        description: `${plan.name} - ${plan.billing_cycle.charAt(0).toUpperCase() + plan.billing_cycle.slice(1)} Subscription`,
        quantity: 1,
        unit_price: subscription.price,
        discount_percent: subscription.discount_percent || 0,
        vat_percent: 15, // Saudi VAT
      }
    ];

    // Calculate totals
    const subtotal = subscription.price;
    const discountAmount = (subtotal * (subscription.discount_percent || 0)) / 100;
    const taxableAmount = subtotal - discountAmount;
    const vatAmount = (taxableAmount * 15) / 100;
    const totalAmount = taxableAmount + vatAmount;

    // Calculate due date based on billing cycle
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 30); // 30 days payment term

    // Calculate next billing date
    const nextBillingDate = new Date(subscription.next_billing_date || today);
    if (plan.billing_cycle === "monthly") {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    } else if (plan.billing_cycle === "quarterly") {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
    } else if (plan.billing_cycle === "annual") {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    }

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("sales_invoices")
      .insert([
        {
          invoice_number: invoiceNumber,
          customer_id: subscription.customer_id,
          subscription_id: subscriptionId,
          date: today.toISOString().split("T")[0],
          due_date: dueDate.toISOString().split("T")[0],
          items: items,
          subtotal: subtotal,
          discount: discountAmount,
          vat: vatAmount,
          total: totalAmount,
          payment_status: "pending",
          payment_method: null,
          notes: `Auto-generated invoice for ${plan.name} subscription`,
          created_by: user.id,
        } as any,
      ])
      .select()
      .single();

    if (invoiceError) {
      console.error("Error creating invoice:", invoiceError);
      throw invoiceError;
    }

    // Update subscription with last invoice info and next billing date
    const { error: updateError } = await supabase
      .from("customer_subscriptions")
      .update({
        last_invoice_date: today.toISOString().split("T")[0],
        last_invoice_id: invoice.id,
        next_billing_date: nextBillingDate.toISOString().split("T")[0],
      } as any)
      .eq("id", subscriptionId);

    if (updateError) {
      console.error("Error updating subscription:", updateError);
      throw updateError;
    }

    return invoice;
  },

  async generateInvoicesForDueSubscriptions() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Get all active/trial subscriptions with billing date today or earlier
    const today = new Date().toISOString().split("T")[0];
    
    const { data: dueSubscriptions, error } = await supabase
      .from("customer_subscriptions")
      .select(`
        *,
        customer:customers(id, name, email),
        plan:subscription_plans(*)
      `)
      .in("status", ["active", "trial"])
      .lte("next_billing_date", today)
      .eq("auto_renew", true);

    if (error) {
      console.error("Error fetching due subscriptions:", error);
      throw error;
    }

    const results = {
      success: [] as any[],
      failed: [] as any[],
    };

    for (const subscription of dueSubscriptions || []) {
      try {
        const invoice = await this.generateInvoiceForSubscription(subscription.id);
        results.success.push({
          subscription,
          invoice,
        });
      } catch (err) {
        console.error(`Failed to generate invoice for subscription ${subscription.id}:`, err);
        results.failed.push({
          subscription,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return results;
  },

  async getSubscriptionInvoices(subscriptionId: string) {
    const { data, error } = await supabase
      .from("sales_invoices")
      .select("*")
      .eq("subscription_id", subscriptionId)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching subscription invoices:", error);
      throw error;
    }

    return data || [];
  },
};