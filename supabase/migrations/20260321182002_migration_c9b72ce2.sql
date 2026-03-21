-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  vat_number TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Saudi Arabia',
  credit_limit DECIMAL(15,2) DEFAULT 0,
  balance DECIMAL(15,2) DEFAULT 0,
  payment_terms INTEGER DEFAULT 30,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  vat_number TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Saudi Arabia',
  payment_terms INTEGER DEFAULT 30,
  balance DECIMAL(15,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  category TEXT,
  unit TEXT DEFAULT 'PCS',
  cost_price DECIMAL(15,2) DEFAULT 0,
  selling_price DECIMAL(15,2) NOT NULL,
  vat_rate DECIMAL(5,2) DEFAULT 15.00,
  stock_quantity DECIMAL(15,3) DEFAULT 0,
  reorder_level DECIMAL(15,3) DEFAULT 0,
  barcode TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales_invoices table
CREATE TABLE IF NOT EXISTS sales_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
  customer_name TEXT NOT NULL,
  customer_vat TEXT,
  subtotal DECIMAL(15,2) NOT NULL,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  paid_amount DECIMAL(15,2) DEFAULT 0,
  due_date DATE,
  notes TEXT,
  zatca_status TEXT DEFAULT 'pending' CHECK (zatca_status IN ('pending', 'cleared', 'reported', 'rejected')),
  zatca_uuid TEXT,
  zatca_qr_code TEXT,
  zatca_xml TEXT,
  zatca_submission_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales_invoice_items table
CREATE TABLE IF NOT EXISTS sales_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES sales_invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  product_code TEXT,
  quantity DECIMAL(15,3) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 15.00,
  tax_amount DECIMAL(15,2) NOT NULL,
  line_total DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales_returns table
CREATE TABLE IF NOT EXISTS sales_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number TEXT UNIQUE NOT NULL,
  return_date DATE NOT NULL,
  original_invoice_id UUID REFERENCES sales_invoices(id) ON DELETE RESTRICT,
  original_invoice_number TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
  customer_name TEXT NOT NULL,
  subtotal DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  refund_amount DECIMAL(15,2) DEFAULT 0,
  refund_method TEXT CHECK (refund_method IN ('cash', 'credit', 'bank')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'refunded', 'cancelled')),
  reason TEXT NOT NULL,
  notes TEXT,
  zatca_status TEXT DEFAULT 'pending' CHECK (zatca_status IN ('pending', 'cleared', 'reported', 'rejected')),
  zatca_uuid TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales_return_items table
CREATE TABLE IF NOT EXISTS sales_return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID REFERENCES sales_returns(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  original_quantity DECIMAL(15,3) NOT NULL,
  return_quantity DECIMAL(15,3) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 15.00,
  tax_amount DECIMAL(15,2) NOT NULL,
  line_total DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_date ON sales_invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer ON sales_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_status ON sales_invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_zatca ON sales_invoices(zatca_status);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_items_invoice ON sales_invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_sales_returns_date ON sales_returns(return_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_returns_status ON sales_returns(status);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_return_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (authenticated users can access all)
CREATE POLICY "Users can view all customers" ON customers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert customers" ON customers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update customers" ON customers FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete customers" ON customers FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view all suppliers" ON suppliers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert suppliers" ON suppliers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update suppliers" ON suppliers FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete suppliers" ON suppliers FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view all products" ON products FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert products" ON products FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update products" ON products FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete products" ON products FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view all invoices" ON sales_invoices FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert invoices" ON sales_invoices FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update invoices" ON sales_invoices FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete invoices" ON sales_invoices FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view invoice items" ON sales_invoice_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert invoice items" ON sales_invoice_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update invoice items" ON sales_invoice_items FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete invoice items" ON sales_invoice_items FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view all returns" ON sales_returns FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert returns" ON sales_returns FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update returns" ON sales_returns FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete returns" ON sales_returns FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view return items" ON sales_return_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert return items" ON sales_return_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update return items" ON sales_return_items FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete return items" ON sales_return_items FOR DELETE USING (auth.uid() IS NOT NULL);