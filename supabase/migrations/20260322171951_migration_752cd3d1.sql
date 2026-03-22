-- Fix the profiles table by removing the invalid default role
-- The default 'employee' conflicts with the CHECK constraint that only allows specific roles
ALTER TABLE profiles 
ALTER COLUMN role SET DEFAULT 'viewer';