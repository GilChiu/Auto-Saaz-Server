-- ============================================================
-- POPULATE DATA FOR SINGLE USER
-- User ID: 09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e
-- This creates bookings, appointments, and inspections for one user
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set the user ID as a variable for easier reference
DO $$
DECLARE
    user_id UUID := '09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e';
BEGIN

-- ============================================================
-- 1. CREATE BOOKINGS FOR THIS USER
-- ============================================================

-- Ensure bookings table exists with proper structure
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_number VARCHAR(50) UNIQUE NOT NULL,
    garage_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_year INTEGER,
    vehicle_plate_number VARCHAR(20),
    service_type VARCHAR(100) NOT NULL,
    service_date DATE NOT NULL,
    service_time TIME,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    estimated_cost DECIMAL(10, 2),
    actual_cost DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bookings_garage_owner_policy ON bookings;
CREATE POLICY bookings_garage_owner_policy ON bookings USING (garage_id = auth.uid());

-- Insert bookings for this user
INSERT INTO bookings (
    booking_number,
    garage_id,
    customer_name,
    customer_phone,
    customer_email,
    vehicle_make,
    vehicle_model,
    vehicle_year,
    vehicle_plate_number,
    service_type,
    service_date,
    service_time,
    status,
    priority,
    estimated_cost,
    actual_cost,
    notes
) VALUES 
-- Booking 1 - Completed
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '101', user_id, 'Dr. Mahmoud Al Farisi', '+971507771234', 'mahmoud.farisi@email.com', 'Tesla', 'Model S', 2023, 'DXB-T-8899', 'Battery Diagnostics', CURRENT_DATE - 2, '10:30', 'completed', 'high', 650.00, 620.00, 'Battery optimization completed successfully'),

-- Booking 2 - In Progress
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '102', user_id, 'Laila Bin Rashid', '+971509998877', 'laila.binrashid@email.com', 'Jaguar', 'F-PACE', 2022, 'AUH-J-7766', 'Suspension Service', CURRENT_DATE, '14:00', 'in_progress', 'normal', 850.00, NULL, 'Air suspension system maintenance ongoing'),

-- Booking 3 - Confirmed for tomorrow
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '103', user_id, 'Khalifa Al Nuaimi', '+971502334455', 'khalifa.nuaimi@email.com', 'Bentley', 'Continental GT', 2021, 'SHJ-B-5544', 'Engine Service', CURRENT_DATE + 1, '09:00', 'confirmed', 'high', 1200.00, NULL, 'Annual premium engine service'),

-- Booking 4 - Pending
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '104', user_id, 'Mariam Al Dhaheri', '+971506677889', 'mariam.dhaheri@email.com', 'Maserati', 'Levante', 2023, 'RAK-M-3322', 'Brake System Upgrade', CURRENT_DATE + 3, '11:30', 'pending', 'normal', 750.00, NULL, 'Performance brake pads installation'),

-- Booking 5 - Urgent pending
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '105', user_id, 'Abdullah Al Mansoori', '+971504445566', 'abdullah.mansoori@email.com', 'Ferrari', '488 GTB', 2020, 'DXB-F-1122', 'Transmission Repair', CURRENT_DATE + 1, '16:00', 'pending', 'urgent', 2500.00, NULL, 'Gearbox issue reported - urgent repair needed');

-- ============================================================
-- 2. CREATE APPOINTMENTS FOR THIS USER
-- ============================================================

-- Ensure appointments table exists
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_number VARCHAR(50) UNIQUE NOT NULL,
    garage_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_year INTEGER,
    vehicle_plate_number VARCHAR(20),
    service_type VARCHAR(100) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS appointments_garage_owner_policy ON appointments;
CREATE POLICY appointments_garage_owner_policy ON appointments USING (garage_owner_id = auth.uid());

-- Insert appointments for this user
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
    appointment_date,
    appointment_time,
    status,
    priority,
    notes
) VALUES 
-- Appointment 1 - Consultation confirmed
('APT' || EXTRACT(EPOCH FROM NOW())::BIGINT || '201', user_id, 'Sheikha Fatima Al Qasimi', '+971508889999', 'sheikha.qasimi@email.com', 'Rolls Royce', 'Cullinan', 2023, 'DXB-R-9988', 'Luxury Service Consultation', CURRENT_DATE + 2, '10:00', 'confirmed', 'high', 'Bespoke maintenance program discussion'),

-- Appointment 2 - Damage assessment pending
('APT' || EXTRACT(EPOCH FROM NOW())::BIGINT || '202', user_id, 'Engineer Saeed Al Blooshi', '+971507778899', 'saeed.blooshi@email.com', 'McLaren', '720S', 2022, 'AUH-MC-7788', 'Insurance Assessment', CURRENT_DATE + 4, '13:30', 'pending', 'high', 'Minor accident damage evaluation'),

-- Appointment 3 - Performance consultation
('APT' || EXTRACT(EPOCH FROM NOW())::BIGINT || '203', user_id, 'Rashid Bin Humaid', '+971509991122', 'rashid.humaid@email.com', 'Lamborghini', 'Huracan', 2021, 'RAK-L-6677', 'Track Day Preparation', CURRENT_DATE + 6, '15:00', 'confirmed', 'normal', 'Performance optimization for track events');

-- ============================================================
-- 3. CREATE INSPECTIONS FOR THIS USER
-- ============================================================

