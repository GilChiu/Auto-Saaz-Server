# Database Migration Guide

## 🔄 Fresh Setup (Recommended)

Since you mentioned deleting the old tables, here's the recommended approach:

### Step 1: Drop All Existing Tables
Run this in Supabase SQL Editor:

```sql
-- Drop all tables in correct order (handles foreign key dependencies)
DROP TABLE IF EXISTS file_uploads CASCADE;
DROP TABLE IF EXISTS verification_codes CASCADE;
DROP TABLE IF EXISTS registration_sessions CASCADE;
DROP TABLE IF EXISTS garage_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop the view
DROP VIEW IF EXISTS user_profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS cleanup_expired_verification_codes();
DROP FUNCTION IF EXISTS cleanup_expired_registration_sessions();
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

### Step 2: Run Complete Schema
Copy the entire contents of `database/schema.sql` and run it in Supabase SQL Editor.

This will create:
- ✅ All 5 tables (users, garage_profiles, verification_codes, registration_sessions, file_uploads)
- ✅ All indexes
- ✅ All triggers
- ✅ All RLS policies
- ✅ Cleanup functions
- ✅ Helper views

### Step 3: Verify Installation
The script automatically runs verification queries at the end. You should see:

**Tables Created:**
- file_uploads
- garage_profiles
- registration_sessions
- users
- verification_codes

**Indexes Created:**
Multiple indexes for each table (check the query results)

---

## 📊 Table Overview

### `registration_sessions` (NEW - Core to new flow)
**Purpose**: Temporary storage for multi-step registration (24-hour expiry)

**Fields**:
- `session_id` - Unique session identifier (64 hex chars)
- `full_name`, `email`, `phone_number` - Step 1
- `address`, `street`, `state`, `location`, `coordinates` - Step 2
- `company_legal_name`, `emirates_id_url`, `trade_license_number`, `vat_certification` - Step 3
- `step_completed` - Progress tracker (1, 2, or 3)
- `expires_at` - 24 hours from creation

**Usage**:
1. Created in Step 1 (no user account yet)
2. Updated in Steps 2 & 3
3. Data copied to `users` + `garage_profiles` in Step 4 (after verification)
4. Deleted after successful user creation

### `users`
**Purpose**: Authentication and user accounts

**Created**: After OTP verification (Step 4), not during Step 1

**Fields**:
- Core: `id`, `email`, `password`, `role`, `status`
- Security: `failed_login_attempts`, `locked_until`
- Tracking: `last_login_at`, `last_login_ip`

### `garage_profiles`
**Purpose**: Extended garage owner information

**Created**: After OTP verification (Step 4), populated with all session data

**Fields**: Same as registration session + verification status

### `verification_codes`
**Purpose**: OTP codes for email/phone verification

**Created**: During Step 3, used in Step 4

**Note**: Can reference `user_id` OR use `email`/`phone_number` (for pre-user verification)

### `file_uploads`
**Purpose**: Track uploaded documents

**Created**: When files are uploaded (Emirates ID, etc.)

---

## 🔧 Maintenance Functions

### Cleanup Expired Sessions
```sql
-- Run periodically (recommended: every hour)
SELECT cleanup_expired_registration_sessions();
```

### Cleanup Expired Verification Codes
```sql
-- Run periodically (recommended: every hour)
SELECT cleanup_expired_verification_codes();
```

**Recommendation**: Set up Supabase cron jobs or Edge Functions to call these automatically.

---

## 🛡️ Row Level Security (RLS)

All tables have RLS enabled with these policies:

**Service Role** (your backend):
- Full access to all tables (INSERT, SELECT, UPDATE, DELETE)

**Authenticated Users** (future mobile/web app):
- Can read/update their own data only
- Cannot access other users' data

**Public/Anonymous**:
- No access (all operations blocked)

---

## ✅ Post-Migration Checklist

After running the schema:

- [ ] Verify all 5 tables exist
- [ ] Verify indexes are created
- [ ] Verify RLS policies are active
- [ ] Test registration flow:
  - [ ] Step 1: Create session
  - [ ] Step 2: Update with location
  - [ ] Step 3: Update with business + OTP sent
  - [ ] Step 4: Verify OTP + create user
- [ ] Set up cron jobs for cleanup functions

---

## 🚨 Troubleshooting

### "Table already exists" error
Run the DROP statements from Step 1 above.

### "Function does not exist" error
Make sure you ran the complete schema, not just parts of it.

### RLS policy errors
Ensure your backend is using the **service role key**, not the anon key.

### Verification codes not working
Check `verification_codes` table is populated and `expires_at` hasn't passed.

---

## 📝 Notes

- **Session Expiry**: 24 hours (configurable in `registration.model.ts`)
- **OTP Length**: 6 digits (configurable in `.env`)
- **OTP Expiry**: 10 minutes (configurable in `.env`)
- **Max Login Attempts**: 5 (configurable in `.env`)
- **Account Lockout**: 30 minutes (configurable in `.env`)

---

**Last Updated**: October 2025  
**Version**: 2.0 (Session-based registration flow)
