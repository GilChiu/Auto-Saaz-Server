# Integration Prompt for AutoSaaz Garage Frontend

Copy this entire prompt and paste it into Claude when working on your Garage frontend repository.

---

## CONTEXT

I need to integrate the AutoSaaz backend registration API into my garage frontend application. The backend has a **4-step registration flow** where the user account is created **AFTER** email/phone verification (not before).

## BACKEND API DETAILS

**Base URL**: `https://autosaaz-server.onrender.com`

### Registration Flow Overview

The registration is split into 4 steps:
1. **Step 1**: Personal Information (NO password) → Returns `sessionId`
2. **Step 2**: Business Location → Updates session
3. **Step 3**: Business Details → Updates session + sends OTP
4. **Step 4**: Verification (OTP + Password) → Creates user account + auto-login

### Important Changes from Traditional Flow:
- ❌ **NO** password in Step 1
- ✅ Password is collected in Step 4 (verification screen)
- ✅ Use `sessionId` (not `userId`) for Steps 2, 3, 4
- ✅ User account is created AFTER OTP verification
- ✅ Automatic login tokens provided after Step 4

---

## API ENDPOINTS

### Step 1: Personal Information
**Endpoint**: `POST /api/auth/register/step1`

**Request Body**:
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+971501234567"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Personal information saved. Please continue to business location.",
  "data": {
    "sessionId": "abc123def456...",
    "expiresAt": "2025-10-18T12:00:00.000Z",
    "nextStep": 2
  }
}
```

**Error Response** (409 Conflict - Email exists):
```json
{
  "success": false,
  "message": "Email already registered",
  "error": "Conflict"
}
```

**Action Required**:
- ✅ Save `sessionId` to localStorage/state
- ✅ Save `expiresAt` (optional - for countdown timer)
- ✅ Navigate to Step 2 (Business Location screen)

---

### Step 2: Business Location
**Endpoint**: `POST /api/auth/register/step2`

**Request Body**:
```json
{
  "sessionId": "abc123def456...",
  "address": "Building 123, Sheikh Zayed Road",
  "street": "Sheikh Zayed Road",
  "state": "Dubai",
  "location": "Downtown Dubai",
  "coordinates": {
    "latitude": 25.2048,
    "longitude": 55.2708
  }
}
```

**Note**: `coordinates` is optional but recommended.

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Business location saved successfully",
  "data": {
    "nextStep": 3
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Please complete Step 1 first",
  "error": "Bad Request"
}
```

**Action Required**:
- ✅ Navigate to Step 3 (Business Details screen)

---

### Step 3: Business Details
**Endpoint**: `POST /api/auth/register/step3`

**Request Body**:
```json
{
  "sessionId": "abc123def456...",
  "companyLegalName": "Auto Saaz Garage LLC",
  "emiratesIdUrl": "https://storage.supabase.co/...",
  "tradeLicenseNumber": "TL123456789",
  "vatCertification": "VAT987654321"
}
```

