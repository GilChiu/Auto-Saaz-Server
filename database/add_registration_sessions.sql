-- Add registration_sessions table to existing schema
-- Run this AFTER schema.sql

-- ============================================================
-- TABLE: registration_sessions
-- Description: Temporary storage for multi-step registration data
-- ============================================================
CREATE TABLE IF NOT EXISTS registration_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  
  -- Step 1: Personal Information
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  
  -- Step 2: Business Location
  address TEXT,
  street VARCHAR(255),
  state VARCHAR(100),
  location VARCHAR(255),
  coordinates JSONB,
  
  -- Step 3: Business Details
  company_legal_name VARCHAR(255),
  emirates_id_url TEXT,
  trade_license_number VARCHAR(100),
  vat_certification VARCHAR(100),
  
  -- Progress tracking
  step_completed INTEGER DEFAULT 1,
  
  -- Expiry
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_registration_sessions_session_id ON registration_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_registration_sessions_email ON registration_sessions(email);
CREATE INDEX IF NOT EXISTS idx_registration_sessions_expires ON registration_sessions(expires_at);

-- Trigger for auto-update updated_at
DROP TRIGGER IF EXISTS update_registration_sessions_updated_at ON registration_sessions;
CREATE TRIGGER update_registration_sessions_updated_at
  BEFORE UPDATE ON registration_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE registration_sessions ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access registration_sessions" ON registration_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- Success message
SELECT 'registration_sessions table created successfully!' as status;
