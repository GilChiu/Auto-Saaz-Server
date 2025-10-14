# 🚗 AutoSaaz Server - Garage Management API

> **Professional, secure, and scalable API built with Node.js, Express, TypeScript, and Supabase**

Enterprise-grade authentication system with multi-step garage registration, OTP verification, and comprehensive security features.

---

## ✨ Features

### 🔐 **Authentication & Security**
- ✅ Multi-step garage registration (matching mobile UI flow)
- ✅ Email & phone verification with OTP
- ✅ Secure password hashing (BCrypt with 12 rounds)
- ✅ JWT authentication (access + refresh tokens)
- ✅ Account lockout after failed login attempts
- ✅ Rate limiting on authentication endpoints
- ✅ Role-based access control (Garage Owner, Admin, Mobile User)

### 📝 **Registration Flow** (4 Steps)
1. **Personal Information**: Full name, email, phone, password
2. **Business Location**: Address, street, state, location, GPS coordinates
3. **Business Details**: Company name, Emirates ID, trade license, VAT
4. **Verification**: OTP validation via email/SMS

### 📁 **File Management**
- ✅ Emirates ID document upload
- ✅ Supabase Storage integration
- ✅ File type and size validation
- ✅ Secure file access with signed URLs

### 🛡️ **Security Features**
- ✅ Input validation with Zod schemas
- ✅ Password strength requirements
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CORS configuration
- ✅ Request logging
- ✅ Error handling middleware

### 🏗️ **Architecture**
- ✅ TypeScript for type safety
- ✅ MVC design pattern
- ✅ Service layer architecture
- ✅ Middleware-based request processing
- ✅ Standardized API responses
- ✅ Comprehensive error handling

---

## 🚀 Quick Start

### 📋 Prerequisites
- Node.js 18+ and npm 9+
- Supabase account and project
- Basic knowledge of REST APIs

### ⚡ Installation

1. **Install dependencies:**
```powershell
npm install
```

2. **Setup environment:**
```powershell
Copy-Item .env.example .env
# Edit .env with your Supabase credentials
```

3. **Setup database:**
- Open Supabase SQL Editor
- Run `database/schema.sql`

4. **Create storage bucket:**
- Supabase → Storage → New bucket: `garage-documents`

5. **Start development server:**
```powershell
npm run dev
```

**📖 For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)**

---

## 📁 Project Structure

```
express-supabase-api/
├── src/
│   ├── config/           # Environment, Supabase, Logger, CORS, Rate Limiting
│   ├── types/            # TypeScript type definitions
│   ├── models/           # Database models (User, Garage Profile)
│   ├── services/         # Business logic (Auth, Verification, Token, File)
│   ├── controllers/      # Request handlers
│   ├── routes/           # API route definitions
│   ├── middleware/       # Auth guards, validation, error handling
│   ├── validators/       # Zod schemas for request validation
│   └── utils/            # Helper functions (password, responses)
├── database/             # SQL schema and migrations
├── docs/                 # API documentation
├── tests/                # Unit and integration tests
├── .env.example          # Environment variable template
└── package.json          # Dependencies and scripts
```

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/step1` | Register personal info + send OTP |
| POST | `/api/auth/register/step2` | Add business location |
| POST | `/api/auth/register/step3` | Add business details |
| POST | `/api/auth/verify` | Verify OTP code |
| POST | `/api/auth/verify/resend` | Resend verification code |
| POST | `/api/auth/login` | Login with email & password |
| POST | `/api/auth/logout` | Logout (client-side) |

### Files

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/files/upload/emirates-id` | Upload Emirates ID document |

---

## 📊 Database Schema

### Tables
- **users** - Authentication and basic user info
- **garage_profiles** - Extended garage owner information
- **verification_codes** - OTP codes for email/phone verification
- **file_uploads** - Uploaded document tracking

**See [database/schema.sql](./database/schema.sql) for complete schema**

---

## 🔐 Security Features

### Password Requirements
- Minimum 8 characters (configurable)
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Account Protection
- Rate limiting: 5 login attempts per 15 minutes
- Account lockout after 5 failed attempts
- 30-minute lockout duration
- IP address logging

### OTP Security
- 6-digit random codes
- 10-minute expiration
- Maximum 3 verification attempts
- Automatic cleanup of expired codes

---

## 🧪 Testing

### Test Registration Flow

```powershell
# 1. Register (Step 1)
POST http://localhost:3000/api/auth/register/step1
{
  "fullName": "John Smith",
  "email": "john@example.com",
  "phoneNumber": "+971501234567",
  "password": "Test@123456"
}

# Check console for OTP code in development mode:
# 📧 OTP for john@example.com: 123456

# 2. Verify OTP
POST http://localhost:3000/api/auth/verify
{
  "code": "123456",
  "email": "john@example.com"
}

# 3. Continue with steps 2, 3...
# 4. Login
POST http://localhost:3000/api/auth/login
{
  "email": "john@example.com",
  "password": "Test@123456"
}
```

---

## 📚 Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Detailed setup instructions
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Complete implementation details
- **[database/schema.sql](./database/schema.sql)** - Database schema

---

## 🛠️ Development

### Available Scripts

```powershell
npm run dev         # Start development server with hot reload
npm run build       # Build for production
npm start           # Start production server
npm test            # Run tests
npm run lint        # Lint code
npm run format      # Format code with Prettier
```

---

## 🌍 Environment Variables

See `.env.example` for all available configuration options.

**Required:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `JWT_SECRET` - Random secret (32+ characters)

**Optional but recommended:**
- Email configuration (SMTP)
- SMS configuration (for OTP)
- Rate limiting settings
- Security settings

---

## 🏗️ Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Authentication**: JWT
- **Validation**: Zod
- **Security**: BCrypt, Helmet, Express Rate Limit
- **Logging**: Winston

---

## 📝 API Response Format

All API responses follow a standardized format:

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "meta": {
    "timestamp": "2025-10-14T10:30:00.000Z"
  }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [...],
  "meta": {
    "timestamp": "2025-10-14T10:30:00.000Z"
  }
}
```

---

## 🚦 Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `423` - Locked (account lockout)
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🆘 Support

- Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) for setup help
- Review [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for architecture details
- Open an issue for bugs or feature requests

---

## 🎯 Roadmap

- [ ] Email integration (Nodemailer)
- [ ] SMS integration (Twilio/AWS SNS)
- [ ] Admin dashboard APIs
- [ ] Mobile user APIs
- [ ] Push notifications
- [ ] Analytics and reporting
- [ ] API rate limiting per user
- [ ] Redis caching
- [ ] WebSocket support
- [ ] Swagger/OpenAPI documentation

---

**Built with ❤️ for AutoSaaz - One Stop Auto Shop**