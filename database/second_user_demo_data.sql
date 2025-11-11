-- ============================================================
-- DEMO DATA FOR SECOND USER
-- User ID: 626a153d-53b6-42c6-ab7f-438b995e2f11
-- Creates complete garage profile with bookings, appointments, and inspections
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. CREATE GARAGE PROFILE FOR SECOND USER
-- ============================================================

INSERT INTO garage_profiles (
    user_id,
    full_name,
    company_legal_name,
    email,
    phone_number,
    location,
    status
) VALUES (
    '626a153d-53b6-42c6-ab7f-438b995e2f11',
    'Khalid Al Mansouri',
    'Al Mansouri Elite Motors LLC',
    'khalid.mansouri@demo.autosaaz.com',
    '+971504567890',
    'Business Bay, Dubai',
    'active'
);

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

-- Completed bookings
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '1001', '626a153d-53b6-42c6-ab7f-438b995e2f11', 'Sheikha Al Qasimi', '+971506789012', 'sheikha.qasimi@email.com', 'Mercedes', 'S-Class Maybach', 2023, 'SHJ-MB-1001', 'Full Service Package', CURRENT_DATE - 5, '10:00', 'completed', 2800.00, 2650.00, 'Complete luxury service with interior detailing'),

('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '1002', '626a153d-53b6-42c6-ab7f-438b995e2f11', 'Tariq Al Habtoor', '+971507890123', 'tariq.habtoor@email.com', 'BMW', 'X7 M50i', 2022, 'DXB-BMW-1002', 'Brake System Overhaul', CURRENT_DATE - 2, '14:00', 'completed', 1850.00, 1800.00, 'Premium brake pads and rotors replaced'),

-- In progress bookings
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '1003', '626a153d-53b6-42c6-ab7f-438b995e2f11', 'Amira Al Zaabi', '+971508901234', 'amira.zaabi@email.com', 'Audi', 'Q8 RS', 2023, 'AUH-Q8-1003', 'Performance Upgrade', CURRENT_DATE, '09:00', 'in_progress', 3200.00, NULL, 'ECU tuning and exhaust system upgrade in progress'),

('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '1004', '626a153d-53b6-42c6-ab7f-438b995e2f11', 'Hassan Al Maktoum', '+971509012345', 'hassan.maktoum@email.com', 'Porsche', 'Cayenne Turbo GT', 2022, 'DXB-CAY-1004', 'Transmission Service', CURRENT_DATE, '13:00', 'in_progress', 2100.00, NULL, 'PDK transmission maintenance and software update'),

-- Confirmed bookings
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '1005', '626a153d-53b6-42c6-ab7f-438b995e2f11', 'Latifa Al Shamsi', '+971500123456', 'latifa.shamsi@email.com', 'Range Rover', 'Autobiography', 2023, 'RAK-RR-1005', 'Air Suspension Repair', CURRENT_DATE + 1, '11:00', 'confirmed', 1650.00, NULL, 'Air suspension malfunction - requires complete system check'),

