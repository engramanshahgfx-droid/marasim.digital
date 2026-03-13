# Marasim Platform - Complete Implementation Guide

## 🎯 Project Overview

This is a **complete SaaS-based Marasim platform** built with:
- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + Email OTP
- **Payments**: PayPal + Bank Transfer (Manual Approval)
- **Communications**: SendGrid (Email) + Twilio (WhatsApp)
- **Styling**: Tailwind CSS

---

## 📊 System Architecture

### User Roles
```
user         → Regular user (can create events, send invitations)
super_admin  → Admin user (approves payments, manages platform)
```

### Subscription System
```
Free Plan (Trial)     → 3 days, 1 event limit, 20 guests
Basic Plan ($9.99)    → Unlimited events, QR codes, basic features
Pro Plan ($19.99)     → All features + advanced reports + exports
```

### Payment Methods
```
PayPal              → Automatic, instant activation
Bank Transfer       → Manual, admin approval required (24 hours)
```

---

## 🗄️ Database Schema

### Core Tables

#### `users`
```sql
- id (UUID)
- email (TEXT UNIQUE)
- full_name (TEXT)
- phone (TEXT)
- role ('user' | 'super_admin')
- account_type ('free' | 'paid')
- subscription_status ('inactive' | 'active' | 'trial' | 'suspended')
- plan_type ('free' | 'basic' | 'pro')
- subscription_expiry (TIMESTAMPTZ)
- event_limit (INTEGER)
- created_at, updated_at
```

#### `subscription_plans`
```sql
- id (UUID)
- name (TEXT UNIQUE)
- description (TEXT)
- price_paypal (DECIMAL)
- event_limit (INTEGER)
- features (JSONB)
- is_active (BOOLEAN)
- display_order (INTEGER)
```

#### `payments`
```sql
- id (UUID)
- user_id (UUID FK)
- plan_id (UUID FK)
- amount (DECIMAL)
- payment_method ('paypal' | 'bank_transfer')
- status ('pending' | 'approved' | 'rejected')

-- PayPal fields
- paypal_transaction_id (TEXT UNIQUE)
- paypal_payer_email (TEXT)

-- Bank Transfer fields
- reference_code (TEXT UNIQUE)
- proof_image_url (TEXT)
- bank_name (TEXT)
- account_holder (TEXT)
```

#### `bank_accounts`
```sql
- id (UUID)
- account_number (TEXT)
- iban (TEXT)
- account_holder (TEXT)
- bank_name (TEXT)
- is_active (BOOLEAN)
```

#### `events`
```sql
- id (UUID)
- user_id (UUID FK)
- name (TEXT)
- date (DATE)
- time (TIME)
- venue (TEXT)
- description (TEXT)
- event_type (TEXT)
- expected_guests (INTEGER)
- status (TEXT)
```

#### `guests`
```sql
- id (UUID)
- event_id (UUID FK)
- name (TEXT)
- phone (TEXT)
- email (TEXT)
- status ('confirmed' | 'declined' | 'no_response')
- qr_token (TEXT UNIQUE)
- checked_in (BOOLEAN)
- checked_in_at (TIMESTAMPTZ)
```

#### `contact_messages`
```sql
- id (UUID)
- name (TEXT)
- email (TEXT)
- message (TEXT)
- status ('unread' | 'read' | 'replied')
- reply (TEXT)
- created_at, updated_at
```

---

## 🔑 API Routes

### Authentication
- `POST /api/auth/send-otp` - Send OTP to email
- `POST /api/auth/register` - Register new user

### Payments

#### PayPal
- `POST /api/payments/paypal/create-order` - Create PayPal order
- `POST /api/payments/paypal/verify-payment` - Verify and activate subscription

#### Bank Transfer
- `POST /api/payments/bank-transfer/create-request` - Create bank transfer request
- `POST /api/payments/bank-transfer/upload-proof` - Upload payment proof

#### Admin
- `POST /api/admin/payments/approve` - Approve bank transfer
- `DELETE /api/admin/payments/approve` - Reject bank transfer

