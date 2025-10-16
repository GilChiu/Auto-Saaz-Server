# Render Environment Variables Setup

## Critical Issue: Supabase Connection Failed

Your deployment is failing because Supabase environment variables are not set in Render.

## Required Environment Variables

Go to **Render Dashboard** → **Your Service** → **Environment** and add these:

### 1. Supabase Configuration (REQUIRED)
```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_public_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_secret_key_here
```

**How to get these:**
1. Go to https://supabase.com/dashboard
2. Select your project (or create one)
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. JWT Secret (REQUIRED)
```bash
JWT_SECRET=your_random_secret_here
```

**Generate a secure secret:**
```bash
# Run this locally to generate:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Node Environment
```bash
NODE_ENV=production
```

### 4. Optional (with defaults)
```bash
# JWT Expiry
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Security
BCRYPT_ROUNDS=12
REQUIRE_EMAIL_VERIFICATION=false
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_DURATION_MINUTES=30

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX_REQUESTS=5

# OTP
OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6
MAX_OTP_ATTEMPTS=3

# CORS (update with your frontend URL)
CORS_ORIGIN=https://your-frontend-app.com
```

## Steps to Fix

### Step 1: Add Environment Variables in Render
1. Go to your Render service
2. Click **Environment** (left sidebar)
3. Click **Add Environment Variable**
4. Add each variable from above
5. Click **Save Changes**

### Step 2: Setup Supabase Database
1. Go to Supabase dashboard
2. Open **SQL Editor**
3. Copy the contents of `database/schema.sql` from this repo
4. Paste and run it in SQL Editor
5. Verify tables are created (users, garage_profiles, verification_codes, file_uploads)

### Step 3: Create Storage Bucket
1. In Supabase, go to **Storage**
2. Click **New Bucket**
3. Name: `garage-documents`
4. Set to **Public** or configure policies
5. Click **Create**

### Step 4: Redeploy
1. Go back to Render
2. Click **Manual Deploy** → **Deploy latest commit**
3. Wait for deployment to complete
4. Check logs for success

## Current Errors Explained

### Error 1: Trust Proxy
```
ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false
```
**Fix:** ✅ Already fixed in latest code (`app.set('trust proxy', 1)`)

### Error 2: Supabase Connection
```
TypeError: fetch failed at UserModel.getUserByEmail
```
**Fix:** Add Supabase environment variables (see Step 1 above)

## Verification

After adding environment variables and redeploying, test the health endpoint:

```bash
curl https://autosaaz-server.onrender.com/health
```

Expected response:
```json
{
  "success": true,
  "message": "AutoSaaz Server is running",
  "timestamp": "2025-10-16T..."
}
```

Then test registration:
```bash
curl -X POST https://autosaaz-server.onrender.com/api/auth/register/step1 \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "phoneNumber": "+971501234567",
    "password": "Test@123456"
  }'
```

## Need Help?

If you still get errors after adding environment variables:
1. Check Render logs for specific error messages
2. Verify Supabase credentials are correct
3. Ensure database schema is executed
4. Check CORS_ORIGIN includes your frontend URL
