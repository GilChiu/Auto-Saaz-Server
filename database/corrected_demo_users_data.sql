-- ============================================================
-- CORRECTED DEMO USERS AND DATA SETUP
-- This script creates demo users using only existing table columns
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. CREATE DEMO USERS (using only existing columns)
-- ============================================================

-- Clear existing demo data (uncomment if you want to reset)
-- DELETE FROM inspections WHERE garage_owner_id IN (
--     SELECT id FROM users WHERE email LIKE '%@demo.autosaaz.com'
-- );
-- DELETE FROM appointments WHERE garage_owner_id IN (
--     SELECT id FROM users WHERE email LIKE '%@demo.autosaaz.com'
-- );
-- DELETE FROM bookings WHERE garage_id IN (
--     SELECT id FROM users WHERE email LIKE '%@demo.autosaaz.com'
-- );
-- DELETE FROM users WHERE email LIKE '%@demo.autosaaz.com';

-- Insert demo users (using only basic required columns)
INSERT INTO users (
    id,
    email,
    role,
    full_name,
    phone,
    email_verified,
    created_at,
    updated_at
) VALUES 
-- User 1: Premium Auto Care
(
    '11111111-1111-1111-1111-111111111111',
    'ahmed.premium@demo.autosaaz.com',
    'garage_owner',
    'Ahmed Al Mansouri - Premium Auto Care Center',
    '+971501234567',
    true,
    NOW() - INTERVAL '90 days',
    NOW()
),

-- User 2: Express Service
(
    '22222222-2222-2222-2222-222222222222',
    'mohammad.express@demo.autosaaz.com',
    'garage_owner',
    'Mohammad Hassan - Express Auto Service',
    '+971509876543',
    true,
    NOW() - INTERVAL '60 days',
    NOW()
),

-- User 3: Elite Motors
(
    '33333333-3333-3333-3333-333333333333',
    'sara.elite@demo.autosaaz.com',
    'garage_owner',
    'Sara Al Zahra - Elite Motors Workshop',
    '+971502468135',
    true,
    NOW() - INTERVAL '30 days',
    NOW()
),

-- User 4: Speed Tech Garage
(
    '44444444-4444-4444-4444-444444444444',
    'khalid.speedtech@demo.autosaaz.com',
    'garage_owner',
    'Khalid Al Rashid - Speed Tech Garage',
    '+971505678901',
    true,
    NOW() - INTERVAL '45 days',
    NOW()
),

-- User 5: Royal Auto Works
(
    '55555555-5555-5555-5555-555555555555',
    'fatima.royal@demo.autosaaz.com',
    'garage_owner',
    'Fatima Al Zaabi - Royal Auto Works',
    '+971503456789',
    true,
    NOW() - INTERVAL '15 days',
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    updated_at = NOW();

-- ============================================================
-- 2. CREATE BOOKINGS TABLE AND DATA
-- ============================================================

-- Ensure bookings table exists
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

-- Insert bookings for each user
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

-- Ahmed's Premium Auto Care Bookings
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '001', '11111111-1111-1111-1111-111111111111', 'Ali Rashid Al Maktoum', '+971501111111', 'ali.rashid@email.com', 'BMW', 'X5', 2022, 'DXB-A-1234', 'Engine Diagnostics', CURRENT_DATE, '09:00', 'completed', 'high', 450.00, 420.00, 'Engine sensor replacement completed'),
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '002', '11111111-1111-1111-1111-111111111111', 'Fatima Al Zahra', '+971501111222', 'fatima.zahra@email.com', 'Mercedes', 'C-Class', 2021, 'AUH-B-5678', 'Brake Service', CURRENT_DATE, '11:00', 'in_progress', 'normal', 320.00, NULL, 'Brake pads replacement in progress'),
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '003', '11111111-1111-1111-1111-111111111111', 'Omar Khan Ahmed', '+971501111333', 'omar.khan@email.com', 'Audi', 'A4', 2020, 'SHJ-C-9012', 'Oil Change', CURRENT_DATE + 1, '14:00', 'confirmed', 'normal', 180.00, NULL, 'Regular maintenance service'),
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '004', '11111111-1111-1111-1111-111111111111', 'Layla Ahmed Hassan', '+971501111444', 'layla.ahmed@email.com', 'Toyota', 'Prado', 2023, 'RAK-D-3456', 'AC Repair', CURRENT_DATE + 2, '10:00', 'pending', 'high', 500.00, NULL, 'AC compressor issue'),

