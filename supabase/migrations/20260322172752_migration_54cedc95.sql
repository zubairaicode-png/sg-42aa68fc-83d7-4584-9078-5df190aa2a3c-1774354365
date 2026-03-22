-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Create a new INSERT policy that allows:
-- 1. Users to insert their own profile (auth.uid() = id)
-- 2. Admins and super_admins to insert any profile
CREATE POLICY "Users and admins can insert profiles" ON profiles
FOR INSERT
WITH CHECK (
  auth.uid() = id  -- User can insert their own profile
  OR
  EXISTS (  -- OR user is admin/super_admin
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);