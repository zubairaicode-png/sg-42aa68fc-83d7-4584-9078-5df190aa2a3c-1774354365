-- Add subscription_id column to sales_invoices table
ALTER TABLE sales_invoices 
ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES customer_subscriptions(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_invoices_subscription_id ON sales_invoices(subscription_id);

-- Add invoice tracking to customer_subscriptions
ALTER TABLE customer_subscriptions
ADD COLUMN IF NOT EXISTS last_invoice_date DATE,
ADD COLUMN IF NOT EXISTS last_invoice_id UUID REFERENCES sales_invoices(id) ON DELETE SET NULL;