# Render Environment Variables Setup

**Go to**: Render Dashboard → Your Service → Environment → Add Environment Variable

---

## 🔴 REQUIRED VARIABLES

### Database (Supabase)

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Where to find**: Supabase Dashboard → Settings → API

---

### JWT Configuration

```bash
JWT_SECRET=your_very_long_random_secret_minimum_32_characters
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

**Generate JWT_SECRET**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### CORS Configuration

```bash
CORS_ORIGIN=https://autosaaz-garage.vercel.app
```

**✅ IMPORTANT**: 
- All `*.vercel.app` domains are **AUTOMATICALLY ALLOWED**
- This includes ALL preview branches (no need to add them)
- `localhost` is **AUTOMATICALLY ALLOWED** for development
- Only add your custom production domains here

**Examples**:
```bash
# Just main Vercel app (previews auto-allowed):
CORS_ORIGIN=https://autosaaz-garage.vercel.app

# With custom domain:
CORS_ORIGIN=https://autosaaz-garage.vercel.app,https://autosaaz.com

# Multiple domains (comma-separated, NO SPACES):
CORS_ORIGIN=https://autosaaz-garage.vercel.app,https://autosaaz.com,https://www.autosaaz.com
```

---

## 📋 QUICK COPY - Minimal Setup

Copy this to Render (replace values):

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=generate_using_node_crypto_command_above
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGIN=https://autosaaz-garage.vercel.app
NODE_ENV=production
```

---

## 🟡 OPTIONAL VARIABLES

### Server Configuration
```bash
PORT=3000
NODE_ENV=production
```

### Rate Limiting
```bash
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX_REQUESTS=5
```

### OTP Configuration
```bash
OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6
MAX_OTP_ATTEMPTS=3
```

### File Storage
```bash
FILE_STORAGE_BUCKET=garage-documents
MAX_FILE_SIZE_MB=5
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg,application/pdf
```

### Email (Gmail Example)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
EMAIL_FROM=noreply@autosaaz.com
```

### SMS
```bash
SMS_API_KEY=your_sms_provider_api_key
SMS_SENDER_ID=AutoSaaz
```

### Security
```bash
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_DURATION_MINUTES=30
PASSWORD_MIN_LENGTH=8
REQUIRE_EMAIL_VERIFICATION=true
SESSION_TIMEOUT_MINUTES=60
```

---

## 🔧 How to Add in Render

1. Go to Render Dashboard
2. Select your service (autosaaz-server)
3. Click **Environment** in sidebar
4. Click **Add Environment Variable**
5. Add each variable:
   - Key: `SUPABASE_URL`
   - Value: `https://...`
6. Click **Save Changes**
7. **Render will auto-redeploy** (takes 2-3 mins)

---

## ✅ What's Auto-Allowed (No Config Needed)

- ✅ All `*.vercel.app` domains (including preview branches)
- ✅ `localhost:*` (all ports)
- ✅ `127.0.0.1:*` (all ports)

**This means your Vercel preview branch works automatically!**

---

## 🚨 Troubleshooting CORS

### Still getting CORS errors?

1. **Check CORS_ORIGIN is set** in Render Environment tab
2. **Wait for deployment** to complete (2-3 minutes)
3. **Check Render logs** for CORS messages:
   ```
   CORS: Allowing Vercel preview deployment: https://...
   ```
4. **Hard refresh** frontend (Ctrl+Shift+R)

### Common Mistakes

❌ **DON'T** add spaces in CORS_ORIGIN:
```bash
# WRONG:
CORS_ORIGIN=https://app1.com, https://app2.com

# CORRECT:
CORS_ORIGIN=https://app1.com,https://app2.com
```

❌ **DON'T** add Vercel preview URLs manually (they're auto-allowed):
```bash
# WRONG (unnecessary):
CORS_ORIGIN=https://app-git-branch.vercel.app

# CORRECT (Vercel is auto-allowed):
CORS_ORIGIN=https://app.vercel.app
```

---

## 📝 Notes

- Changes to environment variables trigger auto-redeploy
- Vercel preview deployments work without manual CORS config
- Check Render logs for detailed CORS information
- JWT_SECRET must be minimum 32 characters

---

**Last Updated**: October 2025  
**Current CORS Logic**: Auto-allows *.vercel.app + localhost + CORS_ORIGIN list
