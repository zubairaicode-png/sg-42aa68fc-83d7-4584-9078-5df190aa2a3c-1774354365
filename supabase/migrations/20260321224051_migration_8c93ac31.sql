-- Update invoice_design_settings table to support drag-drop layout
ALTER TABLE invoice_design_settings
DROP COLUMN IF EXISTS logo_position,
DROP COLUMN IF EXISTS header_style,
DROP COLUMN IF EXISTS show_logo,
DROP COLUMN IF EXISTS show_payment_terms,
DROP COLUMN IF EXISTS show_bank_details,
DROP COLUMN IF EXISTS show_notes;

-- Add new columns for drag-drop layout configuration
ALTER TABLE invoice_design_settings
ADD COLUMN header_layout JSONB DEFAULT '{"left": [], "center": [], "right": []}',
ADD COLUMN footer_layout JSONB DEFAULT '{"left": [], "center": [], "right": []}',
ADD COLUMN available_fields JSONB DEFAULT '[]',
ADD COLUMN layout_name TEXT DEFAULT 'Default Layout';

-- Update RLS policies to allow users to manage their invoice layouts
DROP POLICY IF EXISTS "Users can view their own invoice design settings" ON invoice_design_settings;
DROP POLICY IF EXISTS "Users can insert their own invoice design settings" ON invoice_design_settings;
DROP POLICY IF EXISTS "Users can update their own invoice design settings" ON invoice_design_settings;
DROP POLICY IF EXISTS "Users can delete their own invoice design settings" ON invoice_design_settings;

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