**Note**: `vatCertification` is optional.

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Business details saved. Verification code sent to your email and phone.",
  "data": {
    "nextStep": 4,
    "message": "Please verify your account with the code sent to complete registration"
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Please complete Step 2 first",
  "error": "Bad Request"
}
```

**Action Required**:
- ✅ Show success message: "OTP sent to your email and phone"
- ✅ Navigate to Step 4 (Verification screen)

---

### Step 4: Verification (Creates User Account)
**Endpoint**: `POST /api/auth/verify`

**Request Body**:
```json
{
  "sessionId": "abc123def456...",
  "code": "123456",
  "password": "SecurePass123!"
}
```

**Password Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Verification successful! Welcome to AutoSaaz.",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "john@example.com",
      "role": "garage_owner",
      "status": "active",
      "createdAt": "2025-10-17T10:00:00.000Z"
    },
    "profile": {
      "fullName": "John Doe",
      "email": "john@example.com",
      "phoneNumber": "+971501234567",
      "companyLegalName": "Auto Saaz Garage LLC",
      "status": "active"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response** (400 Bad Request - Invalid OTP):
```json
{
  "success": false,
  "message": "Invalid or expired verification code",
  "error": "Bad Request"
}
```

**Action Required**:
- ✅ Clear `sessionId` from storage
- ✅ Save `accessToken` and `refreshToken` to localStorage
- ✅ Save user and profile data to global state
- ✅ Navigate to dashboard/home screen
- ✅ Show success message: "Welcome to AutoSaaz!"

---

### Resend OTP
**Endpoint**: `POST /api/auth/verify/resend`

**Request Body**:
```json
{
  "sessionId": "abc123def456..."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Verification code sent successfully"
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Please complete all steps before requesting verification code",
  "error": "Bad Request"
}
```

**Action Required**:
- ✅ Show success message
- ✅ Optionally start countdown timer (e.g., "Resend available in 60s")

---

## IMPLEMENTATION REQUIREMENTS

### 1. Create Registration Screens

You need 4 screens:

#### Screen 1: Personal Information
**Fields**:
- Full Name (text input)
- Email (email input)
- Phone Number (phone input with UAE country code)

**Removed**: ❌ Password field (NO LONGER NEEDED HERE)

**Validation**:
- Full name: 3-100 characters, letters and spaces only
- Email: Valid email format
- Phone: UAE format (+971XXXXXXXXX or 05XXXXXXXX)

**Submit Action**:
```typescript
const response = await fetch('https://autosaaz-server.onrender.com/api/auth/register/step1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fullName, email, phoneNumber })
});

const result = await response.json();

if (result.success) {
  // Save sessionId
  localStorage.setItem('registrationSessionId', result.data.sessionId);
  localStorage.setItem('sessionExpiresAt', result.data.expiresAt);
  
  // Navigate to Step 2
  navigate('/register/location');
}
```

#### Screen 2: Business Location
**Fields**:
- Address (textarea)
- Street (text input)
- State/Emirate (dropdown: Dubai, Abu Dhabi, Sharjah, etc.)
- Location/City (text input)
- Coordinates (optional - from map picker)

**Submit Action**:
```typescript
const sessionId = localStorage.getItem('registrationSessionId');

const response = await fetch('https://autosaaz-server.onrender.com/api/auth/register/step2', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId,
    address,
    street,
    state,
    location,
    coordinates // optional
  })
});

const result = await response.json();

if (result.success) {
  navigate('/register/business');
}
```

#### Screen 3: Business Details
**Fields**:
- Company Legal Name (text input)
- Emirates ID (file upload → get URL from your storage)
- Trade License Number (text input)
- VAT Certification (text input, optional)

**Submit Action**:
```typescript
const sessionId = localStorage.getItem('registrationSessionId');

const response = await fetch('https://autosaaz-server.onrender.com/api/auth/register/step3', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId,
    companyLegalName,
    emiratesIdUrl,
    tradeLicenseNumber,
    vatCertification
  })
});

const result = await response.json();

if (result.success) {
  // Show OTP sent message
  toast.success('Verification code sent to your email and phone!');
  navigate('/register/verify');
}
```

#### Screen 4: Verification (NEW - Most Important Change)
**Fields**:
- OTP Code (6-digit input)
- Password (password input) ⭐ **NEW - PASSWORD IS HERE NOW**
- Confirm Password (password input)

**Password Requirements Display**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Submit Action**:
```typescript
const sessionId = localStorage.getItem('registrationSessionId');

const response = await fetch('https://autosaaz-server.onrender.com/api/auth/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId,
    code,
    password
  })
});

const result = await response.json();

