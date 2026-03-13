# Marasim - System Architecture Diagram

## 📐 Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PUBLIC INTERNET (Users)                              │
└──────────────────────────────────────────┬──────────────────────────────────┘
                                          │
                    ┌─────────────────────┴──────────────────────┐
                    │                                            │
        ┌──────────────────────┐                    ┌──────────────────────┐
        │   USER BROWSER       │                    │   ADMIN BROWSER      │
        ├──────────────────────┤                    ├──────────────────────┤
        │ • Home Page          │                    │ • Marasim Login        │
        │ • Features           │                    │ • Dashboard          │
        │ • Pricing            │                    │ • User Management    │
        │ • Register           │                    │ • Payment Approvals  │
        │ • Login              │                    │ • Reports            │
        │ • Dashboard          │                    │ • Settings           │
        │ • Events             │                    │ • Messages           │
        │ • Payments           │                    │ • Plans              │
        └──────────┬───────────┘                    └──────┬───────────────┘
                   │                                        │
                   └────────────────────────┬───────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    │                                             │
        ┌───────────────────────────────────────────────────┐   │
        │                                                   │   │
        │      NEXT.JS APPLICATION SERVER (Port 3000)      │   │
        │     (Localhost in development, Domain in Prod)    │   │
        │                                                   │   │
        │  ┌─────────────────────────────────────────────┐ │   │
        │  │  PAGES & ROUTES                             │ │   │
        │  │  ├─ Home, Features, Pricing, Contact       │ │   │
        │  │  ├─ Auth (Login, Register, OTP)           │ │   │
        │  │  ├─ Dashboard (Events, Guests, QR)        │ │   │
        │  │  ├─ Payment Pages (PayPal, Bank)          │ │   │
        │  │  └─ Admin (Login, Dashboard, Approvals)   │ │   │
        │  └─────────────────────────────────────────────┘ │   │
        │                                                   │   │
        │  ┌─────────────────────────────────────────────┐ │   │
        │  │  API ROUTES (/api)                          │ │   │
        │  │  ├─ /auth (Register, OTP, Verify)         │ │   │
        │  │  ├─ /payments (PayPal, Bank Transfer)     │ │   │
        │  │  ├─ /admin (Approvals, Management)        │ │   │
        │  │  ├─ /contact (Messages)                   │ │   │
        │  │  └─ /webhooks (PayPal IPN)                │ │   │
        │  └─────────────────────────────────────────────┘ │   │
        │                                                   │   │
        │  ┌─────────────────────────────────────────────┐ │   │
        │  │  LIBRARIES & SERVICES                       │ │   │
        │  │  ├─ Supabase Client                        │ │   │
        │  │  ├─ PayPal SDK                             │ │   │
        │  │  ├─ Auth Service                           │ │   │
        │  │  ├─ Subscription Guard                     │ │   │
        │  │  ├─ Admin Service                          │ │   │
        │  │  └─ OTP Service                            │ │   │
        │  └─────────────────────────────────────────────┘ │   │
        │                                                   │   │
        └─────────────────────┬─────────────────────────────┘   │
                              │                                 │
        ┌─────────────────────┼─────────────────────┐           │
        │                     │                     │           │
        │                     ▼                     │           │
    ┌───────────┐    ┌──────────────┐    ┌─────────────┐       │
    │           │    │              │    │             │       │
    │ SUPABASE  │    │  SENDGRID    │    │   TWILIO    │       │
    │           │    │              │    │             │       │
    │ Database  │    │  EmailOTP    │    │  WhatsApp   │       │
    │ ┌─────┐   │    └──────────────┘    │  Messages   │       │
    │ │Users│   │                        │             │       │
    │ │Plans│   │                        └─────────────┘       │
    │ │Evnts│   │                                              │
    │ │Pmnts│   │                      ┌──────────────┐        │
    │ │Gests│   │                      │   PAYPAL     │        │
    │ │Msgs │   │                      │              │        │
    │ └─────┘   │                      │  Payment     │        │
    │           │                      │  Processing  │        │
    │ Auth      │                      └──────────────┘        │
    │ ┌─────┐   │                                              │
    │ │Sess │   │                      ┌──────────────┐        │
    │ │Token│   │                      │   BANK       │        │
    │ └─────┘   │                      │              │        │
    │           │                      │  Manual      │        │
    │ Storage   │                      │  Approval    │        │
    │ ┌─────┐   │                      └──────────────┘        │
    │ │Profs│   │                                              │
    │ └─────┘   │                                              │
    └───────────┘                                              │
                                                               │
        ┌─────────────────────────────────────────────────────┘
        │
        │  EXTERNAL SERVICES (via HTTP)
        │  ├─ PayPal API (Payment Processing)
        │  ├─ SendGrid API (Email Service)
        │  ├─ Twilio API (WhatsApp)
        │  └─ Analytics (Optional)
        │
        └─ Webhook endpoints for IPN events
