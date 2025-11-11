-- Seed sample operational data for garage owner
-- user: 48a774df-6a4f-4882-9308-a2c141f3c1f2 (benedictchiu12@gmail.com)
-- Populates: bookings (5), appointments (5), inspections (5), disputes (4) + messages

BEGIN;

-- convenience vars
-- (psql does not support variables natively; inline the UUID)
-- garage owner id
-- 48a774df-6a4f-4882-9308-a2c141f3c1f2

-- Bookings: pending, confirmed, in_progress, completed, cancelled
INSERT INTO bookings (
  id, booking_number, garage_id, customer_name, customer_phone, customer_email,
  service_type, service_description, booking_date, scheduled_time, vehicle_make, vehicle_model, vehicle_year, vehicle_plate_number,
  estimated_cost, actual_cost, status, payment_status, completion_date, assigned_technician, notes, internal_notes
) VALUES
  (uuid_generate_v4(), 'BK-1001', '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Ali Raza', '050-1111111', 'ali.raza@example.com',
   'Oil Change', 'Engine oil + filter', CURRENT_DATE - INTERVAL '2 day', '10:00', 'Toyota', 'Corolla', 2018, 'ABC-1234',
   200, NULL, 'pending', 'pending', NULL, NULL, 'Customer requested morning slot', NULL),
  (uuid_generate_v4(), 'BK-1002', '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Sara Khan', '050-2222222', 'sara.khan@example.com',
   'Brake Service', 'Front pads replacement', CURRENT_DATE - INTERVAL '1 day', '14:00', 'Honda', 'Civic', 2019, 'DEF-5678',
   450, NULL, 'confirmed', 'pending', NULL, 'Waqas', NULL, 'Urgent squeaking reported'),
  (uuid_generate_v4(), 'BK-1003', '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'John Doe', '050-3333333', 'john.doe@example.com',
   'AC Repair', 'AC gas refill + check', CURRENT_DATE, '11:30', 'Nissan', 'Altima', 2017, 'GHI-9012',
   350, NULL, 'in_progress', 'partial', NULL, 'Ahmed', 'Leak suspected on inspection', NULL),
  (uuid_generate_v4(), 'BK-1004', '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Maryam Ali', '050-4444444', 'maryam.ali@example.com',
   'Battery', 'Battery replacement + test', CURRENT_DATE - INTERVAL '3 day', '09:15', 'Hyundai', 'Elantra', 2020, 'JKL-3456',
   500, 520, 'completed', 'paid', NOW() - INTERVAL '2 day', 'Bilal', 'Replaced with 70Ah battery', 'Old battery kept'),
  (uuid_generate_v4(), 'BK-1005', '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Imran Qureshi', '050-5555555', 'imran.q@example.com',
   'Detailing', 'Interior deep clean', CURRENT_DATE + INTERVAL '1 day', '13:00', 'Kia', 'Sportage', 2021, 'MNO-7890',
   300, NULL, 'cancelled', 'refunded', NULL, NULL, 'Customer cancelled by phone', 'Refund processed');

-- Appointments: pending, confirmed, in_progress, completed, no_show
INSERT INTO appointments (
  id, appointment_number, garage_owner_id, customer_name, customer_phone, customer_email,
  vehicle_make, vehicle_model, vehicle_year, vehicle_plate_number,
  service_type, service_description, appointment_date, scheduled_time, status, priority,
  estimated_duration, estimated_cost, actual_cost, assigned_technician, completion_date, notes, internal_notes
) VALUES
  (uuid_generate_v4(), 'AP-2001', '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Ahmed Ali', '052-1111111', 'ahmed.ali@example.com',
   'Toyota', 'Yaris', 2016, 'XYZ-1001', 'General Service', '10k km service', NOW() + INTERVAL '1 day', '10:00', 'pending', 'normal',
   90, 250, NULL, NULL, NULL, 'Leave car by 9:30', NULL),
  (uuid_generate_v4(), 'AP-2002', '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Fatima Noor', '052-2222222', 'fatima.noor@example.com',
   'Mazda', '3', 2018, 'XYZ-1002', 'Tyre Rotation', 'Rotate + balance', NOW() + INTERVAL '2 day', '11:30', 'confirmed', 'normal',
   45, 120, NULL, 'Waqas', NULL, NULL, NULL),
  (uuid_generate_v4(), 'AP-2003', '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Bilal Khan', '052-3333333', 'bilal.khan@example.com',
   'Ford', 'Focus', 2015, 'XYZ-1003', 'Diagnostics', 'Engine check light', NOW() - INTERVAL '2 hour', '15:00', 'in_progress', 'high',
   60, 180, NULL, 'Ahmed', NULL, 'Scanning in progress', NULL),
  (uuid_generate_v4(), 'AP-2004', '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Zainab Shah', '052-4444444', 'zainab.shah@example.com',
   'Chevrolet', 'Cruze', 2014, 'XYZ-1004', 'Brake Check', 'Pad thickness & discs', NOW() - INTERVAL '1 day', '12:15', 'completed', 'normal',
   50, 150, 155, 'Bilal', NOW() - INTERVAL '1 day', 'Pads OK, discs worn 30%', 'Recommend recheck in 3 months'),
  (uuid_generate_v4(), 'AP-2005', '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Hina Saeed', '052-5555555', 'hina.saeed@example.com',
   'BMW', '320i', 2017, 'XYZ-1005', 'Detailing', 'Exterior polish', NOW() - INTERVAL '3 day', '16:00', 'no_show', 'low',
   120, 400, NULL, NULL, NULL, 'Customer did not attend', 'Follow-up pending');

