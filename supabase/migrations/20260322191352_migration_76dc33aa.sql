-- Remove the old duplicate policies with stricter checks
DROP POLICY IF EXISTS "Allow authenticated users to insert roles" ON user_roles;
DROP POLICY IF EXISTS "Allow authenticated users to update roles" ON user_roles;

-- Verify only the simple policies remain
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY cmd;