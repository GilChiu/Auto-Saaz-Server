# Registration Flow Analysis & Improvements

## Current Issues

### 1. **User Created Before Verification** ❌
- User and profile are created in Step 1
- User can proceed to Step 2-4 without verification
- This violates security best practices

### 2. **Status Flow Problems** ❌
Current flow:
```
Step 1 → User Created (pending_verification)
Step 2 → Location Updated (still pending_verification)
Step 3 → Business Details Updated (still pending_verification)
Step 4 → Verification → Status: VERIFIED or ACTIVE
```

### 3. **Data Type Issues** ⚠️
- `userId` needs to be passed from Step 1 to subsequent steps
- Coordinates should be optional in Step 2
- VAT Certification should be truly optional

---

## Recommended Industry-Standard Flow

### ✅ **Corrected Registration Flow**

```
Step 1: Personal Info
├─ Validate data
├─ Check email uniqueness
├─ Hash password
├─ Create user (status: PENDING_VERIFICATION)
├─ Create profile (minimal data)
├─ Generate & send OTP
└─ Return userId + verification requirement

Step 4: Verify Email/Phone (MOVED HERE)
├─ Validate OTP
├─ Mark user as VERIFIED
├─ Update verification timestamps
└─ Allow proceeding to Step 2

Step 2: Business Location
├─ Require userId
├─ Check user is VERIFIED
├─ Update profile with location
└─ Return success

Step 3: Business Details
├─ Require userId
├─ Check user is VERIFIED
├─ Upload Emirates ID
├─ Update profile with business details
├─ Change status to ACTIVE (full registration complete)
└─ Return success + access tokens

Login
├─ Check user status (must be ACTIVE to login)
├─ Verify password
├─ Generate tokens
└─ Return user data + tokens
```

---

## Status Transitions

```
PENDING_VERIFICATION (Step 1 creates user)
         ↓
    [OTP Verified]
         ↓
VERIFIED (Can now complete Step 2 & 3)
         ↓
  [Step 3 completed]
         ↓
ACTIVE (Fully registered, can login)
```

---

## Required Code Changes

### 1. **Reorder Routes**
```
POST /api/auth/register/step1  ← Personal Info
POST /api/auth/verify          ← VERIFY FIRST (Step 4 becomes Step 2)
POST /api/auth/register/step2  ← Location (requires verification)
POST /api/auth/register/step3  ← Business Details (completes registration)
```

### 2. **Add Middleware**
- `requireVerification` - Check user is verified before Step 2/3
- `requireActiveStatus` - Check user is active before login

### 3. **Update Validations**
- Step 2/3 must include `userId` in request body
- Coordinates should be optional
- VAT can be empty string

### 4. **Fix Response DTOs**
- Step 1: Return `{userId, email, phoneNumber, requiresVerification: true}`
- Step 4 (Verify): Return `{verified: true, canProceed: true}`
- Step 2: Return `{success: true, nextStep: 3}`
- Step 3: Return `{success: true, user, accessToken, refreshToken}` (login automatically)

---

## Security Best Practices Applied

✅ Email verification before allowing data entry
✅ Rate limiting on sensitive endpoints
✅ Password strength validation
✅ Proper status transitions
✅ Input sanitization and validation
✅ Audit trail with proper logging
✅ JWT tokens only after full registration

---

## Frontend Flow (Based on Screenshots)

```
Screen 1: Personal Info
  ↓ [Submit]
  userId stored in state/localStorage

Screen 2: Verification (OTP)
  ↓ [Verify]
  Verification confirmed

Screen 3: Business Location
  ↓ [Submit with userId]
  Location saved

Screen 4: Business Details
  ↓ [Submit with userId]
  Registration complete → Auto-login → Redirect to Dashboard
```
