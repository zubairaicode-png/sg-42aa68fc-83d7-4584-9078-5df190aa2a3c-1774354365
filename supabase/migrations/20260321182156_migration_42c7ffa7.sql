-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_number TEXT UNIQUE NOT NULL,
  expense_date DATE NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  vendor_name TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  reference_number TEXT,
  description TEXT,
  notes TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'paid', 'rejected')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create zatca_devices table
CREATE TABLE IF NOT EXISTS zatca_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_name TEXT NOT NULL,
  csr TEXT,
  private_key TEXT,
  certificate TEXT,
  certificate_expiry TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'revoked')),
  last_used TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create zatca_submissions table
CREATE TABLE IF NOT EXISTS zatca_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL,
  zatca_uuid TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reported', 'cleared', 'rejected')),
  zatca_response JSONB,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE zatca_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE zatca_submissions ENABLE ROW LEVEL SECURITY;

-- Add basic RLS policies
CREATE POLICY "Users can view all expenses" ON expenses FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert expenses" ON expenses FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update expenses" ON expenses FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete expenses" ON expenses FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view zatca devices" ON zatca_devices FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert zatca devices" ON zatca_devices FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update zatca devices" ON zatca_devices FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view zatca submissions" ON zatca_submissions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert zatca submissions" ON zatca_submissions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update zatca submissions" ON zatca_submissions FOR UPDATE USING (auth.uid() IS NOT NULL);