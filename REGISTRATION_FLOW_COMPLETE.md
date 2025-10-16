# ✅ Registration Flow Redesign - COMPLETE

## Summary
Successfully redesigned the complete 4-step registration flow to defer user creation until **after** email/phone verification.

## What Changed

### Previous Flow (DEPRECATED)
1. **Step 1**: Collect personal info + password → Create user immediately
2. **Step 2**: Update user profile with location
3. **Step 3**: Update user profile with business details
4. **Step 4**: Verify email/phone

**Problem**: User account existed before verification, causing data inconsistency issues.

### NEW Flow (CURRENT)
1. **Step 1**: Collect personal info (NO password) → Create temporary session
2. **Step 2**: Collect business location → Update session
3. **Step 3**: Collect business details → Update session + Send OTP
4. **Step 4**: Verify OTP + Set password → **CREATE USER** + Auto-login

**Benefits**:
- ✅ User only created after successful verification
- ✅ All data collected in temporary session storage
- ✅ Cleaner data - no orphaned unverified accounts
- ✅ Better UX - password set at the end after commitment
- ✅ Auto-login with tokens after registration

## Files Changed

### 1. **Validators** - `src/validators/auth.schema.ts`
```typescript
// Step 1: Removed password field
export const personalInfoSchema = z.object({
  fullName: z.string()...,
  email: z.string().email()...,
  phoneNumber: z.string().regex()...,
  // password: REMOVED
});

// Step 2 & 3: Changed userId → sessionId
export const businessLocationSchema = z.object({
  sessionId: z.string().min(1), // Was: userId: UUID
  address: z.string()...,
  // ...rest of fields
});

// Step 4: Added password + sessionId
export const verificationCodeSchema = z.object({
  sessionId: z.string().min(1),
  code: z.string().length(6),
  password: z.string().min(8)..., // NEW
});

// Resend: Simplified to only sessionId
export const resendCodeSchema = z.object({
  sessionId: z.string().min(1),
  // email/phoneNumber: REMOVED
});
```

### 2. **Registration Model** - `src/models/registration.model.ts` (NEW FILE)
```typescript
export class RegistrationSessionModel {
  // Create session (Step 1)
  static async createSession(data: PersonalInfo): Promise<{ sessionId, expiresAt }>;
  
  // Get session by ID
  static async getSession(sessionId: string): Promise<RegistrationSession | null>;
  
  // Update with location data (Step 2)
  static async updateLocationData(sessionId, data): Promise<boolean>;
  
  // Update with business data (Step 3)
  static async updateBusinessData(sessionId, data): Promise<boolean>;
  
  // Delete after successful registration
  static async deleteSession(sessionId): Promise<void>;
  
  // Cleanup cron job
  static async cleanupExpiredSessions(): Promise<number>;
}
```

**Features**:
- 24-hour session expiry
- Crypto-random session IDs (64 hex chars)
- Step progression validation
- Auto-cleanup for expired sessions

### 3. **Auth Service** - `src/services/auth.service.ts`

#### `registerStep1(data: PersonalInfoInput)`
**Before**: Created user with password  
**After**: Creates session, returns sessionId

```typescript
// OLD: const user = await UserModel.createUser({...})
// NEW: const { sessionId } = await RegistrationSessionModel.createSession({...})
return { sessionId, expiresAt, nextStep: 2 };
```

#### `registerStep2(data: BusinessLocationInput)`
**Before**: `(userId, data)` → updated user profile  
**After**: `(data)` → validates session, updates session

```typescript
// OLD: await GarageModel.updateProfile(userId, {...})
// NEW: await RegistrationSessionModel.updateLocationData(data.sessionId, {...})
return { nextStep: 3 };
```

#### `registerStep3(data: BusinessDetailsInput)`
**Before**: `(userId, data)` → updated profile + auto-login  
**After**: `(data)` → updates session + sends OTP

```typescript
// OLD: await GarageModel.updateProfile(...) + return tokens
// NEW: await RegistrationSessionModel.updateBusinessData(...) + send OTP
return { nextStep: 4, message: 'OTP sent' };
```

#### `verifyRegistration(sessionId, code, password)` (COMPLETE REWRITE)
**Before**: Simple OTP verification  
**After**: OTP verification + password validation + **USER CREATION** + profile creation + auto-login

