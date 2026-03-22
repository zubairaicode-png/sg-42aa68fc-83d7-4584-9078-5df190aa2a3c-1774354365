-- Create user_roles table for role management
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text NOT NULL UNIQUE,
  role_code text NOT NULL UNIQUE,
  description text,
  permissions jsonb DEFAULT '{}'::jsonb,
  is_system_role boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all roles"
  ON user_roles FOR SELECT
  TO public
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage roles"
  ON user_roles FOR ALL
  TO public
  USING (auth.uid() IS NOT NULL);

-- Insert system roles
INSERT INTO user_roles (role_name, role_code, description, is_system_role, permissions) VALUES
  ('Super Admin', 'super_admin', 'Full system access with all permissions', true, '{"all": true}'::jsonb),
  ('Admin', 'admin', 'Administrative access to most features', true, '{"users": true, "settings": true, "reports": true}'::jsonb),
  ('Manager', 'manager', 'Manage sales, purchases, and inventory', true, '{"sales": true, "purchases": true, "inventory": true}'::jsonb),
  ('Accountant', 'accountant', 'Manage accounting and financial reports', true, '{"accounting": true, "reports": true}'::jsonb),
  ('Sales', 'sales', 'Create and manage sales invoices', true, '{"sales": true}'::jsonb),
  ('Inventory', 'inventory', 'Manage products and stock', true, '{"inventory": true}'::jsonb),
  ('Viewer', 'viewer', 'View-only access to reports', true, '{"reports": {"view": true}}'::jsonb)
ON CONFLICT (role_code) DO NOTHING;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_code ON user_roles(role_code);

COMMENT ON TABLE user_roles IS 'Stores user roles and their permissions';