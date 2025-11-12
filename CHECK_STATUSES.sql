-- Check actual status values in bookings table
SELECT 
  id,
  booking_number,
  status,
  LENGTH(status) as status_length,
  customer_name,
  created_at
FROM bookings
ORDER BY created_at DESC
LIMIT 10;

-- Count bookings by status
SELECT 
  status,
  LENGTH(status) as status_length,
  COUNT(*) as count
FROM bookings
GROUP BY status
ORDER BY count DESC;

-- Check for whitespace issues
SELECT 
  DISTINCT status,
  LENGTH(status) as length,
  ASCII(SUBSTRING(status, 1, 1)) as first_char_ascii,
  ASCII(SUBSTRING(status, LENGTH(status), 1)) as last_char_ascii
FROM bookings;
