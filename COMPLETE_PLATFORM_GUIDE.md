# Complete Event Invitation + Marketplace Platform Guide

## 📋 Overview

This guide provides a complete roadmap for transforming your e-invitation system into a full event management ecosystem with an integrated services marketplace.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Next.js Frontend                   │
│  (Event Mgmt + Marketplace + Guest Management)       │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│                   API Layer (Next.js)                │
│  Routes: /api/events, /api/services, /api/bookings  │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│           Supabase (PostgreSQL + Auth)               │
│  Tables: events, services, bookings, providers      │
└─────────────────────────────────────────────────────┘
                        ↓
           ┌───────────────────────────┐
        ┌─────────────────────────────────────┐
        │  External Services                  │
        │  - Stripe (Payments)                │
        │  - Twilio (Messaging)               │
        │  - Resend (Email)                   │
        └─────────────────────────────────────┘
```

---

## 📊 Database Schema Extensions

### 1. Services & Providers Tables

```sql
-- Providers (Service Suppliers)
CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  business_name VARCHAR NOT NULL,
  business_description TEXT,
  category VARCHAR NOT NULL, -- 'invitations', 'catering', 'venue', etc.
  phone VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  logo_url TEXT,
  cover_image_url TEXT,
  rating DECIMAL(3,2) DEFAULT 0,
  reviews_count INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  featured_until TIMESTAMP,
  commission_rate DECIMAL(5,2) DEFAULT 10, -- Platform commission percentage
  bank_account_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Services (Products/Services offered by providers)
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR NOT NULL,
  subcategory VARCHAR,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR DEFAULT 'SAR',
  images JSONB, -- Array of image URLs
  features JSONB, -- Array of service features
  duration VARCHAR, -- e.g., "2 hours", "1 day"
  availability JSONB, -- Days and times available
  max_bookings_per_month INT,
  current_bookings_this_month INT DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  reviews_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Bookings (Customer bookings for services)
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id),
  service_id UUID NOT NULL REFERENCES services(id),
  provider_id UUID NOT NULL REFERENCES providers(id),
  customer_id UUID NOT NULL REFERENCES auth.users(id),
  booking_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  quantity INT DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2), -- Calculated fee
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  payment_status VARCHAR DEFAULT 'unpaid', -- unpaid, paid, refunded
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Service Reviews & Ratings
CREATE TABLE service_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id),
  booking_id UUID REFERENCES bookings(id),
  customer_id UUID NOT NULL REFERENCES auth.users(id),
  rating INT NOT NULL, -- 1-5
  title VARCHAR NOT NULL,
  review_text TEXT,
  images JSONB, -- Photos from customer
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Service Categories
CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR,
  parent_category_id UUID REFERENCES service_categories(id),
  display_order INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Marketplace Configuration
CREATE TABLE marketplace_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_commission_rate DECIMAL(5,2) DEFAULT 10,
  minimum_service_price DECIMAL(10,2) DEFAULT 50,
  maximum_service_price DECIMAL(10,2) DEFAULT 100000,
  featured_listing_price DECIMAL(10,2) DEFAULT 99.99,
  featured_listing_duration_days INT DEFAULT 30,
  provider_verification_required BOOLEAN DEFAULT FALSE,
  require_service_approval BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Events Table Extensions

```sql
-- Add marketplace fields to events table if not exists
ALTER TABLE events ADD COLUMN IF NOT EXISTS
  services_booked JSONB DEFAULT '[]'; -- Array of booked service IDs

ALTER TABLE events ADD COLUMN IF NOT EXISTS
  total_service_cost DECIMAL(10,2) DEFAULT 0;

ALTER TABLE events ADD COLUMN IF NOT EXISTS
  marketplace_enabled BOOLEAN DEFAULT TRUE;
```

---

## 🎯 Core Features Implementation

### Feature 1: Services Marketplace

#### 1.1 Service Categories
- **Invitations & Designs**: Digital cards, Printed cards, Video invitations
- **Gifts & Favors**: Gift boxes, Guest giveaways, Thank-you cards
- **Flowers & Decorations**: Bouquets, Event decoration, Entrance setup
- **Catering & Food**: Catering companies, Cakes & sweets, Coffee & dates
- **Photography & Video**: Photographers, Videography, Drone & live streaming
- **Venues**: Wedding halls, Farms & resorts, Hotels
- **Clothing & Beauty**: Dresses, Abayas, Makeup services
- **Additional Services**: DJs, Lighting, Event planners

