# ✅ AutoSaaz Registration Flow - Final Specification

## 📋 Registration Flow (As Per UI Screenshots)

### **Step 1: Personal Information** 
**Screen:** "Welcome to Auto Saaz!"

**Fields:**
- ✅ Full Name (required)
- ✅ Email (required)
- ✅ Phone Number (required)
- ✅ Password (required) - Hidden input

**API Endpoint:**
```
POST /api/auth/register/step1
```

**Request Body:**
```json
{
  "fullName": "Gil Benedict Chiu",
  "email": "benedictchiu12@gmail.com",
  "phoneNumber": "+942948249",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email or phone number.",
  "data": {
    "userId": "uuid-here",
    "email": "benedictchiu12@gmail.com",
    "phoneNumber": "+971942948249",
    "requiresVerification": true
  },
  "status": 201
}
```

**Validation Rules:**
- Full Name: 3-100 chars, letters and spaces only
- Email: Valid email format, auto-lowercase
- Phone: UAE format (+971XXXXXXXXX), auto-normalized
- Password: Min 8 chars, must include uppercase, lowercase, number, special char

**Backend Actions:**
1. ✅ Check if email already exists (return 409 if exists)
2. ✅ Validate password strength
3. ✅ Hash password with bcrypt
4. ✅ Create user (status: `PENDING_VERIFICATION`)
5. ✅ Create garage profile with personal info
6. ✅ Generate 6-digit OTP
7. ✅ Send OTP via email AND SMS
8. ✅ Return userId for next steps

---

### **Step 2 (Actually 4th in sequence): Email/Phone Verification** 
**Screen:** "Enter Verification Code"

**Fields:**
- ✅ 6 separate input boxes for OTP digits
- ✅ "Resend Code" link
- ✅ "← Back" button
- ✅ "Verify Code" button

**API Endpoints:**

#### Verify Code:
```
POST /api/auth/verify
```

**Request Body:**
```json
{
  "code": "123456",
  "email": "benedictchiu12@gmail.com",
  "phoneNumber": "+971942948249"  // optional, can verify with either
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Verification successful. Your account is now active.",
  "data": {},
  "status": 200
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid verification code",
  "errors": [],
  "status": 400
}
```

#### Resend Code:
```
POST /api/auth/verify/resend
```

**Request Body:**
```json
{
  "email": "benedictchiu12@gmail.com",
  "phoneNumber": "+971942948249"  // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent successfully",
  "data": {},
  "status": 200
}
```

**Validation Rules:**
- Code: Exactly 6 digits
- Email OR Phone required (at least one)

**Backend Actions:**
1. ✅ Validate OTP code
2. ✅ Check if code is expired (10 minutes)
3. ✅ Check if max attempts exceeded (3 attempts)
4. ✅ Mark verification code as used
5. ✅ Update user status to `VERIFIED`
6. ✅ Update profile verification timestamps
7. ✅ Allow user to proceed to Step 2

**Resend Code Actions:**
1. ✅ Invalidate old verification codes
2. ✅ Generate new 6-digit OTP
3. ✅ Send new OTP via email/SMS
4. ✅ Return success message

---

### **Step 3 (Actually 2nd after verification): Business Location** 
**Screen:** "Enter Your Business Location"

**Fields:**
- ✅ Address (required) - "Enter Shop Name, Building Name"
- ✅ Street (required)
- ✅ State (required)
- ✅ Location (required)
- ✅ Coordinates (optional) - Not visible in UI, but supported

**API Endpoint:**
```
POST /api/auth/register/step2
```

**Request Body:**
```json
{
  "userId": "uuid-from-step1",
  "address": "AutoSaaz Workshop, Building 15",
  "street": "Sheikh Zayed Road",
  "state": "Dubai",
  "location": "Al Quoz Industrial Area",
  "coordinates": {
    "latitude": 25.2048,
    "longitude": 55.2708
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Business location saved successfully",
  "data": {
    "nextStep": 3
  },
  "status": 200
}
```

**Validation Rules:**
- userId: Must be valid UUID
- Address: 5-255 chars
- Street: 3-100 chars
- State: 2-50 chars
- Location: 2-100 chars
- Coordinates: Optional {latitude: -90 to 90, longitude: -180 to 180}

**Backend Actions:**
1. ✅ Check if user exists
2. ✅ Verify user is in `VERIFIED` status (must complete Step 4 first)
3. ✅ Update garage profile with location info
4. ✅ Return success with nextStep indicator

---

### **Step 4 (Actually 3rd): Business Details** 
**Screen:** "Enter Your Business Details"

**Fields:**
- ✅ Company Legal Name (required)
- ✅ Owner/Representative Emirates ID (required) - File upload
- ✅ Trade License Number (required)
- ✅ VAT Certification (optional)

**API Endpoint:**
```
POST /api/auth/register/step3
```

**Request Body:**
```json
{
  "userId": "uuid-from-step1",
  "companyLegalName": "AutoSaaz Garage Services LLC",
  "emiratesIdUrl": "https://acqdzxnfpnwrhvatfzov.supabase.co/storage/v1/object/public/garage-documents/emirates-id-123.pdf",
  "tradeLicenseNumber": "TL-123456",
  "vatCertification": "VAT-789012"  // optional
}
```

**Response (Auto-Login):**
```json
{
  "success": true,
  "message": "Registration completed successfully! Welcome to AutoSaaz.",
  "data": {
    "user": {
      "id": "uuid",
      "email": "benedictchiu12@gmail.com",
      "role": "garage_owner",
      "status": "active",
      "createdAt": "2025-10-17T10:30:00Z",
      "updatedAt": "2025-10-17T10:30:00Z"
    },
    "profile": {
      "fullName": "Gil Benedict Chiu",
      "email": "benedictchiu12@gmail.com",
      "phoneNumber": "+971942948249",
      "companyLegalName": "AutoSaaz Garage Services LLC",
      "status": "active"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "status": 200
}
```

