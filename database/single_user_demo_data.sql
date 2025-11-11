-- ============================================================
-- DEMO DATA FOR SINGLE USER
-- User ID: 09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e
-- Creates complete garage profile with bookings, appointments, and inspections
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
-- 3. CREATE APPOINTMENTS FOR THIS USER
-- ============================================================

-- Check if appointments table exists, if not, create it
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
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
    status,
    notes
) VALUES 

-- Consultation appointments
('APT' || EXTRACT(EPOCH FROM NOW())::BIGINT || '901', '09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e', 'Rashid Al Blooshi', '+971508881122', 'rashid.blooshi@email.com', 'McLaren', '720S', 2022, 'DXB-MC-901', 'Performance Consultation', CURRENT_DATE + 2, 'confirmed', 'Track preparation consultation'),

('APT' || EXTRACT(EPOCH FROM NOW())::BIGINT || '902', '09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e', 'Noor Al Shamsi', '+971507773344', 'noor.shamsi@email.com', 'Aston Martin', 'DB11', 2021, 'AUH-AM-902', 'Damage Assessment', CURRENT_DATE + 4, 'pending', 'Insurance claim evaluation'),

('APT' || EXTRACT(EPOCH FROM NOW())::BIGINT || '903', '09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e', 'Salem Al Ketbi', '+971509994455', 'salem.ketbi@email.com', 'Rolls Royce', 'Ghost', 2023, 'RAK-RR-903', 'Custom Modification Quote', CURRENT_DATE + 6, 'confirmed', 'Luxury interior customization');

-- ============================================================
-- 4. CREATE INSPECTIONS FOR THIS USER
-- ============================================================

-- Check if inspections table exists, if not, create it based on schema
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
    assigned_technician VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
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
    assigned_technician,
    status,
    tasks,
    estimated_cost,
    actual_cost,
    findings,
    recommendations,
    internal_notes
) VALUES 

-- Completed inspection
('INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '901', '09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e', 'Saeed Al Mansoori', '+971507112233', 'saeed.mansoori@email.com', 'BMW', 'M8 Competition', 2022, 'DXB-BMW-901', CURRENT_DATE - 2, 'Ahmad Al Zaabi', 'completed', '["Engine performance check", "Brake system inspection", "Suspension analysis", "Electrical diagnostics"]'::jsonb, 800.00, 750.00, 'All systems performing optimally. Minor software update applied.', 'Recommend next inspection in 6 months or 15,000km.', 'VIP customer - premium service level'),

-- In progress inspection
('INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '902', '09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e', 'Amina Al Rashid', '+971508223344', 'amina.rashid@email.com', 'Mercedes', 'AMG GT 63S', 2023, 'AUH-AMG-902', CURRENT_DATE, 'Hassan Al Mulla', 'in_progress', '["Transmission diagnostics", "Turbocharger inspection", "Cooling system check", "Performance mapping"]'::jsonb, 1200.00, NULL, NULL, NULL, 'High-performance vehicle - detailed inspection required'),

-- Scheduled inspections
('INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '903', '09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e', 'Khalil Al Nuaimi', '+971509334455', 'khalil.nuaimi@email.com', 'Audi', 'RS6 Avant', 2021, 'SHJ-RS6-903', CURRENT_DATE + 1, 'Omar Khalil', 'pending', '["Pre-purchase inspection", "Engine compression test", "All-wheel drive system check", "Interior and exterior evaluation"]'::jsonb, 650.00, NULL, NULL, NULL, 'Pre-purchase inspection for potential buyer'),

('INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '904', '09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e', 'Layla Al Dhaheri', '+971506445566', 'layla.dhaheri@email.com', 'Range Rover', 'Sport SVR', 2022, 'RAK-RRS-904', CURRENT_DATE + 3, 'Ahmad Al Zaabi', 'pending', '["Off-road capability assessment", "Air suspension calibration", "Terrain response system test", "Engine performance analysis"]'::jsonb, 750.00, NULL, NULL, NULL, 'Customer planning desert expedition');

-- ============================================================
-- 5. VERIFICATION AND SUMMARY
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

-- Show appointments summary
SELECT 
    'Appointments' as data_type,
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
FROM appointments 
WHERE garage_owner_id = '09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e';

-- Show inspections summary
SELECT 
    'Inspections' as data_type,
    COUNT(*) as total_count,
    SUM(CASE WHEN actual_cost IS NOT NULL THEN actual_cost ELSE estimated_cost END) as total_revenue,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed
FROM inspections 
WHERE garage_owner_id = '09ff6bcb-3750-49e0-bee0-b77dcb4f4d4e';

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

📋 APPOINTMENTS: 3 total
   • 2 Confirmed (McLaren, Rolls Royce)
   • 1 Pending (Aston Martin)

🔍 INSPECTIONS: 4 total
   • 1 Completed (BMW M8 - AED 750)
   • 1 In Progress (Mercedes AMG GT - AED 1,200)
   • 2 Scheduled (Audi RS6, Range Rover - AED 1,400)
   • Total Revenue: AED 3,350

💰 TOTAL ESTIMATED REVENUE: AED 17,750

🎯 READY FOR TESTING AND DEMONSTRATION!
*/