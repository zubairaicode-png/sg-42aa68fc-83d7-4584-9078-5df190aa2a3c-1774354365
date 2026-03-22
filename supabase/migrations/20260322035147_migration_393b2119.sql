-- Create chart of accounts table
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_code TEXT UNIQUE NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  parent_account_id UUID REFERENCES chart_of_accounts(id),
  is_active BOOLEAN DEFAULT true,
  opening_balance DECIMAL(15,2) DEFAULT 0,
  current_balance DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view chart of accounts" ON chart_of_accounts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage accounts" ON chart_of_accounts FOR ALL USING (auth.uid() IS NOT NULL);

-- Create journal entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_number TEXT UNIQUE NOT NULL,
  entry_date DATE NOT NULL,
  description TEXT NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  status TEXT DEFAULT 'posted' CHECK (status IN ('draft', 'posted', 'void')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view journal entries" ON journal_entries FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage journal entries" ON journal_entries FOR ALL USING (auth.uid() IS NOT NULL);

-- Create journal entry lines table
CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
  description TEXT,
  debit DECIMAL(15,2) DEFAULT 0,
  credit DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view journal entry lines" ON journal_entry_lines FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage journal entry lines" ON journal_entry_lines FOR ALL USING (auth.uid() IS NOT NULL);

-- Insert default chart of accounts
INSERT INTO chart_of_accounts (account_code, account_name, account_type, opening_balance, current_balance) VALUES
-- Assets
('1000', 'Assets', 'asset', 0, 0),
('1100', 'Current Assets', 'asset', 0, 0),
('1110', 'Cash', 'asset', 0, 0),
('1120', 'Bank Accounts', 'asset', 0, 0),
('1130', 'Accounts Receivable', 'asset', 0, 0),
('1140', 'Inventory', 'asset', 0, 0),
('1150', 'Prepaid Expenses', 'asset', 0, 0),
('1200', 'Fixed Assets', 'asset', 0, 0),
('1210', 'Equipment', 'asset', 0, 0),
('1220', 'Furniture & Fixtures', 'asset', 0, 0),
('1230', 'Vehicles', 'asset', 0, 0),
('1240', 'Accumulated Depreciation', 'asset', 0, 0),
-- Liabilities
('2000', 'Liabilities', 'liability', 0, 0),
('2100', 'Current Liabilities', 'liability', 0, 0),
('2110', 'Accounts Payable', 'liability', 0, 0),
('2120', 'VAT Payable', 'liability', 0, 0),
('2130', 'Accrued Expenses', 'liability', 0, 0),
('2200', 'Long-term Liabilities', 'liability', 0, 0),
('2210', 'Loans Payable', 'liability', 0, 0),
-- Equity
('3000', 'Equity', 'equity', 0, 0),
('3100', 'Owner''s Equity', 'equity', 0, 0),
('3200', 'Retained Earnings', 'equity', 0, 0),
('3300', 'Current Year Earnings', 'equity', 0, 0),
-- Revenue
('4000', 'Revenue', 'revenue', 0, 0),
('4100', 'Sales Revenue', 'revenue', 0, 0),
('4200', 'Service Revenue', 'revenue', 0, 0),
('4300', 'Other Income', 'revenue', 0, 0),
-- Expenses
('5000', 'Expenses', 'expense', 0, 0),
('5100', 'Cost of Goods Sold', 'expense', 0, 0),
('5200', 'Operating Expenses', 'expense', 0, 0),
('5210', 'Salaries & Wages', 'expense', 0, 0),
('5220', 'Rent Expense', 'expense', 0, 0),
('5230', 'Utilities', 'expense', 0, 0),
('5240', 'Marketing & Advertising', 'expense', 0, 0),
('5250', 'Office Supplies', 'expense', 0, 0),
('5260', 'Insurance', 'expense', 0, 0),
('5270', 'Depreciation', 'expense', 0, 0),
('5280', 'Professional Fees', 'expense', 0, 0),
('5290', 'Travel & Entertainment', 'expense', 0, 0),
('5300', 'Bank Charges', 'expense', 0, 0),
('5400', 'VAT Expense', 'expense', 0, 0),
('5500', 'Bad Debt Expense', 'expense', 0, 0),
('5600', 'Repairs & Maintenance', 'expense', 0, 0),
('5700', 'Telephone & Internet', 'expense', 0, 0),
('5800', 'Other Expenses', 'expense', 0, 0)
ON CONFLICT (account_code) DO NOTHING;