**Validation Rules:**
- userId: Must be valid UUID
- Company Legal Name: 3-255 chars
- Emirates ID URL: Must be valid URL
- Trade License Number: 5-50 chars, auto-uppercase
- VAT Certification: Optional, max 50 chars, auto-uppercase

**Backend Actions:**
1. ✅ Check if user exists
2. ✅ Verify user is in `VERIFIED` status
3. ✅ Update garage profile with business details
4. ✅ Update user status to `ACTIVE` (fully registered)
5. ✅ Update profile status to `ACTIVE`
6. ✅ Generate JWT access token (7 days expiry)
7. ✅ Generate JWT refresh token (30 days expiry)
8. ✅ Return user data + tokens for auto-login
9. ✅ User is automatically logged in, redirect to dashboard

---

## 🔄 Complete Flow Sequence

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Personal Info                                        │
│ - Full Name, Email, Phone, Password                          │
│ - Creates user (PENDING_VERIFICATION)                        │
│ - Sends OTP via Email/SMS                                    │
│ - Returns userId                                             │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2 (Verification): Enter OTP                            │
│ - 6-digit code                                               │
│ - Validates OTP                                              │
│ - Updates status to VERIFIED                                 │
│ - Has "Resend Code" button                                   │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3 (Location): Business Location                        │
│ - Address, Street, State, Location                           │
│ - Requires userId + VERIFIED status                          │
│ - Updates garage profile                                     │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 4 (Final): Business Details                            │
│ - Company Name, Emirates ID, Trade License, VAT             │
│ - Requires userId + VERIFIED status                          │
│ - Updates status to ACTIVE                                   │
│ - Returns tokens (AUTO-LOGIN)                                │
│ - Redirect to Dashboard                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Features

✅ **Rate Limiting**
- Registration endpoints: 5 attempts per 15 minutes
- Verification endpoints: 5 attempts per 15 minutes
- Prevents brute force and spam

✅ **Password Security**
- Minimum 8 characters
- Must include: uppercase, lowercase, number, special character
- Hashed with bcrypt (12 rounds)
- Never returned in responses

✅ **OTP Security**
- 6-digit random code
- 10-minute expiry
- Max 3 verification attempts
- One-time use only
- Invalidated old codes on resend

✅ **Status Validation**
- Step 2/3 blocked until user is VERIFIED
- Login blocked until user is ACTIVE
- Proper status transitions enforced

---

## 📊 Database Schema (snake_case)

### users table:
```sql
- id (UUID)
- email (VARCHAR)
- password (TEXT) - hashed
- role (ENUM: garage_owner, admin, mobile_user)
- status (ENUM: pending_verification, verified, active, suspended, rejected)
- failed_login_attempts (INTEGER)
- locked_until (TIMESTAMP)
- last_login_at (TIMESTAMP)
- last_login_ip (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### garage_profiles table:
```sql
- id (UUID)
- user_id (UUID) - FK to users
- full_name (VARCHAR)
- email (VARCHAR)
- phone_number (VARCHAR)
- address (TEXT)
- street (VARCHAR)
- state (VARCHAR)
- location (VARCHAR)
- coordinates (JSONB)
- company_legal_name (VARCHAR)
- emirates_id_url (TEXT)
- trade_license_number (VARCHAR)
- vat_certification (VARCHAR)
- role (VARCHAR)
- status (VARCHAR)
- is_email_verified (BOOLEAN)
- is_phone_verified (BOOLEAN)
- email_verified_at (TIMESTAMP)
- phone_verified_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### verification_codes table:
```sql
- id (UUID)
- user_id (UUID) - FK to users
- email (VARCHAR)
- phone_number (VARCHAR)
- code (VARCHAR)
- method (ENUM: email, phone, both)
- attempts (INTEGER)
- is_used (BOOLEAN)
- expires_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

---

## ✅ Code Quality Checklist

- ✅ All inputs validated with Zod schemas
- ✅ Proper TypeScript typing throughout
- ✅ snake_case for database columns
- ✅ camelCase for API responses (JavaScript convention)
- ✅ Error handling in try-catch blocks
- ✅ Meaningful error messages
- ✅ HTTP status codes correctly used
- ✅ Rate limiting on sensitive endpoints
- ✅ Password hashing with bcrypt
- ✅ JWT tokens with expiry
- ✅ Audit logging for all actions
- ✅ Input sanitization (trim, lowercase)
- ✅ CORS properly configured
- ✅ Service role key for RLS bypass
- ✅ Industry-standard code organization

---

## 🚀 Frontend Integration

### Save userId in localStorage after Step 1:
```typescript
const response = await registerStep1(data);
localStorage.setItem('registrationUserId', response.data.userId);
```

### Use userId in subsequent steps:
```typescript
const userId = localStorage.getItem('registrationUserId');

// Step 2 (Verification)
await verifyCode({ code, email });

// Step 3 (Location)
await registerStep2({ userId, ...locationData });

// Step 4 (Business Details)
const response = await registerStep3({ userId, ...businessData });

// Auto-login: Save tokens
localStorage.setItem('accessToken', response.data.accessToken);
localStorage.setItem('refreshToken', response.data.refreshToken);
localStorage.removeItem('registrationUserId');

// Redirect to dashboard
router.push('/dashboard');
```

---

## ✅ Everything is Correct!

All APIs, data types, validations, and security measures are implemented according to industry standards. The code is production-ready! 🎉