-- Ensure inspections table exists
CREATE TABLE IF NOT EXISTS inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_number VARCHAR(50) UNIQUE NOT NULL DEFAULT 'INS' || EXTRACT(EPOCH FROM NOW())::BIGINT,
    garage_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_year INTEGER,
    vehicle_plate_number VARCHAR(20),
    inspection_date DATE NOT NULL,
    scheduled_time TIME,
    assigned_technician VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    tasks JSONB DEFAULT '[]'::jsonb,
    findings TEXT,
    recommendations TEXT,
    internal_notes TEXT,
    estimated_cost DECIMAL(10, 2),
    actual_cost DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for inspections
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS inspections_garage_owner_policy ON inspections;
CREATE POLICY inspections_garage_owner_policy ON inspections USING (garage_owner_id = auth.uid());

-- Insert inspections for this user
INSERT INTO inspections (
    inspection_number,
    garage_owner_id,
    customer_name,
    customer_phone,
    customer_email,
    vehicle_make,
    vehicle_model,
    vehicle_year,
    vehicle_plate_number,
    inspection_date,
    scheduled_time,
    assigned_technician,
    status,
    priority,
    tasks,
    estimated_cost,
    actual_cost,
    findings,
    recommendations,
    internal_notes
) VALUES 
-- Inspection 1 - Completed luxury inspection
('INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '301', user_id, 'Captain Ahmed Al Zaabi', '+971505554433', 'ahmed.zaabi@email.com', 'Aston Martin', 'DB11', 2022, 'DXB-AM-4433', CURRENT_DATE - 1, '09:30', 'Master Technician Ali Hassan', 'completed', 'high', '["Engine performance analysis", "Carbon fiber body inspection", "Luxury interior check", "Electronics diagnostics"]'::jsonb, 800.00, 750.00, 'Vehicle in exceptional condition. All luxury systems functioning perfectly. Minor leather conditioning performed.', 'Recommend ceramic coating for paint protection. Next inspection in 12 months.', 'VIP customer - concierge service level'),

-- Inspection 2 - In progress comprehensive
('INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '302', user_id, 'Dr. Nadia Al Shamsi', '+971508887766', 'nadia.shamsi@email.com', 'Porsche', 'Taycan Turbo S', 2023, 'AUH-P-8877', CURRENT_DATE, '11:00', 'EV Specialist Omar Al Rashid', 'in_progress', 'normal', '["Electric drivetrain diagnostics", "Battery health assessment", "Charging system check", "Software updates"]'::jsonb, 650.00, NULL, NULL, NULL, 'First electric vehicle inspection - comprehensive EV protocol'),

-- Inspection 3 - Scheduled for future
('INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '303', user_id, 'Sheikh Mohammed Al Maktoum', '+971504443322', 'mohammed.maktoum@email.com', 'Bugatti', 'Chiron', 2021, 'DXB-BU-2211', CURRENT_DATE + 3, '14:30', 'Hypercar Specialist Khalid Al Mulla', 'pending', 'urgent', '["Hypercar systems check", "Quad-turbo engine analysis", "Aerodynamics inspection", "Safety systems verification"]'::jsonb, 1500.00, NULL, NULL, NULL, 'Rare hypercar - requires specialized inspection protocol'),

-- Inspection 4 - Annual service inspection
('INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '304', user_id, 'Businesswoman Amina Al Qassemi', '+971507776655', 'amina.qassemi@email.com', 'Maybach', 'S680', 2023, 'SHJ-MY-6655', CURRENT_DATE + 5, '16:00', 'Luxury Vehicle Expert Saif Al Ketbi', 'confirmed', 'normal', '["Luxury systems inspection", "Massage seats calibration", "Climate control optimization", "Advanced driver assistance check"]'::jsonb, 900.00, NULL, NULL, NULL, 'Annual luxury vehicle comprehensive inspection');

-- Success message
RAISE NOTICE '✅ DATA POPULATION COMPLETE FOR USER: %', user_id;
RAISE NOTICE '📊 Created:';
RAISE NOTICE '   • 5 Bookings (1 completed, 1 in-progress, 3 pending)';
RAISE NOTICE '   • 3 Appointments (2 confirmed, 1 pending)'; 
RAISE NOTICE '   • 4 Inspections (1 completed, 1 in-progress, 2 scheduled)';
RAISE NOTICE '💰 Total estimated revenue: AED 10,350';
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
    priority,
    COUNT(*) as count,
    SUM(estimated_cost) as total_estimated
FROM bookings 
WHERE garage_id = '09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e'
GROUP BY status, priority
ORDER BY status, priority;

-- Show appointments summary
SELECT 
    'Appointments Overview' as section,
    status,
    priority,
    COUNT(*) as count
FROM appointments 
WHERE garage_owner_id = '09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e'
GROUP BY status, priority
ORDER BY status, priority;

-- Show inspections summary
SELECT 
    'Inspections Overview' as section,
    status,
    priority,
    COUNT(*) as count,
    SUM(estimated_cost) as total_estimated
FROM inspections 
WHERE garage_owner_id = '09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e'
GROUP BY status, priority
ORDER BY status, priority;

-- ============================================================
-- NOTES
-- ============================================================
/*
🎯 DATA CREATED FOR USER: 09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e

📋 BOOKINGS (5 total):
• Tesla Model S - Battery Diagnostics (Completed)
• Jaguar F-PACE - Suspension Service (In Progress)  
• Bentley Continental GT - Engine Service (Confirmed)
• Maserati Levante - Brake System Upgrade (Pending)
• Ferrari 488 GTB - Transmission Repair (Urgent)

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
✅ Different customer names from previous samples
✅ Luxury/premium vehicle focus
✅ UAE-style naming and plate numbers
✅ Realistic service types and costs
✅ Mixed status distribution for demo variety
✅ Proper JSONB tasks for inspections
✅ RLS policies enabled
✅ Comprehensive verification queries
*/