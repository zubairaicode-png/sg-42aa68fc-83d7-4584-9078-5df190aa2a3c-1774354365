-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'annual')),
  price DECIMAL(10, 2) NOT NULL,
  setup_fee DECIMAL(10, 2) DEFAULT 0,
  trial_days INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  resource_limits JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer_subscriptions table
CREATE TABLE IF NOT EXISTS customer_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('trial', 'active', 'suspended', 'cancelled', 'expired')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN DEFAULT true,
  price DECIMAL(10, 2) NOT NULL,
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription_invoices table
CREATE TABLE IF NOT EXISTS subscription_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES customer_subscriptions(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  billing_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  billing_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  vat_amount DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans
CREATE POLICY "Users can view subscription plans" ON subscription_plans FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert subscription plans" ON subscription_plans FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update subscription plans" ON subscription_plans FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete subscription plans" ON subscription_plans FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for customer_subscriptions
CREATE POLICY "Users can view subscriptions" ON customer_subscriptions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert subscriptions" ON customer_subscriptions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update subscriptions" ON customer_subscriptions FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete subscriptions" ON customer_subscriptions FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for subscription_invoices
CREATE POLICY "Users can view subscription invoices" ON subscription_invoices FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert subscription invoices" ON subscription_invoices FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update subscription invoices" ON subscription_invoices FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create indexes for better performance
CREATE INDEX idx_subscriptions_customer ON customer_subscriptions(customer_id);
CREATE INDEX idx_subscriptions_plan ON customer_subscriptions(plan_id);
CREATE INDEX idx_subscriptions_status ON customer_subscriptions(status);
CREATE INDEX idx_subscriptions_next_billing ON customer_subscriptions(next_billing_date);
CREATE INDEX idx_subscription_invoices_subscription ON subscription_invoices(subscription_id);
CREATE INDEX idx_subscription_invoices_status ON subscription_invoices(status);

-- Insert sample subscription plans
INSERT INTO subscription_plans (name, description, billing_cycle, price, setup_fee, trial_days, features, resource_limits, is_active) VALUES
('Basic Cloud Hosting', 'Perfect for small websites and blogs', 'monthly', 99.00, 50.00, 14, 
 '["1 Website", "10GB Storage", "100GB Bandwidth", "Free SSL Certificate", "24/7 Support"]'::jsonb,
 '{"storage_gb": 10, "bandwidth_gb": 100, "domains": 1, "emails": 5}'::jsonb, true),

('Pro Cloud Hosting', 'Ideal for growing businesses', 'monthly', 299.00, 50.00, 14,
 '["5 Websites", "50GB Storage", "500GB Bandwidth", "Free SSL Certificate", "Priority Support", "Daily Backups"]'::jsonb,
 '{"storage_gb": 50, "bandwidth_gb": 500, "domains": 5, "emails": 25}'::jsonb, true),

('Enterprise Cloud Hosting', 'For large-scale applications', 'monthly', 999.00, 100.00, 30,
 '["Unlimited Websites", "200GB Storage", "2TB Bandwidth", "Free SSL Certificate", "Dedicated Support", "Hourly Backups", "CDN Included"]'::jsonb,
 '{"storage_gb": 200, "bandwidth_gb": 2000, "domains": -1, "emails": 100}'::jsonb, true),

('VPS Server - Basic', 'Virtual Private Server for developers', 'monthly', 499.00, 0, 7,
 '["2 CPU Cores", "4GB RAM", "80GB SSD", "Root Access", "Dedicated IP", "24/7 Support"]'::jsonb,
 '{"cpu_cores": 2, "ram_gb": 4, "storage_gb": 80}'::jsonb, true),

('VPS Server - Pro', 'High-performance VPS for demanding apps', 'monthly', 999.00, 0, 7,
 '["4 CPU Cores", "8GB RAM", "160GB SSD", "Root Access", "2 Dedicated IPs", "Priority Support", "Free Backups"]'::jsonb,
 '{"cpu_cores": 4, "ram_gb": 8, "storage_gb": 160}'::jsonb, true),

('Annual Basic Hosting', 'Save 20% with annual billing', 'annual', 950.00, 50.00, 30,
 '["1 Website", "10GB Storage", "100GB Bandwidth", "Free SSL Certificate", "24/7 Support", "2 Months Free"]'::jsonb,
 '{"storage_gb": 10, "bandwidth_gb": 100, "domains": 1, "emails": 5}'::jsonb, true);