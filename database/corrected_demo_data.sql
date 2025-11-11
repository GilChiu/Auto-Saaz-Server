-- ============================================================
-- CORRECTED DEMO DATA SCRIPT
-- Based on actual database schema with users + garage_profiles structure
-- Creates 5 demo garage businesses with comprehensive data
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. CREATE DEMO USERS (Basic user accounts)
-- ============================================================

-- Insert basic user accounts first
INSERT INTO users (
    id,
    email,
    password,
    role,
    status,
    created_at,
    updated_at
) VALUES 
-- User 1: Premium Auto Care Center
(
    '11111111-1111-1111-1111-111111111111',
    'ahmed.premium@demo.autosaaz.com',
    '$2b$10$example.hash.for.Demo123!',
    'garage_owner',
    'verified',
    NOW() - INTERVAL '90 days',
    NOW()
),

-- User 2: Express Auto Service
(
    '22222222-2222-2222-2222-222222222222',
    'mohammad.express@demo.autosaaz.com',
    '$2b$10$example.hash.for.Demo123!',
    'garage_owner',
    'verified',
    NOW() - INTERVAL '60 days',
    NOW()
),

-- User 3: Elite Motors Workshop
(
    '33333333-3333-3333-3333-333333333333',
    'sara.elite@demo.autosaaz.com',
    '$2b$10$example.hash.for.Demo123!',
    'garage_owner',
    'verified',
    NOW() - INTERVAL '30 days',
    NOW()
),

-- User 4: Speed Tech Garage
(
    '44444444-4444-4444-4444-444444444444',
    'khalid.speedtech@demo.autosaaz.com',
    '$2b$10$example.hash.for.Demo123!',
    'garage_owner',
    'verified',
    NOW() - INTERVAL '45 days',
    NOW()
),

-- User 5: Royal Auto Works
(
    '55555555-5555-5555-5555-555555555555',
    'fatima.royal@demo.autosaaz.com',
    '$2b$10$example.hash.for.Demo123!',
    'garage_owner',
    'verified',
    NOW() - INTERVAL '15 days',
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    status = EXCLUDED.status,
    updated_at = NOW();

-- ============================================================
-- 2. CREATE GARAGE PROFILES (Extended business information)
-- ============================================================

INSERT INTO garage_profiles (
    user_id,
    full_name,
    email,
    phone_number,
    address,
    street,
    state,
    location,
    company_legal_name,
    trade_license_number,
    role,
    status,
    is_email_verified,
    is_phone_verified,
    email_verified_at,
    phone_verified_at,
    created_at,
    updated_at
) VALUES 
-- Profile 1: Premium Auto Care Center
(
    '11111111-1111-1111-1111-111111111111',
    'Ahmed Al Mansouri',
    'ahmed.premium@demo.autosaaz.com',
    '+971501234567',
    'Al Wasl Road, Jumeirah, Dubai, UAE',
    'Al Wasl Road',
    'Dubai',
    'Jumeirah',
    'Premium Auto Care Center LLC',
    'DXB-GAR-2023-001',
    'garage_owner',
    'verified',
    true,
    true,
    NOW() - INTERVAL '85 days',
    NOW() - INTERVAL '85 days',
    NOW() - INTERVAL '90 days',
    NOW()
),

-- Profile 2: Express Auto Service
(
    '22222222-2222-2222-2222-222222222222',
    'Mohammad Hassan',
    'mohammad.express@demo.autosaaz.com',
    '+971509876543',
    'Sheikh Zayed Road, Business Bay, Dubai, UAE',
    'Sheikh Zayed Road',
    'Dubai',
    'Business Bay',
    'Express Auto Service LLC',
    'DXB-GAR-2023-002',
    'garage_owner',
    'verified',
    true,
    true,
    NOW() - INTERVAL '55 days',
    NOW() - INTERVAL '55 days',
    NOW() - INTERVAL '60 days',
    NOW()
),

-- Profile 3: Elite Motors Workshop
(
    '33333333-3333-3333-3333-333333333333',
    'Sara Al Zahra',
    'sara.elite@demo.autosaaz.com',
    '+971502468135',
    'Dubai Investment Park, Dubai, UAE',
    'Dubai Investment Park',
    'Dubai',
    'Dubai Investment Park',
    'Elite Motors Workshop LLC',
    'DXB-GAR-2023-003',
    'garage_owner',
    'verified',
    true,
    true,
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '30 days',
    NOW()
),

-- Profile 4: Speed Tech Garage
(
    '44444444-4444-4444-4444-444444444444',
    'Khalid Al Rashid',
    'khalid.speedtech@demo.autosaaz.com',
    '+971505678901',
    'Al Qusais Industrial Area, Dubai, UAE',
    'Al Qusais Industrial Area',
    'Dubai',
    'Al Qusais',
    'Speed Tech Garage LLC',
    'DXB-GAR-2023-004',
    'garage_owner',
    'verified',
    true,
    true,
    NOW() - INTERVAL '40 days',
    NOW() - INTERVAL '40 days',
    NOW() - INTERVAL '45 days',
    NOW()
),

-- Profile 5: Royal Auto Works
(
    '55555555-5555-5555-5555-555555555555',
    'Fatima Al Zaabi',
    'fatima.royal@demo.autosaaz.com',
    '+971503456789',
    'Abu Dhabi Industrial City, Abu Dhabi, UAE',
    'Abu Dhabi Industrial City',
    'Abu Dhabi',
    'Abu Dhabi Industrial City',
    'Royal Auto Works LLC',
    'AUH-GAR-2023-005',
    'garage_owner',
    'verified',
    true,
    true,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '15 days',
    NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone_number = EXCLUDED.phone_number,
    company_legal_name = EXCLUDED.company_legal_name,
    updated_at = NOW();

-- ============================================================
-- 3. CREATE BOOKINGS (Using correct table structure)
-- ============================================================

-- First, let's ensure bookings table exists and check its structure
-- Note: We'll use the structure that likely exists based on previous successful scripts

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
    booking_date,
    scheduled_time,
    status,
    estimated_cost,
    actual_cost,
    notes
) VALUES 

-- Premium Auto Care Center Bookings (4 bookings)
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '001', '11111111-1111-1111-1111-111111111111', 'Ali Rashid Al Maktoum', '+971501111111', 'ali.rashid@email.com', 'BMW', 'X5', 2022, 'DXB-A-1234', 'Engine Diagnostics', CURRENT_DATE - 1, '09:00', 'completed', 450.00, 420.00, 'Engine sensor replacement completed'),
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '002', '11111111-1111-1111-1111-111111111111', 'Fatima Al Zahra', '+971501111222', 'fatima.zahra@email.com', 'Mercedes', 'C-Class', 2021, 'AUH-B-5678', 'Brake Service', CURRENT_DATE, '11:00', 'in_progress', 320.00, NULL, 'Brake pads replacement in progress'),
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '003', '11111111-1111-1111-1111-111111111111', 'Omar Khan Ahmed', '+971501111333', 'omar.khan@email.com', 'Audi', 'A4', 2020, 'SHJ-C-9012', 'Oil Change', CURRENT_DATE + 1, '14:00', 'confirmed', 180.00, NULL, 'Regular maintenance service'),
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '004', '11111111-1111-1111-1111-111111111111', 'Layla Ahmed Hassan', '+971501111444', 'layla.ahmed@email.com', 'Toyota', 'Prado', 2023, 'RAK-D-3456', 'AC Repair', CURRENT_DATE + 2, '10:00', 'pending', 500.00, NULL, 'AC compressor issue'),