#### 1.2 Provider Registration Flow
```
User Registration
       ↓
If Provider: Creator Profile → Service Creation → Marketplace Listing
If Customer: Customer Profile → Browse Services → Book Services
```

#### 1.3 Service Listing Features
- High-quality image gallery
- Detailed descriptions
- Pricing structure
- Availability calendar
- Customer reviews (5-star rating)
- Verification badge
- Featured status

---

### Feature 2: Booking System

#### 2.1 Booking Flow
```
1. Customer views event
2. Customer browses marketplace services
3. Selects service & booking date
4. Configures booking details (quantity, preferences)
5. Reviews pricing & platform fee
6. Proceeds to payment
7. Booking confirmed → Notification to provider
8. Service completed → Review & rating
```

#### 2.2 Booking Management
- Real-time availability checking
- Overbooking prevention
- Automatic calendar sync
- Booking confirmations (Email + SMS)
- Provider notifications
- Customer communication

---

### Feature 3: Provider Dashboard

#### 3.1 Dashboard Analytics
- Total revenue
- Active bookings
- Completed services
- Average rating
- Review trends
- Monthly earnings breakdown

#### 3.2 Provider Tools
- Service management (add/edit/delete)
- Availability calendar
- Booking management
- Customer communication
- Payment tracking
- Bank account management
- Featured listing purchase

---

### Feature 4: Messaging System

#### 4.1 Invitation Templates
```
Templates for:
1. Initial invitation
2. RSVP reminder (7 days before)
3. RSVP reminder (3 days before)
4. Event reminder (1 day before)
5. Post-event thank you
6. Event photos update
```

#### 4.2 Message Channels
- **Email**: Using Resend (already integrated)
- **WhatsApp**: Using Twilio (already integrated)
- **SMS**: Using Twilio (already integrated)
- **In-app notifications**: Push notifications

#### 4.3 Bulk Messaging
- Schedule messages for specific times
- Track open rates & delivery
- A/B testing for subject lines
- Template personalization (guest name, event details)

---

## 🛠️ Implementation Phases

### Phase 1: Database & API (Week 1-2)
- [ ] Create migration file for marketplace tables
- [ ] Create API endpoints:
  - `GET /api/services/categories` - Get service categories
  - `GET /api/services/list` - Search services
  - `GET /api/services/:id` - Service details
  - `POST /api/services` - Create service (provider)
  - `GET /api/bookings/:eventId` - Get event bookings
  - `POST /api/bookings` - Create booking
  - `GET /api/providers/:id` - Provider profile
  - `POST /api/providers` - Register provider

### Phase 2: Frontend Pages (Week 2-3)
- [ ] Marketplace browse page
- [ ] Service detail page
- [ ] Service booking form
- [ ] Provider profile page
- [ ] Provider dashboard

### Phase 3: Payment Integration (Week 3)
- [ ] Stripe integration for service bookings
- [ ] Commission calculation
- [ ] Payment tracking

### Phase 4: Advanced Features (Week 4+)
- [ ] Reviews & ratings system
- [ ] Bulk messaging scheduler
- [ ] Analytics dashboard
- [ ] Provider verification

---

## 📁 Recommended File Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── marketplace/
│   │   │   ├── page.tsx                 # Marketplace browse
│   │   │   ├── [serviceId]/
│   │   │   │   └── page.tsx             # Service detail
│   │   │   └── search/
│   │   │       └── page.tsx             # Search results
│   │   ├── my-bookings/
│   │   │   └── page.tsx                 # Customer bookings
│   │   ├── provider-dashboard/
│   │   │   ├── page.tsx                 # Dashboard
│   │   │   ├── services/
│   │   │   │   └── page.tsx
│   │   │   ├── bookings/
│   │   │   │   └── page.tsx
│   │   │   └── analytics/
│   │   │       └── page.tsx
│   │   └── provider-register/
│   │       └── page.tsx
│   └── api/
│       ├── services/
│       │   ├── list/route.ts
│       │   ├── search/route.ts
│       │   ├── [id]/route.ts
│       │   └── categories/route.ts
│       ├── bookings/
│       │   ├── create/route.ts
│       │   ├── [id]/route.ts
│       │   └── list/route.ts
│       └── providers/
│           ├── register/route.ts
│           ├── [id]/route.ts
│           └── dashboard/stats/route.ts
├── components/
│   ├── marketplace/
│   │   ├── ServiceCard.tsx
│   │   ├── ServiceGrid.tsx
│   │   ├── ServiceFilters.tsx
│   │   └── ServiceSearch.tsx
│   ├── bookings/
│   │   ├── BookingForm.tsx
│   │   ├── BookingCalendar.tsx
│   │   └── BookingConfirmation.tsx
│   └── provider/
│       ├── ProviderDashboard.tsx
│       ├── ServiceManager.tsx
│       └── AnalyticsPanel.tsx
└── lib/
    ├── bookingService.ts
    ├── providerService.ts
    └── marketplaceUtils.ts
