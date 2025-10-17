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
-- TABLE: registration_sessions
-- Description: Temporary storage for multi-step registration data
-- Note: Sessions expire after 24 hours. User is only created after verification.
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
-- TABLE: bookings
-- Description: Customer bookings for garage services
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number VARCHAR(50) UNIQUE NOT NULL,
  garage_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Customer Information
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),
  
  -- Service Information
  service_type VARCHAR(50) NOT NULL,
  service_description TEXT,
  booking_date DATE NOT NULL,
  scheduled_time VARCHAR(10),
  
  -- Vehicle Information
  vehicle_make VARCHAR(100),
  vehicle_model VARCHAR(100),
  vehicle_year INTEGER,
  vehicle_plate_number VARCHAR(20),
  
  -- Financial Information
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  
  -- Status Tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded')),
  completion_date TIMESTAMP WITH TIME ZONE,
  
  -- Assignment
  assigned_technician VARCHAR(255),
  
  -- Notes
  notes TEXT,
  internal_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster lookups and filtering
CREATE INDEX IF NOT EXISTS idx_bookings_garage_id ON bookings(garage_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_number ON bookings(booking_number);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone ON bookings(customer_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_service_type ON bookings(service_type);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);

-- ============================================================
-- TABLE: appointments
-- Description: Customer appointments for garage services
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_number VARCHAR(50) UNIQUE NOT NULL,
  garage_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Customer Information
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),
  
  -- Vehicle Information
  vehicle_make VARCHAR(100),
  vehicle_model VARCHAR(100),
  vehicle_year INTEGER,
  vehicle_plate_number VARCHAR(20),
  
  -- Service Information
  service_type VARCHAR(100) NOT NULL,
  service_description TEXT,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_time VARCHAR(10), -- Time in HH:MM format
  
  -- Status and Priority
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Duration and Cost
  estimated_duration INTEGER, -- Duration in minutes
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  
  -- Assignment and Completion
  assigned_technician VARCHAR(255),
  completion_date TIMESTAMP WITH TIME ZONE,
  
  -- Notes
  notes TEXT, -- Customer visible notes
  internal_notes TEXT, -- Internal garage notes
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster lookups and filtering
CREATE INDEX IF NOT EXISTS idx_appointments_garage_owner_id ON appointments(garage_owner_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_priority ON appointments(priority);
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_number ON appointments(appointment_number);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_phone ON appointments(customer_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_service_type ON appointments(service_type);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments(created_at);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_name ON appointments(customer_name);
CREATE INDEX IF NOT EXISTS idx_appointments_vehicle_make ON appointments(vehicle_make);
CREATE INDEX IF NOT EXISTS idx_appointments_vehicle_model ON appointments(vehicle_model);
CREATE INDEX IF NOT EXISTS idx_appointments_vehicle_plate ON appointments(vehicle_plate_number);

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

-- Trigger for registration_sessions table
DROP TRIGGER IF EXISTS update_registration_sessions_updated_at ON registration_sessions;
CREATE TRIGGER update_registration_sessions_updated_at
  BEFORE UPDATE ON registration_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for bookings table
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for appointments table
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE garage_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Service role full access registration_sessions" ON registration_sessions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access files" ON file_uploads
  FOR ALL USING (auth.role() = 'service_role');

-- Bookings policies
CREATE POLICY "Users can read own bookings" ON bookings
  FOR SELECT USING (auth.uid() = garage_id);

CREATE POLICY "Users can create own bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = garage_id);

CREATE POLICY "Users can update own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = garage_id);

CREATE POLICY "Users can delete own bookings" ON bookings
  FOR DELETE USING (auth.uid() = garage_id);

CREATE POLICY "Service role full access bookings" ON bookings
  FOR ALL USING (auth.role() = 'service_role');

-- Appointments policies
CREATE POLICY "Users can read own appointments" ON appointments
  FOR SELECT USING (auth.uid() = garage_owner_id);

CREATE POLICY "Users can create own appointments" ON appointments
  FOR INSERT WITH CHECK (auth.uid() = garage_owner_id);

CREATE POLICY "Users can update own appointments" ON appointments
  FOR UPDATE USING (auth.uid() = garage_owner_id);

CREATE POLICY "Users can delete own appointments" ON appointments
  FOR DELETE USING (auth.uid() = garage_owner_id);

CREATE POLICY "Service role full access appointments" ON appointments
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
-- CLEANUP: Remove expired registration sessions (run as cron)
-- ============================================================

CREATE OR REPLACE FUNCTION cleanup_expired_registration_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM registration_sessions
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- You can set up a Supabase Edge Function or cron job to call this periodically
-- Example: SELECT cleanup_expired_registration_sessions();

-- ============================================================
-- COMPLETED
-- ============================================================

-- Verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN ('users', 'garage_profiles', 'verification_codes', 'registration_sessions', 'file_uploads', 'bookings', 'appointments')
ORDER BY table_name;

-- Verify indexes were created
SELECT 
  tablename, 
  indexname
FROM pg_indexes 
WHERE schemaname = 'public'
  AND tablename IN ('users', 'garage_profiles', 'verification_codes', 'registration_sessions', 'file_uploads', 'bookings', 'appointments')
ORDER BY tablename, indexname;
