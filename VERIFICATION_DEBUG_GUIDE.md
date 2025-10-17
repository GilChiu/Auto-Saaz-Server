# Verification & User Creation Debug Guide

## Issue
After email verification, users are not being inserted into the database.

## What I Fixed

### 1. Added Comprehensive Logging
Enhanced `src/services/auth.service.ts` → `verifyRegistration()` method with detailed logging at every step:

```typescript
✅ Password generation logged
✅ Password hashing logged
✅ User creation attempt logged
✅ User creation success/failure logged
✅ User status update logged
✅ Garage profile creation logged
✅ Email sending logged
✅ Session deletion logged
✅ Error details logged (including stack trace)
```

### 2. Logging Added at These Steps:

**Step 1: Password Generation**
```typescript
logger.info(`Generated password for ${session.email}: ${generatedPassword.substring(0, 4)}****`);
```

**Step 2: Password Hashing**
```typescript
logger.info(`Password hashed successfully for ${session.email}`);
```

**Step 3: User Creation**
```typescript
logger.info(`Attempting to create user for ${session.email}`);
// ... createUser call ...
logger.info(`User created successfully with ID: ${user.id}`);
```

**Step 4: User Status Update**
```typescript
logger.info(`Updating user status to ACTIVE for ${user.id}`);
```

**Step 5: Garage Profile Creation**
```typescript
logger.info(`Creating garage profile for user ${user.id}`);
// ... createProfile call ...
logger.info(`Garage profile created successfully for user ${user.id}`);
```

**Step 6: Email Sending**
```typescript
logger.info(`Sending welcome email to ${session.email}`);
```

**Step 7: Session Cleanup**
```typescript
logger.info(`Deleting registration session ${sessionId}`);
```

**Step 8: Profile Retrieval**
```typescript
logger.info(`Profile retrieved for user ${user.id}: ${profile ? 'Found' : 'Not Found'}`);
```

**Error Logging**
```typescript
logger.error('AuthService.verifyRegistration error:', error);
logger.error('Error stack:', error.stack);
logger.error('Error details:', JSON.stringify(error, null, 2));
```

---

## How to Debug

### Step 1: Check Server Logs

Run your server and check the console output when verification happens:

```bash
npm run dev
```

Look for these log messages:

```
✅ Generated password for user@example.com: ****
✅ Password hashed successfully for user@example.com
✅ Attempting to create user for user@example.com
✅ User created successfully with ID: uuid-here
✅ Updating user status to ACTIVE for uuid-here
✅ Creating garage profile for user uuid-here
✅ Garage profile created successfully for user uuid-here
✅ Sending welcome email to user@example.com
✅ Deleting registration session session-id
✅ Profile retrieved for user uuid-here: Found
✅ Registration completed and user created: user@example.com
```

### Step 2: Identify Where It Fails

If you see an error, look at which step it stopped at:

**If it stops at "Attempting to create user":**
- Check Supabase connection
- Verify `users` table exists
- Check RLS policies on `users` table

**If it stops at "Creating garage profile":**
- Check `garage_profiles` table exists
- Verify foreign key constraints
- Check RLS policies on `garage_profiles` table

**If it stops at "Sending welcome email":**
- Check email service configuration
- Verify SMTP settings (or mock mode)

---

## Common Issues & Solutions

### Issue 1: Supabase RLS (Row Level Security) Blocking Inserts

**Symptom:** User creation returns null or throws permission error

**Solution:** Disable RLS or add proper policies

```sql
-- Option 1: Disable RLS for users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Option 2: Disable RLS for garage_profiles table
ALTER TABLE garage_profiles DISABLE ROW LEVEL SECURITY;

-- Option 3: Add proper RLS policies
CREATE POLICY "Allow service role to insert users"
ON users FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Allow service role to insert profiles"
ON garage_profiles FOR INSERT
TO service_role
WITH CHECK (true);
```

### Issue 2: Missing Tables

**Symptom:** Error "relation 'users' does not exist"

**Solution:** Run the schema setup

```bash
# Check if tables exist in Supabase SQL Editor:
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

# If missing, run:
# Copy contents of database/schema.sql and paste into Supabase SQL Editor
```

