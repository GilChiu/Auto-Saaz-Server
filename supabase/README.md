# Supabase Functions Migration

This folder contains Supabase Edge Functions that replicate the Express API so the client can call Supabase directly.

## What’s included

- config.toml with project ref: `lblcjyeiwgyanadssqac` (confirm in Dashboard if needed)
- functions/_shared/cors.ts: CORS helpers for consistent responses
- Implemented Functions:
  - auth-register-step1 → POST `/api/auth/register/step1`
  - auth-register-step2 → POST `/api/auth/register/step2`
  - auth-register-step3 → POST `/api/auth/register/step3`
  - auth-verify → POST `/api/auth/verify`
  - auth-login → POST `/api/auth/login`
  - auth-refresh → POST `/api/auth/refresh`

## Requirements

- Supabase project access and a Personal Access Token (PAT) to deploy functions.
- Set these project secrets (in Project Settings → Functions → Secrets):
  - `SERVICE_ROLE_KEY` (Service Role key for server-side database operations)
  - `JWT_SECRET` (shared HMAC secret for issuing/verifying HS256 tokens)

## Deploy (via npx Supabase CLI)

From the `express-supabase-api` folder:

```powershell
# Ensure you're logged in (one-time)
npx supabase login

# Deploy functions
npx supabase functions deploy auth-register-step1 --project-ref lblcjyeiwgyanadssqac
npx supabase functions deploy auth-register-step2 --project-ref lblcjyeiwgyanadssqac
npx supabase functions deploy auth-register-step3 --project-ref lblcjyeiwgyanadssqac
npx supabase functions deploy auth-verify         --project-ref lblcjyeiwgyanadssqac
npx supabase functions deploy auth-login          --project-ref lblcjyeiwgyanadssqac
npx supabase functions deploy auth-refresh        --project-ref lblcjyeiwgyanadssqac
```

Notes:
- Do not prefix secrets with `SUPABASE_` (those names are reserved and will be rejected).
- Each function requires the `Authorization: Bearer <anon-key>` header when called from outside Supabase.

## Endpoints and payloads

Base URL:

```
https://<project-ref>.functions.supabase.co
```

Common headers:

```
Authorization: Bearer <SUPABASE_ANON_KEY>
Content-Type: application/json
```

### auth-register-step1

Request body:

```
{ "fullName": string, "email": string, "phoneNumber": string }
```

Response data:

```
{ "sessionId": string, "expiresAt": iso8601, "nextStep": 2 }
```

### auth-register-step2

Body: `{ "sessionId": string, "location": { country, city, address } }`

### auth-register-step3

Body: `{ "sessionId": string, "business": { companyLegalName, email, phoneNumber } }`

### auth-verify

Body: `{ "sessionId": string, "code": string }`

Response: `{ user, generatedPassword }` (temporary; password is generated if needed)

### auth-login

Body: `{ "email": string, "password": string }`

Response data:

```
{
  "user": { /* user sans password */ },
  "profile": {
    "fullName": string,
    "email": string,
    "phoneNumber": string,
    "companyLegalName": string,
    "status": string
  },
  "accessToken": string,  // HS256, issuer=autosaaz-api, aud=autosaaz-client, exp=7d
  "refreshToken": string  // HS256, type=refresh, exp=30d
}
```

### auth-refresh

Body: `{ "refreshToken": string }`

Response: `{ "accessToken": string }`

## Next targets

- Bookings CRUD
- Dashboard stats and other endpoints

We’ll port these iteratively, reusing the existing patterns and Deno-compatible code.
