-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_number TEXT NOT NULL UNIQUE,
  purchase_date DATE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  supplier_name TEXT NOT NULL,
  supplier_vat TEXT,
  subtotal NUMERIC(15,2) NOT NULL,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  tax_amount NUMERIC(15,2) NOT NULL,
  total_amount NUMERIC(15,2) NOT NULL,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  paid_amount NUMERIC(15,2) DEFAULT 0,
  due_date DATE,
  notes TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'received', 'cancelled')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase_items table
CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  product_code TEXT,
  quantity NUMERIC(15,3) NOT NULL,
  unit_price NUMERIC(15,2) NOT NULL,
  discount_percentage NUMERIC(5,2) DEFAULT 0,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 15.00,
  tax_amount NUMERIC(15,2) NOT NULL,
  line_total NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase_returns table
CREATE TABLE IF NOT EXISTS purchase_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number TEXT NOT NULL UNIQUE,
  return_date DATE NOT NULL,
  original_purchase_id UUID REFERENCES purchases(id),
  original_purchase_number TEXT NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  supplier_name TEXT NOT NULL,
  subtotal NUMERIC(15,2) NOT NULL,
  tax_amount NUMERIC(15,2) NOT NULL,
  total_amount NUMERIC(15,2) NOT NULL,
  refund_amount NUMERIC(15,2) DEFAULT 0,
  refund_method TEXT CHECK (refund_method IN ('cash', 'credit', 'bank')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'refunded', 'cancelled')),
  reason TEXT NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase_return_items table
CREATE TABLE IF NOT EXISTS purchase_return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID REFERENCES purchase_returns(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  original_quantity NUMERIC(15,3) NOT NULL,
  return_quantity NUMERIC(15,3) NOT NULL,
  unit_price NUMERIC(15,2) NOT NULL,
  tax_rate NUMERIC(5,2) DEFAULT 15.00,
  tax_amount NUMERIC(15,2) NOT NULL,
  line_total NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bank_accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  iban TEXT,
  swift_code TEXT,
  currency TEXT DEFAULT 'SAR',
  current_balance NUMERIC(15,2) DEFAULT 0,
  opening_balance NUMERIC(15,2) DEFAULT 0,
  opening_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bank_transactions table
CREATE TABLE IF NOT EXISTS bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  reference_number TEXT,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer')),
  amount NUMERIC(15,2) NOT NULL,
  balance_after NUMERIC(15,2),
  category TEXT,
  reconciled BOOLEAN DEFAULT FALSE,
  reconciled_date DATE,
  reconciled_by UUID REFERENCES auth.users(id),
  matched_transaction_id UUID,
  matched_transaction_type TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bank_reconciliations table
CREATE TABLE IF NOT EXISTS bank_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE,
  reconciliation_date DATE NOT NULL,
  statement_date DATE NOT NULL,
  statement_balance NUMERIC(15,2) NOT NULL,
  book_balance NUMERIC(15,2) NOT NULL,
  difference NUMERIC(15,2) NOT NULL,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'approved')),
  reconciled_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_reconciliations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for purchases
CREATE POLICY "Users can view all purchases" ON purchases FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert purchases" ON purchases FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update purchases" ON purchases FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete purchases" ON purchases FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view purchase items" ON purchase_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert purchase items" ON purchase_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update purchase items" ON purchase_items FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete purchase items" ON purchase_items FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create RLS policies for purchase returns
CREATE POLICY "Users can view all purchase returns" ON purchase_returns FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert purchase returns" ON purchase_returns FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update purchase returns" ON purchase_returns FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete purchase returns" ON purchase_returns FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view purchase return items" ON purchase_return_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert purchase return items" ON purchase_return_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update purchase return items" ON purchase_return_items FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete purchase return items" ON purchase_return_items FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create RLS policies for bank accounts
CREATE POLICY "Users can view all bank accounts" ON bank_accounts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert bank accounts" ON bank_accounts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update bank accounts" ON bank_accounts FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete bank accounts" ON bank_accounts FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view bank transactions" ON bank_transactions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert bank transactions" ON bank_transactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update bank transactions" ON bank_transactions FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete bank transactions" ON bank_transactions FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view bank reconciliations" ON bank_reconciliations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert bank reconciliations" ON bank_reconciliations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update bank reconciliations" ON bank_reconciliations FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete bank reconciliations" ON bank_reconciliations FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create indexes for better performance
CREATE INDEX idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX idx_purchases_date ON purchases(purchase_date DESC);
CREATE INDEX idx_purchases_status ON purchases(status);
CREATE INDEX idx_purchase_items_purchase ON purchase_items(purchase_id);
CREATE INDEX idx_purchase_returns_date ON purchase_returns(return_date DESC);
CREATE INDEX idx_purchase_returns_status ON purchase_returns(status);
CREATE INDEX idx_bank_transactions_account ON bank_transactions(account_id);
CREATE INDEX idx_bank_transactions_date ON bank_transactions(transaction_date DESC);
CREATE INDEX idx_bank_transactions_reconciled ON bank_transactions(reconciled);

COMMENT ON TABLE purchases IS 'Stores purchase orders and invoices from suppliers';
COMMENT ON TABLE purchase_items IS 'Stores line items for purchases';
COMMENT ON TABLE purchase_returns IS 'Stores purchase return headers';
COMMENT ON TABLE purchase_return_items IS 'Stores purchase return line items';
COMMENT ON TABLE bank_accounts IS 'Stores bank account information';
COMMENT ON TABLE bank_transactions IS 'Stores bank transactions for reconciliation';
COMMENT ON TABLE bank_reconciliations IS 'Stores bank reconciliation sessions';