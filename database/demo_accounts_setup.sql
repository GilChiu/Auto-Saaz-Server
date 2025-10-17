-- ============================================================
-- DEMO ACCOUNTS SETUP FOR EMPLOYER PRESENTATION
-- This script creates test accounts with realistic data
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. TEST USER ACCOUNTS
-- ============================================================

-- Clear existing demo data (optional - comment out if you want to keep existing data)
-- DELETE FROM inspections WHERE garage_owner_id IN (
--     SELECT id FROM users WHERE email LIKE '%@demo.autosaaz.com'
-- );
-- DELETE FROM bookings WHERE garage_id IN (
--     SELECT id FROM users WHERE email LIKE '%@demo.autosaaz.com'
-- );
-- DELETE FROM appointments WHERE garage_owner_id IN (
--     SELECT id FROM users WHERE email LIKE '%@demo.autosaaz.com'
-- );
-- DELETE FROM users WHERE email LIKE '%@demo.autosaaz.com';

-- Create demo user accounts
INSERT INTO users (
    id,
    email,
    password_hash,
    role,
    garage_name,
    phone,
    full_name,
    email_verified,
    business_address,
    business_license,
    created_at,
    updated_at
) VALUES 
-- Demo Account 1: Premium Garage
(
    '11111111-1111-1111-1111-111111111111',
    'premium@demo.autosaaz.com',
    '$2b$10$8K7QzK5v5n6YcXzX8K7QzK5v5n6YcXzX8K7QzK5v5n6YcXzX8K7QzK', -- Password: Demo123!
    'garage_owner',
    'Premium Auto Care Center',
    '+971501234567',
    'Ahmed Al Mansouri',
    true,
    'Al Wasl Road, Jumeirah, Dubai, UAE',
    'DXB-GAR-2023-001',
    NOW() - INTERVAL '90 days',
    NOW()
),
-- Demo Account 2: Express Service
(
    '22222222-2222-2222-2222-222222222222',
    'express@demo.autosaaz.com',
    '$2b$10$8K7QzK5v5n6YcXzX8K7QzK5v5n6YcXzX8K7QzK5v5n6YcXzX8K7QzK', -- Password: Demo123!
    'garage_owner',
    'Express Auto Service',
    '+971509876543',
    'Mohammad Hassan',
    true,
    'Sheikh Zayed Road, Business Bay, Dubai, UAE',
    'DXB-GAR-2023-002',
    NOW() - INTERVAL '60 days',
    NOW()
),
-- Demo Account 3: Elite Motors
(
    '33333333-3333-3333-3333-333333333333',
    'elite@demo.autosaaz.com',
    '$2b$10$8K7QzK5v5n6YcXzX8K7QzK5v5n6YcXzX8K7QzK5v5n6YcXzX8K7QzK', -- Password: Demo123!
    'garage_owner',
    'Elite Motors Workshop',
    '+971502468135',
    'Sara Al Zahra',
    true,
    'Dubai Investment Park, Dubai, UAE',
    'DXB-GAR-2023-003',
    NOW() - INTERVAL '30 days',
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    garage_name = EXCLUDED.garage_name,
    phone = EXCLUDED.phone,
    full_name = EXCLUDED.full_name,
    business_address = EXCLUDED.business_address,
    updated_at = NOW();

-- ============================================================
-- 2. BOOKINGS DATA
-- ============================================================

-- Ensure bookings table exists with all necessary columns
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

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_bookings_garage_id ON bookings(garage_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_service_date ON bookings(service_date);

-- Enable RLS for bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bookings
DROP POLICY IF EXISTS bookings_garage_owner_policy ON bookings;
CREATE POLICY bookings_garage_owner_policy ON bookings
    USING (garage_id = auth.uid());

-- Insert sample bookings
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
-- Premium Auto Care Center Bookings
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '001', '11111111-1111-1111-1111-111111111111', 'Ali Rashid', '+971501111111', 'ali.rashid@email.com', 'BMW', 'X5', 2022, 'DXB-A-1234', 'Engine Diagnostics', CURRENT_DATE, '09:00', 'completed', 'high', 450.00, 420.00, 'Engine sensor replacement completed successfully'),
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '002', '11111111-1111-1111-1111-111111111111', 'Fatima Al Zahra', '+971502222222', 'fatima.zahra@email.com', 'Mercedes', 'C-Class', 2021, 'AUH-B-5678', 'Brake Service', CURRENT_DATE, '11:00', 'in_progress', 'normal', 320.00, NULL, 'Brake pads and fluid replacement in progress'),
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '003', '11111111-1111-1111-1111-111111111111', 'Omar Khan', '+971503333333', 'omar.khan@email.com', 'Audi', 'A4', 2020, 'SHJ-C-9012', 'Oil Change & Filter', CURRENT_DATE + INTERVAL '1 day', '14:00', 'confirmed', 'normal', 180.00, NULL, 'Regular maintenance service'),
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '004', '11111111-1111-1111-1111-111111111111', 'Layla Ahmed', '+971504444444', 'layla.ahmed@email.com', 'Toyota', 'Prado', 2023, 'RAK-D-3456', 'AC Repair', CURRENT_DATE + INTERVAL '2 days', '10:00', 'pending', 'high', 500.00, NULL, 'AC compressor issue reported'),

