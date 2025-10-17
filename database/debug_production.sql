-- ============================================================
-- PRODUCTION DATABASE VERIFICATION SCRIPT
-- Run this in your Supabase SQL Editor to debug the 404 issue
-- ============================================================

-- Check if bookings table exists
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;

-- Check if we have any bookings for your user
SELECT 
    COUNT(*) as total_bookings,
    COUNT(*) FILTER (WHERE garage_id = 'ba50abf9-5210-4177-8605-b01c73b9f9f3') as your_bookings
FROM bookings;

-- Check for the specific booking we're looking for
SELECT 
    id,
    booking_number,
    garage_id,
    customer_name,
    service_type,
    status
FROM bookings 
WHERE booking_number = 'BK17053188000001' 
   OR id = 'BK17053188000001';

-- Check all bookings for your garage
SELECT 
    id,
    booking_number,
    customer_name,
    service_type,
    status,
    created_at
FROM bookings 
WHERE garage_id = 'ba50abf9-5210-4177-8605-b01c73b9f9f3'
ORDER BY created_at DESC
LIMIT 10;

-- Check if there are any bookings with partial matches
SELECT 
    id,
    booking_number,
    customer_name,
    garage_id
FROM bookings 
WHERE booking_number LIKE '%BK170531880000%'
   OR booking_number LIKE '%000001%'
LIMIT 5;