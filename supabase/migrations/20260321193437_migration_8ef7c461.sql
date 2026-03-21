-- Add PDF template preference to zatca_devices table
ALTER TABLE zatca_devices 
ADD COLUMN IF NOT EXISTS pdf_template VARCHAR(50) DEFAULT 'modern';

-- Add invoice PDF log table to track generated PDFs
CREATE TABLE IF NOT EXISTS zatca_invoice_pdfs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL,
  invoice_type VARCHAR(50) NOT NULL, -- 'sales' or 'sales_return'
  pdf_template VARCHAR(50) NOT NULL,
  qr_code TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generated_by UUID REFERENCES auth.users(id),
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE zatca_invoice_pdfs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own PDF logs" 
  ON zatca_invoice_pdfs FOR SELECT 
  USING (auth.uid() = generated_by);

CREATE POLICY "Users can insert their own PDF logs" 
  ON zatca_invoice_pdfs FOR INSERT 
  WITH CHECK (auth.uid() = generated_by);