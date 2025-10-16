# Database Setup Guide

## 🎉 CORS IS FIXED! 

Your backend CORS is now working correctly. The issue now is that your Supabase database needs to be set up.

## Error You're Seeing:
```
Could not find the table 'public.users' in the schema cache
```

## Solution: Run the Database Schema

### Step-by-Step Instructions:

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your AutoSaaz project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy the Schema**
   - Open the file: `database/schema.sql` in this project
   - Select ALL content (Ctrl+A)
   - Copy it (Ctrl+C)

4. **Run the Schema**
   - Paste the entire schema into the SQL Editor
   - Click "Run" button (or press Ctrl+Enter)
   - Wait for it to complete (should take 5-10 seconds)

5. **Verify Tables Created**
   - Go to "Table Editor" in the left sidebar
   - You should see these tables:
     - ✅ users
     - ✅ garage_profiles
     - ✅ registration_sessions
     - ✅ refresh_tokens
     - ✅ files
     - ✅ verification_codes

6. **Test Registration Again**
   - Go back to your frontend: https://auto-saaz-garage-client.vercel.app/register
   - Try registering again
   - It should work now!

## What the Schema Creates:

- **users** - Main authentication table
- **garage_profiles** - Extended user profile information
- **registration_sessions** - Temporary storage for multi-step registration
- **refresh_tokens** - JWT refresh token management
- **files** - File upload tracking
- **verification_codes** - OTP codes for email/phone verification

## RLS (Row Level Security)

The schema also sets up RLS policies that allow:
- Service role (your backend) - Full access to all tables
- Users can only access their own data

## After Setup:

Once the schema is run, your registration flow will work:
1. Step 1: Personal info → Creates session
2. Step 2: Business location → Updates session
3. Step 3: Business details → Updates session, sends OTP
4. Step 4: Verify OTP + Password → Creates user account

## Troubleshooting:

If you get errors when running the schema:
- **"relation already exists"** - Tables already exist, that's OK
- **Permission denied** - Make sure you're using the correct Supabase project
- **Syntax error** - Copy the entire file, don't modify it

## Environment Variables:

Make sure your Render environment has:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

You can find these in Supabase Dashboard → Settings → API

---

**Need Help?** Check the Supabase logs in your dashboard if you encounter any issues.