### Contact
- `POST /api/contact` - Submit contact message
- `GET /api/contact` - Get all messages (admin only)

---

## 🎨 Frontend Pages

### Public Pages
```
/                           → Home page
/features                   → Features page
/pricing                    → Pricing & payment plans
/contact                    → Contact form
```

### Authentication Pages
```
/[locale]/auth/login        → User login
/[locale]/auth/register     → User registration
/[locale]/auth/sign-out     → Logout
```

### User Dashboard Pages
```
/[locale]/dashboard                      → Main dashboard
/[locale]/event-management-dashboard     → Event management
/[locale]/guest-list-management          → Guest management
/[locale]/qr-check-in-system            → QR check-in
```

### Payment Pages
```
/[locale]/payment/paypal               → PayPal checkout
/[locale]/payment/bank-transfer        → Bank transfer checkout
/[locale]/payment-success              → Success page
/[locale]/payment-cancelled            → Cancelled page
```

### Admin Pages
```
/admin-login                 → Admin login (super_admin only)
/admin/dashboard             → Admin dashboard
  ├── Dashboard Overview
  ├── Users Management
  ├── Payments Management
  ├── Bank Transfers (Approvals)
  ├── Contact Messages
  ├── Plans Management
  └── Settings
```

---

## 🔐 Security Features

### Authentication & Authorization
✅ Email OTP verification for registration
✅ Supabase Auth with session management
✅ Role-based access control (RBAC)
✅ Row-level security (RLS) policies
✅ Super admin protected routes

### Payment Security
✅ Payment verification before subscription activation
✅ Reference codes for bank transfers
✅ Payment proof image uploads
✅ Manual admin approval for bank transfers
✅ Status tracking for all payments

### Data Protection
✅ Encrypted passwords
✅ Secure database connections
✅ HTTPS only in production
✅ API rate limiting (implement in production)

---

## 📱 User Journey

### 1. Registration Flow
```
User visits website
  ↓
Clicks "Create Invitation"
  ↓
Enters email, name, password
  ↓
Receives OTP via email
  ↓
Verifies OTP
  ↓
Account created with FREE TRIAL (3 days, 1 event)
  ↓
Redirected to dashboard
```

### 2. Event Creation (Free Trial)
```
User in dashboard
  ↓
Clicks "Create Event"
  ↓
Can create 1 event (limited by FREE plan)
  ↓
Adds guests (max 20 in free)
  ↓
Generates QR codes
  ↓
Sends WhatsApp invitations
```

### 3. Subscription Flow (PayPal)
```
Free trial ends OR user wants more events
  ↓
Clicks "Upgrade" or "Create Event" (error shown)
  ↓
Redirected to /pricing
  ↓
Selects plan & clicks "Pay with PayPal"
  ↓
Goes to PayPal checkout
  ↓
Payment successful
  ↓
Webhook or confirmation received
  ↓
subscription_status = 'active'
account_type = 'paid'
plan_type = selected plan
event_limit = unlimited/5 based on plan
  ↓
Redirected to /payment-success
  ↓
User has access to all paid features
```

### 4. Subscription Flow (Bank Transfer)
```
Free trial ends OR user wants more events
  ↓
Clicks "Upgrade"
  ↓
Goes to /pricing
  ↓
Selects plan & clicks "Bank Transfer"
  ↓
System generates unique reference code
  ↓
Shows bank account details:
  - Account holder name
  - Bank name
  - Account number
  - IBAN
  - Reference code (IMPORTANT)
  ↓
User manually transfers money (includes reference code)
  ↓
User uploads payment screenshot as proof
  ↓
Payment status = 'pending'
  ↓
Admin reviews in dashboard
  ↓
If valid: Admin clicks "Approve"
  ↓
subscription_status = 'active'
account_type = 'paid'
subscription_expiry = 30 days from approval
  ↓
User receives notification
  ↓
Full features unlocked
```