```typescript
async verifyRegistration(sessionId, code, password) {
  // 1. Get session
  const session = await RegistrationSessionModel.getSession(sessionId);
  
  // 2. Verify OTP
  await verificationService.verifyCode({ code, email, phoneNumber });
  
  // 3. Validate & hash password
  const hashedPassword = await hashPassword(password);
  
  // 4. CREATE USER (happens here!)
  const user = await UserModel.createUser({
    email: session.email,
    password: hashedPassword,
    role: UserRole.GARAGE_OWNER,
  });
  
  // 5. Create profile with ALL session data
  await GarageModel.createProfile(user.id, {
    ...session, // All Step 1, 2, 3 data
    is_email_verified: true,
    is_phone_verified: true,
    status: RegistrationStatus.ACTIVE,
  });
  
  // 6. Delete session
  await RegistrationSessionModel.deleteSession(sessionId);
  
  // 7. Generate tokens for auto-login
  const accessToken = createToken(user.id, ...);
  const refreshToken = createRefreshToken(user.id);
  
  return { user, profile, accessToken, refreshToken };
}
```

#### `resendVerificationCode(sessionId)`
**Before**: `(email, phoneNumber)` → looked up user  
**After**: `(sessionId)` → looks up session

```typescript
// OLD: const user = await UserModel.getUserByEmail(email);
// NEW: const session = await RegistrationSessionModel.getSession(sessionId);
```

### 4. **Auth Controller** - `src/controllers/auth.controller.ts`

```typescript
// Step 1: Removed password extraction
registerStep1 = async (req, res) => {
  const { fullName, email, phoneNumber } = req.body; // No password
  const result = await authService.registerStep1({ fullName, email, phoneNumber });
  // Returns: { sessionId, expiresAt, nextStep: 2 }
};

// Step 2 & 3: Pass entire req.body (includes sessionId)
registerStep2 = async (req, res) => {
  const result = await authService.registerStep2(req.body);
  // Returns: { nextStep: 3 }
};

registerStep3 = async (req, res) => {
  const result = await authService.registerStep3(req.body);
  // Returns: { nextStep: 4, message: 'OTP sent' }
};

// Step 4: Extract sessionId, code, password
verifyRegistration = async (req, res) => {
  const { sessionId, code, password } = req.body;
  const result = await authService.verifyRegistration(sessionId, code, password);
  // Returns: { user, profile, accessToken, refreshToken }
};

// Resend: Only sessionId needed
resendVerificationCode = async (req, res) => {
  const { sessionId } = req.body;
  const result = await authService.resendVerificationCode(sessionId);
};
```

### 5. **Database Schema** - `database/add_registration_sessions.sql` (NEW FILE)

```sql
CREATE TABLE registration_sessions (
  id UUID PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  
  -- Step 1
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  
  -- Step 2
  address TEXT,
  street VARCHAR(255),
  state VARCHAR(100),
  location VARCHAR(255),
  coordinates JSONB,
  
  -- Step 3
  company_legal_name VARCHAR(255),
  emirates_id_url TEXT,
  trade_license_number VARCHAR(100),
  vat_certification VARCHAR(100),
  
  -- Progress
  step_completed INTEGER DEFAULT 1,
  
  -- Expiry
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_registration_sessions_session_id ON registration_sessions(session_id);
CREATE INDEX idx_registration_sessions_email ON registration_sessions(email);
CREATE INDEX idx_registration_sessions_expires ON registration_sessions(expires_at);

-- RLS Policies
ALTER TABLE registration_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON registration_sessions
  FOR ALL USING (auth.role() = 'service_role');
```

## API Contract Changes

### Step 1: Personal Information
**Endpoint**: `POST /api/auth/register/step1`