```

---

## 🔑 Key Implementation Details

### 1. Search & Filter System
```typescript
// Query parameters
GET /api/services/list?
  category=catering
  &minPrice=100
  &maxPrice=1000
  &rating=4
  &availability=2026-03-25
  &page=1
  &limit=20
```

### 2. Commission Calculation
```typescript
subtotal = service_price * quantity
platform_fee = subtotal * (commission_rate / 100)
total = subtotal + platform_fee
provider_earnings = subtotal - (subtotal * commission_rate / 100)
```

### 3. Availability Management
```typescript
// Service availability JSONB structure
{
  "monday": { "available": true, "start": "09:00", "end": "18:00" },
  "tuesday": { "available": true, "start": "09:00", "end": "18:00" },
  // ...
  "blackout_dates": ["2026-04-01", "2026-04-02"]
}
```

### 4. Featured Listings
```typescript
// Purchase featured listing
POST /api/services/:id/feature
{
  "duration_days": 30  // or 7, 14, 30, 90
}

// Auto-expires after duration
// Renewal reminders sent before expiration
```

---

## 🔐 Security Considerations

### Provider Verification
- [ ] Email verification
- [ ] Phone number verification
- [ ] Business license verification (optional)
- [ ] Bank account verification for withdrawals

### Payment Security
- [ ] PCI compliance through Stripe
- [ ] Rate limiting on booking endpoints
- [ ] CSRF protection
- [ ] Input validation
- [ ] SQL injection prevention (Supabase handles)

### Data Privacy
- [ ] No exposure of provider bank details to customers
- [ ] Payment info encrypted
- [ ] GDPR compliance for customer data
- [ ] Audit logs for transactions

---

## 💰 Monetization Strategy

### 1. Platform Commission
- Default: 10% of service price
- Can be customized per category
- Applied to all bookings

### 2. Featured Listings
- 7 days: $19.99
- 14 days: $34.99
- 30 days: $59.99
- 90 days: $149.99

### 3. Premium Provider Plan (Future)
- $9.99/month
- Lower commission (7%)
- Priority support
- Marketing features

### 4. Advertising (Future)
- Sponsored service listings
- Category sponsorships
- Email newsletter placements

---

## 📊 Analytics & Reporting

### Customer Analytics
- Total events created
- Invitations sent
- Guest RSVPs
- Services booked
- Total spending

### Provider Analytics
- Services listed
- Total bookings
- Revenue generated
- Average rating
- Customer satisfaction

### Platform Analytics
- Total revenue
- Active providers
- Active customers
- Booking trends
- Popular services

---

## 🚀 Deployment Checklist

- [ ] All migrations applied to production database
- [ ] API endpoints tested
- [ ] Frontend pages tested (desktop + mobile)
- [ ] Payment flow tested end-to-end
- [ ] Email templates tested
- [ ] SMS/WhatsApp templates tested
- [ ] Error handling tested
- [ ] Rate limiting verified
- [ ] Security headers configured
- [ ] HTTPS enabled
- [ ] CDN configured for images
- [ ] Monitoring & logging setup
- [ ] Backup strategy verified

---

## 📗 Next Steps

1. **Review this guide** with your team
2. **Create database migration file** with provided schemas
3. **Set up API structure** with route handlers
4. **Build marketplace UI components**
5. **Implement booking system**
6. **Add payment integration**
7. **Build provider dashboard**
8. **Testing & deployment**

---

## 📞 Support & Resources

- Supabase Docs: https://supabase.com/docs
- Stripe API: https://stripe.com/docs/api
- Twilio Docs: https://www.twilio.com/docs
- Next.js App Router: https://nextjs.org/docs/app

---

**Project**: Marasim Event Management Platform
**Version**: 1.0 Complete Platform Guide
**Last Updated**: March 2026
