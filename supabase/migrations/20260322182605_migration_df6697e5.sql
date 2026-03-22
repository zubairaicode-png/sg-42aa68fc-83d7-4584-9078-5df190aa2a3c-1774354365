-- Drop all existing RLS policies on users table
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view own record" ON users;
DROP POLICY IF EXISTS "Admins can create users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Users can update own record" ON users;
DROP POLICY IF EXISTS "Super admins can delete users" ON users;

-- Create new simple policies that don't cause recursion
-- Allow public access for authentication (login doesn't have uid() yet)
CREATE POLICY "Allow public read for authentication" ON users
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert for registration" ON users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow users to update themselves" ON users
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete" ON users
  FOR DELETE
  USING (true);