-- Express Auto Service Bookings
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '005', '22222222-2222-2222-2222-222222222222', 'Hassan Al Mansoori', '+971505555555', 'hassan.mansoori@email.com', 'Honda', 'Civic', 2019, 'DXB-E-7890', 'Transmission Check', CURRENT_DATE, '08:00', 'completed', 'urgent', 800.00, 750.00, 'Transmission fluid and filter replaced'),
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '006', '22222222-2222-2222-2222-222222222222', 'Amira Khalil', '+971506666666', 'amira.khalil@email.com', 'Nissan', 'Altima', 2022, 'AUH-F-2468', 'Battery Replacement', CURRENT_DATE, '13:00', 'confirmed', 'normal', 150.00, NULL, 'Battery testing and replacement if needed'),
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '007', '22222222-2222-2222-2222-222222222222', 'Khalid Saeed', '+971507777777', 'khalid.saeed@email.com', 'Hyundai', 'Tucson', 2021, 'SHJ-G-1357', 'Tire Rotation', CURRENT_DATE + INTERVAL '1 day', '15:00', 'pending', 'low', 80.00, NULL, 'Regular tire maintenance'),

-- Elite Motors Workshop Bookings
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '008', '33333333-3333-3333-3333-333333333333', 'Nour Al Zaabi', '+971508888888', 'nour.zaabi@email.com', 'Lexus', 'RX350', 2023, 'DXB-H-9753', 'Full Service', CURRENT_DATE, '09:30', 'in_progress', 'normal', 600.00, NULL, 'Comprehensive vehicle inspection and service'),
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '009', '33333333-3333-3333-3333-333333333333', 'Youssef Mahmoud', '+971509999999', 'youssef.mahmoud@email.com', 'Porsche', 'Cayenne', 2022, 'AUH-I-8642', 'Brake & Suspension', CURRENT_DATE + INTERVAL '1 day', '11:30', 'confirmed', 'high', 950.00, NULL, 'Performance brake and suspension service'),
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '010', '33333333-3333-3333-3333-333333333333', 'Maryam Al Shamsi', '+971500000000', 'maryam.shamsi@email.com', 'Range Rover', 'Evoque', 2021, 'RAK-J-7531', 'Engine Tune-up', CURRENT_DATE + INTERVAL '3 days', '16:00', 'pending', 'normal', 750.00, NULL, 'Engine performance optimization');

-- ============================================================
-- 3. APPOINTMENTS DATA
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

-- Create indexes for appointments
CREATE INDEX IF NOT EXISTS idx_appointments_garage_owner_id ON appointments(garage_owner_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);

