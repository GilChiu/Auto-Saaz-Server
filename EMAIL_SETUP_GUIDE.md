# Email Integration Guide - Gmail Setup

## 🎯 Overview

AutoSaaz uses **Nodemailer** for sending transactional emails (OTP codes, welcome emails, password resets). This guide shows how to configure Gmail for sending emails.

## 📧 Gmail Setup (Recommended for Testing)

### Step 1: Enable 2-Factor Authentication

1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** in the left sidebar
3. Scroll to "How you sign in to Google"
4. Click **2-Step Verification**
5. Follow the steps to enable 2FA

### Step 2: Generate App Password

1. After enabling 2FA, go to: https://myaccount.google.com/apppasswords
2. **Select app**: Choose "Mail"
3. **Select device**: Choose "Other (Custom name)"
4. Enter a name: `AutoSaaz Server`
5. Click **Generate**
6. **Copy the 16-character password** (format: `xxxx xxxx xxxx xxxx`)
7. **Save it securely** - you won't see it again!

### Step 3: Configure Environment Variables

Add these to your Render environment variables:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxxxxxxxxxxxxxx
SMTP_FROM="AutoSaaz" <your-email@gmail.com>
APP_URL=https://auto-saaz-garage-client.vercel.app
```

**Important:**
- `SMTP_USER`: Your full Gmail address
- `SMTP_PASS`: The 16-character app password (no spaces!)
- `SMTP_FROM`: Can be different from SMTP_USER for display purposes

### Step 4: Update Render Environment

1. Go to: https://dashboard.render.com
2. Select your service: `auto-saaz-server`
3. Click **Environment** tab
4. Click **Add Environment Variable**
5. Add each variable:
   - Key: `SMTP_USER`
   - Value: `your-email@gmail.com`
6. Repeat for all SMTP variables
7. Click **Save Changes**

The service will automatically redeploy.

---

## 🏢 Production Email Services (Recommended)

For production, use a dedicated transactional email service:

### Option 1: SendGrid (Recommended)

**Free Tier:** 100 emails/day

1. Sign up: https://signup.sendgrid.com/
2. Verify your email
3. Get your API key from: https://app.sendgrid.com/settings/api_keys
4. Add to Render env:
   ```bash
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your_sendgrid_api_key
   SMTP_FROM="AutoSaaz" <noreply@yourdomain.com>
   ```

### Option 2: AWS SES (Simple Email Service)

**Free Tier:** 62,000 emails/month

1. AWS Console → SES
2. Verify your domain or email
3. Create SMTP credentials
4. Add to Render env:
   ```bash
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=your_aws_access_key
   SMTP_PASS=your_aws_secret_key
   SMTP_FROM="AutoSaaz" <noreply@yourdomain.com>
   ```

### Option 3: Mailgun

**Free Tier:** 5,000 emails/month

1. Sign up: https://signup.mailgun.com/
2. Verify your domain
3. Get SMTP credentials from dashboard
4. Add to Render env:
   ```bash
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   SMTP_USER=postmaster@your-domain.mailgun.org
   SMTP_PASS=your_mailgun_password
   SMTP_FROM="AutoSaaz" <noreply@yourdomain.com>
   ```

---

## 🧪 Testing Email Configuration

### Test 1: Verify SMTP Connection

The service automatically verifies the connection on startup. Check Render logs for:

```
✅ Email service initialized successfully
✅ Email service verified and ready to send emails
```

If you see errors:
```
❌ Email service verification failed
```

Check:
1. SMTP credentials are correct
2. App password is used (not regular Gmail password)
3. 2FA is enabled on Gmail
4. No spaces in app password

### Test 2: Send Test Registration

1. Go to your frontend: https://auto-saaz-garage-client.vercel.app/register
2. Complete registration Steps 1-3
3. Check your email for OTP code
4. Complete verification
5. Check email for welcome message with password

### Test 3: Check Logs

Monitor Render logs for:
```
✅ Email sent successfully: <message-id>
📧 To: user@example.com
```

---

## 📝 Email Templates

The service includes professional HTML email templates for:

### 1. OTP Verification Email
- Clean, modern design
- Large OTP code display
- 15-minute expiry notice
- Mobile-responsive

### 2. Welcome Email
- Personalized greeting
- Account credentials (email + auto-generated password)
- Security notice
- Login button
- Support contact

### 3. Password Reset Email  
- Reset link button
- 1-hour expiry notice
- Security warning
- Mobile-responsive

---

## 🔒 Security Best Practices

### For Gmail:

1. **Never use your regular Gmail password** - always use app passwords
2. **Enable 2FA** - required for app passwords
3. **Use a dedicated email** - create `noreply@yourdomain.com` or use a separate Gmail
4. **Monitor usage** - Gmail has sending limits (500/day for free accounts)
5. **Rotate passwords** - change app passwords regularly

### For Production:

1. **Use a dedicated service** - SendGrid, AWS SES, or Mailgun
2. **Verify your domain** - improves deliverability
3. **Set up DKIM/SPF** - prevents emails going to spam
4. **Monitor bounce rates** - clean your email list
5. **Use environment variables** - never commit credentials
6. **Enable logging** - track email delivery
7. **Set up alerts** - notify when sending fails

---

## 📊 Gmail Sending Limits

**Free Gmail Account:**
- 500 emails per day
- 500 recipients per email
- Resets at midnight PST

**Google Workspace:**
- 2,000 emails per day
- 2,000 recipients per email

If you exceed limits, use a dedicated service like SendGrid.

---

## 🐛 Troubleshooting

### Issue: "Invalid login" or "Username and Password not accepted"

**Solution:**
1. Ensure 2FA is enabled
2. Use app password, not regular password
3. Remove spaces from app password
4. Regenerate app password if needed

### Issue: Emails going to spam

**Solution:**
1. Add SPF record to your domain
2. Use a verified "From" address
3. Don't use words like "free", "urgent" in subject
4. Include unsubscribe link (for marketing emails)

### Issue: "Email not sent" in logs

**Solution:**
1. Check SMTP credentials in Render env
2. Verify SMTP_HOST and SMTP_PORT are correct
3. Check firewall/network restrictions
4. Try a different SMTP provider

### Issue: No logs showing

**Solution:**
1. Check Render deployment status
2. Verify environment variables are set
3. Check for TypeScript compilation errors
4. Review server startup logs

---

## 📦 Environment Variables Checklist

Before deploying, ensure these are set in Render:

- [ ] `SMTP_HOST` - SMTP server address
- [ ] `SMTP_PORT` - Usually 587 for TLS
- [ ] `SMTP_SECURE` - Set to `false` for port 587
- [ ] `SMTP_USER` - Your email address or username
- [ ] `SMTP_PASS` - App password or API key
- [ ] `SMTP_FROM` - Display name and email
- [ ] `APP_URL` - Frontend URL for email links

---

## 📚 Additional Resources

- **Nodemailer Docs**: https://nodemailer.com/
- **Gmail App Passwords**: https://support.google.com/accounts/answer/185833
- **SendGrid Docs**: https://docs.sendgrid.com/
- **AWS SES Docs**: https://docs.aws.amazon.com/ses/
- **Email on Acid** (testing): https://www.emailonacid.com/

---

## ✅ Quick Start Summary

1. **Enable 2FA** on your Gmail
2. **Generate app password** at https://myaccount.google.com/apppasswords
3. **Add to Render**:
   ```
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   ```
4. **Redeploy** your service
5. **Test** registration flow

That's it! 🎉

---

## 🚀 Next Steps

After email is working:
1. Configure SMS service for phone verification (Twilio, AWS SNS)
2. Set up custom domain for better deliverability
3. Add email analytics tracking
4. Implement email templates in a CMS
5. Set up email queuing for high volume

---

**Need Help?** 

Check the logs for detailed error messages or contact support.