if (result.success) {
  // Clear session data
  localStorage.removeItem('registrationSessionId');
  localStorage.removeItem('sessionExpiresAt');
  
  // Save auth tokens
  localStorage.setItem('accessToken', result.data.accessToken);
  localStorage.setItem('refreshToken', result.data.refreshToken);
  
  // Save user data
  localStorage.setItem('user', JSON.stringify(result.data.user));
  
  // Navigate to dashboard
  navigate('/dashboard');
  toast.success('Welcome to AutoSaaz!');
}
```

**Resend OTP Button**:
```typescript
const resendOTP = async () => {
  const sessionId = localStorage.getItem('registrationSessionId');
  
  const response = await fetch('https://autosaaz-server.onrender.com/api/auth/verify/resend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId })
  });
  
  const result = await response.json();
  
  if (result.success) {
    toast.success('Verification code sent!');
  }
};
```

---

### 2. Session Management

**Store Session ID**:
```typescript
// After Step 1
localStorage.setItem('registrationSessionId', sessionId);
localStorage.setItem('sessionExpiresAt', expiresAt);
```

**Retrieve Session ID**:
```typescript
// In Steps 2, 3, 4
const sessionId = localStorage.getItem('registrationSessionId');
```

**Clear Session After Success**:
```typescript
// After Step 4 verification
localStorage.removeItem('registrationSessionId');
localStorage.removeItem('sessionExpiresAt');
```

**Optional: Session Expiry Timer**:
```typescript
const expiresAt = localStorage.getItem('sessionExpiresAt');
const timeRemaining = new Date(expiresAt) - new Date();

if (timeRemaining <= 0) {
  // Session expired
  toast.error('Session expired. Please start registration again.');
  navigate('/register/step1');
}
```

---

### 3. Error Handling

**Handle Different HTTP Status Codes**:
```typescript
const handleResponse = async (response) => {
  const result = await response.json();
  
  if (response.status === 201 || response.status === 200) {
    return result; // Success
  }
  
  if (response.status === 400) {
    // Bad request - validation error
    throw new Error(result.message || 'Invalid input');
  }
  
  if (response.status === 404) {
    // Session not found or expired
    toast.error('Session expired. Please start over.');
    navigate('/register/step1');
    throw new Error('Session expired');
  }
  
  if (response.status === 409) {
    // Conflict - email already exists
    throw new Error(result.message || 'Email already registered');
  }
  
  throw new Error('Something went wrong. Please try again.');
};
```

---

### 4. Form Validation

**Client-side validation before API calls**:

```typescript
// Step 1 Validation
const validateStep1 = (data) => {
  const errors = {};
  
  if (!data.fullName || data.fullName.length < 3) {
    errors.fullName = 'Full name must be at least 3 characters';
  }
  
  if (!/^[a-zA-Z\s]+$/.test(data.fullName)) {
    errors.fullName = 'Full name can only contain letters and spaces';
  }
  
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Please enter a valid email';
  }
  
  const phoneRegex = /^(\+971|971|0)?[1-9][0-9]{8}$/;
  if (!data.phoneNumber || !phoneRegex.test(data.phoneNumber)) {
    errors.phoneNumber = 'Please enter a valid UAE phone number';
  }
  
  return errors;
};

// Step 4 Validation (Password)
const validatePassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  
  if (!passwordRegex.test(password)) {
    return 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
  }
  
  return null;
};
```

---

### 5. State Management (Example with React Context)

```typescript
// AuthContext.tsx
interface RegistrationState {
  sessionId: string | null;
  currentStep: number;
  expiresAt: string | null;
}

const RegistrationContext = createContext({
  registration: { sessionId: null, currentStep: 1, expiresAt: null },
  setSessionId: (id: string, expiresAt: string) => {},
  clearSession: () => {},
  goToNextStep: () => {}
});

export const RegistrationProvider = ({ children }) => {
  const [registration, setRegistration] = useState<RegistrationState>({
    sessionId: localStorage.getItem('registrationSessionId'),
    currentStep: 1,
    expiresAt: localStorage.getItem('sessionExpiresAt')
  });
  
  const setSessionId = (id: string, expiresAt: string) => {
    localStorage.setItem('registrationSessionId', id);
    localStorage.setItem('sessionExpiresAt', expiresAt);
    setRegistration({ ...registration, sessionId: id, expiresAt });
  };
  
  const clearSession = () => {
    localStorage.removeItem('registrationSessionId');
    localStorage.removeItem('sessionExpiresAt');
    setRegistration({ sessionId: null, currentStep: 1, expiresAt: null });
  };
  
  return (
    <RegistrationContext.Provider value={{ registration, setSessionId, clearSession }}>
      {children}
    </RegistrationContext.Provider>
  );
};
```

---

### 6. UI/UX Recommendations

**Progress Indicator**:
```jsx
<ProgressSteps currentStep={currentStep}>
  <Step number={1} label="Personal Info" />
  <Step number={2} label="Location" />
  <Step number={3} label="Business" />
  <Step number={4} label="Verify" />
