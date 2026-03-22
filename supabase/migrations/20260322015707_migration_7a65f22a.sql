-- Create business_locations table
CREATE TABLE IF NOT EXISTS business_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_code TEXT NOT NULL UNIQUE,
  location_name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Saudi Arabia',
  phone TEXT,
  email TEXT,
  is_default BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_locations table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES business_locations(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, location_id)
);

-- Enable RLS on business_locations
ALTER TABLE business_locations ENABLE ROW LEVEL SECURITY;

-- Create policies for business_locations
CREATE POLICY "Users can view all locations" ON business_locations
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert locations" ON business_locations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update locations" ON business_locations
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete locations" ON business_locations
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Enable RLS on user_locations
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

-- Create policies for user_locations
CREATE POLICY "Users can view all user locations" ON user_locations
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert user locations" ON user_locations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update user locations" ON user_locations
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete user locations" ON user_locations
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Update profiles table role check constraint if needed
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('super_admin', 'admin', 'manager', 'accountant', 'sales', 'inventory', 'viewer'));