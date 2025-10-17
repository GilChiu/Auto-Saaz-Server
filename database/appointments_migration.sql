-- ============================================================
-- AUTOSAAZ APPOINTMENTS TABLE - SQL MIGRATION SCRIPT
-- ============================================================

-- Run this in your Supabase SQL Editor to add appointments functionality

-- ============================================================
-- CREATE APPOINTMENTS TABLE
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

-- ============================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================
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
-- CREATE TRIGGER FOR AUTO-UPDATE TIMESTAMP
-- ============================================================
-- Create the function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for appointments table
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CREATE RLS POLICIES
-- ============================================================

-- Users can only access their own appointments
CREATE POLICY "Users can read own appointments" ON appointments
  FOR SELECT USING (auth.uid() = garage_owner_id);

CREATE POLICY "Users can create own appointments" ON appointments
  FOR INSERT WITH CHECK (auth.uid() = garage_owner_id);

CREATE POLICY "Users can update own appointments" ON appointments
  FOR UPDATE USING (auth.uid() = garage_owner_id);

CREATE POLICY "Users can delete own appointments" ON appointments
  FOR DELETE USING (auth.uid() = garage_owner_id);

-- Service role (backend API) can access all appointments
CREATE POLICY "Service role full access appointments" ON appointments
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ============================================================

-- Uncomment the following lines to insert sample appointment data

/*
-- Insert sample appointments (replace USER_ID with actual user UUID)
INSERT INTO appointments (
  appointment_number,
  garage_owner_id,
  customer_name,
  customer_phone,
  customer_email,
  vehicle_make,
  vehicle_model,
  vehicle_year,
  vehicle_plate_number,
  service_type,
  service_description,
  appointment_date,
  scheduled_time,
  status,
  priority,
  estimated_duration,
  estimated_cost,
  notes
) VALUES 
(
  'APT' || EXTRACT(EPOCH FROM NOW())::BIGINT || '001',
  'YOUR_USER_ID_HERE', -- Replace with actual user ID
  'Michael Johnson',
  '+971501234567',
  'michael.johnson@email.com',
  'BMW',
  'X5',
  2022,
  'DXB-12345',
  'Brake pad replacement',
  'Front and rear brake pads need replacement',
  NOW() + INTERVAL '1 day',
  '10:00',
  'confirmed',
  'normal',
  120,
  450.00,
  'Customer requested OEM parts'
),
(
  'APT' || EXTRACT(EPOCH FROM NOW())::BIGINT || '002',
  'YOUR_USER_ID_HERE', -- Replace with actual user ID
  'Sarah Lee',
  '+971509876543',
  'sarah.lee@email.com',
  'Honda',
  'Civic',
  2021,
  'AUH-67890',
  'Oil change',
  'Regular oil change service',
  NOW() + INTERVAL '2 days',
  '14:00',
  'pending',
  'high',
  60,
  120.00,
  'Customer prefers synthetic oil'
);
*/

-- ============================================================
-- USEFUL QUERIES FOR TESTING
-- ============================================================

-- Check if table was created successfully
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'appointments'
ORDER BY ordinal_position;

-- Check if indexes were created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'appointments';

-- Check if RLS policies were created
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'appointments';

-- Get appointment counts by status
-- SELECT status, COUNT(*) as count
-- FROM appointments
-- GROUP BY status
-- ORDER BY count DESC;

-- Get upcoming appointments
-- SELECT *
-- FROM appointments
-- WHERE appointment_date >= NOW()
--   AND status IN ('pending', 'confirmed')
-- ORDER BY appointment_date;

-- ============================================================
-- COMPLETION MESSAGE
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Appointments table created successfully!';
  RAISE NOTICE '📋 Table: appointments';
  RAISE NOTICE '🔐 RLS Policies: Applied';
  RAISE NOTICE '⚡ Indexes: Created for performance';
  RAISE NOTICE '🔄 Auto-update trigger: Enabled';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Your appointments API is now ready to use!';
END $$;