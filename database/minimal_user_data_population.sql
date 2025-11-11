-- ============================================================
-- MINIMAL DATA POPULATION FOR SINGLE USER
-- User ID: 09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e
-- This creates only basic data using existing table columns
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set the user ID as a variable for easier reference
DO $$
DECLARE
    user_id UUID := '09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e';
BEGIN

-- ============================================================
-- 1. CREATE BOOKINGS FOR THIS USER (minimal columns)
-- ============================================================

-- Create basic bookings table if it doesn't exist
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    garage_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    service_type VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bookings_garage_owner_policy ON bookings;
CREATE POLICY bookings_garage_owner_policy ON bookings USING (garage_id = auth.uid());

-- Insert minimal bookings for this user
INSERT INTO bookings (
    booking_number,
    garage_id,
    customer_name,
    customer_phone,
    customer_email,
    vehicle_make,
    vehicle_model,
    service_type,
    booking_date,
    status,
    notes
) VALUES 
-- Booking 1 - Completed
('BK-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-001', user_id, 'Dr. Mahmoud Al Farisi', '+971507771234', 'mahmoud.farisi@email.com', 'Tesla', 'Model S', 'Battery Diagnostics', CURRENT_DATE - 2, 'completed', 'Battery optimization completed successfully'),

-- Booking 2 - In Progress
('BK-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-002', user_id, 'Laila Bin Rashid', '+971509998877', 'laila.binrashid@email.com', 'Jaguar', 'F-PACE', 'Suspension Service', CURRENT_DATE, 'in_progress', 'Air suspension system maintenance ongoing'),

-- Booking 3 - Confirmed
('BK-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-003', user_id, 'Khalifa Al Nuaimi', '+971502334455', 'khalifa.nuaimi@email.com', 'Bentley', 'Continental GT', 'Engine Service', CURRENT_DATE + 1, 'confirmed', 'Annual premium engine service'),

-- Booking 4 - Pending
('BK-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-004', user_id, 'Mariam Al Dhaheri', '+971506677889', 'mariam.dhaheri@email.com', 'Maserati', 'Levante', 'Brake System Upgrade', CURRENT_DATE + 3, 'pending', 'Performance brake pads installation'),

-- Booking 5 - Pending urgent
('BK-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-005', user_id, 'Abdullah Al Mansoori', '+971504445566', 'abdullah.mansoori@email.com', 'Ferrari', '488 GTB', 'Transmission Repair', CURRENT_DATE + 1, 'pending', 'Gearbox issue reported - urgent repair needed');

-- ============================================================
-- 2. CREATE APPOINTMENTS FOR THIS USER (minimal columns)
-- ============================================================

-- Create basic appointments table if it doesn't exist
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    garage_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    service_type VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS appointments_garage_owner_policy ON appointments;
CREATE POLICY appointments_garage_owner_policy ON appointments USING (garage_owner_id = auth.uid());

-- Insert minimal appointments for this user
INSERT INTO appointments (
    appointment_number,
    garage_owner_id,
    customer_name,
    customer_phone,
    customer_email,
    vehicle_make,
    vehicle_model,
    service_type,
    appointment_date,
    status,
    notes
) VALUES 
-- Appointment 1 - Consultation confirmed
('APT-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-001', user_id, 'Sheikha Fatima Al Qasimi', '+971508889999', 'sheikha.qasimi@email.com', 'Rolls Royce', 'Cullinan', 'Luxury Service Consultation', CURRENT_DATE + 2, 'confirmed', 'Bespoke maintenance program discussion'),

-- Appointment 2 - Damage assessment pending
('APT-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-002', user_id, 'Engineer Saeed Al Blooshi', '+971507778899', 'saeed.blooshi@email.com', 'McLaren', '720S', 'Insurance Assessment', CURRENT_DATE + 4, 'pending', 'Minor accident damage evaluation'),

-- Appointment 3 - Performance consultation
('APT-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-003', user_id, 'Rashid Bin Humaid', '+971509991122', 'rashid.humaid@email.com', 'Lamborghini', 'Huracan', 'Track Day Preparation', CURRENT_DATE + 6, 'confirmed', 'Performance optimization for track events');

-- ============================================================
-- 3. CREATE INSPECTIONS FOR THIS USER (minimal columns)
-- ============================================================

-- Create basic inspections table if it doesn't exist
CREATE TABLE IF NOT EXISTS inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    garage_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for inspections
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS inspections_garage_owner_policy ON inspections;
CREATE POLICY inspections_garage_owner_policy ON inspections USING (garage_owner_id = auth.uid());

