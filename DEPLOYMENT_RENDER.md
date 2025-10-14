# Deployment Guide - Render

## Why Render?

✅ **Perfect for Express.js servers** (persistent, not serverless)  
✅ **Free tier**: 750 hours/month  
✅ **Auto-deploy** from GitHub  
✅ **No timeout limits** (unlike Vercel's 10s limit)  
✅ **Environment variables** management  
✅ **Health checks** built-in  
✅ **PostgreSQL** integration available  

---

## Quick Deploy to Render

### Option 1: One-Click Deploy (Recommended)

1. **Click this button** (after setting up Render account):
   - Visit: https://render.com/
   - Sign up with GitHub
   - Click "New Web Service"
   - Connect this repository: `GilChiu/Auto-Saaz-Server`

2. **Configure the service**:
   - **Name**: `autosaaz-server`
   - **Environment**: `Node`
   - **Region**: Choose closest to UAE (e.g., Singapore or Frankfurt)
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

3. **Add Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   
   # Supabase Configuration
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # JWT Configuration
   JWT_SECRET=your_generated_secret
   JWT_ACCESS_EXPIRY=7d
   JWT_REFRESH_EXPIRY=30d
   
   # Security
   BCRYPT_ROUNDS=12
   REQUIRE_EMAIL_VERIFICATION=true
   MAX_LOGIN_ATTEMPTS=5
   LOCKOUT_DURATION_MINUTES=30
   
   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=5
   
   # Optional: Email/SMS (configure when ready)
   # EMAIL_HOST=smtp.gmail.com
   # EMAIL_PORT=587
   # EMAIL_USER=your_email
   # EMAIL_PASSWORD=your_password
   # SMS_API_KEY=your_sms_api_key
   ```

4. **Deploy**:
   - Click "Create Web Service"
   - Render will automatically build and deploy
   - Your server will be live at: `https://autosaaz-server.onrender.com`

---

## Option 2: Manual Setup

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with your GitHub account
3. Verify your email

### Step 2: Create New Web Service
1. Click "New +" → "Web Service"
2. Connect to GitHub repository: `GilChiu/Auto-Saaz-Server`
3. Grant permissions if prompted

### Step 3: Configure Service
Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `autosaaz-server` |
| **Environment** | `Node` |
| **Region** | Singapore or Frankfurt (closest to UAE) |
| **Branch** | `main` |
| **Root Directory** | `express-supabase-api` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

### Step 4: Set Environment Variables
Click "Advanced" → "Add Environment Variable"

**Required Variables:**
```bash
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
JWT_SECRET=your_32_char_random_secret
```

**Optional Variables:**
```bash
JWT_ACCESS_EXPIRY=7d
JWT_REFRESH_EXPIRY=30d
BCRYPT_ROUNDS=12
REQUIRE_EMAIL_VERIFICATION=true
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=30
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5
```

### Step 5: Deploy
1. Click "Create Web Service"
2. Wait for deployment (2-5 minutes)
3. Check deployment logs for any errors
4. Your server URL: `https://autosaaz-server.onrender.com`

---

## Post-Deployment Steps

### 1. Test Health Endpoint
```bash
curl https://autosaaz-server.onrender.com/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is healthy",
  "data": {
    "status": "ok",
    "timestamp": "2025-10-15T..."
  }
}
```

### 2. Test Registration API
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

### 3. Setup Supabase Database
1. Run the `database/schema.sql` in Supabase SQL Editor
2. Create storage bucket: `garage-documents`
3. Configure bucket policies

### 4. Update Mobile App
Update your mobile app's API base URL:
```javascript
// Old
const API_BASE_URL = 'http://localhost:3000/api';

// New
const API_BASE_URL = 'https://autosaaz-server.onrender.com/api';
```

---

## Render Dashboard Features

### Auto-Deploy from GitHub
- Every push to `main` branch triggers automatic deployment
- Enable/disable in Settings → "Auto-Deploy"

### View Logs
- Real-time logs in "Logs" tab
- Debug issues quickly
- See all API requests

### Metrics
- CPU usage
- Memory usage
- Request count
- Response times

### Custom Domain (Optional)
1. Go to Settings → "Custom Domains"
2. Add your domain (e.g., `api.autosaaz.com`)
3. Update DNS records as instructed
4. SSL certificate auto-provisioned

---

## Environment Variables Management

### Get JWT Secret
If you need a new JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Get Supabase Credentials
1. Go to your Supabase project
2. Settings → API
3. Copy:
   - Project URL → `SUPABASE_URL`
   - anon/public key → `SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

---

## Troubleshooting

### Build Failed
**Check logs for:**
- TypeScript errors → Run `npm run build` locally first
- Missing dependencies → Ensure package.json is correct
- Node version → Render uses Node 18 by default

### Server Not Starting
**Common issues:**
- Port binding → Render sets `PORT` env var automatically
- Missing env vars → Check all required variables are set
- Database connection → Verify Supabase credentials

### 503 Service Unavailable
**Free tier limitations:**
- Server spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- Upgrade to paid tier for always-on

### Rate Limit Issues
Adjust in environment variables:
```bash
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=10   # Increase from 5
```

---

## Cost Breakdown

### Free Tier
- ✅ **750 hours/month** of runtime
- ✅ **100GB bandwidth/month**
- ✅ **Unlimited** deployments
- ⚠️ Spins down after 15 min inactivity
- ⚠️ Shared resources

### Paid Tier ($7/month)
- ✅ **Always on** (no spin down)
- ✅ **Dedicated resources**
- ✅ **Better performance**
- ✅ **Priority support**

---

## Security Best Practices

### 1. Secure Environment Variables
- Never commit `.env` to GitHub
- Use Render's dashboard to set variables
- Rotate JWT secrets periodically

### 2. Enable CORS Properly
In production, update `src/config/cors.ts`:
```typescript
const allowedOrigins = [
  'https://your-mobile-app-domain.com',
  'https://admin.autosaaz.com'
];
```

### 3. Rate Limiting
Already configured in the server
- Auth endpoints: 5 requests per 15 min
- Adjust as needed for production traffic

### 4. HTTPS Only
- Render provides free SSL certificates
- All traffic is encrypted by default

---

## Monitoring & Alerts

### Setup Notifications
1. Render Dashboard → Settings → "Notifications"
2. Add email or Slack webhook
3. Get alerts for:
   - Deploy failures
   - Server crashes
   - High resource usage

### Health Checks
- Render automatically checks `/health` endpoint
- Restarts server if unhealthy
- Configure interval in Settings

---

## Scaling Considerations

### When to Upgrade
Monitor these metrics:
- **Response time** > 2 seconds consistently
- **CPU usage** > 80% sustained
- **Memory usage** > 90% sustained
- **High traffic** (many concurrent users)

### Scaling Options
1. **Vertical**: Upgrade instance type (more CPU/RAM)
2. **Horizontal**: Add more instances + load balancer
3. **Database**: Upgrade Supabase plan if needed

---

## Backup & Disaster Recovery

### Code Backup
- ✅ GitHub repository (already done)
- ✅ Auto-deploy from `main` branch

### Database Backup
- Configure in Supabase dashboard
- Daily automatic backups (paid plans)
- Point-in-time recovery

### Rollback
If deployment fails:
1. Go to Render Dashboard → "Events"
2. Click "Rollback" on previous successful deploy
3. Or push previous commit to GitHub

---

## Next Steps After Deployment

1. ✅ **Test all endpoints** with production URL
2. ✅ **Setup Supabase database** (run schema.sql)
3. ✅ **Configure email/SMS** for OTP delivery
4. ✅ **Update mobile app** with new API URL
5. ✅ **Add custom domain** (optional)
6. ✅ **Setup monitoring** and alerts
7. ✅ **Test registration flow** end-to-end

---

## Support & Resources

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **Supabase Docs**: https://supabase.com/docs
- **This Project**: https://github.com/GilChiu/Auto-Saaz-Server

---

## Quick Reference

| Item | Value |
|------|-------|
| **Repository** | https://github.com/GilChiu/Auto-Saaz-Server |
| **Render URL** | https://autosaaz-server.onrender.com |
| **Health Check** | /health |
| **API Base** | /api |
| **Auth Routes** | /api/auth/* |
| **Node Version** | 18+ |
| **Build Time** | ~2-5 minutes |

---

**Ready to deploy?** Follow Option 1 above for quickest setup! 🚀