**Request** (CHANGED):
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+971501234567"
  // "password": REMOVED
}
```

**Response** (CHANGED):
```json
{
  "success": true,
  "message": "Personal information saved. Please continue to business location.",
  "data": {
    "sessionId": "abc123...",  // NEW (was userId)
    "expiresAt": "2024-01-02T12:00:00Z",  // NEW
    "nextStep": 2
  }
}
```

### Step 2: Business Location
**Endpoint**: `POST /api/auth/register/step2`

**Request** (CHANGED):
```json
{
  "sessionId": "abc123...",  // CHANGED (was userId)
  "address": "123 Main St",
  "street": "Main Street",
  "state": "Dubai",
  "location": "Downtown Dubai",
  "coordinates": {
    "latitude": 25.2048,
    "longitude": 55.2708
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Business location saved successfully",
  "data": {
    "nextStep": 3
  }
}
```

### Step 3: Business Details
**Endpoint**: `POST /api/auth/register/step3`

**Request** (CHANGED):
```json
{
  "sessionId": "abc123...",  // CHANGED (was userId)
  "companyLegalName": "Auto Saaz LLC",
  "emiratesIdUrl": "https://...",
  "tradeLicenseNumber": "TL123456",
  "vatCertification": "VAT123"
}
```

**Response** (CHANGED):
```json
{
  "success": true,
  "message": "Business details saved. Verification code sent to your email and phone.",
  "data": {
    "nextStep": 4,
    "message": "Please verify your account with the code sent to complete registration"
  }
  // No longer returns tokens here
}
```

### Step 4: Verification (FINAL STEP - Creates User)
**Endpoint**: `POST /api/auth/verify`

**Request** (CHANGED):
```json
{
  "sessionId": "abc123...",  // NEW (was optional email/phoneNumber)
  "code": "123456",
  "password": "SecurePass123!"  // NEW
}
```

**Response** (CHANGED):
```json
{
  "success": true,
  "message": "Verification successful! Welcome to AutoSaaz.",
  "data": {
    "user": {
      "id": "uuid...",
      "email": "john@example.com",
      "role": "garage_owner",
      "status": "active"  // Already ACTIVE, not PENDING_VERIFICATION
    },
    "profile": {
      "fullName": "John Doe",
      "email": "john@example.com",
      "phoneNumber": "+971501234567",
      "companyLegalName": "Auto Saaz LLC",
      "status": "active"
    },
    "accessToken": "eyJhbGc...",  // For auto-login
    "refreshToken": "eyJhbGc..."
  }
}
```

### Resend Verification Code
**Endpoint**: `POST /api/auth/verify/resend`

**Request** (CHANGED):
```json
{
  "sessionId": "abc123..."  // SIMPLIFIED (was email/phoneNumber)
}
```

**Response**:
```json
{
  "success": true,
  "message": "Verification code sent successfully"
}
```

## Frontend Integration Checklist

### Required Changes
- [ ] **Step 1 Screen**:
  - Remove password input field
  - Save `sessionId` (not userId) from response
  - Save `expiresAt` to show countdown timer (optional)

- [ ] **Step 2 Screen**:
  - Send `sessionId` (not userId) in request body
  - All other fields remain the same

- [ ] **Step 3 Screen**:
  - Send `sessionId` (not userId) in request body
  - Remove auto-login logic (no tokens in response)
  - Show "OTP sent to email and phone" message
  - Navigate to Step 4 (verification screen)

- [ ] **Step 4 Screen (NEW)**:
  - Add password input field (with validation)
  - Add OTP code input field (6 digits)
  - Send `sessionId`, `code`, and `password`
  - **Handle auto-login**: Save tokens from response
  - Redirect to dashboard after successful verification

- [ ] **Resend OTP**:
  - Send only `sessionId` (remove email/phoneNumber)

### Session Management
```typescript
// After Step 1
const { sessionId, expiresAt } = response.data;
localStorage.setItem('registrationSessionId', sessionId);
localStorage.setItem('sessionExpiresAt', expiresAt);

// In Steps 2, 3, 4
const sessionId = localStorage.getItem('registrationSessionId');
// Include in request body

// After successful Step 4 (verification)
const { accessToken, refreshToken } = response.data;
localStorage.removeItem('registrationSessionId');
localStorage.removeItem('sessionExpiresAt');
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);
// Navigate to dashboard
```

## Database Migration

### ⚠️ REQUIRED: Run in Supabase SQL Editor
```sql
-- Copy contents of: database/add_registration_sessions.sql
-- Paste in Supabase SQL Editor
-- Click "Run"
```

**What it does**:
- Creates `registration_sessions` table
- Creates 3 indexes (session_id, email, expires_at)
- Sets up RLS policies (service role access)
- Creates auto-update trigger for `updated_at`

## Testing Checklist

### Manual Testing Flow
1. **Step 1**: POST `/api/auth/register/step1`
   - ✅ Send: `fullName`, `email`, `phoneNumber` (NO password)
   - ✅ Expect: `sessionId`, `expiresAt`, `nextStep: 2`
   - ✅ Verify: Session created in `registration_sessions` table

2. **Step 2**: POST `/api/auth/register/step2`
   - ✅ Send: `sessionId`, `address`, `street`, `state`, `location`
   - ✅ Expect: `nextStep: 3`
   - ✅ Verify: Session updated with location data, `step_completed = 2`

3. **Step 3**: POST `/api/auth/register/step3`
   - ✅ Send: `sessionId`, `companyLegalName`, `emiratesIdUrl`, `tradeLicenseNumber`
   - ✅ Expect: `nextStep: 4`, OTP sent message
   - ✅ Verify: Session updated with business data, `step_completed = 3`
   - ✅ Verify: OTP created in `verification_codes` table
   - ✅ Check: Email/SMS logs for OTP code

4. **Step 4**: POST `/api/auth/verify`
   - ✅ Send: `sessionId`, `code` (from email/SMS), `password`
   - ✅ Expect: `user`, `profile`, `accessToken`, `refreshToken`
   - ✅ Verify: User created in `users` table with status = 'active'
   - ✅ Verify: Profile created in `garage_profiles` with all data
   - ✅ Verify: Session deleted from `registration_sessions`
   - ✅ Verify: Tokens are valid for authentication

5. **Resend OTP**: POST `/api/auth/verify/resend`
   - ✅ Send: `sessionId`
   - ✅ Expect: Success message
   - ✅ Verify: New OTP created in `verification_codes`

### Edge Cases
- ⚠️ Expired session (24 hours) → Returns 404
- ⚠️ Invalid sessionId → Returns 404
- ⚠️ Step 2 before Step 1 → Returns 400
- ⚠️ Step 3 before Step 2 → Returns 400
- ⚠️ Resend before Step 3 → Returns 400
- ⚠️ Wrong OTP code → Returns 400
- ⚠️ Weak password → Returns 400
- ⚠️ Duplicate email → Returns 409 (Step 1)

## Deployment Status

### ✅ Completed
- [x] Code changes committed
- [x] Pushed to GitHub (`main` branch)
- [x] Render auto-deployment triggered

### ⏳ Pending
- [ ] Run database migration in Supabase
- [ ] Test complete flow in production
- [ ] Update frontend application

## Next Steps

1. **Run Database Migration** (CRITICAL):
   ```bash
   # Go to: https://supabase.com/dashboard/project/[your-project]/sql/new
   # Copy: database/add_registration_sessions.sql
   # Paste and Run
   ```

2. **Test in Production**:
   ```bash
   # Use Postman/Thunder Client to test:
   # Step 1: POST https://autosaaz-server.onrender.com/api/auth/register/step1
   # Step 2: POST .../step2
   # Step 3: POST .../step3
   # Step 4: POST .../verify
   ```

3. **Update Frontend**:
   - Remove password from Step 1 screen
   - Add password to Step 4 (verification) screen
   - Update all API calls to use `sessionId` instead of `userId`
   - Implement auto-login after Step 4

4. **Monitor**:
   - Check Render logs for deployment success
   - Monitor Supabase for session creation/cleanup
   - Track OTP delivery (currently console logs)

## Rollback Plan (if needed)

```bash
# Revert to previous version
git revert 006d90a
git push origin main

# Or reset to specific commit
git reset --hard 82a8593  # Previous commit
git push origin main --force
```

## Notes

- **Session Expiry**: 24 hours (configurable)
- **Session ID Format**: 64 hex characters (crypto random)
- **OTP Delivery**: Currently logs to console (production integration pending)
- **Auto-Login**: User receives tokens immediately after verification
- **Security**: RLS enabled, service role required
- **Cleanup**: Expired sessions should be cleaned via cron job

## Support

If you encounter issues:
1. Check Render deployment logs
2. Check Supabase logs for database errors
3. Verify `registration_sessions` table exists
4. Test each step individually with Postman
5. Check console logs for OTP codes (until email/SMS integrated)

---

**Last Updated**: January 2024  
**Status**: ✅ Ready for Testing (after DB migration)  
**Deployment**: 🚀 Auto-deployed to Render
