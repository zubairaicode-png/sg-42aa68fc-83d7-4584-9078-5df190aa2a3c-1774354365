-- Add serial_number column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS serial_number TEXT;

-- Add index for faster serial number searches
CREATE INDEX IF NOT EXISTS idx_products_serial_number ON products(serial_number);

-- Add po_number and payment_type columns to sales_invoices table
ALTER TABLE sales_invoices
ADD COLUMN IF NOT EXISTS po_number TEXT,
ADD COLUMN IF NOT EXISTS payment_type TEXT CHECK (payment_type IN ('cash', 'bank', 'cheque', 'card'));

-- Create index for payment_type filtering
CREATE INDEX IF NOT EXISTS idx_sales_invoices_payment_type ON sales_invoices(payment_type);