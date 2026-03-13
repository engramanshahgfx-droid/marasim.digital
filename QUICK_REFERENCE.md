# 🚀 Marasim - Quick Reference Guide

## 📍 Important URLs

### User-Facing URLs
```
📱 Home Page
   http://localhost:3000/

✨ Features Page
   http://localhost:3000/features

💰 Pricing Page
   http://localhost:3000/pricing

📧 Contact Page
   http://localhost:3000/contact

🔐 User Login
   http://localhost:3000/en/auth/login

✍️ User Registration
   http://localhost:3000/en/auth/register

📊 User Dashboard
   http://localhost:3000/en/dashboard

💳 PayPal Checkout
   http://localhost:3000/en/payment/paypal?planId=PLAN_ID

🏦 Bank Transfer Checkout
   http://localhost:3000/en/payment/bank-transfer?planId=PLAN_ID

✅ Payment Success
   http://localhost:3000/en/payment-success

❌ Payment Cancelled
   http://localhost:3000/en/payment-cancelled
```

### Admin URLs
```
🔑 Admin Login
   http://localhost:3000/admin-login

📊 Admin Dashboard
   http://localhost:3000/admin/dashboard
   └─ Dashboard Overview
   └─ Users Management
   └─ Payments
   └─ Bank Transfers
   └─ Contact Messages
   └─ Plans Management
   └─ Settings
```

---

## 🔌 API Endpoints

### Authentication
```
POST /api/auth/send-otp
Body: { email: "user@example.com" }
Response: { success: true, message: "OTP sent" }

POST /api/auth/register
Body: { email, password, fullName }
Response: { success: true, user: {...}, message: "..." }

POST /api/auth/verify-otp
Body: { email, code }
Response: { success: true, message: "..." }
```

### PayPal Payments
```
POST /api/payments/paypal/create-order
Body: { planId: "uuid", userId: "uuid" }
Response: { transactionId, amount, paymentId }

POST /api/payments/paypal/verify-payment
Body: { paymentId, transactionId, userId }
Response: { success: true, message: "Subscription activated" }
```

### Bank Transfers
```
POST /api/payments/bank-transfer/create-request
Body: { planId: "uuid", userId: "uuid" }
Response: { 
  paymentId, 
  referenceCode, 
  bankDetails: {...}, 
  amount 
}

POST /api/payments/bank-transfer/upload-proof
Body: FormData { file, paymentId }
Response: { success: true, proofUrl, message: "..." }
```

### Admin Operations
```
POST /api/admin/payments/approve
Body: { paymentId: "uuid", adminId: "uuid" }
Response: { success: true, message: "Payment approved" }

DELETE /api/admin/payments/approve
Body: { paymentId: "uuid", adminId: "uuid" }
Response: { success: true, message: "Payment rejected" }
```

### Contact Messages
```
POST /api/contact
Body: { name, email, message }
Response: { success: true, messageId: "uuid", message: "..." }

GET /api/contact
Headers: { "x-admin-id": "uuid" }
Response: { messages: [...] }
```

---

## 🔑 Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# PayPal
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_client_id
PAYPAL_SECRET_KEY=your_secret_key
PAYPAL_MODE=sandbox  # or 'live' for production

# Bank Transfer
BANK_ACCOUNT_NUMBER=1234567890
BANK_IBAN=SA49XXXXXXXXXXXXXXXXXXXX
BANK_HOLDER_NAME=Your Company Name
BANK_NAME=Your Bank Name

# Email Service
SENDGRID_API_KEY=your_api_key
SENDGRID_FROM_EMAIL=your-email@company.com

# WhatsApp
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_API_KEY_SID=your_api_key_sid
TWILIO_API_KEY_SECRET=your_api_key_secret
TWILIO_PHONE_NUMBER=+966551981751
TWILIO_VERIFY_SERVICE_SID=your_service_sid
```

---

## 📊 Database Quick Access

### View All Users
```sql
SELECT id, email, full_name, role, subscription_status, account_type, plan_type
FROM users
ORDER BY created_at DESC;
```

### View Pending Payments
```sql
SELECT p.*, u.email, sp.name as plan_name
FROM payments p
JOIN users u ON p.user_id = u.id
JOIN subscription_plans sp ON p.plan_id = sp.id
WHERE p.status = 'pending'
ORDER BY p.created_at DESC;
```

### View Banking Transfer Details
```sql
SELECT p.*, u.email, sp.name
FROM payments p
JOIN users u ON p.user_id = u.id
JOIN subscription_plans sp ON p.plan_id = sp.id
WHERE p.payment_method = 'bank_transfer' AND p.status = 'pending';
```

### Create Admin User
```sql
-- First get the auth user ID from Supabase Auth
-- Then insert:
INSERT INTO users (id, email, full_name, role, account_type, subscription_status)
VALUES ('auth-user-id-here', 'admin@company.com', 'Admin Name', 'super_admin', 'paid', 'active');
```

### Approve Bank Transfer (Manual)
```sql
UPDATE payments 
SET status = 'approved', updated_at = NOW()
WHERE id = 'payment-id-here';

-- Then update user subscription
UPDATE users 
SET subscription_status = 'active', 
    account_type = 'paid',
    plan_type = 'basic',  -- or 'pro'
    subscription_expiry = NOW() + INTERVAL '30 days',
    event_limit = 999  -- or 5
