# Seed sample data for a Garage Owner

This guide provides a single, data-only SQL you can run in Supabase to populate the Dashboard widgets for a specific garage owner:
- Bookings (mix of pending/confirmed/in_progress/completed/cancelled)
- Appointments (pending/confirmed/in_progress/completed/no_show)
- Inspections (pending/in_progress/completed)
- Resolution Center (Disputes: new/open and resolved)

It does not modify schema; it only inserts rows.

## Target user

Use the garage owner id below (replace if needed):

```
48a774df-6a4f-4882-9308-a2c141f3c1f2
```

## How to run

1. Open the Supabase Dashboard → SQL Editor.
2. Paste the SQL block below (choose the Disputes section that matches your schema; see notes).
3. Run the script once.
4. Refresh the Garage Dashboard and pages.

## SQL (copy-paste)

```sql
-- Bookings (5 samples: pending, confirmed, in_progress, completed, cancelled)
INSERT INTO bookings (
  id, booking_number, garage_id, customer_name, customer_phone, customer_email,
  service_type, service_description, booking_date, scheduled_time,
  vehicle_make, vehicle_model, vehicle_year, vehicle_plate_number,
  estimated_cost, actual_cost, status, payment_status, completion_date,
  assigned_technician, notes, internal_notes
) VALUES
  (uuid_generate_v4(), 'BK-1101', '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Ali Raza', '050-1111111', 'ali.raza@example.com',
   'Oil Change', 'Engine oil + filter', CURRENT_DATE - INTERVAL '2 day', '10:00',
   'Toyota', 'Corolla', 2018, 'ABC-1234', 200, NULL, 'pending', 'pending', NULL, NULL, 'Prefers morning slot', NULL),
  (uuid_generate_v4(), 'BK-1102', '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Sara Khan', '050-2222222', 'sara.khan@example.com',
   'Brake Service', 'Front pads replacement', CURRENT_DATE - INTERVAL '1 day', '14:00',
   'Honda', 'Civic', 2019, 'DEF-5678', 450, NULL, 'confirmed', 'pending', NULL, 'Waqas', NULL, 'Urgent squeaking reported'),
  (uuid_generate_v4(), 'BK-1103', '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'John Doe', '050-3333333', 'john.doe@example.com',
   'AC Repair', 'AC gas refill + check', CURRENT_DATE, '11:30',
   'Nissan', 'Altima', 2017, 'GHI-9012', 350, NULL, 'in_progress', 'partial', NULL, 'Ahmed', 'Leak suspected', NULL),
  (uuid_generate_v4(), 'BK-1104', '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Maryam Ali', '050-4444444', 'maryam.ali@example.com',
   'Battery', 'Battery replacement + test', CURRENT_DATE - INTERVAL '3 day', '09:15',
   'Hyundai', 'Elantra', 2020, 'JKL-3456', 500, 520, 'completed', 'paid', NOW() - INTERVAL '2 day', 'Bilal', 'Replaced with 70Ah battery', 'Old battery kept'),
  (uuid_generate_v4(), 'BK-1105', '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Imran Qureshi', '050-5555555', 'imran.q@example.com',
   'Detailing', 'Interior deep clean', CURRENT_DATE + INTERVAL '1 day', '13:00',
   'Kia', 'Sportage', 2021, 'MNO-7890', 300, NULL, 'cancelled', 'refunded', NULL, NULL, 'Cancelled by phone', 'Refund processed');

-- Appointments (5 samples: pending, confirmed, in_progress, completed, no_show)
INSERT INTO appointments (
  id, appointment_number, garage_owner_id, customer_name, customer_phone, customer_email,
  vehicle_make, vehicle_model, vehicle_year, vehicle_plate_number,
  service_type, service_description, appointment_date, scheduled_time,
  status, priority, estimated_duration, estimated_cost, actual_cost,
  assigned_technician, completion_date, notes, internal_notes
) VALUES
  (uuid_generate_v4(), 'AP-2101', '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Ahmed Ali', '052-1111111', 'ahmed.ali@example.com',
   'Toyota', 'Yaris', 2016, 'XYZ-1001', 'General Service', '10k km service',
   NOW() + INTERVAL '1 day', '10:00', 'pending', 'normal', 90, 250, NULL, NULL, NULL, 'Leave car by 9:30', NULL),
  (uuid_generate_v4(), 'AP-2102', '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Fatima Noor', '052-2222222', 'fatima.noor@example.com',
   'Mazda', '3', 2018, 'XYZ-1002', 'Tyre Rotation', 'Rotate + balance',
   NOW() + INTERVAL '2 day', '11:30', 'confirmed', 'normal', 45, 120, NULL, 'Waqas', NULL, NULL, NULL),
  (uuid_generate_v4(), 'AP-2103', '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Bilal Khan', '052-3333333', 'bilal.khan@example.com',
   'Ford', 'Focus', 2015, 'XYZ-1003', 'Diagnostics', 'Engine check light',
   NOW() - INTERVAL '2 hour', '15:00', 'in_progress', 'high', 60, 180, NULL, 'Ahmed', NULL, 'Scanning in progress', NULL),
  (uuid_generate_v4(), 'AP-2104', '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Zainab Shah', '052-4444444', 'zainab.shah@example.com',
   'Chevrolet', 'Cruze', 2014, 'XYZ-1004', 'Brake Check', 'Pad thickness & discs',
   NOW() - INTERVAL '1 day', '12:15', 'completed', 'normal', 50, 150, 155, 'Bilal', NOW() - INTERVAL '1 day', 'Pads OK, discs worn 30%', 'Recheck in 3 months'),
  (uuid_generate_v4(), 'AP-2105', '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Hina Saeed', '052-5555555', 'hina.saeed@example.com',
   'BMW', '320i', 2017, 'XYZ-1005', 'Detailing', 'Exterior polish',
   NOW() - INTERVAL '3 day', '16:00', 'no_show', 'low', 120, 400, NULL, NULL, NULL, 'Did not attend', 'Follow-up pending');

-- Inspections (5 samples: 2 pending, 1 in_progress, 2 completed)
INSERT INTO inspections (
  id, inspection_number, garage_owner_id, customer_name, customer_phone, customer_email,
  vehicle_make, vehicle_model, vehicle_year, vehicle_plate_number,
  inspection_date, scheduled_time, assigned_technician, status, priority, tasks,
  findings, recommendations, internal_notes, estimated_cost, actual_cost,
  created_at, updated_at, completed_at
) VALUES
  (uuid_generate_v4(), 'IN-3101', '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Omar Aziz', '055-1111111', 'omar.aziz@example.com',
   'Toyota', 'Camry', 2017, 'INS-1001', CURRENT_DATE, '09:30', 'Ali', 'pending', 'normal', '[]',
   NULL, NULL, NULL, 120, NULL, NOW(), NOW(), NULL),
  (uuid_generate_v4(), 'IN-3102', '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Ayesha Malik', '055-2222222', 'ayesha.malik@example.com',
   'Hyundai', 'Sonata', 2018, 'INS-1002', CURRENT_DATE + INTERVAL '1 day', '10:15', 'Ahmed', 'pending', 'urgent', '[{"task":"Brake check"}]',
   NULL, NULL, 'Vibration reported', 200, NULL, NOW(), NOW(), NULL),
  (uuid_generate_v4(), 'IN-3103', '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Salman Iqbal', '055-3333333', 'salman.iqbal@example.com',
   'Honda', 'Accord', 2016, 'INS-1003', CURRENT_DATE - INTERVAL '1 day', '11:00', 'Bilal', 'in_progress', 'high', '[{"task":"Suspension"}]',
   'Front shocks worn', NULL, NULL, 350, NULL, NOW() - INTERVAL '1 day', NOW(), NULL),
  (uuid_generate_v4(), 'IN-3104', '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Khalid Mehmood', '055-4444444', 'khalid.m@example.com',
   'Nissan', 'X-Trail', 2015, 'INS-1004', CURRENT_DATE - INTERVAL '2 day', '14:30', 'Waqas', 'completed', 'normal', '[{"task":"AC"}]',
   'Low gas', 'Refilled', NULL, 180, 185, NOW() - INTERVAL '2 day', NOW() - INTERVAL '2 day', NOW() - INTERVAL '2 day'),
  (uuid_generate_v4(), 'IN-3105', '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Usman Tariq', '055-5555555', 'usman.tariq@example.com',
   'Kia', 'Cerato', 2019, 'INS-1005', CURRENT_DATE - INTERVAL '5 day', '15:45', 'Ali', 'completed', 'normal', '[{"task":"Electrical"}]',
   'Weak battery', 'Replace soon', 'Voltage drop recorded', 100, 100, NOW() - INTERVAL '5 day', NOW() - INTERVAL '5 day', NOW() - INTERVAL '5 day');

-- Resolution Center (use ONE of the two blocks below, depending on your schema)
-- If you have disputes / dispute_messages (new naming):
INSERT INTO disputes (
  id, garage_id, contact_name, contact_email, subject, message, source, status, created_at, updated_at
) VALUES
  (uuid_generate_v4(), '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Benedict Chiu', 'benedictchiu12@gmail.com',
   'Incorrect charge on invoice', 'Charged extra 200 AED compared to quote.', 'garage-portal', 'open', NOW() - INTERVAL '3 day', NOW() - INTERVAL '3 day'),
  (uuid_generate_v4(), '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Benedict Chiu', 'benedictchiu12@gmail.com',
   'Part quality issue', 'Received part seems defective on arrival.', 'garage-portal', 'open', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  (uuid_generate_v4(), '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Benedict Chiu', 'benedictchiu12@gmail.com',
   'Late delivery concern', 'Resolved: shipping delay acknowledged and compensated.', 'garage-portal', 'resolved', NOW() - INTERVAL '7 day', NOW() - INTERVAL '2 day'),
  (uuid_generate_v4(), '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Benedict Chiu', 'benedictchiu12@gmail.com',
   'Refund not reflected', 'Resolved: refund processed, bank confirmation sent.', 'garage-portal', 'resolved', NOW() - INTERVAL '10 day', NOW() - INTERVAL '4 day');

-- If you still have support_tickets / support_ticket_messages (legacy naming), run this instead:
-- INSERT INTO support_tickets (
--   id, garage_id, contact_name, contact_email, subject, message, source, status, created_at, updated_at
-- ) VALUES
--   (uuid_generate_v4(), '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Benedict Chiu', 'benedictchiu12@gmail.com',
--    'Incorrect charge on invoice', 'Charged extra 200 AED compared to quote.', 'garage-portal', 'open', NOW() - INTERVAL '3 day', NOW() - INTERVAL '3 day'),
--   (uuid_generate_v4(), '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Benedict Chiu', 'benedictchiu12@gmail.com',
--    'Part quality issue', 'Received part seems defective on arrival.', 'garage-portal', 'open', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
--   (uuid_generate_v4(), '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Benedict Chiu', 'benedictchiu12@gmail.com',
--    'Late delivery concern', 'Resolved: shipping delay acknowledged and compensated.', 'garage-portal', 'resolved', NOW() - INTERVAL '7 day', NOW() - INTERVAL '2 day'),
--   (uuid_generate_v4(), '48a774df-6a4f-4882-9308-a2c141f3c1f2', 'Benedict Chiu', 'benedictchiu12@gmail.com',
--    'Refund not reflected', 'Resolved: refund processed, bank confirmation sent.', 'garage-portal', 'resolved', NOW() - INTERVAL '10 day', NOW() - INTERVAL '4 day');
```

## Verification checklist

- Bookings: counts show across multiple statuses; at least one completed for revenue widgets.
- Appointments: a mix of statuses; one completed and one no_show present.
- Inspections: at least two pending and two completed; one in_progress.
- Resolution Center: two open (new) and two resolved; Case IDs (DSP###) will appear if your schema uses `disputes` and the code trigger is present; otherwise, IDs display.

## Notes

- If your schema already uses `disputes` and `dispute_messages`, use the Disputes block as-is.
- If you still have `support_tickets`, use the legacy block.
- You can rerun with different IDs or numbers if needed; ensure booking/appointment/inspection numbers remain unique.
