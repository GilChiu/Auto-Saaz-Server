# Testing Guide - AutoSaaz Registration

## 🎉 Current Status

✅ CORS is working  
✅ Database tables created  
✅ Password auto-generation implemented  
✅ All 4 registration steps functional  

## How to Test Registration Flow

### Step 1: Personal Information
**Endpoint:** `POST /api/auth/register/step1`

**Request:**
```json
{
  "fullName": "Gil Chiu",
  "email": "benedictchiu12@gmail.com",
  "phoneNumber": "+971501234567"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "c8e6f567...",
    "nextStep": 2
  }
}
```

**Save the `sessionId`** - you'll need it for all subsequent steps!

---

### Step 2: Business Location
**Endpoint:** `POST /api/auth/register/step2`

**Request:**
```json
{
  "sessionId": "c8e6f567...",
  "address": "Dubai Marina",
  "street": "Sheikh Zayed Road",
  "state": "Dubai",
  "location": "Marina Walk",
  "coordinates": {
    "latitude": 25.0772,
    "longitude": 55.1376
  }
}
```

---

### Step 3: Business Details
**Endpoint:** `POST /api/auth/register/step3`

**Request:**
```json
{
  "sessionId": "c8e6f567...",
  "companyLegalName": "AutoSaaz Garage LLC",
  "emiratesIdUrl": "https://example.com/emirates-id.pdf",
  "tradeLicenseNumber": "TL-123456",
  "vatCertification": "VAT-789012"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nextStep": 4,
    "message": "Please verify your account with the code sent to complete registration"
  }
}
```

**Check Render Logs** for the OTP code:
```
[EMAIL] Verification code for benedictchiu12@gmail.com: 035673
[SMS] Verification code for +971501234567: 035673
```

---

### Step 4: Verify Code (NO PASSWORD NEEDED!)
**Endpoint:** `POST /api/auth/verify`

**Request:**
```json
{
  "sessionId": "c8e6f567...",
  "code": "035673"
}
```

**NO PASSWORD FIELD!** The backend auto-generates it.

**Response:**
```json
{
  "success": true,
  "message": "Registration successful! Your password has been sent to your email.",
  "data": {
    "user": {
      "id": "uuid...",
      "email": "benedictchiu12@gmail.com",
      "role": "garage_owner",
      "status": "active"
    },
    "profile": {
      "fullName": "Gil Chiu",
      "email": "benedictchiu12@gmail.com",
      "phoneNumber": "+971501234567",
      "companyLegalName": "AutoSaaz Garage LLC",
      "status": "active"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "generatedPassword": "Xk9$aB2mPq8R"  // ← Only in development!
  }
}
```

**Check Render Logs** for the welcome email:
```
🎉 WELCOME TO AUTOSAAZ!
================================================================================
👤 Name: Gil Chiu
📧 Email: benedictchiu12@gmail.com
🔑 Password: Xk9$aB2mPq8R
```

---

## Finding the OTP Code

Since email/SMS is not configured yet, codes are logged to **Render console**:

1. Go to: https://dashboard.render.com
2. Click on: `auto-saaz-server`
3. Click: **Logs** tab
4. Look for lines like:
   ```
   [EMAIL] Verification code for benedictchiu12@gmail.com: 647197
   ```

---

## Finding the Generated Password

After successful verification, check Render logs for:

```
🎉 WELCOME TO AUTOSAAZ!
================================================================================
👤 Name: Gil Chiu
📧 Email: benedictchiu12@gmail.com
🔑 Password: Xk9$aB2mPq8R
================================================================================
```

**In development mode**, the password is also included in the API response under `data.generatedPassword`.

**In production**, it will only be sent via email (once email service is configured).

---

## Resend Verification Code

If you need a new code:

**Endpoint:** `POST /api/auth/verify/resend`

**Request:**
```json
{
  "sessionId": "c8e6f567..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent successfully"
}
```

Check logs for the new code.

---

## Login After Registration

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "benedictchiu12@gmail.com",
  "password": "Xk9$aB2mPq8R"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

---

## Password Format

Auto-generated passwords are:
- **12 characters long**
- **Uppercase letters** (A-Z, excluding I, O)
- **Lowercase letters** (a-z, excluding l)
- **Numbers** (2-9, excluding 0, 1)
- **Special characters** (@$!%*?&)
- **Cryptographically random**

Example: `Xk9$aB2mPq8R`

---

## Current Verification Code

From your logs, the latest code is:
```
647197
```

Use this in Step 4!

---

## Testing Checklist

- [x] Step 1: Create session with personal info
- [x] Step 2: Add business location
- [x] Step 3: Add business details (triggers OTP)
- [ ] Step 4: Verify with OTP code (NO password field!)
- [ ] Check logs for generated password
- [ ] Login with generated password
- [ ] Change password (future feature)

---

## Frontend Integration Notes

### Remove Password Fields from Step 4

Your verification screen (screenshot) currently has:
- ❌ "Create Password" field
- ❌ "Confirm Password" field

**These should be removed!**

The Step 4 screen should only have:
- ✅ 6-digit code input boxes
- ✅ "Resend Code" link
- ✅ "Complete Registration" button

### After Successful Verification

Show a success message:
```
🎉 Registration Successful!

Your account has been created.
Your password has been sent to: benedictchiu12@gmail.com

Please check your email and login with your credentials.
```

Then redirect to login page or auto-login using the returned tokens.

---

## Next Steps

1. **Test Step 4** with code `647197` (from logs)
2. **Remove password fields** from frontend Step 4
3. **Test full flow** end-to-end
4. **Configure email service** (SendGrid, AWS SES, etc.)
5. **Add "Change Password" feature** for users

---

## Email Service Integration (TODO)

To actually send emails, add to `.env`:
```
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-key
SENDGRID_FROM_EMAIL=noreply@autosaaz.com
```

Then uncomment the email sending code in `sendWelcomeEmail()` method.

---

## Troubleshooting

### "Invalid or expired session"
- Session expired (24 hours)
- Start registration from Step 1 again

### "Invalid verification code"
- Code expired (15 minutes)
- Use "Resend Code" to get a new one
- Check latest code in Render logs

### "User already exists"
- Email already registered
- Use a different email
- Or login with existing account

---

**Ready to test!** Use code `647197` from your logs. 🚀