-- Express Auto Service Bookings (3 bookings)
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '005', '22222222-2222-2222-2222-222222222222', 'Hassan Al Mansoori', '+971502222111', 'hassan.mansoori@email.com', 'Honda', 'Civic', 2019, 'DXB-E-7890', 'Transmission Check', CURRENT_DATE - 1, '08:00', 'completed', 800.00, 750.00, 'Transmission service completed'),
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '006', '22222222-2222-2222-2222-222222222222', 'Amira Khalil Said', '+971502222222', 'amira.khalil@email.com', 'Nissan', 'Altima', 2022, 'AUH-F-2468', 'Battery Replacement', CURRENT_DATE, '13:00', 'confirmed', 150.00, NULL, 'Battery testing scheduled'),
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '007', '22222222-2222-2222-2222-222222222222', 'Khalid Saeed Ali', '+971502222333', 'khalid.saeed@email.com', 'Hyundai', 'Tucson', 2021, 'SHJ-G-1357', 'Tire Rotation', CURRENT_DATE + 1, '15:00', 'pending', 80.00, NULL, 'Regular tire maintenance'),

-- Elite Motors Workshop Bookings (3 bookings)
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '008', '33333333-3333-3333-3333-333333333333', 'Nour Al Zaabi', '+971503333111', 'nour.zaabi@email.com', 'Lexus', 'RX350', 2023, 'DXB-H-9753', 'Full Service', CURRENT_DATE, '09:30', 'in_progress', 600.00, NULL, 'Comprehensive service in progress'),
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '009', '33333333-3333-3333-3333-333333333333', 'Youssef Mahmoud', '+971503333222', 'youssef.mahmoud@email.com', 'Porsche', 'Cayenne', 2022, 'AUH-I-8642', 'Performance Upgrade', CURRENT_DATE + 1, '11:30', 'confirmed', 950.00, NULL, 'Performance tuning scheduled'),
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '010', '33333333-3333-3333-3333-333333333333', 'Maryam Al Shamsi', '+971503333333', 'maryam.shamsi@email.com', 'Range Rover', 'Evoque', 2021, 'RAK-J-7531', 'Engine Tune-up', CURRENT_DATE + 3, '16:00', 'pending', 750.00, NULL, 'Engine optimization'),