### Issue 3: Supabase Service Role Key Not Set

**Symptom:** Permission denied errors

**Solution:** Check environment variables

```bash
# In .env file:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# NOT the anon key - must be SERVICE_ROLE_KEY!
```

### Issue 4: Mock Verification Always Failing

**Symptom:** "Invalid or expired reset code" even with correct code

**Solution:** Check mock mode configuration

```typescript
// In src/services/verification.service.ts
private useMockMode = true; // Should be true for development

// Mock code should be: "123456"
```

---

## Testing Verification Flow

### Test 1: Complete Registration Flow

```bash
# Step 1: Register personal info
POST /api/auth/register/step1
{
  "fullName": "Test User",
  "email": "test@example.com",
  "phoneNumber": "+971501234567"
}

# Response: { sessionId: "uuid" }

# Step 2: Add business location
POST /api/auth/register/step2
{
  "sessionId": "uuid-from-step1",
  "address": "123 Main St",
  "street": "Main Street",
  "state": "Dubai",
  "location": "Dubai Marina",
  "coordinates": { "latitude": 25.0772, "longitude": 55.1368 }
}

# Step 3: Add business details
POST /api/auth/register/step3
{
  "sessionId": "uuid-from-step1",
  "companyLegalName": "Test Garage LLC",
  "tradeLicenseNumber": "123456",
  "vatCertification": "VAT123",
  "emiratesIdUrl": "https://example.com/id.pdf"
}

# Step 4: Verify with code
POST /api/auth/verify
{
  "sessionId": "uuid-from-step1",
  "code": "123456"
}

# Expected Response:
{
  "success": true,
  "message": "Registration successful! Your password has been sent to your email.",
  "data": {
    "user": { ... },
    "profile": { ... },
    "accessToken": "...",
    "refreshToken": "...",
    "generatedPassword": "RandomPass123!" // Only in development
  }
}
```

### Test 2: Check Database After Verification

```sql
-- In Supabase SQL Editor:

-- Check if user was created
SELECT * FROM users WHERE email = 'test@example.com';

-- Check if profile was created
SELECT gp.*, u.email 
FROM garage_profiles gp
JOIN users u ON u.id = gp.user_id
WHERE u.email = 'test@example.com';

-- Check verification codes
SELECT * FROM verification_codes WHERE email = 'test@example.com';
```

---

## Quick Diagnostic Checklist

Run through this checklist to identify the issue:

```
☐ Server is running (npm run dev)
☐ Supabase connection is working
☐ .env file has correct SUPABASE_URL
☐ .env file has SUPABASE_SERVICE_ROLE_KEY (not anon key)
☐ Tables exist: users, garage_profiles, verification_codes
☐ RLS is disabled OR proper policies exist
☐ Mock mode is enabled (useMockMode = true)
☐ Verification code is "123456" in mock mode
☐ Server logs show detailed step-by-step progress
☐ No errors in console when calling /api/auth/verify
```

---

## Expected Behavior

After calling `POST /api/auth/verify` with correct sessionId and code:

1. ✅ Server logs show "Generated password"
2. ✅ Server logs show "User created successfully"
3. ✅ Server logs show "Garage profile created successfully"
4. ✅ Response includes user, profile, and tokens
5. ✅ Database `users` table has new row
6. ✅ Database `garage_profiles` table has new row
7. ✅ User status is "active"
8. ✅ Profile is_email_verified is true

---

## Next Steps

1. **Run the server** and complete a registration flow
2. **Watch the logs** to see where it stops
3. **Check the database** to see if user/profile was created
4. **If still not working:**
   - Copy the error logs
   - Check Supabase logs in dashboard
   - Verify RLS policies
   - Confirm service role key is correct

---

## Contact Points

- **Error Logs:** Check server console output
- **Database:** Check Supabase dashboard → Table Editor
- **RLS Policies:** Supabase dashboard → Authentication → Policies
- **API Logs:** Supabase dashboard → Logs → API Logs

The enhanced logging should now show you exactly where the process is failing!
