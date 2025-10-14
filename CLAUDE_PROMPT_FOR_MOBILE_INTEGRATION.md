# Claude Prompt: Implement AutoSaaz API Integration for Garage Mobile App

## Context
I have a Node.js Express + Supabase backend server running at `http://localhost:3000` with professional authentication APIs. I need to integrate these APIs into my React Native/Flutter/Mobile garage application that has the UI screens already built.

## Backend API Details

### Base URL
```
http://localhost:3000/api
```

### Available Endpoints

#### 1. **Registration Step 1 - Personal Information**
```http
POST /api/auth/register/step1
Content-Type: application/json

Request Body:
{
  "fullName": "string (3-100 chars, letters and spaces only)",
  "email": "string (valid email, lowercase)",
  "phoneNumber": "string (UAE format: +971XXXXXXXXX)",
  "password": "string (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)"
}

Success Response (201):
{
  "success": true,
  "message": "Registration successful. Please verify your email or phone number.",
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "phoneNumber": "+971501234567",
    "requiresVerification": true
  },
  "meta": {
    "timestamp": "2025-10-14T..."
  }
}

Error Response (400/409):
{
  "success": false,
  "message": "Error description",
  "errors": [...],
  "meta": {
    "timestamp": "2025-10-14T..."
  }
}
```

#### 2. **Registration Step 2 - Business Location**
```http
POST /api/auth/register/step2
Content-Type: application/json

Request Body:
{
  "userId": "uuid (from step 1 response)",
  "address": "string (5-255 chars)",
  "street": "string (3-100 chars)",
  "state": "string (2-50 chars)",
  "location": "string (2-100 chars)",
  "coordinates": {  // Optional
    "latitude": number,
    "longitude": number
  }
}

Success Response (200):
{
  "success": true,
  "message": "Business location saved successfully",
  "data": {},
  "meta": { "timestamp": "..." }
}
```

#### 3. **Registration Step 3 - Business Details**
```http
POST /api/auth/register/step3
Content-Type: application/json

Request Body:
{
  "userId": "uuid",
  "companyLegalName": "string (3-255 chars)",
  "emiratesIdUrl": "string (URL from file upload)",
  "tradeLicenseNumber": "string (5-50 chars, uppercase)",
  "vatCertification": "string (optional, max 50 chars, uppercase)"
}

Success Response (200):
{
  "success": true,
  "message": "Business details saved successfully",
  "data": {},
  "meta": { "timestamp": "..." }
}
```

#### 4. **Verify Registration (OTP)**
```http
POST /api/auth/verify
Content-Type: application/json

Request Body:
{
  "code": "string (6 digits)",
  "email": "string (optional)",
  "phoneNumber": "string (optional)"
}

Success Response (200):
{
  "success": true,
  "message": "Verification successful. Your account is now active.",
  "data": {},
  "meta": { "timestamp": "..." }
}
```

#### 5. **Resend Verification Code**
```http
POST /api/auth/verify/resend
Content-Type: application/json

Request Body:
{
  "email": "string (optional)",
  "phoneNumber": "string (optional)"
}

Success Response (200):
{
  "success": true,
  "message": "Verification code sent successfully",
  "data": {},
  "meta": { "timestamp": "..." }
}
```

#### 6. **Login**
```http
POST /api/auth/login
Content-Type: application/json

Request Body:
{
  "email": "string",
  "password": "string"
}

Success Response (200):
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "garage_owner",
      "status": "active",
      "createdAt": "2025-10-14T...",
      // password excluded for security
    },
    "profile": {
      "fullName": "John Smith",
      "email": "john@example.com",
      "phoneNumber": "+971501234567",
      "companyLegalName": "Smith Auto Garage LLC",
      "status": "active"
    },
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  },
  "meta": { "timestamp": "..." }
}

Error Responses:
- 401: Invalid credentials
- 403: Email not verified
- 423: Account locked
```

#### 7. **Logout**
```http
POST /api/auth/logout
Content-Type: application/json

Request Body:
{
  "userId": "uuid (optional)"
}

Success Response (200):
{
  "success": true,
  "message": "Logout successful",
  "data": {},
  "meta": { "timestamp": "..." }
}
```

---

## Requirements

Please implement the following in my garage mobile app:

### 1. **API Service Layer**
Create a professional API service module with:
- Base URL configuration (environment-based)
- HTTP client setup (Axios/Fetch)
- Request/Response interceptors
- Error handling with proper types
- Token management (store/retrieve/refresh)
- Automatic retry logic for failed requests

### 2. **Authentication Flow**
Implement the complete 4-step registration flow:

**Screen 1: Personal Info (Login/Register Screen)**
- Input fields: Full Name, Email, Phone, Password
- Validation: Real-time validation matching backend rules
- Submit: Call `/api/auth/register/step1`
- Store `userId` from response for next steps
- Navigate to verification screen

**Screen 2: Verification (OTP Screen)**
- 6-digit OTP input
- Call `/api/auth/verify` with code
- Resend OTP button → `/api/auth/verify/resend`
- On success, navigate to Step 2

**Screen 3: Business Location**
- Input fields: Address, Street, State, Location
- Optional: GPS coordinates picker
- Submit: Call `/api/auth/register/step2` with userId
- Navigate to Step 3

**Screen 4: Business Details**
- Input fields: Company Name, Trade License, VAT
- File picker for Emirates ID (implement upload separately)
- Submit: Call `/api/auth/register/step3`
- On success, navigate to login or home

**Login Screen**
- Input: Email, Password
- Submit: Call `/api/auth/login`
- Store tokens securely (AsyncStorage/SecureStore)
- Store user profile in state management
- Navigate to home screen