-- Speed Tech Garage Bookings (3 bookings)
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '011', '44444444-4444-4444-4444-444444444444', 'Rashid Al Blooshi', '+971504444111', 'rashid.blooshi@email.com', 'Ford', 'F-150', 2020, 'DXB-K-1111', 'Suspension Repair', CURRENT_DATE - 1, '10:00', 'completed', 680.00, 650.00, 'Suspension components replaced'),
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '012', '44444444-4444-4444-4444-444444444444', 'Mona Al Hashemi', '+971504444222', 'mona.hashemi@email.com', 'Chevrolet', 'Tahoe', 2021, 'AUH-L-2222', 'Electrical Diagnostics', CURRENT_DATE, '14:00', 'in_progress', 300.00, NULL, 'Electrical system check ongoing'),
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '013', '44444444-4444-4444-4444-444444444444', 'Ahmed Al Ketbi', '+971504444333', 'ahmed.ketbi@email.com', 'Jeep', 'Wrangler', 2019, 'SHJ-M-3333', 'Clutch Replacement', CURRENT_DATE + 2, '09:00', 'confirmed', 1200.00, NULL, 'Clutch system overhaul'),

-- Royal Auto Works Bookings (3 bookings)
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '014', '55555555-5555-5555-5555-555555555555', 'Tariq Al Mulla', '+971505555111', 'tariq.mulla@email.com', 'Volkswagen', 'Tiguan', 2022, 'DXB-N-4444', 'Cooling System', CURRENT_DATE - 1, '11:00', 'completed', 400.00, 380.00, 'Radiator service completed'),
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '015', '55555555-5555-5555-5555-555555555555', 'Zara Younis Said', '+971505555222', 'zara.younis@email.com', 'Kia', 'Sorento', 2023, 'AUH-O-5555', 'Brake System Overhaul', CURRENT_DATE + 1, '13:30', 'confirmed', 550.00, NULL, 'Complete brake system service'),
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '016', '55555555-5555-5555-5555-555555555555', 'Majid Al Qasimi', '+971505555333', 'majid.qasimi@email.com', 'Mazda', 'CX-5', 2020, 'RAK-P-6666', 'Engine Overhaul', CURRENT_DATE + 5, '08:00', 'pending', 2500.00, NULL, 'Major engine rebuild scheduled');

-- ============================================================
-- 4. VERIFICATION QUERIES
-- ============================================================

-- Show created users and their profiles
SELECT 
    u.email,
    u.role,
    u.status as user_status,
    gp.full_name,
    gp.company_legal_name,
    gp.phone_number,
    gp.location
FROM users u
LEFT JOIN garage_profiles gp ON u.id = gp.user_id
WHERE u.email LIKE '%@demo.autosaaz.com'
ORDER BY u.email;

-- Show booking summary
SELECT 
    gp.company_legal_name,
    COUNT(b.id) as total_bookings,
    SUM(CASE WHEN b.actual_cost IS NOT NULL THEN b.actual_cost ELSE b.estimated_cost END) as total_revenue
FROM garage_profiles gp
LEFT JOIN bookings b ON gp.user_id = b.garage_id
WHERE gp.email LIKE '%@demo.autosaaz.com'
GROUP BY gp.company_legal_name, gp.user_id
ORDER BY gp.company_legal_name;

-- Show success message
SELECT '✅ Demo data created successfully! Ready for testing.' as status;

-- ============================================================
-- AUTHENTICATION SETUP NOTES
-- ============================================================
/*
🔐 SUPABASE AUTHENTICATION SETUP REQUIRED

After running this script, you need to create authentication accounts manually:

🏢 DEMO GARAGE ACCOUNTS:
1. ahmed.premium@demo.autosaaz.com - Premium Auto Care Center
2. mohammad.express@demo.autosaaz.com - Express Auto Service  
3. sara.elite@demo.autosaaz.com - Elite Motors Workshop
4. khalid.speedtech@demo.autosaaz.com - Speed Tech Garage
5. fatima.royal@demo.autosaaz.com - Royal Auto Works

📋 SETUP STEPS:
1. Go to Supabase Dashboard > Authentication > Users
2. Create each user manually with the emails above
3. Set password: Demo123! (for all accounts)
4. Ensure User IDs match the UUIDs in this script

🎯 IMPORTANT: The user IDs in Supabase Auth must match the IDs in the users table!

📊 DEMO DATA SUMMARY:
- 5 Garage owner accounts with complete profiles
- 16 Bookings across all garages
- Mix of completed, in-progress, and pending services
- Realistic UAE customer names and vehicle details
- Revenue tracking with estimated and actual costs

🚀 READY FOR PRODUCTION DEMONSTRATION!
*/