('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '1006', '626a153d-53b6-42c6-ab7f-438b995e2f11', 'Saif Al Ketbi', '+971501234567', 'saif.ketbi@email.com', 'Maserati', 'Quattroporte Trofeo', 2022, 'AUH-QT-1006', 'Engine Diagnostics', CURRENT_DATE + 2, '15:00', 'confirmed', 1200.00, NULL, 'Check engine light - comprehensive diagnostics needed'),

('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '1007', '626a153d-53b6-42c6-ab7f-438b995e2f11', 'Nora Al Blooshi', '+971502345678', 'nora.blooshi@email.com', 'Bentley', 'Bentayga Speed', 2023, 'SHJ-BT-1007', 'Preventive Maintenance', CURRENT_DATE + 3, '08:00', 'confirmed', 2200.00, NULL, 'Scheduled 20,000km service'),

-- Pending bookings
('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '1008', '626a153d-53b6-42c6-ab7f-438b995e2f11', 'Ahmed Al Nuaimi', '+971503456789', 'ahmed.nuaimi@email.com', 'Jaguar', 'F-Type SVR', 2021, 'DXB-JAG-1008', 'Supercharger Service', CURRENT_DATE + 4, '12:00', 'pending', 2800.00, NULL, 'Supercharger maintenance and performance optimization'),

('BK' || EXTRACT(EPOCH FROM NOW())::BIGINT || '1009', '626a153d-53b6-42c6-ab7f-438b995e2f11', 'Maryam Al Dhaheri', '+971504567890', 'maryam.dhaheri@email.com', 'Lexus', 'LX 600', 2023, 'RAK-LX-1009', 'Hybrid System Check', CURRENT_DATE + 6, '10:00', 'pending', 1400.00, NULL, 'Hybrid battery diagnostics and system optimization');

-- ============================================================
-- 3. CREATE APPOINTMENTS FOR THIS USER
-- ============================================================

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
('APT' || EXTRACT(EPOCH FROM NOW())::BIGINT || '1001', '626a153d-53b6-42c6-ab7f-438b995e2f11', 'Rashed Al Mulla', '+971505678901', 'rashed.mulla@email.com', 'Ferrari', 'SF90 Stradale', 2023, 'DXB-SF90-1001', 'Performance Consultation', CURRENT_DATE + 1, 'confirmed', 'Track day preparation and performance optimization'),

('APT' || EXTRACT(EPOCH FROM NOW())::BIGINT || '1002', '626a153d-53b6-42c6-ab7f-438b995e2f11', 'Hala Al Rashid', '+971506789012', 'hala.rashid@email.com', 'Lamborghini', 'Urus Performante', 2023, 'AUH-LP-1002', 'Pre-Purchase Inspection', CURRENT_DATE + 3, 'pending', 'Comprehensive inspection for potential purchase'),

('APT' || EXTRACT(EPOCH FROM NOW())::BIGINT || '1003', '626a153d-53b6-42c6-ab7f-438b995e2f11', 'Khalifa Al Suwaidi', '+971507890123', 'khalifa.suwaidi@email.com', 'McLaren', '765LT Spider', 2022, 'SHJ-765-1003', 'Custom Modification Quote', CURRENT_DATE + 5, 'confirmed', 'Carbon fiber aerodynamics package installation'),

('APT' || EXTRACT(EPOCH FROM NOW())::BIGINT || '1004', '626a153d-53b6-42c6-ab7f-438b995e2f11', 'Dana Al Mansoori', '+971508901234', 'dana.mansoori@email.com', 'Rolls Royce', 'Cullinan Black Badge', 2023, 'RAK-CUL-1004', 'Warranty Service Review', CURRENT_DATE + 7, 'pending', 'Review warranty coverage and service history');

-- ============================================================
-- 4. CREATE INSPECTIONS FOR THIS USER
-- ============================================================

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

-- Completed inspections
('INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '1001', '626a153d-53b6-42c6-ab7f-438b995e2f11', 'Sultan Al Qasimi', '+971509012345', 'sultan.qasimi@email.com', 'Aston Martin', 'DBS Superleggera', 2022, 'SHJ-DBS-1001', CURRENT_DATE - 3, 'Khalid Al Mansouri', 'completed', '["V12 engine analysis", "Carbon ceramic brake inspection", "Suspension geometry check", "Electrical system diagnostics"]'::jsonb, 950.00, 900.00, 'Exceptional condition. Minor software update applied. All performance parameters within specifications.', 'Next inspection recommended in 8 months or 12,000km. Consider track-focused brake fluid upgrade.', 'Collector vehicle - maintain detailed service records'),

('INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '1002', '626a153d-53b6-42c6-ab7f-438b995e2f11', 'Yousef Al Habtoor', '+971500123456', 'yousef.habtoor@email.com', 'BMW', 'M5 Competition', 2023, 'DXB-M5C-1002', CURRENT_DATE - 1, 'Omar Al Zaabi', 'completed', '["S63 twin-turbo V8 inspection", "M xDrive system check", "Active M differential analysis", "Performance exhaust evaluation"]'::jsonb, 800.00, 780.00, 'Vehicle in excellent condition. All M-specific systems operating optimally.', 'Maintain aggressive driving mode settings. Schedule next inspection at 15,000km.', 'High-performance daily driver - monitor tire wear closely'),

-- In progress inspections
('INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '1003', '626a153d-53b6-42c6-ab7f-438b995e2f11', 'Reem Al Shamsi', '+971501234567', 'reem.shamsi@email.com', 'Porsche', '911 GT3 RS', 2023, 'AUH-GT3-1003', CURRENT_DATE, 'Hassan Al Mulla', 'in_progress', '["GT3 RS engine inspection", "PDK transmission analysis", "Track-focused suspension check", "Aerodynamics package evaluation"]'::jsonb, 1100.00, NULL, NULL, NULL, 'Track-focused vehicle - comprehensive performance analysis required'),

('INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '1004', '626a153d-53b6-42c6-ab7f-438b995e2f11', 'Marwan Al Ketbi', '+971502345678', 'marwan.ketbi@email.com', 'Mercedes', 'AMG GT Black Series', 2022, 'RAK-GT-1004', CURRENT_DATE, 'Ahmad Al Zaabi', 'in_progress', '["Hand-built V8 biturbo inspection", "Race-derived suspension analysis", "Carbon fiber body evaluation", "Track telemetry system check"]'::jsonb, 1300.00, NULL, NULL, NULL, 'Limited edition vehicle - specialized inspection protocols'),

-- Scheduled inspections
('INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '1005', '626a153d-53b6-42c6-ab7f-438b995e2f11', 'Fatima Al Nuaimi', '+971503456789', 'fatima.nuaimi@email.com', 'Bentley', 'Continental GT Speed', 2023, 'DXB-CGT-1005', CURRENT_DATE + 2, 'Omar Al Zaabi', 'pending', '["W12 engine comprehensive check", "All-wheel drive system test", "Luxury interior inspection", "Infotainment system diagnostics"]'::jsonb, 850.00, NULL, NULL, NULL, 'Luxury grand tourer - focus on comfort and performance balance'),

('INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '1006', '626a153d-53b6-42c6-ab7f-438b995e2f11', 'Abdullah Al Blooshi', '+971504567890', 'abdullah.blooshi@email.com', 'Range Rover', 'Sport SVR Carbon Edition', 2023, 'SHJ-SVR-1006', CURRENT_DATE + 4, 'Hassan Al Mulla', 'pending', '["Supercharged V8 analysis", "Terrain response system test", "Carbon fiber components check", "Air suspension calibration"]'::jsonb, 750.00, NULL, NULL, NULL, 'Performance SUV - comprehensive capability assessment needed');

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
WHERE gp.user_id = '626a153d-53b6-42c6-ab7f-438b995e2f11';

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
WHERE garage_id = '626a153d-53b6-42c6-ab7f-438b995e2f11';

-- Show appointments summary
SELECT 
    'Appointments' as data_type,
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
FROM appointments 
WHERE garage_owner_id = '626a153d-53b6-42c6-ab7f-438b995e2f11';

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
WHERE garage_owner_id = '626a153d-53b6-42c6-ab7f-438b995e2f11';

-- Success message
SELECT '✅ Demo data created successfully for user 626a153d-53b6-42c6-ab7f-438b995e2f11!' as status;

-- ============================================================
-- SUMMARY OF CREATED DATA
-- ============================================================
/*
📊 DEMO DATA SUMMARY FOR USER: 626a153d-53b6-42c6-ab7f-438b995e2f11

🏢 GARAGE PROFILE:
   • Company: Al Mansouri Elite Motors LLC
   • Owner: Khalid Al Mansouri  
   • Email: khalid.mansouri@demo.autosaaz.com
   • Phone: +971504567890
   • Location: Business Bay, Dubai

📅 BOOKINGS: 9 total
   • 2 Completed (Mercedes Maybach, BMW X7 - AED 4,450)
   • 2 In Progress (Audi Q8 RS, Porsche Cayenne - AED 5,300)
   • 3 Confirmed (Range Rover, Maserati, Bentley - AED 5,050)
   • 2 Pending (Jaguar F-Type, Lexus LX - AED 4,200)
   • Total Revenue: AED 19,000

📋 APPOINTMENTS: 4 total
   • 2 Confirmed (Ferrari SF90, McLaren 765LT)
   • 2 Pending (Lamborghini Urus, Rolls Royce Cullinan)

🔍 INSPECTIONS: 6 total
   • 2 Completed (Aston Martin DBS, BMW M5 - AED 1,680)
   • 2 In Progress (Porsche GT3 RS, Mercedes AMG GT - AED 2,400)
   • 2 Scheduled (Bentley Continental, Range Rover SVR - AED 1,600)
   • Total Revenue: AED 5,680

💰 TOTAL ESTIMATED REVENUE: AED 24,680

🎯 READY FOR TESTING AND DEMONSTRATION!
*/