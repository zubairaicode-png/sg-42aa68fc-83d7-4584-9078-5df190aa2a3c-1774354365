-- Simplify the RLS policies - allow ANY authenticated user to manage roles
DROP POLICY IF EXISTS "Allow authenticated users to view roles" ON user_roles;
DROP POLICY IF EXISTS "Allow authenticated users to create custom roles" ON user_roles;
DROP POLICY IF EXISTS "Allow authenticated users to update custom roles" ON user_roles;
DROP POLICY IF EXISTS "Allow authenticated users to delete custom roles" ON user_roles;

-- Create simpler, more permissive policies
CREATE POLICY "Authenticated users can view all roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert roles"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update roles"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete roles"
  ON user_roles
  FOR DELETE
  TO authenticated
  USING (true);