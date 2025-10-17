-- ============================================================
-- SAMPLE DATA INSERTION FOR TESTING
-- ============================================================

-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from the users table
-- You can get your user ID by running: SELECT id FROM users WHERE email = 'your-email@example.com';

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
  'ba50abf9-5210-4177-8605-b01c73b9f9f3', -- Replace with your user ID
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
  'ba50abf9-5210-4177-8605-b01c73b9f9f3', -- Replace with your user ID
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
  'ba50abf9-5210-4177-8605-b01c73b9f9f3', -- Replace with your user ID
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
  'ba50abf9-5210-4177-8605-b01c73b9f9f3', -- Replace with your user ID
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
  'ba50abf9-5210-4177-8605-b01c73b9f9f3', -- Replace with your user ID
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
  'ba50abf9-5210-4177-8605-b01c73b9f9f3', -- Replace with your user ID
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
  'ba50abf9-5210-4177-8605-b01c73b9f9f3', -- Replace with your user ID
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
  'ba50abf9-5210-4177-8605-b01c73b9f9f3', -- Replace with your user ID
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
  'ba50abf9-5210-4177-8605-b01c73b9f9f3', -- Replace with your user ID
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
  'ba50abf9-5210-4177-8605-b01c73b9f9f3', -- Replace with your user ID
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

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Verify bookings were inserted
SELECT 
  booking_number,
  customer_name,
  service_type,
  status,
  booking_date
FROM bookings 
ORDER BY created_at DESC
LIMIT 10;

-- Verify appointments were inserted
SELECT 
  appointment_number,
  customer_name,
  service_type,
  status,
  priority,
  appointment_date
FROM appointments 
ORDER BY created_at DESC
LIMIT 10;

-- Show sample dashboard stats
SELECT 
  'Bookings' as type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
FROM bookings

UNION ALL

SELECT 
  'Appointments' as type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
FROM appointments;

-- ============================================================
-- IMPORTANT NOTE
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '⚠️  IMPORTANT: Replace YOUR_USER_ID_HERE with your actual user ID!';
  RAISE NOTICE '📝 Get your user ID by running: SELECT id FROM users WHERE email = ''your-email@example.com'';';
  RAISE NOTICE '✅ After replacing the user ID, run this script to populate sample data.';
END $$;