-- Enable RLS for appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for appointments
DROP POLICY IF EXISTS appointments_garage_owner_policy ON appointments;
CREATE POLICY appointments_garage_owner_policy ON appointments
    USING (garage_owner_id = auth.uid());

-- Insert sample appointments
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
-- Premium Auto Care Center Appointments
('APT' || EXTRACT(EPOCH FROM NOW())::BIGINT || '001', '11111111-1111-1111-1111-111111111111', 'Ahmed Khalil', '+971501234567', 'ahmed.khalil@email.com', 'BMW', '3 Series', 2020, 'DXB-K-1111', 'Consultation', CURRENT_DATE + INTERVAL '1 day', '09:00', 'confirmed', 'normal', 'Initial consultation for custom modifications'),
('APT' || EXTRACT(EPOCH FROM NOW())::BIGINT || '002', '11111111-1111-1111-1111-111111111111', 'Rania Saleh', '+971502345678', 'rania.saleh@email.com', 'Mercedes', 'E-Class', 2022, 'AUH-L-2222', 'Quote Request', CURRENT_DATE + INTERVAL '2 days', '11:00', 'pending', 'high', 'Needs quote for accident damage repair'),

-- Express Auto Service Appointments
('APT' || EXTRACT(EPOCH FROM NOW())::BIGINT || '003', '22222222-2222-2222-2222-222222222222', 'Tariq Al Mulla', '+971503456789', 'tariq.mulla@email.com', 'Honda', 'Accord', 2021, 'SHJ-M-3333', 'Quick Check', CURRENT_DATE + INTERVAL '1 day', '14:00', 'confirmed', 'normal', 'Strange noise from engine - quick diagnostic needed'),
('APT' || EXTRACT(EPOCH FROM NOW())::BIGINT || '004', '22222222-2222-2222-2222-222222222222', 'Zara Younis', '+971504567890', 'zara.younis@email.com', 'Toyota', 'Camry', 2023, 'RAK-N-4444', 'Warranty Check', CURRENT_DATE + INTERVAL '3 days', '10:30', 'pending', 'low', 'Warranty service appointment'),

-- Elite Motors Workshop Appointments
('APT' || EXTRACT(EPOCH FROM NOW())::BIGINT || '005', '33333333-3333-3333-3333-333333333333', 'Majid Al Qasimi', '+971505678901', 'majid.qasimi@email.com', 'Porsche', '911', 2023, 'DXB-O-5555', 'Performance Upgrade', CURRENT_DATE + INTERVAL '5 days', '15:00', 'confirmed', 'high', 'Performance tuning consultation for track use'),
('APT' || EXTRACT(EPOCH FROM NOW())::BIGINT || '006', '33333333-3333-3333-3333-333333333333', 'Leila Farooq', '+971506789012', 'leila.farooq@email.com', 'Audi', 'Q7', 2022, 'AUH-P-6666', 'Custom Interior', CURRENT_DATE + INTERVAL '7 days', '13:00', 'pending', 'normal', 'Custom leather interior modification quote');

-- ============================================================
-- 4. INSPECTIONS DATA
-- ============================================================

-- Ensure inspections table exists (from previous script)
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

-- Create indexes for inspections if they don't exist
CREATE INDEX IF NOT EXISTS idx_inspections_garage_owner_id ON inspections(garage_owner_id);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(inspection_date);

-- Enable RLS for inspections
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for inspections
DROP POLICY IF EXISTS inspections_garage_owner_policy ON inspections;
CREATE POLICY inspections_garage_owner_policy ON inspections
    USING (garage_owner_id = auth.uid());

