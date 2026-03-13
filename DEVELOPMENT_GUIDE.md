# 🛠️ Development & Testing Guide

## Getting Started with Development

Your Marasim platform is fully configured for development and testing!

---

## 📋 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open browser
# Visit: http://localhost:3000
```

---

## 🧪 Testing User Registration

### Test Registration Flow (Development Mode)

1. **Open Registration Page**
   ```
   http://localhost:3000/en/auth/register
   ```

2. **Fill Registration Form**
   - **Full Name**: Any name (e.g., "Test User")
   - **Email**: Any email (e.g., test@example.com)
   - **Phone**: Optional (e.g., 0551981751)
   - **Password**: Any password (minimum 8 chars)

3. **Submit Registration**
   - Click "Send Verification Code" button
   - Look at **terminal/console** for OTP code

4. **Copy OTP Code from Console**
   ```
   📧 OTP VERIFICATION CODE
   ━━━━━━━━━━━━━━━━━━━━━━━
   User: Test User (test@example.com)
   Code: 523847
   Expires: 15 minutes
   ━━━━━━━━━━━━━━━━━━━━━━━
   ```

5. **Enter OTP in Registration Page**
   - Paste the code shown in console (e.g., 523847)
   - Account created automatically ✅

---

## 💻 Console Output Explained

### When You Register:
```
📧 OTP VERIFICATION CODE
━━━━━━━━━━━━━━━━━━━━━━━
User: Aman Shah (engramanshahgfx@gmail.com)
Code: 523847
Expires: 15 minutes
━━━━━━━━━━━━━━━━━━━━━━━

✅ Verification email sent to engramanshahgfx@gmail.com
```

### What It Means:
- ✅ **Code: 523847** - This is your OTP
- 📧 **Email sent** - Email service attempted (may be in development mode)
- 15 minutes - Code expires after 15 minutes

---

## 🔓 Development Credentials

### Test Admin User
```
Email: admin@marasim.digital
Password: Admin@123456
Role: super_admin
```

### Test Regular User
```
Email: user@example.com
Password: User@123456
Role: user
Account Type: free (trial)
```

### Test Bank Account Credentials
```
Account Holder: SAJJAD BAQER BIN IBRAHIM ALMURAYHIL
Bank: Alrajhi Bank
Account: 0108089585850010
IBAN: SA9230400108089585850010
Branch: OMRAN (0309)
```

---

## 🧪 Testing Payment Flows

### Test PayPal Payment

1. **Go to Pricing Page**
   ```
   http://localhost:3000/en/pricing
   ```

2. **Select Plan**
   - Click on "Basic Plan" or "Pro Plan"

3. **Choose Payment Method**
   - Click "Pay with PayPal"

4. **Sandbox Checkout**
   - In development: Auto-confirms payment
   - Check console for payment confirmation

5. **Verify Subscription**
   ```
   http://localhost:3000/en/dashboard
   ```
   - Subscription status should show "active"
   - Can create unlimited events

### Test Bank Transfer

1. **Go to Pricing**
   ```
   http://localhost:3000/en/pricing
   ```

2. **Bank Transfer Checkout**
   - Click "Bank Transfer" button

3. **View Bank Details**
   - See reference code: `BANK-1709876234-a4d2f8`
   - Copy account details from screen

4. **Upload Proof (Any Image)**
   - Click upload button
   - Select any image file
   - Enter WhatsApp number (optional)

5. **Admin Approval**
   - Go to: `http://localhost:3000/admin-login`
   - Use temp admin user
   - Click "Bank Transfers" tab
   - Click "Approve" button

6. **Check WhatsApp**
   - Should receive approval message
   - Subscription activated

---

## 🔐 Testing Admin Dashboard

### Login as Admin

1. **Go to Admin Login**
   ```
   http://localhost:3000/admin-login
   ```

2. **Use Admin Credentials**
   - Email: `admin@marasim.digital`
   - Password: `Admin@123456`

3. **Admin Dashboard Sections**
   - **Overview**: See stats (users, revenue, pending)
   - **Users**: List all users, upgrade users
   - **Payments**: PayPal transactions
   - **Bank Transfers**: Review proofs, approve/reject
   - **Messages**: Contact form submissions
   - **Plans**: View subscription plans
   - **Settings**: Configure system

---

## 📧 Email OTP in Development

### Current Setup
- ✅ **MailSlurp** configured for email sending
- ✅ **OTP logged to console** for testing
- ✅ **No email client needed** for development
- ✅ **Works offline** (console fallback)

### Using OTP Codes

**In Development:**
```bash
# Console shows OTP when you register
Code: 523847

# Copy and paste in registration form
# No email needed!
```

**In Production:**
- Email sent to actual inbox
- User receives real email
- Copy code from email

---

## 🐛 Common Issues & Solutions

### Issue: "Failed to send verification email"
**Solution:**
1. Check console for OTP code
2. Copy the code from console output
3. Use that code in the form
4. Account will be created

**Why it happens:**
- MailSlurp free tier has limits
- Email service may be rate-limited
- Development mode uses console fallback

### Issue: Code Doesn't Work
**Solution:**
1. Check code is correct (copy from console)
2. Code expires after 15 minutes
3. Get new code by clicking "Resend"
4. Paste immediately in form

### Issue: Can't Login After Registration
**Solution:**
1. Use email you registered with
2. Use password you set (case-sensitive)
3. Check Supabase auth is enabled
4. Try password reset on login page