-- Mohammad's Express Auto Service Bookings  
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '005', '22222222-2222-2222-2222-222222222222', 'Hassan Al Mansoori', '+971502222111', 'hassan.mansoori@email.com', 'Honda', 'Civic', 2019, 'DXB-E-7890', 'Transmission Check', CURRENT_DATE, '08:00', 'completed', 'urgent', 800.00, 750.00, 'Transmission service completed'),
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '006', '22222222-2222-2222-2222-222222222222', 'Amira Khalil Said', '+971502222222', 'amira.khalil@email.com', 'Nissan', 'Altima', 2022, 'AUH-F-2468', 'Battery Replacement', CURRENT_DATE, '13:00', 'confirmed', 'normal', 150.00, NULL, 'Battery testing scheduled'),
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '007', '22222222-2222-2222-2222-222222222222', 'Khalid Saeed Ali', '+971502222333', 'khalid.saeed@email.com', 'Hyundai', 'Tucson', 2021, 'SHJ-G-1357', 'Tire Rotation', CURRENT_DATE + 1, '15:00', 'pending', 'low', 80.00, NULL, 'Regular tire maintenance'),

-- Sara's Elite Motors Bookings
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '008', '33333333-3333-3333-3333-333333333333', 'Nour Al Zaabi', '+971503333111', 'nour.zaabi@email.com', 'Lexus', 'RX350', 2023, 'DXB-H-9753', 'Full Service', CURRENT_DATE, '09:30', 'in_progress', 'normal', 600.00, NULL, 'Comprehensive service in progress'),
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '009', '33333333-3333-3333-3333-333333333333', 'Youssef Mahmoud', '+971503333222', 'youssef.mahmoud@email.com', 'Porsche', 'Cayenne', 2022, 'AUH-I-8642', 'Performance Upgrade', CURRENT_DATE + 1, '11:30', 'confirmed', 'high', 950.00, NULL, 'Performance tuning scheduled'),
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '010', '33333333-3333-3333-3333-333333333333', 'Maryam Al Shamsi', '+971503333333', 'maryam.shamsi@email.com', 'Range Rover', 'Evoque', 2021, 'RAK-J-7531', 'Engine Tune-up', CURRENT_DATE + 3, '16:00', 'pending', 'normal', 750.00, NULL, 'Engine optimization'),

-- Khalid's Speed Tech Garage Bookings
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '011', '44444444-4444-4444-4444-444444444444', 'Rashid Al Blooshi', '+971504444111', 'rashid.blooshi@email.com', 'Ford', 'F-150', 2020, 'DXB-K-1111', 'Suspension Repair', CURRENT_DATE, '10:00', 'completed', 'high', 680.00, 650.00, 'Suspension components replaced'),
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '012', '44444444-4444-4444-4444-444444444444', 'Mona Al Hashemi', '+971504444222', 'mona.hashemi@email.com', 'Chevrolet', 'Tahoe', 2021, 'AUH-L-2222', 'Electrical Diagnostics', CURRENT_DATE, '14:00', 'in_progress', 'normal', 300.00, NULL, 'Electrical system check ongoing'),
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '013', '44444444-4444-4444-4444-444444444444', 'Ahmed Al Ketbi', '+971504444333', 'ahmed.ketbi@email.com', 'Jeep', 'Wrangler', 2019, 'SHJ-M-3333', 'Clutch Replacement', CURRENT_DATE + 2, '09:00', 'confirmed', 'urgent', 1200.00, NULL, 'Clutch system overhaul'),

