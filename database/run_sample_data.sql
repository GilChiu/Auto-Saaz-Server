-- ============================================================
-- RUN THIS SCRIPT IN YOUR SUPABASE SQL EDITOR
-- ============================================================

-- Step 1: Run the appointments migration first
\i database/appointments_migration.sql

-- Step 2: Insert sample data with your user ID
-- Insert sample bookings data
INSERT INTO bookings (
  booking_number,
  garage_id,
  customer_name,
  customer_phone,
  customer_email,
  service_type,
  service_description,
  booking_date,
  scheduled_time,
  vehicle_make,
  vehicle_model,
  vehicle_year,
  vehicle_plate_number,
  status,
  payment_status,
  estimated_cost,
  notes
) VALUES 
(
  'BK17053188000001',
  'ba50abf9-5210-4177-8605-b01c73b9f9f3',
  'Ali Khan',
  '+971501111111',
  'ali.khan@email.com',
  'Oil Change',
  'Regular oil change and filter replacement',
  '2025-06-10',
  '09:00',
  'Toyota',
  'Camry',
  2023,
  'DXB-A-1234',
  'in_progress',
  'pending',
  150.00,
  'Customer requested synthetic oil'
),
(
  'BK17053188000002',
  'ba50abf9-5210-4177-8605-b01c73b9f9f3',
  'Sara Malik',
  '+971502222222',
  'sara.malik@email.com',
  'AC Repair',
  'Air conditioning not cooling properly',
  '2025-06-10',
  '11:00',
  'Honda',
  'Accord',
  2022,
  'SHJ-B-5678',
  'in_progress',
  'pending',
  300.00,
  'Customer reported strange noise from AC'
),
(
  'BK17053188000003',
  'ba50abf9-5210-4177-8605-b01c73b9f9f3',
  'Hamza',
  '+971503333333',
  'hamza@email.com',
  'Oil Change',
  'Regular maintenance oil change',
  '2025-06-10',
  '13:00',
  'Nissan',
  'Altima',
  2021,
  'AUH-C-9012',
  'in_progress',
  'pending',
  120.00,
  'Vehicle due for regular service'
),
(
  'BK17053188000004',
  'ba50abf9-5210-4177-8605-b01c73b9f9f3',
  'Rehman',
  '+971504444444',
  'rehman@email.com',
  'Battery Change',
  'Battery replacement and electrical check',
  '2025-06-10',
  '15:00',
  'Ford',
  'Explorer',
  2020,
  'RAK-D-3456',
  'in_progress',
  'pending',
  250.00,
  'Customer reported starting issues'
),
(
  'BK17053188000005',
  'ba50abf9-5210-4177-8605-b01c73b9f9f3',
  'Noor',
  '+971505555555',
  'noor@email.com',
  'AC Repair',
  'Complete AC system diagnosis and repair',
  '2025-06-10',
  '17:00',
  'Chevrolet',
  'Malibu',
  2019,
  'FUJ-E-7890',
  'completed',
  'paid',
  400.00,
  'AC compressor replaced successfully'
),
(
  'BK17053188000006',
  'ba50abf9-5210-4177-8605-b01c73b9f9f3',
  'Sunny',
  '+971506666666',
  'sunny@email.com',
  'Oil Change',
  'Premium oil change service',
  '2025-06-10',
  '19:00',
  'Hyundai',
  'Elantra',
  2024,
  'DXB-F-2468',
  'completed',
  'paid',
  180.00,
  'Used premium synthetic oil as requested'
);

-- Insert sample appointments data
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
  'ba50abf9-5210-4177-8605-b01c73b9f9f3',
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
  'ba50abf9-5210-4177-8605-b01c73b9f9f3',
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
),
(
  'APT' || EXTRACT(EPOCH FROM NOW())::BIGINT || '003',
  'ba50abf9-5210-4177-8605-b01c73b9f9f3',
  'Ahmed Al Maktoum',
  '+971507777777',
  'ahmed.almaktoum@email.com',
  'Mercedes',
  'E-Class',
  2023,
  'DXB-VIP-001',
  'Tire replacement',
  'All four tires need replacement',
  NOW() + INTERVAL '3 days',
  '09:00',
  'confirmed',
  'urgent',
  180,
  800.00,
  'Premium tires requested'
),
(
  'APT' || EXTRACT(EPOCH FROM NOW())::BIGINT || '004',
  'ba50abf9-5210-4177-8605-b01c73b9f9f3',
  'Fatima Hassan',
  '+971508888888',
  'fatima.hassan@email.com',
  'Toyota',
  'Prius',
  2020,
  'SHJ-ECO-123',
  'Battery check',
  'Hybrid battery diagnostic',
  NOW() + INTERVAL '4 days',
  '11:30',
  'pending',
  'normal',
  90,
  200.00,
  'Hybrid vehicle - special care needed'
);

-- Verification queries
SELECT 'Bookings inserted:' as message, COUNT(*) as count FROM bookings WHERE garage_id = 'ba50abf9-5210-4177-8605-b01c73b9f9f3';
SELECT 'Appointments inserted:' as message, COUNT(*) as count FROM appointments WHERE garage_owner_id = 'ba50abf9-5210-4177-8605-b01c73b9f9f3';

-- Test the booking detail API
SELECT 
  id,
  booking_number,
  customer_name,
  service_type,
  status,
  booking_date
FROM bookings 
WHERE garage_id = 'ba50abf9-5210-4177-8605-b01c73b9f9f3'
ORDER BY created_at DESC;

RAISE NOTICE '✅ Sample data inserted successfully!';
RAISE NOTICE '🔄 You can now test booking detail navigation in your frontend.';
RAISE NOTICE '📋 Booking IDs: BK17053188000001, BK17053188000002, BK17053188000003, etc.';