WHERE id = 'user-id-here';
```

---

## 🧪 Testing Credentials

### Test User
```
Email: test@example.com
Password: Test@123456
OTP: Check console in development
```

### Test Admin
```
Email: admin@example.com
Password: Admin@123456
Role: super_admin
```

### Test Bank Details (Default)
```
Account Name: Marasim
Bank Name: Saudi National Bank
Account Number: 1234567890
IBAN: SA49XXXXXXXXXXXXXXXXXXXX
```

---

## 🎯 Common Tasks

### Register a New User
```
1. Go to /en/auth/register
2. Enter email, name, password
3. Submit
4. Check console for OTP (dev) or email (production)
5. Enter OTP
6. Account created with FREE TRIAL
```

### Create Event
```
1. Login to /en/dashboard
2. Click "Create Event" button
3. Fill event details (name, date, venue, etc.)
4. Click "Save"
5. Add guests from the guests management page
```

### Upgrade User to Paid Plan
```
Option 1 - User Self-Service:
1. Go to /pricing
2. Select plan (Basic or Pro)
3. Choose payment method (PayPal or Bank Transfer)
4. Complete payment

Option 2 - Admin Upgrade:
1. Login to admin dashboard
2. Go to "Users Management"
3. Find user
4. Click "Upgrade"
```

### Approve Bank Transfer Payment
```
1. Login to admin dashboard (/admin-login)
2. Go to "Bank Transfers" tab
3. Find pending payment
4. Click "View Proof" to verify screenshot
5. Click "Approve" button
6. User subscription activates immediately
```

### View Contact Messages
```
1. Login to admin dashboard
2. Go to "Contact Messages" tab
3. See all messages from public contact form
4. Mark as read or reply to message
```

---

## ⚙️ Quick Configuration

### Change Trial Duration
File: `src/app/api/auth/register/route.ts`
Line: `trialExpiry.setDate(trialExpiry.getDate() + 3);`
Change `3` to desired number of days

### Change Plan Prices
```sql
-- In Supabase SQL Editor
UPDATE subscription_plans 
SET price_paypal = 12.99 
WHERE name = 'Basic Plan';

UPDATE subscription_plans 
SET price_paypal = 24.99 
WHERE name = 'Pro Plan';
```

### Change OTP Expiry
File: `src/lib/otpService.ts`
Line: `expiryDate.setMinutes(expiryDate.getMinutes() + 15);`
Change `15` to desired number of minutes

### Change Bank Account
```sql
-- In Supabase SQL Editor
UPDATE bank_accounts 
SET account_number = 'YOUR_NUMBER',
    iban = 'YOUR_IBAN',
    account_holder = 'YOUR_NAME',
    bank_name = 'YOUR_BANK'
WHERE is_active = true;
```

---

## 🔍 Debugging

### View OTP in Development
```
1. Open browser console (F12)
2. Go to /en/auth/register
3. Enter email and submit
4. Check console → OTP will be logged
5. Copy and use OTP
```

### Check Payment Status
```sql
SELECT id, user_id, payment_method, status, amount, created_at
FROM payments
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

### Check User Subscription
```sql
SELECT id, email, account_type, subscription_status, plan_type, subscription_expiry, event_limit
FROM users
WHERE email = 'user@example.com';
```

### View Admin Actions Log
```
Check browser console when admin performs actions
All API calls are logged with responses
Database includes created_at and updated_at timestamps
```

---

## 📞 Service Credentials Needed

Before going live, you need:

**PayPal**
- Client ID
- Secret Key
- (Get from PayPal Developer Dashboard)

**SendGrid**
- API Key
- From Email Address
- (Get from SendGrid account)

**Twilio**
- Account SID
- API Key
- Phone Number
- Verify Service SID
- (Get from Twilio Dashboard)

**Supabase**
- Project URL
- Anon Key
- Service Role Key
- (Already configured)

---

## 🚀 Deployment Checklist

- [ ] Update all environment variables
- [ ] Change PayPal to production mode
- [ ] Update bank account details
- [ ] Configure SendGrid API key
- [ ] Setup Twilio WhatsApp business
- [ ] Create first admin user
- [ ] Test all payment flows
- [ ] Setup error tracking (optional)
- [ ] Configure domain DNS
- [ ] Setup SSL/HTTPS certificate
- [ ] Deploy to Vercel/Netlify
- [ ] Monitor logs and errors

---

## 📚 Documentation Files

1. **BUILD_SUMMARY.md** - Overall project summary
2. **SAAS_IMPLEMENTATION.md** - System architecture & features
3. **SETUP_GUIDE.md** - Step-by-step setup instructions
4. **QUICK_REFERENCE.md** - This file

---

## 💡 Tips & Tricks

1. **Use Admin Dashboard for quick user management** - No SQL needed
2. **PayPal testing** - Use sandbox account for safe testing
3. **Bank transfer testing** - Can test full flow locally with mock proofs
4. **Check timestamps** - All records have created_at/updated_at
5. **Use Supabase UI** - Visual interface for viewing/editing data
6. **Monitor API responses** - Check network tab for API debugging
7. **Enable RLS in production** - Database security is critical

---

**Last Updated**: February 28, 2026
**Status**: Production Ready ✅
**Support**: See documentation files for detailed help
