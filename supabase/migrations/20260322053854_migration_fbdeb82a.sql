-- Create subscription_servers table
CREATE TABLE IF NOT EXISTS subscription_servers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES customer_subscriptions(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Server Details
  server_ip VARCHAR(45) NOT NULL,  -- Supports IPv4 and IPv6
  software_version VARCHAR(100),
  subscription_date DATE NOT NULL,
  port INTEGER,
  rdp_port INTEGER DEFAULT 3389,
  
  -- Backup Information
  backup BOOLEAN DEFAULT false,
  backup_option VARCHAR(100),  -- e.g., "Daily", "Weekly", "Monthly"
  
  -- Domain/PC Information
  contact_domain VARCHAR(255),
  pc_name VARCHAR(255),
  
  -- Additional fields for completeness
  os_type VARCHAR(50),  -- e.g., "Windows Server 2022", "Ubuntu 22.04"
  cpu_cores INTEGER,
  ram_gb INTEGER,
  disk_gb INTEGER,
  status VARCHAR(20) DEFAULT 'active',
  notes TEXT,
  
  -- Audit fields
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_subscription_servers_subscription ON subscription_servers(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_servers_customer ON subscription_servers(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscription_servers_status ON subscription_servers(status);
CREATE INDEX IF NOT EXISTS idx_subscription_servers_ip ON subscription_servers(server_ip);

-- Add RLS policies
ALTER TABLE subscription_servers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view subscription servers"
  ON subscription_servers FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert subscription servers"
  ON subscription_servers FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update subscription servers"
  ON subscription_servers FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete subscription servers"
  ON subscription_servers FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Add constraint for status
ALTER TABLE subscription_servers 
ADD CONSTRAINT subscription_servers_status_check 
CHECK (status IN ('active', 'inactive', 'maintenance', 'suspended'));

COMMENT ON TABLE subscription_servers IS 'Stores server information for customer subscriptions including IP, software version, ports, and backup details';