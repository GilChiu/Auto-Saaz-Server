# CORS Debugging Guide

## What I Just Fixed

1. ✅ Added explicit `app.options('*', setupCors)` for preflight requests
2. ✅ Enhanced logging to show exactly what's happening
3. ✅ Trim whitespace from CORS_ORIGIN values
4. ✅ Added `allowedHeaders` for common request headers
5. ✅ Changed `optionsSuccessStatus` to 204 (HTTP standard)
6. ✅ Ensured CORS is the FIRST middleware
7. ✅ Added health check endpoint at `/health`

## Wait for Deployment

⏳ **Render is deploying now** (2-3 minutes)

Watch Render logs for:
```
CORS Configuration:
- Allowed Origins: https://auto-saaz-garage-client.vercel.app
- Auto-allowing: *.vercel.app domains
- Auto-allowing: localhost and 127.0.0.1
```

## Test After Deployment

### 1. Test Health Endpoint
```bash
curl https://autosaaz-server.onrender.com/health
```

Expected: `{"status":"ok","timestamp":"..."}`

### 2. Test CORS Preflight
```bash
curl -X OPTIONS https://autosaaz-server.onrender.com/api/auth/register/step1 \
  -H "Origin: https://auto-saaz-garage-client.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

Expected in response:
```
< HTTP/2 204
< access-control-allow-origin: https://auto-saaz-garage-client.vercel.app
< access-control-allow-methods: GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS
< access-control-allow-headers: Content-Type,Authorization,X-Requested-With,Accept,Origin
< access-control-allow-credentials: true
```

### 3. Test Actual Request
Go to your Vercel app and try Step 1 registration.

## Check Render Logs

After testing, check logs for:

**Success logs:**
```
CORS: Checking origin: https://auto-saaz-garage-client.vercel.app
CORS: ✅ Allowed (Vercel deployment): https://auto-saaz-garage-client.vercel.app
```

**Failure logs (if still failing):**
```
CORS: Checking origin: https://auto-saaz-garage-client.vercel.app
CORS: ❌ BLOCKED: https://auto-saaz-garage-client.vercel.app
```

## If Still Failing

### Check 1: Verify CORS_ORIGIN in Render
```
CORS_ORIGIN=https://auto-saaz-garage-client.vercel.app
```
(No spaces, no trailing slash)

### Check 2: Verify Deployment Completed
- Render Dashboard → Logs → "Service is live"

### Check 3: Hard Refresh Browser
- Chrome: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Clear browser cache

### Check 4: Check Browser Network Tab
1. Open DevTools → Network tab
2. Try registration
3. Look for OPTIONS request (preflight)
4. Check Response Headers for:
   - `access-control-allow-origin`
   - `access-control-allow-methods`

### Check 5: Test with curl
```bash
# Test from terminal to isolate browser issues
curl -X POST https://autosaaz-server.onrender.com/api/auth/register/step1 \
  -H "Origin: https://auto-saaz-garage-client.vercel.app" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","email":"test@example.com","phoneNumber":"+971501234567"}' \
  -v
```

## Common Issues

### Issue 1: Old deployment cached
**Solution**: Wait 3-4 minutes for Render to fully deploy

### Issue 2: Browser cached CORS failure
**Solution**: Hard refresh (Ctrl+Shift+R)

### Issue 3: Wrong origin format
**Solution**: Make sure CORS_ORIGIN has no trailing slash:
- ✅ `https://auto-saaz-garage-client.vercel.app`
- ❌ `https://auto-saaz-garage-client.vercel.app/`

### Issue 4: Rate limiting
**Solution**: Check if you hit rate limit (wait 15 mins)

## Timeline

- **Now**: Deployment started
- **+2 min**: Build completes
- **+3 min**: Service is live
- **+3 min**: Test from Vercel
- **+4 min**: Should work! 🎉

## Expected Behavior After Fix

1. Browser sends OPTIONS request (preflight)
2. Server responds with 204 + CORS headers
3. Browser sends POST request
4. Server responds with 200/201 + CORS headers + data
5. ✅ Success!

---

**Status**: Deployed at $(date)  
**Next Check**: In 3 minutes