</ProgressSteps>
```

**Session Timer** (Optional):
```jsx
const SessionTimer = () => {
  const expiresAt = localStorage.getItem('sessionExpiresAt');
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(expiresAt));
  
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft(expiresAt);
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
        // Handle expiry
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [expiresAt]);
  
  return <div>Session expires in: {formatTime(timeLeft)}</div>;
};
```

**OTP Input Component**:
```jsx
<OTPInput
  length={6}
  value={code}
  onChange={setCode}
  autoFocus
/>
```

**Password Strength Indicator**:
```jsx
<PasswordStrengthMeter password={password} />
```

---

## TESTING CHECKLIST

After implementing the integration:

- [ ] **Step 1**: Can submit personal info without password
- [ ] **Step 1**: Receives and stores sessionId
- [ ] **Step 1**: Shows error if email already exists
- [ ] **Step 2**: Sends sessionId with location data
- [ ] **Step 2**: Shows error if Step 1 not completed
- [ ] **Step 3**: Sends sessionId with business data
- [ ] **Step 3**: Shows "OTP sent" message
- [ ] **Step 4**: Password input field exists
- [ ] **Step 4**: Can verify OTP with password
- [ ] **Step 4**: Receives and stores auth tokens
- [ ] **Step 4**: Auto-login works after verification
- [ ] **Resend OTP**: Can resend verification code
- [ ] **Session Expiry**: Handles 24-hour expiration
- [ ] **Error Handling**: Shows appropriate error messages
- [ ] **Navigation**: Can move between steps properly
- [ ] **Back Button**: Properly handles going back to previous steps

---

## IMPORTANT NOTES

1. **Password is NOW in Step 4** (verification screen), NOT in Step 1
2. **Use sessionId** everywhere, NOT userId (user doesn't exist until Step 4)
3. **User account is created** in Step 4 after OTP verification
4. **Auto-login** happens after Step 4 (tokens provided in response)
5. **Session expires** in 24 hours - handle this gracefully
6. **OTP is sent** after Step 3 completion
7. **Backend uses service role** - no need to send auth headers during registration

---

## EXAMPLE API CALL SEQUENCE

```
1. POST /api/auth/register/step1
   → Receive: sessionId

2. POST /api/auth/register/step2
   → Send: sessionId + location data

3. POST /api/auth/register/step3
   → Send: sessionId + business data
   → Backend sends OTP

4. POST /api/auth/verify
   → Send: sessionId + OTP + password
   → Receive: user, profile, accessToken, refreshToken
   → Auto-login

5. (Optional) POST /api/auth/verify/resend
   → Send: sessionId
   → Receive: new OTP
```

---

## SUPPORT

If you encounter issues:
1. Check that you're sending `sessionId` in Steps 2, 3, 4
2. Verify that password is in Step 4, not Step 1
3. Check response status codes and error messages
4. Ensure session hasn't expired (24 hours)
5. Check network tab in DevTools for request/response details

Backend GitHub: https://github.com/GilChiu/Auto-Saaz-Server
Backend Deployment: https://autosaaz-server.onrender.com

---

## TASK

Please help me implement this 4-step registration flow in my garage frontend application. I need:

1. 4 registration screens (Personal Info, Location, Business, Verification)
2. Password field moved from Step 1 to Step 4
3. Session management with sessionId
4. API integration for all 4 steps + resend OTP
5. Error handling for all edge cases
6. Auto-login after successful verification
7. Proper form validation
8. Good UI/UX with progress indicator

Please create the necessary components, screens, API service functions, and state management required for this flow.