### Issue: Admin Dashboard Not Loading
**Solution:**
1. Make sure you're logged in as super_admin
2. Check database has admin user created
3. Clear browser cookies and try again
4. Check console for errors

---

## 📊 Testing Scenarios

### Scenario 1: Basic User Flow
```
1. Register → OTP from console
2. Create Event → Shows "1/1 events used"
3. Try 2nd Event → Shows "Upgrade" modal
4. Click Upgrade → Goes to /pricing
5. Make Payment → Mock success
6. Dashboard → Unlimited events now
```

### Scenario 2: Bank Transfer Flow
```
1. Choose Bank Transfer at /pricing
2. See bank details and reference code
3. Upload any image as "proof"
4. Gets "Pending Approval" status
5. Login as admin
6. Go to Bank Transfers tab
7. Click "Approve" button
8. WhatsApp notification sent
9. User subscription activated
```

### Scenario 3: Contact Form
```
1. Go to /contact page
2. Submit message
3. Admin gets notification
4. Admin can see in dashboard
5. Email forwarded to support
```

---

## 🖥️ VS Code Debug Commands

### View Recent Console Output
```
# Press: Ctrl + Shift + C (in terminal)
# Scroll up to see OTP codes
```

### Restart Dev Server
```bash
# Press: Ctrl + C (to stop)
# Run: npm run dev (to restart)
```

### Clear Build Cache
```bash
# Delete .next folder
rm -rf .next

# Restart dev server
npm run dev
```

---

## 📱 Mobile Testing

### Test on Different Devices

**iPhone/iPad:**
```
# Use ngrok to expose local server
npm i -g ngrok
ngrok http 3000

# Then visit: https://[ngrok-id].ngrok.io
```

**Android:**
```
# Get your computer's IP
ipconfig getifaddr en0

# Visit: http://[YOUR_IP]:3000
```

---

## 🔧 Environment File Reference

### Current Settings
```env
# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=https://nskuisqwjfcfrpudqwvv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...

# PayPal (Payments)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-id
PAYPAL_SECRET_KEY=your-secret
PAYPAL_MODE=sandbox

# Bank (Transfer)
BANK_ACCOUNT_NUMBER=0108089585850010
BANK_IBAN=SA9230400108089585850010

# Email (OTP)
MAILSLURP_API_KEY=sk_Xvhd...
MAILSLURP_FROM_EMAIL=noreply@marasim.digital

# WhatsApp (Messages)
TWILIO_PHONE_NUMBER=+966551981751
TWILIO_ACCOUNT_SID=...
TWILIO_API_KEY_SECRET=...
```

### To Add/Change Variables
1. Edit `.env` file
2. Restart dev server: `npm run dev`
3. Changes take effect immediately

---

## 📈 Database Testing

### Quick SQL Queries

**View all users:**
```sql
SELECT id, email, full_name, role, subscription_status FROM users LIMIT 10;
```

**View OTP codes:**
```sql
SELECT email, code, expires_at FROM verification_codes ORDER BY created_at DESC;
```

**View payments:**
```sql
SELECT id, user_id, amount, status, payment_method FROM payments ORDER BY created_at DESC;
```

**Create test admin:**
```sql
INSERT INTO users (id, email, full_name, role, account_type, subscription_status)
VALUES (gen_random_uuid(), 'test-admin@example.com', 'Test Admin', 'super_admin', 'paid', 'active');
```

---

## 🚀 Moving to Production

### Before Deploy

- [ ] Test all registration flows
- [ ] Test all payment flows
- [ ] Configure real PayPal credentials
- [ ] Configure email service (SendGrid/MailSlurp)
- [ ] Setup Twilio for WhatsApp
- [ ] Create admin user
- [ ] Test database backups
- [ ] Review security settings
- [ ] Setup error tracking (Sentry)
- [ ] Configure analytics

### Production Checklist

```bash
# 1. Update .env with production keys
PAYPAL_MODE=live
NEXT_PUBLIC_PAYPAL_CLIENT_ID=prod_id

# 2. Build and test
npm run build
npm run start

# 3. Deploy to Vercel/Netlify
vercel --prod

# 4. Monitor in production
# Check errors, uptime, performance
```

---

## 📞 Getting Help

### If Something Breaks

1. **Check Console Errors**
   - Press F12 in browser
   - Look for red errors
   - Note the error message

2. **Check Server Log**
   - Look at terminal where `npm run dev` runs
   - Check for red/yellow warnings
   - Search error in documentation

3. **Check Database**
   - Go to Supabase dashboard
   - Check if tables exist
   - Look for error messages

4. **Common Fixes**
   - Restart dev server: `npm run dev`
   - Clear cache: `npm run build`
   - Check .env file
   - Check internet connection

---

## ✅ Development Checklist

- [ ] Dev server runs: `npm run dev`
- [ ] No console errors
- [ ] Can register user
- [ ] OTP appears in console
- [ ] Can create events
- [ ] Can upgrade to paid
- [ ] PayPal flow works
- [ ] Bank transfer works
- [ ] Admin dashboard accessible
- [ ] WhatsApp messages send (logged)
- [ ] Database queries run
- [ ] No build errors: `npm run build`

---

## 🎉 You're Ready!

Your development environment is **fully configured** and ready to build! 

```bash
npm run dev
# Visit: http://localhost:3000
# Register, test features, enjoy!
```

**Happy coding!** 🚀

