-- Add tax settings table for company-wide tax configuration
CREATE TABLE IF NOT EXISTS tax_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tax_name TEXT NOT NULL DEFAULT 'VAT',
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  tax_registration_number TEXT,
  is_tax_inclusive BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add invoice design settings table
CREATE TABLE IF NOT EXISTS invoice_design_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_style TEXT NOT NULL DEFAULT 'modern' CHECK (template_style IN ('modern', 'classic', 'premium')),
  primary_color TEXT DEFAULT '#2563eb',
  secondary_color TEXT DEFAULT '#64748b',
  show_logo BOOLEAN DEFAULT true,
  logo_position TEXT DEFAULT 'left' CHECK (logo_position IN ('left', 'center', 'right')),
  show_company_details BOOLEAN DEFAULT true,
  show_payment_terms BOOLEAN DEFAULT true,
  footer_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE tax_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_design_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tax_settings
CREATE POLICY "Users can view their own tax settings" 
  ON tax_settings FOR SELECT 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own tax settings" 
  ON tax_settings FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own tax settings" 
  ON tax_settings FOR UPDATE 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own tax settings" 
  ON tax_settings FOR DELETE 
  USING (auth.uid() = created_by);

-- RLS Policies for invoice_design_settings
CREATE POLICY "Users can view their own invoice design settings" 
  ON invoice_design_settings FOR SELECT 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own invoice design settings" 
  ON invoice_design_settings FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own invoice design settings" 
  ON invoice_design_settings FOR UPDATE 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own invoice design settings" 
  ON invoice_design_settings FOR DELETE 
  USING (auth.uid() = created_by);