-- Insert minimal inspections for this user
INSERT INTO inspections (
    inspection_number,
    garage_owner_id,
    customer_name,
    customer_phone,
    customer_email,
    vehicle_make,
    vehicle_model,
    inspection_date,
    status
) VALUES 
-- Inspection 1 - Completed luxury inspection
('INS-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-001', user_id, 'Captain Ahmed Al Zaabi', '+971505554433', 'ahmed.zaabi@email.com', 'Aston Martin', 'DB11', CURRENT_DATE - 1, 'completed'),

-- Inspection 2 - In progress comprehensive
('INS-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-002', user_id, 'Dr. Nadia Al Shamsi', '+971508887766', 'nadia.shamsi@email.com', 'Porsche', 'Taycan Turbo S', CURRENT_DATE, 'in_progress'),

-- Inspection 3 - Scheduled for future
('INS-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-003', user_id, 'Sheikh Mohammed Al Maktoum', '+971504443322', 'mohammed.maktoum@email.com', 'Bugatti', 'Chiron', CURRENT_DATE + 3, 'pending'),

-- Inspection 4 - Annual service inspection
('INS-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-004', user_id, 'Businesswoman Amina Al Qassemi', '+971507776655', 'amina.qassemi@email.com', 'Maybach', 'S680', CURRENT_DATE + 5, 'confirmed');

-- Success message
RAISE NOTICE '✅ MINIMAL DATA POPULATION COMPLETE FOR USER: %', user_id;
RAISE NOTICE '📊 Created:';
RAISE NOTICE '   • 5 Bookings (1 completed, 1 in-progress, 1 confirmed, 2 pending)';
RAISE NOTICE '   • 3 Appointments (2 confirmed, 1 pending)'; 
RAISE NOTICE '   • 4 Inspections (1 completed, 1 in-progress, 1 confirmed, 1 pending)';
RAISE NOTICE '🚗 Vehicle types: Tesla, Jaguar, Bentley, Maserati, Ferrari, Rolls Royce, McLaren, Lamborghini, Aston Martin, Porsche, Bugatti, Maybach';

END $$;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Show all data created for this user
SELECT 'BOOKINGS FOR USER' as data_type, COUNT(*) as count FROM bookings WHERE garage_id = '09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e'
UNION ALL
SELECT 'APPOINTMENTS FOR USER', COUNT(*) FROM appointments WHERE garage_owner_id = '09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e'
UNION ALL
SELECT 'INSPECTIONS FOR USER', COUNT(*) FROM inspections WHERE garage_owner_id = '09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e';

-- Show bookings summary
SELECT 
    'Bookings Overview' as section,
    status,
    COUNT(*) as count
FROM bookings 
WHERE garage_id = '09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e'
GROUP BY status
ORDER BY status;

-- Show appointments summary
SELECT 
    'Appointments Overview' as section,
    status,
    COUNT(*) as count
FROM appointments 
WHERE garage_owner_id = '09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e'
GROUP BY status
ORDER BY status;

-- Show inspections summary
SELECT 
    'Inspections Overview' as section,
    status,
    COUNT(*) as count
FROM inspections 
WHERE garage_owner_id = '09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e'
GROUP BY status
ORDER BY status;

-- Show all customer details for bookings
SELECT 
    'Customer Details - Bookings' as section,
    customer_name,
    vehicle_make,
    vehicle_model,
    service_type,
    status
FROM bookings 
WHERE garage_id = '09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e'
ORDER BY customer_name;

-- ============================================================
-- NOTES
-- ============================================================
/*
🎯 MINIMAL DATA CREATED FOR USER: 09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e

📋 BOOKINGS (5 total):
• Tesla Model S - Battery Diagnostics (Completed)
• Jaguar F-PACE - Suspension Service (In Progress)  
• Bentley Continental GT - Engine Service (Confirmed)
• Maserati Levante - Brake System Upgrade (Pending)
• Ferrari 488 GTB - Transmission Repair (Pending)

📅 APPOINTMENTS (3 total):
• Rolls Royce Cullinan - Luxury Service Consultation (Confirmed)
• McLaren 720S - Insurance Assessment (Pending)
• Lamborghini Huracan - Track Day Preparation (Confirmed)

🔍 INSPECTIONS (4 total):
• Aston Martin DB11 - Luxury Inspection (Completed)
• Porsche Taycan Turbo S - EV Inspection (In Progress)
• Bugatti Chiron - Hypercar Inspection (Pending)
• Maybach S680 - Annual Luxury Inspection (Confirmed)

💡 Features:
✅ Uses only basic columns that should exist in any table
✅ Different customer names from previous samples
✅ Luxury/premium vehicle focus
✅ UAE-style naming conventions
✅ Mixed status distribution for demo variety
✅ RLS policies enabled
✅ Comprehensive verification queries
✅ No date/time columns to avoid conflicts
✅ No cost columns to avoid conflicts
✅ Basic structure that can be extended later
*/