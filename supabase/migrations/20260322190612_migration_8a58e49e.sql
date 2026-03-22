-- Drop the existing policy and create proper policies
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view all roles" ON user_roles;

-- Create comprehensive policies for user_roles
CREATE POLICY "Allow authenticated users to view roles" 
  ON user_roles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert roles" 
  ON user_roles
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update roles" 
  ON user_roles
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete custom roles" 
  ON user_roles
  FOR DELETE
  USING (auth.uid() IS NOT NULL AND is_system_role = false);