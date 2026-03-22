// Subscription-related TypeScript types

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  billing_cycle: "monthly" | "quarterly" | "annual";
  price: number;
  setup_fee?: number;
  trial_days?: number;
  features: string[];
  resource_limits?: {
    storage_gb?: number;
    bandwidth_gb?: number;
    cpu_cores?: number;
    ram_gb?: number;
    domains?: number;
    emails?: number;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerSubscription {
  id: string;
  customer_id: string;
  plan_id: string;
  status: "trial" | "active" | "suspended" | "cancelled" | "expired";
  start_date: string;
  end_date?: string;
  next_billing_date?: string;
  trial_end_date?: string;
  auto_renew: boolean;
  price: number; // Locked price at subscription time
  discount_percent?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionInvoice {
  id: string;
  subscription_id: string;
  customer_id: string;
  invoice_number: string;
  billing_period_start: string;
  billing_period_end: string;
  amount: number;
  vat_amount: number;
  total_amount: number;
  status: "pending" | "paid" | "overdue" | "cancelled";
  due_date: string;
  paid_date?: string;
  created_at: string;
}

export interface SubscriptionMetrics {
  total_subscriptions: number;
  active_subscriptions: number;
  trial_subscriptions: number;
  suspended_subscriptions: number;
  cancelled_subscriptions: number;
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  churn_rate: number;
  average_revenue_per_user: number;
}