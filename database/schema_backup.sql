-- AutoSaaz Database Schema for Supabase
-- Run this script in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: users
-- Description: Main user authentication table
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'garage_owner' CHECK (role IN ('garage_owner', 'admin', 'mobile_user')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'verified', 'active', 'suspended', 'rejected')),
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  last_login_ip VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ============================================================
-- TABLE: garage_profiles
-- Description: Extended profile information for garage owners
-- ============================================================
CREATE TABLE IF NOT EXISTS garage_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Personal Information (Step 1)
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  
  -- Business Location (Step 2)
  address TEXT,
  street VARCHAR(255),
  state VARCHAR(100),
  location VARCHAR(255),
  coordinates JSONB, -- { "latitude": 25.2048, "longitude": 55.2708 }
  
  -- Business Details (Step 3)
  company_legal_name VARCHAR(255),
  emirates_id_url TEXT,
  trade_license_number VARCHAR(100),
  vat_certification VARCHAR(100),
  
  -- Status and Role
  role VARCHAR(50) DEFAULT 'garage_owner',
  status VARCHAR(50) DEFAULT 'pending_verification',
  
  -- Verification
  is_email_verified BOOLEAN DEFAULT FALSE,
  is_phone_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  phone_verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Security
  failed_login_attempts INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_profile UNIQUE(user_id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_garage_profiles_user_id ON garage_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_garage_profiles_email ON garage_profiles(email);
CREATE INDEX IF NOT EXISTS idx_garage_profiles_phone ON garage_profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_garage_profiles_status ON garage_profiles(status);

-- ============================================================
-- TABLE: verification_codes
-- Description: OTP/verification codes for email and phone
-- ============================================================
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  phone_number VARCHAR(20),
  code VARCHAR(10) NOT NULL,
  method VARCHAR(20) NOT NULL CHECK (method IN ('email', 'phone', 'both')),
  attempts INTEGER DEFAULT 0,
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for verification lookups
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_phone ON verification_codes(phone_number);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes(expires_at);

-- ============================================================
-- TABLE: file_uploads
-- Description: Track all file uploads (Emirates ID, documents, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS file_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  upload_type VARCHAR(50) NOT NULL CHECK (upload_type IN ('emirates_id', 'trade_license', 'vat_certificate', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for file lookups
CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_type ON file_uploads(upload_type);

-- ============================================================
-- FUNCTIONS: Auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for garage_profiles table
DROP TRIGGER IF EXISTS update_garage_profiles_updated_at ON garage_profiles;
CREATE TRIGGER update_garage_profiles_updated_at
  BEFORE UPDATE ON garage_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE garage_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Garage profiles
CREATE POLICY "Users can read own profile" ON garage_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON garage_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- File uploads
CREATE POLICY "Users can read own files" ON file_uploads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upload files" ON file_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for server-side operations)
CREATE POLICY "Service role full access users" ON users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access profiles" ON garage_profiles
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access codes" ON verification_codes
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access files" ON file_uploads
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================

-- Uncomment below to insert sample data

/*
-- Sample admin user (password: Admin@123456)
INSERT INTO users (email, password, role, status) VALUES
  ('admin@autosaaz.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyVT8G.QQK3K', 'admin', 'active');

-- Sample garage profile
INSERT INTO garage_profiles (
  user_id, 
  full_name, 
  email, 
  phone_number,
  company_legal_name,
  status,
  is_email_verified,
  is_phone_verified
) VALUES (
  (SELECT id FROM users WHERE email = 'admin@autosaaz.com'),
  'Admin User',
  'admin@autosaaz.com',
  '+971501234567',
  'AutoSaaz LLC',
  'active',
  true,
  true
);
*/

-- ============================================================
-- VIEWS: Useful queries
-- ============================================================

-- Complete user information with profile
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
  u.id,
  u.email,
  u.role as user_role,
  u.status as user_status,
  u.last_login_at,
  u.created_at as user_created_at,
  gp.full_name,
  gp.phone_number,
  gp.address,
  gp.street,
  gp.state,
  gp.location,
  gp.company_legal_name,
  gp.trade_license_number,
  gp.is_email_verified,
  gp.is_phone_verified,
  gp.status as profile_status
FROM users u
LEFT JOIN garage_profiles gp ON u.id = gp.user_id;

-- ============================================================
-- CLEANUP: Remove expired verification codes (run as cron)
-- ============================================================

CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM verification_codes
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- You can set up a Supabase Edge Function or cron job to call this periodically
-- Example: SELECT cleanup_expired_verification_codes();

-- ============================================================
-- COMPLETED
-- ============================================================

-- Verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN ('users', 'garage_profiles', 'verification_codes', 'file_uploads')
ORDER BY table_name;

-- Verify indexes were created
SELECT 
  tablename, 
  indexname
FROM pg_indexes 
WHERE schemaname = 'public'
  AND tablename IN ('users', 'garage_profiles', 'verification_codes', 'file_uploads')
ORDER BY tablename, indexname;