```

---

## 🔄 Data Flow Diagrams

### User Registration Flow
```
User
  │
  ├─→ Register Page (/en/auth/register)
  │     │
  │     ├─→ Enter: Email, Password, Name
  │     │
  │     ├─→ POST /api/auth/register
  │     │     │
  │     │     ├─→ Create Auth User (Supabase)
  │     │     │
  │     │     └─→ Create User Profile with:
  │     │           • role = 'user'
  │     │           • account_type = 'free'
  │     │           • subscription_status = 'trial'
  │     │           • event_limit = 1
  │     │           • subscription_expiry = +3 days
  │     │
  │     └─→ Auto-login → Dashboard
  │
  └─→ FREE TRIAL ACTIVE (3 Days)
```

### PayPal Payment Flow
```
User
  │
  ├─→ Select Plan → Click "Pay with PayPal"
  │
  ├─→ /en/payment/paypal?planId=xxx
  │
  ├─→ POST /api/payments/paypal/create-order
  │     │
  │     ├─→ Create Payment Record (status='pending')
  │     │
  │     └─→ Return: transactionId, paymentId
  │
  ├─→ PayPal Checkout (Simulated in dev)
  │
  ├─→ POST /api/payments/paypal/verify-payment
  │     │
  │     ├─→ Update Payment (status='approved')
  │     │
  │     └─→ Update User:
  │           • subscription_status='active'
  │           • account_type='paid'
  │           • plan_type='basic'/'pro'
  │           • event_limit=unlimited
  │           • subscription_expiry=+30 days
  │
  └─→ Redirect to /payment-success
      └─→ Full Features UNLOCKED ✅
```

### Bank Transfer Flow
```
User
  │
  ├─→ Select Plan → Click "Bank Transfer"
  │
  ├─→ /en/payment/bank-transfer?planId=xxx
  │
  ├─→ POST /api/payments/bank-transfer/create-request
  │     │
  │     ├─→ Generate Reference Code: BANK-[timestamp]-[hex]
  │     │
  │     ├─→ Create Payment Record (status='pending')
  │     │
  │     └─→ Display Bank Details:
  │           • Account Number
  │           • IBAN
  │           • Account Holder
  │           • Reference Code
  │
  ├─→ User Manually Transfers Money
  │   (Including Reference Code)
  │
  ├─→ User Goes to "Upload Proof" Step
  │
  ├─→ POST /api/payments/bank-transfer/upload-proof
  │     │
  │     ├─→ Upload Image to Supabase Storage
  │     │
  │     └─→ Update Payment (proof_image_url=...)
  │           Status still = 'pending'
  │
  ├─→ Page shows: "Waiting for Admin Approval"
  │
  └─→ User Portal: Status = PENDING APPROVAL
      (Pending = Yellow)
```

### Admin Approval Flow
```
Admin
  │
  ├─→ Login: /admin-login
  │
  ├─→ /admin/dashboard
  │
  ├─→ Click "Bank Transfers" Tab
  │
  ├─→ See Pending Payments List:
  │   • User Email
  │   • Plan Name
  │   • Amount
  │   • Reference Code
  │   • "View Proof" Link
  │
  ├─→ Review Proof Image
  │
  ├─→ Click "Approve" Button
  │
  ├─→ POST /api/admin/payments/approve
  │     │
  │     ├─→ Verify Admin Role (super_admin)
  │     │
  │     ├─→ Update Payment:
  │     │   • status = 'approved'
  │     │
  │     └─→ Update User:
  │           • subscription_status='active'
  │           • account_type='paid'
  │           • plan_type=[selected plan]
  │           • subscription_expiry=+30 days
  │           • event_limit=unlimited
  │
  │   OR
  │
  │   Click "Reject" Button
  │     │
  │     ├─→ DELETE /api/admin/payments/approve
  │     │
  │     └─→ Update Payment: status='rejected'
  │
  └─→ User Gets Notification
      (Email notification ready)
```

---

## 🗄️ Database Relationships

```
┌──────────────┐
│    users     │
├──────────────┤
│ id (PK)      │◄──────────────────────────┐
│ email        │                           │
│ full_name    │                           │
│ role         │                           │
│ account_type │                           │
│ subscription │                           │
│ plan_type    │                           │
│ event_limit  │                           │
│ created_at   │                           │
└──────────────┘                           │
       │                                   │
       │  1:N                              │
       │                                   │
   ┌───┴────────────┬─────────────────────┴──┐
   │                │                        │
   │                │                        │
   ▼                ▼                        ▼
┌────────────┐  ┌──────────┐      ┌──────────────┐
│   events   │  │ payments │      │ subscriptions│
├────────────┤  ├──────────┤      ├──────────────┤
│ id (PK)    │  │ id (PK)  │      │ id (PK)      │
│ user_id FK ├─►│ user_id  │      │ user_id FK   │
│ name       │  │ plan_id  │      │ plan_id FK   │
│ date       │  │ amount   │      │ status       │
│ venue      │  │ method   │      │ period_start │
│ status     │  │ status   │      │ period_end   │
│ created_at │  │ created  │      │ created_at   │
└────────────┘  └──────────┘      └──────────────┘
   │ 1:N              ▲
   │                  │
   │            1:N   │
   │                  │
   ▼                  │
