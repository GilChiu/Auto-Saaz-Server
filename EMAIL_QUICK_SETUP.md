# 📧 Quick Email Setup - Gmail

## 🚀 5-Minute Setup

### Step 1: Get Gmail App Password

1. Go to: https://myaccount.google.com/apppasswords
2. If you don't see it, enable 2FA first at: https://myaccount.google.com/security
3. Click "Generate" for "Mail" app
4. Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)

### Step 2: Add to Render

1. Go to: https://dashboard.render.com
2. Click: `auto-saaz-server` service
3. Click: **Environment** tab
4. Add these variables:

```
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_SECURE = false
SMTP_USER = benedictchiu12@gmail.com
SMTP_PASS = your16charpassword
SMTP_FROM = "AutoSaaz" <benedictchiu12@gmail.com>
APP_URL = https://auto-saaz-garage-client.vercel.app
```

5. Click **Save Changes**
6. Wait 2-3 minutes for deployment

### Step 3: Test

1. Register a new user at: https://auto-saaz-garage-client.vercel.app/register
2. Check your inbox for OTP code
3. Complete verification
4. Check inbox for welcome email with password

---

## ⚠️ Important Notes

- **DON'T** use your regular Gmail password
- **DO** use the 16-character app password
- **Remove spaces** from the app password when pasting
- Emails may take 10-30 seconds to arrive
- Check spam folder if not received

---

## 🔍 Verify It's Working

Check Render logs for:
```
✅ Email service initialized successfully
✅ Email service verified and ready to send emails
✅ Email sent successfully: <message-id>
```

---

## 📚 Full Documentation

See `EMAIL_SETUP_GUIDE.md` for:
- Detailed Gmail setup
- Production email services (SendGrid, AWS SES)
- Troubleshooting
- Security best practices

---

## 🐛 Quick Troubleshooting

**"Invalid login" error?**
→ Make sure you're using the app password, not your Gmail password

**No email received?**
→ Check spam folder
→ Wait 30-60 seconds
→ Check Render logs for errors

**"Email service not initialized" in logs?**
→ SMTP variables not set in Render
→ Typo in SMTP_USER or SMTP_PASS

---

## ✅ Checklist

- [ ] 2FA enabled on Gmail
- [ ] App password generated
- [ ] All 7 SMTP variables added to Render
- [ ] No spaces in SMTP_PASS
- [ ] Service redeployed
- [ ] Logs show "Email service verified"
- [ ] Test registration completed
- [ ] Email received in inbox

---

**Ready to go!** 🎉
