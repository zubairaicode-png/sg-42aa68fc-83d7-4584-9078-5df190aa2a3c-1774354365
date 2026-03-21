-- Add Saudi National Address fields to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS building_number TEXT,
ADD COLUMN IF NOT EXISTS additional_number TEXT,
ADD COLUMN IF NOT EXISTS street_name TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS unit_number TEXT,
ADD COLUMN IF NOT EXISTS short_address TEXT;

-- Add comments for documentation
COMMENT ON COLUMN customers.building_number IS 'Building number from Saudi National Address';
COMMENT ON COLUMN customers.additional_number IS 'Additional number from Saudi National Address';
COMMENT ON COLUMN customers.street_name IS 'Street name from Saudi National Address';
COMMENT ON COLUMN customers.district IS 'District name from Saudi National Address';
COMMENT ON COLUMN customers.city IS 'City name from Saudi National Address';
COMMENT ON COLUMN customers.postal_code IS 'Postal code (5 digits) from Saudi National Address';
COMMENT ON COLUMN customers.unit_number IS 'Optional unit number from Saudi National Address';
COMMENT ON COLUMN customers.short_address IS 'Optional short address description';