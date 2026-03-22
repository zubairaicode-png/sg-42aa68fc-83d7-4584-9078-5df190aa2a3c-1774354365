-- Create purchase_invoices table
CREATE TABLE IF NOT EXISTS purchase_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL UNIQUE,
  supplier_id UUID REFERENCES suppliers(id),
  supplier_name TEXT NOT NULL,
  supplier_vat TEXT,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid', 'partial')),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase_invoice_items table
CREATE TABLE IF NOT EXISTS purchase_invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC NOT NULL DEFAULT 15,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  discount_percentage NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  line_total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoice_items ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view purchase invoices" ON purchase_invoices FOR SELECT USING (true);
CREATE POLICY "Users can insert purchase invoices" ON purchase_invoices FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update purchase invoices" ON purchase_invoices FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete purchase invoices" ON purchase_invoices FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view purchase invoice items" ON purchase_invoice_items FOR SELECT USING (true);
CREATE POLICY "Users can insert purchase invoice items" ON purchase_invoice_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update purchase invoice items" ON purchase_invoice_items FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete purchase invoice items" ON purchase_invoice_items FOR DELETE USING (auth.uid() IS NOT NULL);