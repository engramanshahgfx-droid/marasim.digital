# 🚀 Quick Start Guide - Marasim Platform

## What's Ready ✅

Your SaaS platform is now feature-complete with:
- ✅ User registration & authentication
- ✅ Subscription system (3 tiers)
- ✅ Stripe payment processing
- ✅ WhatsApp integration
- ✅ Event management
- ✅ Guest list management
- ✅ QR code check-ins
- ✅ RSVP tracking
- ✅ Multi-language support (EN/AR)

---

## 5-Minute Setup

### Step 1: Copy Environment Variables
```bash
cp .env.example .env.local
```

### Step 2: Get Your Keys

**Supabase:**
1. Go to https://supabase.com
2. Create a new project
3. Copy Project URL to `NEXT_PUBLIC_SUPABASE_URL`
4. Go to Settings → API → copy Anon Key to `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
5. Copy Service Role Key to `SUPABASE_SERVICE_ROLE_KEY`

**Stripe:**
1. Go to https://stripe.com/dashboard
2. Copy Publishable Key to `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Copy Secret Key to `STRIPE_SECRET_KEY`
4. Go to Developers → WebHooks
5. Add endpoint: `http://localhost:3000/api/webhooks/stripe`
6. Copy Signing Secret to `STRIPE_WEBHOOK_SECRET`

**Twilio (Optional):**
1. Go to https://www.twilio.com/console
2. Copy Account SID to `TWILIO_ACCOUNT_SID`
3. Copy Auth Token to `TWILIO_AUTH_TOKEN`
4. Get your WhatsApp-enabled phone number

### Step 3: Setup Database
1. In Supabase, go to SQL Editor
2. Create a new query
3. Copy and run `supabase/schema.sql`

### Step 4: Create Stripe Prices
1. In Stripe Dashboard, go to Products
2. Create 3 products: Basic, Pro, Enterprise
3. Create recurring prices for each
4. Copy price IDs to the database:

```sql
UPDATE subscription_plans SET 
  stripe_price_id_monthly = 'price_...'
WHERE name = 'Basic';

UPDATE subscription_plans SET 
  stripe_price_id_monthly = 'price_...'
WHERE name = 'Pro';

UPDATE subscription_plans SET 
  stripe_price_id_monthly = 'price_...'
WHERE name = 'Enterprise';
```

### Step 5: Run the App
```bash
npm run dev
```

Visit `http://localhost:3000` 🎉

---

## Testing the Flow

1. **Register**: Go to `/auth/register` and create account
2. **See Pricing**: Auto-redirected to `/pricing`
3. **Choose Plan**: Click any plan, Stripe opens
4. **Test Payment**: Use Stripe test card: `4242 4242 4242 4242`
5. **Success**: Redirected to dashboard with active subscription

---

## Key Files & Routes

### Authentication
- `src/app/auth/login/page.tsx` - Login page
- `src/app/auth/register/page.tsx` - Register page
- `src/lib/auth.ts` - Auth utilities

### Payments
- `src/app/pricing/page.tsx` - Pricing page
- `src/app/api/stripe/*` - Stripe operations
- `src/app/api/webhooks/stripe` - Webhook handler

### WhatsApp
- `src/app/api/whatsapp/send-invitations` - Send invitations
- `src/lib/twilio.ts` - WhatsApp utilities

### Dashboard
- `src/app/event-management-dashboard/` - Main dashboard
- `src/app/guest-list-management/` - Guest management
- `src/app/qr-check-in-system/` - QR check-ins

---

## Important: Supabase RLS

When you run the schema, Row-Level Security is automatically enabled. This means:

✅ Users can only see their own data
✅ Queries are protected at the database level
✅ No need for manual security checks on queries

---

## Stripe Webhook Events Handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Record payment |
| `invoice.payment_succeeded` | Renew subscription |
| `customer.subscription.created` | Activate plan |
| `customer.subscription.updated` | Update limits |
| `customer.subscription.deleted` | Deactivate subscription |
| `invoice.payment_failed` | Mark payment failed |

---

## Database Schema Overview

```
┌─────────────────┐
│     users       │ ← Main user + subscription status
├─────────────────┤
│ subscription_   │ ← 3 plans: Basic, Pro, Enterprise
│ plans           │
├─────────────────┤
│  subscriptions  │ ← Active subscription per user
├─────────────────┤
│   payments      │ ← Payment history
├─────────────────┤
│     events      │ ← User's events
├─────────────────┤
│     guests      │ ← Guests per event
├─────────────────┤
│    messages     │ ← WhatsApp tracking
├─────────────────┤
│   templates     │ ← Email templates
└─────────────────┘
```

All tables have RLS policies enabled.

---

## Common Issues

**Q: Stripe webhook not working?**
A: Make sure webhook secret in `.env` matches Stripe Dashboard

**Q: Supabase queries failing?**
A: Check RLS policies are enabled and correct in SQL Editor

**Q: WhatsApp test failing?**
A: Verify Twilio credentials and phone number format

**Q: Payment not creating subscription?**
A: Check webhook is receiving events in Stripe Dashboard

---

## Next Steps

1. **Customize pricing** - Modify plans in `supabase/schema.sql`
2. **Add your branding** - Update colors in `tailwind.config.js`
3. **Create templates** - Add email templates
4. **Set up monitoring** - Add Sentry or similar
5. **Deploy** - Push to Vercel with production keys

---

## Support Resources

- 📚 [Supabase Docs](https://supabase.com/docs)
- 💳 [Stripe Docs](https://stripe.com/docs)
- 📱 [Twilio WhatsApp](https://www.twilio.com/docs/whatsapp)
- ⚙️ [Next.js Docs](https://nextjs.org/docs)

---

**Ready to go!** 🎉 Start with npm run dev and test the full flow.
