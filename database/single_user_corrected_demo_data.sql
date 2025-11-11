-- ============================================================
-- DEMO DATA FOR SINGLE USER - CORRECTED VERSION
-- User ID: 09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e
-- Based on working corrected_demo_data.sql format
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. CREATE GARAGE PROFILE FOR EXISTING USER
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
) VALUES (
    '09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e',
    'Ahmed Al Farisi',
    'ahmed.farisi@demo.autosaaz.com',
    '+971507889900',
    'Al Wasl Road, Jumeirah 1, Dubai, UAE',
    'Al Wasl Road',
    'Dubai',
    'Jumeirah 1',
    'Farisi Premium Auto Care LLC',
    'DXB-GAR-2025-100',
    'garage_owner',
    'verified',
    true,
    true,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '12 days',
    NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone_number = EXCLUDED.phone_number,
    company_legal_name = EXCLUDED.company_legal_name,
    updated_at = NOW();

-- ============================================================
-- 2. CREATE BOOKINGS FOR THIS USER
-- ============================================================

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

-- Completed booking
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '901', '09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e', 'Dr. Mahmoud Al Farisi', '+971507771234', 'mahmoud.farisi@email.com', 'Tesla', 'Model S', 2022, 'DXB-T-9001', 'Battery Diagnostics', CURRENT_DATE - 3, '09:00', 'completed', 1200.00, 1150.00, 'Battery optimization completed successfully'),

-- In progress booking
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '902', '09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e', 'Laila Bin Rashid', '+971509998877', 'laila.binrashid@email.com', 'Jaguar', 'F-PACE', 2021, 'AUH-J-9002', 'Suspension Service', CURRENT_DATE, '11:00', 'in_progress', 900.00, NULL, 'Air suspension system maintenance ongoing'),

-- Confirmed bookings
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '903', '09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e', 'Khalifa Al Nuaimi', '+971502334455', 'khalifa.nuaimi@email.com', 'Bentley', 'Continental GT', 2023, 'SHJ-B-9003', 'Engine Service', CURRENT_DATE + 1, '14:00', 'confirmed', 2500.00, NULL, 'Annual premium engine service'),

('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '904', '09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e', 'Mariam Al Dhaheri', '+971506677889', 'mariam.dhaheri@email.com', 'Maserati', 'Levante', 2020, 'RAK-M-9004', 'Brake System Upgrade', CURRENT_DATE + 3, '10:00', 'confirmed', 1800.00, NULL, 'Performance brake pads installation'),

-- Pending bookings
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '905', '09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e', 'Abdullah Al Mansoori', '+971504445566', 'abdullah.mansoori@email.com', 'Ferrari', '488 GTB', 2022, 'DXB-F-9005', 'Transmission Repair', CURRENT_DATE + 2, '08:00', 'pending', 3500.00, NULL, 'Gearbox issue reported - urgent repair needed'),

('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '906', '09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e', 'Fatima Al Zahra', '+971501122334', 'fatima.zahra@email.com', 'Lamborghini', 'Huracan', 2021, 'AUH-L-9006', 'Performance Tuning', CURRENT_DATE + 5, '15:00', 'pending', 4200.00, NULL, 'Custom ECU tuning requested'),

('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '907', '09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e', 'Omar Al Rashid', '+971505556677', 'omar.rashid@email.com', 'Porsche', '911 Turbo S', 2023, 'SHJ-P-9007', 'Oil Change Premium', CURRENT_DATE + 1, '12:00', 'confirmed', 350.00, NULL, 'Synthetic oil change with filter');

-- ============================================================
-- 3. VERIFICATION QUERIES
-- ============================================================

-- Show the created garage profile
SELECT 
    gp.full_name,
    gp.company_legal_name,
    gp.email,
    gp.phone_number,
    gp.location,
    gp.status
FROM garage_profiles gp
WHERE gp.user_id = '09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e';

-- Show bookings summary
SELECT 
    'Bookings' as data_type,
    COUNT(*) as total_count,
    SUM(CASE WHEN actual_cost IS NOT NULL THEN actual_cost ELSE estimated_cost END) as total_revenue,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
FROM bookings 
WHERE garage_id = '09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e';

-- Success message
SELECT '✅ Demo data created successfully for user 09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e!' as status;

-- ============================================================
-- SUMMARY OF CREATED DATA
-- ============================================================
/*
📊 DEMO DATA SUMMARY FOR USER: 09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e

🏢 GARAGE PROFILE:
   • Company: Farisi Premium Auto Care LLC
   • Owner: Ahmed Al Farisi  
   • Email: ahmed.farisi@demo.autosaaz.com
   • Phone: +971507889900
   • Location: Jumeirah 1, Dubai

📅 BOOKINGS: 7 total
   • 1 Completed (Tesla Model S - AED 1,150)
   • 1 In Progress (Jaguar F-PACE - AED 900)
   • 3 Confirmed (Bentley, Maserati, Porsche - AED 4,650)
   • 2 Pending (Ferrari, Lamborghini - AED 7,700)
   • Total Revenue: AED 14,400

💰 TOTAL ESTIMATED REVENUE: AED 14,400

🎯 READY FOR TESTING AND DEMONSTRATION!

🔐 AUTHENTICATION NOTE:
   The password for this user should be set manually in Supabase Auth as: Demo123!
*/