### 3. **State Management**
Implement auth state management using (choose one):
- Redux Toolkit
- Zustand
- Context API + useReducer
- MobX

Store:
- User profile
- Authentication status
- Access token
- Refresh token
- Registration progress (current step, userId)

### 4. **Secure Storage**
- Store tokens securely (not plain AsyncStorage)
- Use: react-native-encrypted-storage or expo-secure-store
- Clear tokens on logout

### 5. **Error Handling**
Handle all API errors gracefully:
- Network errors
- Validation errors (400)
- Unauthorized (401) → redirect to login
- Conflict errors (409) - email exists
- Account locked (423)
- Server errors (500)

Display user-friendly error messages.

### 6. **Loading States**
Show loading indicators during:
- Registration steps
- Login
- OTP verification
- API calls

### 7. **Form Validation**
Client-side validation matching backend rules:
- Email: Valid email format
- Phone: UAE format (+971XXXXXXXXX)
- Password: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special
- Full Name: 3-100 chars, letters and spaces only
- All required fields

### 8. **Navigation**
- Protected routes (require authentication)
- Public routes (login, register)
- Auto-redirect if already authenticated
- Persist auth state across app restarts

### 9. **TypeScript Types**
Create type definitions for:
- API requests
- API responses
- User profile
- Garage profile
- Auth state

### 10. **Testing Considerations**
- Use mock API in development
- Switch to real API for production
- Environment variables for API URL

---

## Code Structure Expected

```
src/
├── api/
│   ├── client.ts           # HTTP client setup
│   ├── auth.api.ts         # Auth API calls
│   └── interceptors.ts     # Request/response interceptors
├── services/
│   ├── auth.service.ts     # Auth business logic
│   └── storage.service.ts  # Secure storage
├── store/ (or state/)
│   ├── auth/
│   │   ├── authSlice.ts    # Auth state
│   │   └── authActions.ts  # Auth actions
│   └── index.ts
├── types/
│   ├── api.types.ts        # API types
│   └── user.types.ts       # User types
├── utils/
│   ├── validation.ts       # Form validation
│   └── constants.ts        # API URLs, etc
└── screens/
    ├── auth/
    │   ├── LoginScreen.tsx
    │   ├── RegisterStep1Screen.tsx
    │   ├── RegisterStep2Screen.tsx
    │   ├── RegisterStep3Screen.tsx
    │   └── VerificationScreen.tsx
    └── ...
```

---

## Implementation Guidelines

### 1. **Use Environment Variables**
```typescript
// .env or config
API_BASE_URL=http://localhost:3000/api
API_TIMEOUT=30000
```

### 2. **HTTP Client Example (Axios)**
```typescript
import axios from 'axios';
import { getToken, clearTokens } from './storage.service';

const apiClient = axios.create({
  baseURL: process.env.API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      await clearTokens();
      // Navigate to login
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 3. **Type Safety**
```typescript
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
  meta: {
    timestamp: string;
  };
}

interface RegisterStep1Request {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

interface RegisterStep1Response {
  userId: string;
  email: string;
  phoneNumber: string;
  requiresVerification: boolean;
}

interface LoginResponse {
  user: User;
  profile: GarageProfile;
  accessToken: string;
  refreshToken: string;
}
```

### 4. **Error Messages**
Display appropriate messages for each error:
- Email already exists → "This email is already registered. Please login instead."
- Invalid password → "Password must be at least 8 characters with uppercase, lowercase, number, and special character."
- Account locked → "Too many failed attempts. Your account is temporarily locked."
- OTP expired → "Verification code expired. Please request a new one."

---

## Security Best Practices

1. **Never log sensitive data** (passwords, tokens)
2. **Store tokens securely** (encrypted storage)
3. **Clear tokens on logout**
4. **Validate all inputs client-side** before sending
5. **Handle token refresh** if implementing
6. **Use HTTPS in production**
7. **Implement biometric auth** (optional enhancement)

---

## Testing the Integration

Before implementing, test all endpoints using:
- Postman
- cURL
- HTTP client in browser console

Example test:
```javascript
fetch('http://localhost:3000/api/auth/register/step1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fullName: 'John Smith',
    email: 'john@example.com',
    phoneNumber: '+971501234567',
    password: 'Test@123456'
  })
})
.then(res => res.json())
.then(console.log);
```

---

## Development Notes

- **OTP Codes**: In development, check server console for OTP codes (they're logged)
- **Rate Limiting**: 5 login attempts per 15 minutes
- **Token Expiry**: Access token valid for 7 days, refresh token for 30 days
- **Account Lockout**: 5 failed login attempts locks account for 30 minutes

---

## Expected Deliverables

1. ✅ Complete API service layer with all endpoints
2. ✅ 4-step registration flow fully functional
3. ✅ Login/Logout functionality
4. ✅ Secure token storage
5. ✅ State management for auth
6. ✅ Form validation matching backend
7. ✅ Error handling with user-friendly messages
8. ✅ Loading states and UX feedback
9. ✅ TypeScript types for all API interactions
10. ✅ Protected route navigation

---

## Additional Enhancements (Optional)

- Biometric authentication (Face ID/Touch ID)
- Remember me functionality
- Auto-fill OTP from SMS
- Password strength indicator
- Social login integration
- Profile update APIs (implement later)

---

Please implement this integration professionally with:
- Clean, maintainable code
- Proper error handling
- TypeScript type safety
- User-friendly UX
- Security best practices
- Code comments where needed

Let me know if you need clarification on any endpoint or requirement!