-- Inspections: pending, in_progress, completed (2)
INSERT INTO inspections (
  id, inspection_number, garage_owner_id, customer_name, customer_phone, customer_email,
  vehicle_make, vehicle_model, vehicle_year, vehicle_plate_number,
  inspection_date, scheduled_time, assigned_technician, status, priority, tasks, findings, recommendations, internal_notes,
  estimated_cost, actual_cost, created_at, updated_at, completed_at
) VALUES
  (uuid_generate_v4(), 'IN-3001', '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Omar Aziz', '055-1111111', 'omar.aziz@example.com',
   'Toyota', 'Camry', 2017, 'INS-1001', CURRENT_DATE, '09:30', 'Ali', 'pending', 'normal', '[]', NULL, NULL, NULL, 120, NULL, NOW(), NOW(), NULL),
  (uuid_generate_v4(), 'IN-3002', '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Ayesha Malik', '055-2222222', 'ayesha.malik@example.com',
   'Hyundai', 'Sonata', 2018, 'INS-1002', CURRENT_DATE + INTERVAL '1 day', '10:15', 'Ahmed', 'pending', 'urgent', '[{"task":"Brake check"}]', NULL, NULL, 'Customer reports vibration', 200, NULL, NOW(), NOW(), NULL),
  (uuid_generate_v4(), 'IN-3003', '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Salman Iqbal', '055-3333333', 'salman.iqbal@example.com',
   'Honda', 'Accord', 2016, 'INS-1003', CURRENT_DATE - INTERVAL '1 day', '11:00', 'Bilal', 'in_progress', 'high', '[{"task":"Suspension"}]', 'Front shocks worn', NULL, NULL, 350, NULL, NOW() - INTERVAL '1 day', NOW(), NULL),
  (uuid_generate_v4(), 'IN-3004', '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Khalid Mehmood', '055-4444444', 'khalid.m@example.com',
   'Nissan', 'X-Trail', 2015, 'INS-1004', CURRENT_DATE - INTERVAL '2 day', '14:30', 'Waqas', 'completed', 'normal', '[{"task":"AC"}]', 'Low gas', 'Refilled', NULL, 180, 185, NOW() - INTERVAL '2 day', NOW() - INTERVAL '2 day', NOW() - INTERVAL '2 day'),
  (uuid_generate_v4(), 'IN-3005', '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Usman Tariq', '055-5555555', 'usman.tariq@example.com',
   'Kia', 'Cerato', 2019, 'INS-1005', CURRENT_DATE - INTERVAL '5 day', '15:45', 'Ali', 'completed', 'normal', '[{"task":"Electrical"}]', 'Weak battery', 'Replace soon', 'Voltage drop recorded', 100, 100, NOW() - INTERVAL '5 day', NOW() - INTERVAL '5 day', NOW() - INTERVAL '5 day');

-- Disputes (Resolution Center): two open, two resolved
INSERT INTO disputes (
  id, garage_id, contact_name, contact_email, subject, message, source, status, created_at, updated_at
) VALUES
  (uuid_generate_v4(), '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Benedict Chiu', 'benedictchiu12@gmail.com', 'Incorrect charge on invoice', 'Charged extra 200 AED compared to quote.', 'garage-portal', 'open', NOW() - INTERVAL '3 day', NOW() - INTERVAL '3 day'),
  (uuid_generate_v4(), '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Benedict Chiu', 'benedictchiu12@gmail.com', 'Part quality issue', 'Received part seems defective on arrival.', 'garage-portal', 'open', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  (uuid_generate_v4(), '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Benedict Chiu', 'benedictchiu12@gmail.com', 'Late delivery concern', 'Order arrived 2 days late.', 'garage-portal', 'resolved', NOW() - INTERVAL '7 day', NOW() - INTERVAL '2 day'),
  (uuid_generate_v4(), '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Benedict Chiu', 'benedictchiu12@gmail.com', 'Refund not reflected', 'Refund email received but not in bank.', 'garage-portal', 'resolved', NOW() - INTERVAL '10 day', NOW() - INTERVAL '4 day');

-- Minimal messages for each dispute (only from the garage owner to satisfy FK)
-- Link messages to the inserted disputes by selecting their ids deterministically using subject text
INSERT INTO dispute_messages (id, ticket_id, sender_id, body, created_at, updated_at)
SELECT uuid_generate_v4(), d.id, '48a774df-6a4f-4882-9308-a2c141f3c1f2', d.message, d.created_at, d.created_at
FROM disputes d
WHERE d.garage_id = '48a774df-6a4f-4882-9308-a2c141f3c1f2'
  AND d.subject IN ('Incorrect charge on invoice','Part quality issue','Late delivery concern','Refund not reflected');

-- For resolved disputes, update message to include a resolution summary
UPDATE disputes
SET message = CASE subject
  WHEN 'Late delivery concern' THEN 'Resolved: shipping delay acknowledged and compensated.'
  WHEN 'Refund not reflected' THEN 'Resolved: refund processed, bank confirmation sent.'
  ELSE message
END
WHERE garage_id = '48a774df-6a4f-4882-9308-a2c141f3c1f2' AND status = 'resolved';

COMMIT;
