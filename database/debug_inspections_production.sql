-- ============================================================
-- INSPECTIONS PRODUCTION DEBUG SCRIPT
-- Run this in your Supabase SQL Editor to debug inspections issues
-- ============================================================

-- 1. Check if inspections table exists
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'inspections' 
ORDER BY ordinal_position;

-- 2. Check if users table exists and has your user ID
SELECT id, email, role 
FROM users 
WHERE id = 'ba50abf9-5210-4177-8605-b01c73b9f9f3';

-- 3. Check if inspections table has any data
SELECT COUNT(*) as total_inspections FROM inspections;

-- 4. Check inspections for your user ID
SELECT 
    id,
    inspection_number,
    garage_owner_id,
    customer_name,
    status,
    priority,
    inspection_date,
    created_at
FROM inspections 
WHERE garage_owner_id = 'ba50abf9-5210-4177-8605-b01c73b9f9f3'
ORDER BY created_at DESC
LIMIT 10;

-- 5. Check RLS policies on inspections table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'inspections';

-- 6. Check if uuid_generate_v4() function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'uuid_generate_v4';

-- 7. Test current user authentication (if connected via API)
SELECT auth.uid() as current_user_id;

-- ============================================================
-- If inspections table doesn't exist, you need to run:
-- database/inspections_migration.sql
-- ============================================================