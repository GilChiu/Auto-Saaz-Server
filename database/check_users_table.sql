-- ============================================================
-- CHECK USERS TABLE STRUCTURE
-- Run this first to see what columns exist in your users table
-- ============================================================

-- Check the structure of the users table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check existing users to see the structure
SELECT * FROM users LIMIT 1;