-- Fatima's Royal Auto Works Bookings
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '014', '55555555-5555-5555-5555-555555555555', 'Tariq Al Mulla', '+971505555111', 'tariq.mulla@email.com', 'Volkswagen', 'Tiguan', 2022, 'DXB-N-4444', 'Cooling System', CURRENT_DATE, '11:00', 'completed', 'normal', 400.00, 380.00, 'Radiator service completed'),
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '015', '55555555-5555-5555-5555-555555555555', 'Zara Younis Said', '+971505555222', 'zara.younis@email.com', 'Kia', 'Sorento', 2023, 'AUH-O-5555', 'Brake System Overhaul', CURRENT_DATE + 1, '13:30', 'confirmed', 'high', 550.00, NULL, 'Complete brake system service'),
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '016', '55555555-5555-5555-5555-555555555555', 'Majid Al Qasimi', '+971505555333', 'majid.qasimi@email.com', 'Mazda', 'CX-5', 2020, 'RAK-P-6666', 'Engine Overhaul', CURRENT_DATE + 5, '08:00', 'pending', 'urgent', 2500.00, NULL, 'Major engine rebuild scheduled');

-- ============================================================
-- 3. CREATE APPOINTMENTS TABLE AND DATA
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

-- Insert appointments for each user
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

-- Ahmed's Premium Auto Care Appointments
('APT' || EXTRACT(EPOCH FROM NOW())::BIGINT || '001', '11111111-1111-1111-1111-111111111111', 'Ahmed Khalil Nasser', '+971501234567', 'ahmed.khalil@email.com', 'BMW', '3 Series', 2020, 'DXB-Q-1111', 'Consultation', CURRENT_DATE + 1, '09:00', 'confirmed', 'normal', 'Custom modification consultation'),
('APT' || EXTRACT(EPOCH FROM NOW())::BIGINT || '002', '11111111-1111-1111-1111-111111111111', 'Rania Saleh Omar', '+971501234568', 'rania.saleh@email.com', 'Mercedes', 'E-Class', 2022, 'AUH-R-2222', 'Damage Assessment', CURRENT_DATE + 2, '11:00', 'pending', 'high', 'Insurance claim assessment'),

-- Mohammad's Express Auto Service Appointments
('APT' || EXTRACT(EPOCH FROM NOW())::BIGINT || '003', '22222222-2222-2222-2222-222222222222', 'Tariq Al Mulla Ahmad', '+971509876543', 'tariq.mulla@email.com', 'Honda', 'Accord', 2021, 'SHJ-S-3333', 'Quick Diagnostic', CURRENT_DATE + 1, '14:00', 'confirmed', 'normal', 'Engine noise diagnostic'),
('APT' || EXTRACT(EPOCH FROM NOW())::BIGINT || '004', '22222222-2222-2222-2222-222222222222', 'Zara Younis Hassan', '+971509876544', 'zara.younis@email.com', 'Toyota', 'Camry', 2023, 'RAK-T-4444', 'Warranty Inspection', CURRENT_DATE + 3, '10:30', 'pending', 'low', 'Warranty service check'),

-- Sara's Elite Motors Appointments
('APT' || EXTRACT(EPOCH FROM NOW())::BIGINT || '005', '33333333-3333-3333-3333-333333333333', 'Majid Al Qasimi Rashid', '+971502468135', 'majid.qasimi@email.com', 'Porsche', '911', 2023, 'DXB-U-5555', 'Performance Consultation', CURRENT_DATE + 5, '15:00', 'confirmed', 'high', 'Track performance tuning'),
('APT' || EXTRACT(EPOCH FROM NOW())::BIGINT || '006', '33333333-3333-3333-3333-333333333333', 'Leila Farooq Said', '+971502468136', 'leila.farooq@email.com', 'Audi', 'Q7', 2022, 'AUH-V-6666', 'Custom Interior Quote', CURRENT_DATE + 7, '13:00', 'pending', 'normal', 'Leather interior modification'),