┌─────────┐  ┌──────────────────┐
│ guests  │  │ subscription_    │
├─────────┤  │ plans            │
│ id (PK) │  ├──────────────────┤
│event_id ├─►│ id (PK)          │
│ name    │  │ name             │
│ phone   │  │ price_paypal     │
│ email   │  │ event_limit      │
│ status  │  │ features (JSON)  │
│ qr_token│  │ is_active        │
└─────────┘  └──────────────────┘

┌──────────────┐    ┌──────────────────┐
│contact_      │    │ bank_accounts    │
│ messages     │    ├──────────────────┤
├──────────────┤    │ id (PK)          │
│ id (PK)      │    │ account_number   │
│ name         │    │ iban             │
│ email        │    │ account_holder   │
│ message      │    │ bank_name        │
│ status       │    │ is_active        │
│ created_at   │    └──────────────────┘
└──────────────┘
```

---

## 🔐 Authentication & Authorization Flow

```
                        ┌─────────────────────────────┐
                        │   USER AUTHENTICATION       │
                        └────────────┬────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
            ┌───────▼────────┐            ┌────────▼─────────┐
            │  REGISTRATION  │            │     LOGIN        │
            ├────────────────┤            ├──────────────────┤
            │ 1. Email       │            │ 1. Email         │
            │ 2. Password    │            │ 2. Password      │
            │ 3. Generate OTP│            │ 3. Verify Creds  │
            │ 4. Send Email  │            │ 4. Get Token     │
            │ 5. Verify OTP  │            └──────┬───────────┘
            │ 6. Create Acct │                   │
            │ 7. Auto Login  │                   │
            └────────┬───────┘                   │
                     │                           │
                     │    ┌─────────────────────┘
                     │    │
                     ▼    ▼
            ┌──────────────────────────────┐
            │   SUPABASE SESSION TOKEN     │
            │   (Stored in Browser Local)  │
            ├──────────────────────────────┤
            │ Used for All API Requests    │
            └──────┬───────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
    ┌────────┐ ┌──────┐ ┌──────────┐
    │ Users  │ │Admins│ │Public    │
    │Access: │ │Access│ │Access:   │
    │        │ │      │ │          │
    │Own data│ │All   │ │Contact   │
    │Events  │ │data  │ │Form      │
    │Guests  │ │Usr   │ │Pricing   │
    │Payments│ │mgmt  │ │Features  │
    │        │ │Pay   │ │          │
    │        │ │approv│ │          │
    └────────┘ └──────┘ └──────────┘
         ▲       ▲
         │       │
         │   role='super_admin'
         │   → /admin routes
         │
    role='user'
    → /dashboard routes
```

---

## 💰 Payment Processing Pipeline

```
PAYMENT REQUEST
        │
        ▼
┌──────────────────────┐
│ SELECT PAYMENT METHOD│
└─────────┬────────────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
PayPal      Bank Transfer
  │           │
  │           ├─→ Generate Reference Code
  │           ├─→ Show Bank Details
  │           ├─→ Record in Database (pending)
  │           ├─→ User Transfers Money
  │           ├─→ User Uploads Proof
  │           │
  │           └─→ TO ADMIN APPROVAL
  │               │
  │               ├─→ Admin Reviews
  │               ├─→ Admin Approves/Rejects
  │               │
  │               ├─APPROVED→ Update User
  │               │           Activate Subscription
  │               │
  │               └─REJECTED→ Mark as Rejected
  │                          Notify User
  │
  └─→ PAYMENT PROCESSED
      │
      ├─→ Create Payment Record
      ├─→ Update User Subscription
      │   • status = 'active'
      │   • account_type = 'paid'
      │   • plan_type = selected
      │   • event_limit = plan limit
      │   • subscription_expiry = +30 days
      │
      └─→ ACTIVATE FULL FEATURES ✅
```

---

## 📈 Scalability Considerations

```
CURRENT ARCHITECTURE (Single Server)
├─ Frontend (Next.js) on single instance
├─ Backend API (Next.js) on same instance
├─ Database (Supabase) managed service
└─ External Services (SendGrid, Twilio, PayPal)

FOR SCALING:
├─ Frontend: Deploy to CDN (Vercel automatically does this)
├─ Backend: Serverless functions (Vercel Edge Functions)
├─ Database: Supabase handles auto-scaling
├─ File Storage: Supabase S3-compatible storage
└─ Caching: Add Redis for session caching (optional)

PERFORMANCE OPTIMIZATION:
├─ Images: Optimize and compress
├─ API calls: Implement caching
├─ Database: Add indexes for common queries
├─ Webhooks: Implement queue system for heavy operations
└─ Monitoring: Setup error tracking and performance monitoring
```

---

**Architecture Diagram Complete** ✅

This shows the complete system design, data flows, and how all components interact.