-- Insert sample inspections
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
-- Premium Auto Care Center Inspections
('INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '001', '11111111-1111-1111-1111-111111111111', 'Saif Al Rashid', '+971501111001', 'saif.rashid@email.com', 'BMW', 'X3', 2021, 'DXB-Q-1001', CURRENT_DATE, '08:00', 'Ahmad Al Zaabi', 'completed', 'normal', '["Engine diagnostics", "Brake system check", "Suspension inspection", "Electrical system test"]'::jsonb, 300.00, 280.00, 'All major systems functioning well. Minor brake fluid top-up performed.', 'Regular maintenance recommended every 6 months.', 'Customer satisfied with service quality'),

('INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '002', '11111111-1111-1111-1111-111111111111', 'Dana Al Mansouri', '+971501111002', 'dana.mansouri@email.com', 'Mercedes', 'GLC', 2022, 'AUH-R-2002', CURRENT_DATE, '10:30', 'Hassan Al Mulla', 'in_progress', 'high', '["Transmission diagnostics", "Cooling system check", "Tire inspection", "Battery test"]'::jsonb, 400.00, NULL, NULL, NULL, 'Customer reported transmission issues - detailed inspection in progress'),

('INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '003', '11111111-1111-1111-1111-111111111111', 'Khalid Hamdan', '+971501111003', 'khalid.hamdan@email.com', 'Audi', 'Q5', 2020, 'SHJ-S-3003', CURRENT_DATE + INTERVAL '1 day', '14:00', 'Ahmed Al Zaabi', 'pending', 'normal', '["Pre-purchase inspection", "Engine compression test", "Brake system evaluation", "Body and paint inspection"]'::jsonb, 350.00, NULL, NULL, NULL, 'Pre-purchase inspection for potential buyer'),

-- Express Auto Service Inspections
('INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '004', '22222222-2222-2222-2222-222222222222', 'Mona Al Hashemi', '+971502222001', 'mona.hashemi@email.com', 'Honda', 'CR-V', 2019, 'DXB-T-4004', CURRENT_DATE, '09:00', 'Omar Khalil', 'completed', 'normal', '["Engine oil analysis", "Air filter inspection", "Brake pad measurement", "Tire tread check"]'::jsonb, 200.00, 180.00, 'Engine oil due for change. Air filter replaced. Brakes in good condition.', 'Next service in 3 months or 10,000km whichever comes first.', 'Customer enrolled in maintenance package'),

('INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '005', '22222222-2222-2222-2222-222222222222', 'Rashid Al Blooshi', '+971502222002', 'rashid.blooshi@email.com', 'Toyota', 'Land Cruiser', 2023, 'RAK-U-5005', CURRENT_DATE, '13:30', 'Khalil Hassan', 'pending', 'urgent', '["Emergency inspection", "Engine overheating check", "Coolant system test", "Radiator inspection"]'::jsonb, 250.00, NULL, NULL, NULL, 'Emergency inspection - customer reported overheating'),

-- Elite Motors Workshop Inspections
('INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '006', '33333333-3333-3333-3333-333333333333', 'Amina Al Ketbi', '+971503333001', 'amina.ketbi@email.com', 'Porsche', 'Macan', 2022, 'DXB-V-6006', CURRENT_DATE, '11:00', 'Yousef Al Mansoori', 'completed', 'high', '["Performance diagnostics", "Suspension tuning check", "Brake performance test", "Exhaust system inspection"]'::jsonb, 500.00, 480.00, 'Performance systems operating at optimal levels. Suspension calibration adjusted for track use.', 'Recommend performance brake fluid upgrade for track driving.', 'VIP customer - premium service package'),

('INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '007', '33333333-3333-3333-3333-333333333333', 'Faisal Al Nuaimi', '+971503333002', 'faisal.nuaimi@email.com', 'Range Rover', 'Sport', 2021, 'AUH-W-7007', CURRENT_DATE + INTERVAL '2 days', '15:30', 'Ahmed Al Zahra', 'confirmed', 'normal', '["Annual inspection", "Air suspension check", "4WD system test", "Electronic diagnostics"]'::jsonb, 450.00, NULL, NULL, NULL, 'Annual comprehensive inspection scheduled');

-- ============================================================
-- 5. VERIFICATION QUERIES
-- ============================================================

-- Show created users
SELECT 'Demo users created successfully!' as message;
SELECT 
    garage_name,
    full_name,
    email,
    phone,
    business_address
FROM users 
WHERE email LIKE '%@demo.autosaaz.com'
ORDER BY garage_name;

-- Show bookings summary
SELECT 
    u.garage_name,
    COUNT(b.id) as total_bookings,
    COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN b.status = 'in_progress' THEN 1 END) as in_progress,
    COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed,
    COUNT(CASE WHEN b.status = 'pending' THEN 1 END) as pending
FROM users u
LEFT JOIN bookings b ON u.id = b.garage_id
WHERE u.email LIKE '%@demo.autosaaz.com'
GROUP BY u.garage_name, u.id
ORDER BY u.garage_name;

-- Show appointments summary
SELECT 
    u.garage_name,
    COUNT(a.id) as total_appointments,
    COUNT(CASE WHEN a.status = 'confirmed' THEN 1 END) as confirmed,
    COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as pending
FROM users u
LEFT JOIN appointments a ON u.id = a.garage_owner_id
WHERE u.email LIKE '%@demo.autosaaz.com'
GROUP BY u.garage_name, u.id
ORDER BY u.garage_name;

-- Show inspections summary
SELECT 
    u.garage_name,
    COUNT(i.id) as total_inspections,
    COUNT(CASE WHEN i.status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN i.status = 'in_progress' THEN 1 END) as in_progress,
    COUNT(CASE WHEN i.status = 'pending' THEN 1 END) as pending
FROM users u
LEFT JOIN inspections i ON u.id = i.garage_owner_id
WHERE u.email LIKE '%@demo.autosaaz.com'
GROUP BY u.garage_name, u.id
ORDER BY u.garage_name;

-- ============================================================
-- DEMO ACCOUNT CREDENTIALS FOR EMPLOYER
-- ============================================================

/*
🔐 DEMO ACCOUNT CREDENTIALS

Account 1 - Premium Auto Care Center:
Email: premium@demo.autosaaz.com
Password: Demo123!
Owner: Ahmed Al Mansouri
Phone: +971501234567
Location: Al Wasl Road, Jumeirah, Dubai, UAE

Account 2 - Express Auto Service:
Email: express@demo.autosaaz.com
Password: Demo123!
Owner: Mohammad Hassan
Phone: +971509876543
Location: Sheikh Zayed Road, Business Bay, Dubai, UAE

Account 3 - Elite Motors Workshop:
Email: elite@demo.autosaaz.com
Password: Demo123!
Owner: Sara Al Zahra
Phone: +971502468135
Location: Dubai Investment Park, Dubai, UAE

📊 DATA SUMMARY:
- 3 different garage businesses
- 10 bookings across all garages (various statuses)
- 6 appointments scheduled
- 7 inspections (completed, in-progress, pending)
- Realistic UAE customer data
- Professional service types and pricing
- Geographic diversity across Dubai, Abu Dhabi, Sharjah, Ras Al Khaimah

🎯 DEMO SCENARIOS:
1. Premium garage with luxury vehicle services
2. Express service with quick turnaround focus
3. Elite workshop specializing in high-end modifications

All accounts have realistic data that showcases the platform's capabilities
for different types of automotive service businesses.
*/

RAISE NOTICE '🎉 DEMO ACCOUNTS SETUP COMPLETE!';
RAISE NOTICE 'Created 3 demo accounts with realistic business data';
RAISE NOTICE 'Total bookings: %', (SELECT COUNT(*) FROM bookings WHERE garage_id IN (SELECT id FROM users WHERE email LIKE '%@demo.autosaaz.com'));
RAISE NOTICE 'Total appointments: %', (SELECT COUNT(*) FROM appointments WHERE garage_owner_id IN (SELECT id FROM users WHERE email LIKE '%@demo.autosaaz.com'));
RAISE NOTICE 'Total inspections: %', (SELECT COUNT(*) FROM inspections WHERE garage_owner_id IN (SELECT id FROM users WHERE email LIKE '%@demo.autosaaz.com'));
RAISE NOTICE 'Use the credentials above to demonstrate the platform to your employer.';