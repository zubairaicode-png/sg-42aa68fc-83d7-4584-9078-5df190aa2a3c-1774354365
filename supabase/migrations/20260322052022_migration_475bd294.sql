ALTER TABLE business_locations ADD COLUMN IF NOT EXISTS location_name_ar VARCHAR(255);
ALTER TABLE business_locations ADD COLUMN IF NOT EXISTS building_number VARCHAR(50);
ALTER TABLE business_locations ADD COLUMN IF NOT EXISTS street_name VARCHAR(255);
ALTER TABLE business_locations ADD COLUMN IF NOT EXISTS district VARCHAR(255);
ALTER TABLE business_locations ADD COLUMN IF NOT EXISTS additional_number VARCHAR(50);
ALTER TABLE business_locations ADD COLUMN IF NOT EXISTS postal_code VARCHAR(50);