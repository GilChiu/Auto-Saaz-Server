# Complete Fix: User Creation After Verification

## Problem
Users are not being inserted into the database after email verification completes successfully.

## Root Cause
**Supabase Row Level Security (RLS)** is blocking INSERT operations from the backend API.

## Solution

### Quick Fix (Disable RLS for Development)

Run this SQL in your Supabase SQL Editor:

```sql
-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE garage_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE registration_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'garage_profiles', 'verification_codes', 'registration_sessions', 'bookings');
-- All should show rowsecurity = false
```

### Production Fix (Enable RLS with Proper Policies)

For production, keep RLS enabled and add proper policies:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE garage_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- USERS TABLE POLICIES
-- ============================================================

-- Service role can do everything
CREATE POLICY "service_role_all_users"
ON users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can read their own data
CREATE POLICY "users_read_own"
ON users
FOR SELECT
TO authenticated
USING (auth.uid()::text = id::text);

-- Authenticated users can update their own data
CREATE POLICY "users_update_own"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid()::text = id::text)
WITH CHECK (auth.uid()::text = id::text);

-- ============================================================
-- GARAGE_PROFILES TABLE POLICIES
-- ============================================================

-- Service role can do everything
CREATE POLICY "service_role_all_profiles"
ON garage_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can read their own profile
CREATE POLICY "profiles_read_own"
ON garage_profiles
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id::text);

-- Authenticated users can update their own profile
CREATE POLICY "profiles_update_own"
ON garage_profiles
FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

-- ============================================================
-- VERIFICATION_CODES TABLE POLICIES
-- ============================================================

-- Service role can do everything
CREATE POLICY "service_role_all_verification"
ON verification_codes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow public to insert verification codes (for registration)
CREATE POLICY "public_insert_verification"
ON verification_codes
FOR INSERT
TO anon
WITH CHECK (true);

-- ============================================================
-- REGISTRATION_SESSIONS TABLE POLICIES
-- ============================================================

-- Service role can do everything
CREATE POLICY "service_role_all_sessions"
ON registration_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow public to insert/update sessions (for registration flow)
CREATE POLICY "public_manage_sessions"
ON registration_sessions
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- ============================================================
-- BOOKINGS TABLE POLICIES
-- ============================================================

-- Service role can do everything
CREATE POLICY "service_role_all_bookings"
ON bookings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Garage owners can read their own bookings
CREATE POLICY "bookings_read_own"
ON bookings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM garage_profiles
    WHERE garage_profiles.user_id::text = auth.uid()::text
    AND garage_profiles.id::text = bookings.garage_id::text
  )
);

-- Garage owners can update their own bookings
CREATE POLICY "bookings_update_own"
ON bookings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM garage_profiles
    WHERE garage_profiles.user_id::text = auth.uid()::text
    AND garage_profiles.id::text = bookings.garage_id::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM garage_profiles
    WHERE garage_profiles.user_id::text = auth.uid()::text
    AND garage_profiles.id::text = bookings.garage_id::text
  )
);
```

## Verification Steps

### 1. Check RLS Status

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### 2. Test User Creation Manually

```sql
-- Try inserting a test user
INSERT INTO users (email, password, role, status)
VALUES ('test@example.com', 'hashed_password', 'garage_owner', 'active')
RETURNING *;

-- If successful, RLS is not blocking
-- Clean up
DELETE FROM users WHERE email = 'test@example.com';
```

### 3. Check Existing Users

```sql
SELECT id, email, role, status, created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;
```

### 4. Monitor Logs During Registration

Watch your server console when completing registration:

```
Expected logs:
✅ Generated password for user@example.com: ****
✅ Password hashed successfully for user@example.com
✅ Attempting to create user for user@example.com
✅ User created successfully with ID: uuid
✅ Updating user status to ACTIVE for uuid
✅ Creating garage profile for user uuid
✅ Garage profile created successfully for user uuid
✅ Sending welcome email to user@example.com
✅ Registration completed and user created: user@example.com
```

If it stops at "Attempting to create user", RLS is blocking.

## Testing the Fix

### Complete Registration Flow Test

```bash
# Step 1: Personal Info
curl -X POST https://auto-saaz-server.onrender.com/api/auth/register/step1 \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test123@example.com",
    "phoneNumber": "+971501234567"
  }'

# Save sessionId from response

# Step 2: Business Location
curl -X POST https://auto-saaz-server.onrender.com/api/auth/register/step2 \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "YOUR_SESSION_ID",
    "address": "123 Test St",
    "street": "Test Street",
    "state": "Dubai",
    "location": "Dubai Marina"
  }'

# Step 3: Business Details
curl -X POST https://auto-saaz-server.onrender.com/api/auth/register/step3 \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "YOUR_SESSION_ID",
    "companyLegalName": "Test Garage LLC",
    "tradeLicenseNumber": "123456"
  }'

# Step 4: Verify (creates user)
curl -X POST https://auto-saaz-server.onrender.com/api/auth/register/verify \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "YOUR_SESSION_ID",
    "code": "123456"
  }'
```

### Expected Success Response

```json
{
  "success": true,
  "message": "Registration successful! Your password has been sent to your email.",
  "data": {
    "user": {
      "id": "uuid",
      "email": "test123@example.com",
      "role": "garage_owner",
      "status": "active"
    },
    "profile": {
      "fullName": "Test User",
      "email": "test123@example.com",
      "phoneNumber": "+971501234567",
      "companyLegalName": "Test Garage LLC",
      "status": "active"
    },
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "generatedPassword": "RandomPass123!" // Development only
  }
}
```

### Verify in Database

```sql
-- Check user was created
SELECT * FROM users WHERE email = 'test123@example.com';

-- Check profile was created
SELECT * FROM garage_profiles WHERE email = 'test123@example.com';

-- Both should return 1 row
```

## Common Errors

### Error 1: "relation 'users' does not exist"

**Solution:** Run `database/schema.sql` in Supabase SQL Editor

### Error 2: "permission denied for table users"

**Solution:** Disable RLS or add service_role policy

### Error 3: "Failed to create user - createUser returned null"

**Solution:** Check Supabase logs for detailed error:
- Go to Supabase Dashboard
- Click "Logs" → "API"
- Look for INSERT errors

### Error 4: "Invalid or expired session"

**Solution:** Session expires after 30 minutes. Start fresh registration.

## Environment Check

Ensure your `.env` has the correct Supabase credentials:

```bash
# Must be SERVICE_ROLE_KEY, not anon key!
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Get from Supabase Dashboard → Settings → API
# Use "service_role" (secret) key
```

## Quick Checklist

- [ ] Disable RLS on all tables (for development)
- [ ] Verify SUPABASE_SERVICE_ROLE_KEY in .env
- [ ] Test manual INSERT into users table
- [ ] Complete registration flow test
- [ ] Check server logs for detailed errors
- [ ] Verify user exists in database
- [ ] Test login with generated password

## Status

After applying the fix:
- ✅ RLS disabled (or proper policies added)
- ✅ Service role key configured
- ✅ Users can be created successfully
- ✅ Registration flow completes end-to-end

**Recommendation:** Disable RLS for development, enable with policies for production.
