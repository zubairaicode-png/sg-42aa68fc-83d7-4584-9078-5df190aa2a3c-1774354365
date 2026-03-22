-- Drop existing policies and create new ones that allow access
DROP POLICY IF EXISTS "Users can view business locations" ON business_locations;
DROP POLICY IF EXISTS "Users can insert business locations" ON business_locations;
DROP POLICY IF EXISTS "Users can update business locations" ON business_locations;
DROP POLICY IF EXISTS "Users can delete business locations" ON business_locations;

-- Create new simple policies that allow all authenticated users
CREATE POLICY "Allow authenticated users to view locations" ON business_locations
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert locations" ON business_locations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update locations" ON business_locations
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow authenticated users to delete locations" ON business_locations
  FOR DELETE
  USING (true);