-- Khalid's Speed Tech Garage Appointments
('APT' || EXTRACT(EPOCH FROM NOW())::BIGINT || '007', '44444444-4444-4444-4444-444444444444', 'Salem Al Rashid Khalil', '+971505678901', 'salem.rashid@email.com', 'Ford', 'Mustang', 2021, 'DXB-W-7777', 'Performance Upgrade Quote', CURRENT_DATE + 2, '12:00', 'confirmed', 'high', 'Turbocharger installation quote'),
('APT' || EXTRACT(EPOCH FROM NOW())::BIGINT || '008', '44444444-4444-4444-4444-444444444444', 'Noura Al Mansoori', '+971505678902', 'noura.mansoori@email.com', 'Dodge', 'Challenger', 2020, 'SHJ-X-8888', 'Exhaust System Consultation', CURRENT_DATE + 4, '16:00', 'pending', 'normal', 'Custom exhaust system design'),

-- Fatima's Royal Auto Works Appointments
('APT' || EXTRACT(EPOCH FROM NOW())::BIGINT || '009', '55555555-5555-5555-5555-555555555555', 'Hamdan Al Zaabi Omar', '+971503456789', 'hamdan.zaabi@email.com', 'Land Rover', 'Defender', 2022, 'DXB-Y-9999', 'Off-road Preparation', CURRENT_DATE + 3, '10:00', 'confirmed', 'normal', 'Desert safari preparation'),
('APT' || EXTRACT(EPOCH FROM NOW())::BIGINT || '010', '55555555-5555-5555-5555-555555555555', 'Amina Al Ketbi Fatima', '+971503456790', 'amina.ketbi@email.com', 'Mitsubishi', 'Pajero', 2021, 'AUH-Z-0000', 'Maintenance Planning', CURRENT_DATE + 6, '14:30', 'pending', 'low', 'Annual maintenance schedule');

-- ============================================================
-- 4. CREATE INSPECTIONS TABLE AND DATA
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

-- Insert inspections for each user
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