### 5. Admin Approval Workflow
```
Bank transfer payment submitted
  ↓
Admin logs in at /admin-login
  ↓
Goes to /admin/dashboard
  ↓
Clicks "Bank Transfers" tab
  ↓
Sees pending payments with:
  - User email
  - Plan name
  - Amount
  - Reference code
  - Proof image link
  ↓
Reviews proof image
  ↓
Clicks "Approve" or "Reject"
  ↓
If Approve:
  - Payment status = 'approved'
  - User subscription activated
  - User notified
```

---

## 🚀 Getting Started

### 1. Setup Environment Variables
```bash
# Copy .env and update with your values:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=your_email
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_API_KEY_SECRET=your_twilio_secret
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_SECRET_KEY=your_paypal_secret
```

### 2. Setup Supabase Database
```bash
# Run the updated schema:
# Copy contents of supabase/schema-updated.sql
# Paste into Supabase SQL Editor and execute
```

### 3. Install Dependencies
```bash
npm install
# or
yarn install
```

### 4. Run Development Server
```bash
npm run dev
```

Access the application:
- User app: http://localhost:3000
- Admin panel: http://localhost:3000/admin-login

### 5. Create Test Admin User
```sql
-- In Supabase SQL Editor:
INSERT INTO users (email, full_name, role, account_type, subscription_status)
VALUES ('admin@example.com', 'Admin User', 'super_admin', 'paid', 'active');

-- Then create auth user for this email with password
```

---

## 💰 Monetization

### Revenue Model
1. **Subscription Plans**: Monthly/Annual recurring revenue
2. **Payment Methods**:
   - PayPal: Automatic payments, take commission
   - Bank Transfer: Final client pays bank fees

### Pricing Strategy
- **Free Trial**: 3 days, 1 event, 20 guests
- **Basic Plan**: $9.99/mo or $99.90/yr (5 events)
- **Pro Plan**: $19.99/mo or $199.90/yr (unlimited)

---

## 📋 Checklist for Production

- [ ] Configure real PayPal credentials (production keys)
- [ ] Setup webhook for PayPal IPN notifications
- [ ] Configure SendGrid email templates
- [ ] Setup Twilio WhatsApp messaging
- [ ] Enable HTTPS/SSL in production
- [ ] Configure API rate limiting
- [ ] Setup automated backups
- [ ] Configure CDN for assets
- [ ] Setup monitoring & error logging
- [ ] Create admin user accounts
- [ ] Test all payment flows end-to-end
- [ ] Setup customer support system
- [ ] Create terms of service & privacy policy
- [ ] Configure email notifications for admins
- [ ] Implement user analytics

---

## 🔧 Customization Guide

### Change Bank Account Details
Edit `supabase/schema-updated.sql` - `bank_accounts` insert statement

### Change Pricing
Update `subscription_plans` in database or use admin panel

### Change Trial Period
Modify `src/app/api/auth/register/route.ts` - change trial expiry calculation

### Change OTP Expiry
Modify `src/lib/otpService.ts` - change minutes (currently 15)

### Add New Features
1. Add to `subscription_plans.features` JSONB
2. Check with `canAccessFeature()` in your code
3. Show/hide UI based on feature availability

---

## 🐛 Common Issues & Solutions

### Issue: Users can't receive OTP emails
**Solution**: Check SENDGRID_API_KEY and SENDGRID_FROM_EMAIL in .env

### Issue: PayPal payment not working
**Solution**: Verify NEXT_PUBLIC_PAYPAL_CLIENT_ID and PAYPAL_SECRET_KEY

### Issue: Admin can't login
**Solution**: Verify user has `role = 'super_admin'` in database

### Issue: Bank transfer reference code not unique
**Solution**: Reference codes are generated with timestamp + random hex, should be unique

---

## 📞 Support & Contact

For issues or questions:
- Check error logs in browser console
- Check server logs in terminal
- Review Supabase logs for database errors
- Check email service (SendGrid) logs

---

## 🎉 You're All Set!

Your Marasim platform is now fully configured with:
✅ User authentication & registration
✅ Free trial system
✅ PayPal integration
✅ Bank transfer with manual approval
✅ User dashboard
✅ Admin dashboard  
✅ Event management
✅ Guest management
✅ QR check-in system
✅ Contact messaging
✅ Subscription limits & guards

Start building and grow your business! 🚀
