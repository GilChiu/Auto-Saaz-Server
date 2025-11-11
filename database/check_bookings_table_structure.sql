-- Check the actual structure of the bookings table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;

-- Also check if there are any existing bookings
SELECT COUNT(*) as booking_count FROM bookings;

-- Show sample of existing bookings structure (if any)
SELECT * FROM bookings LIMIT 3;