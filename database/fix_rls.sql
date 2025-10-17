-- Quick Fix for User Creation Issue
-- Run this in Supabase SQL Editor

-- ============================================================
-- STEP 1: Check if RLS is enabled
-- ============================================================
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'garage_profiles', 'verification_codes', 'registration_sessions');

-- If rowsecurity = true, RLS is enabled and may be blocking inserts


-- ============================================================
-- STEP 2: Disable RLS (Recommended for Development)
-- ============================================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE garage_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE registration_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;


-- ============================================================
-- STEP 3: Verify RLS is disabled
-- ============================================================
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'garage_profiles', 'verification_codes', 'registration_sessions', 'bookings');

-- All should show rowsecurity = false


-- ============================================================
-- STEP 4: Check if tables exist
-- ============================================================
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Should include:
-- - users
-- - garage_profiles
-- - verification_codes
-- - registration_sessions
-- - bookings


-- ============================================================
-- STEP 5: Check current users (if any)
-- ============================================================
SELECT 
    id,
    email,
    role,
    status,
    created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;


-- ============================================================
-- STEP 6: Check current garage profiles (if any)
-- ============================================================
SELECT 
    gp.id,
    gp.full_name,
    gp.email,
    gp.status,
    u.email as user_email,
    gp.created_at
FROM garage_profiles gp
LEFT JOIN users u ON u.id = gp.user_id
ORDER BY gp.created_at DESC
LIMIT 10;


-- ============================================================
-- STEP 7: Clean up test data (optional)
-- ============================================================
-- Uncomment to delete all test users
-- DELETE FROM users WHERE email LIKE '%test%';
-- DELETE FROM garage_profiles WHERE email LIKE '%test%';


-- ============================================================
-- ALTERNATIVE: Enable RLS with Proper Policies (Production)
-- ============================================================
-- Only use this if you want RLS enabled for production

-- Enable RLS
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE garage_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for service role (backend API)
-- CREATE POLICY "Service role can insert users"
-- ON users FOR INSERT
-- TO service_role
-- WITH CHECK (true);

-- CREATE POLICY "Service role can select users"
-- ON users FOR SELECT
-- TO service_role
-- USING (true);

-- CREATE POLICY "Service role can update users"
-- ON users FOR UPDATE
-- TO service_role
-- USING (true);

-- CREATE POLICY "Service role can insert profiles"
-- ON garage_profiles FOR INSERT
-- TO service_role
-- WITH CHECK (true);

-- CREATE POLICY "Service role can select profiles"
-- ON garage_profiles FOR SELECT
-- TO service_role
-- USING (true);

-- CREATE POLICY "Service role can update profiles"
-- ON garage_profiles FOR UPDATE
-- TO service_role
-- USING (true);


-- ============================================================
-- STEP 8: Test user creation manually
-- ============================================================
-- Try inserting a test user to see if it works
INSERT INTO users (email, password, role, status)
VALUES ('manual-test@example.com', 'test_password_hash', 'garage_owner', 'active')
RETURNING *;

-- If this works, RLS is not blocking
-- If this fails, check error message

-- Clean up test
DELETE FROM users WHERE email = 'manual-test@example.com';


-- ============================================================
-- Summary
-- ============================================================
-- Run steps 1-3 to disable RLS (quickest fix)
-- Run step 4 to verify tables exist
-- Run step 5-6 to check existing data
-- Run step 8 to test manual insertion
-- 
-- After running this, test your registration flow again