-- Ahmed's Premium Auto Care Inspections
('INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '001', '11111111-1111-1111-1111-111111111111', 'Saif Al Rashid Nasser', '+971501111001', 'saif.rashid@email.com', 'BMW', 'X3', 2021, 'DXB-AA-1001', CURRENT_DATE, '08:00', 'Ahmad Al Zaabi', 'completed', 'normal', '["Engine diagnostics", "Brake system check", "Suspension inspection", "Electrical system test"]'::jsonb, 300.00, 280.00, 'All major systems functioning well. Minor brake fluid top-up performed.', 'Regular maintenance recommended every 6 months.', 'Premium customer - VIP service'),
('INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '002', '11111111-1111-1111-1111-111111111111', 'Dana Al Mansouri Said', '+971501111002', 'dana.mansouri@email.com', 'Mercedes', 'GLC', 2022, 'AUH-BB-2002', CURRENT_DATE, '10:30', 'Hassan Al Mulla', 'in_progress', 'high', '["Transmission diagnostics", "Cooling system check", "Tire inspection", "Battery test"]'::jsonb, 400.00, NULL, NULL, NULL, 'Customer reported transmission issues'),
('INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '003', '11111111-1111-1111-1111-111111111111', 'Khalid Hamdan Omar', '+971501111003', 'khalid.hamdan@email.com', 'Audi', 'Q5', 2020, 'SHJ-CC-3003', CURRENT_DATE + 1, '14:00', 'Ahmad Al Zaabi', 'pending', 'normal', '["Pre-purchase inspection", "Engine compression test", "Brake system evaluation", "Body and paint inspection"]'::jsonb, 350.00, NULL, NULL, NULL, 'Pre-purchase inspection for potential buyer'),

-- Mohammad's Express Auto Service Inspections
('INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '004', '22222222-2222-2222-2222-222222222222', 'Mona Al Hashemi Khalil', '+971502222001', 'mona.hashemi@email.com', 'Honda', 'CR-V', 2019, 'DXB-DD-4004', CURRENT_DATE, '09:00', 'Omar Khalil', 'completed', 'normal', '["Engine oil analysis", "Air filter inspection", "Brake pad measurement", "Tire tread check"]'::jsonb, 200.00, 180.00, 'Engine oil due for change. Air filter replaced. Brakes in good condition.', 'Next service in 3 months or 10,000km.', 'Customer enrolled in maintenance package'),
('INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '005', '22222222-2222-2222-2222-222222222222', 'Rashid Al Blooshi Hassan', '+971502222002', 'rashid.blooshi@email.com', 'Toyota', 'Land Cruiser', 2023, 'RAK-EE-5005', CURRENT_DATE, '13:30', 'Khalil Hassan', 'pending', 'urgent', '["Emergency inspection", "Engine overheating check", "Coolant system test", "Radiator inspection"]'::jsonb, 250.00, NULL, NULL, NULL, 'Emergency inspection - overheating reported'),

-- Sara's Elite Motors Inspections
('INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '006', '33333333-3333-3333-3333-333333333333', 'Amina Al Ketbi Zahra', '+971503333001', 'amina.ketbi@email.com', 'Porsche', 'Macan', 2022, 'DXB-FF-6006', CURRENT_DATE, '11:00', 'Yousef Al Mansoori', 'completed', 'high', '["Performance diagnostics", "Suspension tuning check", "Brake performance test", "Exhaust system inspection"]'::jsonb, 500.00, 480.00, 'Performance systems operating at optimal levels. Suspension calibration adjusted.', 'Recommend performance brake fluid upgrade for track driving.', 'VIP customer - premium service package'),
('INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '007', '33333333-3333-3333-3333-333333333333', 'Faisal Al Nuaimi Rashid', '+971503333002', 'faisal.nuaimi@email.com', 'Range Rover', 'Sport', 2021, 'AUH-GG-7007', CURRENT_DATE + 2, '15:30', 'Ahmed Al Zahra', 'confirmed', 'normal', '["Annual inspection", "Air suspension check", "4WD system test", "Electronic diagnostics"]'::jsonb, 450.00, NULL, NULL, NULL, 'Annual comprehensive inspection'),

-- Khalid's Speed Tech Garage Inspections
('INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '008', '44444444-4444-4444-4444-444444444444', 'Salem Al Rashid Mahmoud', '+971504444001', 'salem.rashid@email.com', 'Ford', 'Raptor', 2021, 'DXB-HH-8008', CURRENT_DATE, '12:00', 'Khalil Al Zaabi', 'completed', 'high', '["Off-road capability check", "Suspension performance test", "4WD system inspection", "Engine power analysis"]'::jsonb, 380.00, 360.00, 'Off-road systems performing excellently. Minor suspension adjustment made.', 'Ready for desert adventures. Check again after 5000km off-road use.', 'Customer planning desert expedition'),
('INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '009', '44444444-4444-4444-4444-444444444444', 'Noura Al Mansoori Ahmed', '+971504444002', 'noura.mansoori@email.com', 'Jeep', 'Grand Cherokee', 2020, 'SHJ-II-9009', CURRENT_DATE + 1, '16:30', 'Ahmad Al Hashemi', 'pending', 'normal', '["Routine inspection", "Brake system check", "Transmission service", "Electrical diagnostics"]'::jsonb, 320.00, NULL, NULL, NULL, 'Routine 60,000km service inspection'),

-- Fatima's Royal Auto Works Inspections  
('INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '010', '55555555-5555-5555-5555-555555555555', 'Hamdan Al Zaabi Khalil', '+971505555001', 'hamdan.zaabi@email.com', 'Land Rover', 'Discovery', 2022, 'DXB-JJ-1010', CURRENT_DATE, '10:30', 'Fatima Al Rashid', 'completed', 'normal', '["Desert preparation check", "Cooling system inspection", "Tire condition assessment", "Navigation system test"]'::jsonb, 280.00, 260.00, 'Vehicle ready for extended desert travel. All systems optimized for harsh conditions.', 'Carry extra coolant and check tire pressure regularly in desert.', 'Customer planning cross-country desert trip'),
('INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '011', '55555555-5555-5555-5555-555555555555', 'Amina Al Ketbi Nasser', '+971505555002', 'amina.ketbi@email.com', 'Mitsubishi', 'Outlander', 2021, 'AUH-KK-1111', CURRENT_DATE + 2, '14:00', 'Omar Al Zahra', 'confirmed', 'low', '["Family vehicle safety check", "Child seat anchor inspection", "Emergency equipment check", "Maintenance schedule review"]'::jsonb, 220.00, NULL, NULL, NULL, 'Family safety inspection - new baby coming');

-- ============================================================
-- 5. VERIFICATION AND SUMMARY
-- ============================================================

-- Show all created users
SELECT 'Demo users created successfully!' as message;
SELECT 
    full_name,
    email,
    phone
FROM users 
WHERE email LIKE '%@demo.autosaaz.com'
ORDER BY full_name;

-- Show data summary for each user
SELECT 
    u.full_name,
    u.email,
    COUNT(DISTINCT b.id) as total_bookings,
    COUNT(DISTINCT a.id) as total_appointments,
    COUNT(DISTINCT i.id) as total_inspections
FROM users u
LEFT JOIN bookings b ON u.id = b.garage_id
LEFT JOIN appointments a ON u.id = a.garage_owner_id
LEFT JOIN inspections i ON u.id = i.garage_owner_id
WHERE u.email LIKE '%@demo.autosaaz.com'
GROUP BY u.full_name, u.email, u.id
ORDER BY u.full_name;

RAISE NOTICE '🎉 CORRECTED DEMO SETUP COMPLETE!';
RAISE NOTICE 'Created 5 demo users with individual data sets';
RAISE NOTICE 'Total demo bookings: %', (SELECT COUNT(*) FROM bookings b JOIN users u ON b.garage_id = u.id WHERE u.email LIKE '%@demo.autosaaz.com');
RAISE NOTICE 'Total demo appointments: %', (SELECT COUNT(*) FROM appointments a JOIN users u ON a.garage_owner_id = u.id WHERE u.email LIKE '%@demo.autosaaz.com');
RAISE NOTICE 'Total demo inspections: %', (SELECT COUNT(*) FROM inspections i JOIN users u ON i.garage_owner_id = u.id WHERE u.email LIKE '%@demo.autosaaz.com');

-- ============================================================
-- IMPORTANT NOTES FOR PASSWORD SETUP
-- ============================================================
/*
⚠️  IMPORTANT: PASSWORD SETUP REQUIRED

This script creates users using only existing table columns.
The garage business names are included in the full_name field.

To set up login credentials, you need to:

1. Use Supabase Auth system to create accounts:
   - Go to your Supabase Dashboard > Authentication > Users
   - Create users manually with these emails:
     * ahmed.premium@demo.autosaaz.com
     * mohammad.express@demo.autosaaz.com  
     * sara.elite@demo.autosaaz.com
     * khalid.speedtech@demo.autosaaz.com
     * fatima.royal@demo.autosaaz.com
   - Set password as: Demo123!

2. Or use your registration system to create these accounts

3. The user IDs in this script should match the auth.users IDs

DEMO USER EMAILS:
✅ ahmed.premium@demo.autosaaz.com - Ahmed Al Mansouri - Premium Auto Care Center
✅ mohammad.express@demo.autosaaz.com - Mohammad Hassan - Express Auto Service  
✅ sara.elite@demo.autosaaz.com - Sara Al Zahra - Elite Motors Workshop
✅ khalid.speedtech@demo.autosaaz.com - Khalid Al Rashid - Speed Tech Garage
✅ fatima.royal@demo.autosaaz.com - Fatima Al Zaabi - Royal Auto Works

Each user has: 3-4 bookings, 2 appointments, 2-3 inspections
Total: 16 bookings, 10 appointments, 11 inspections
*/