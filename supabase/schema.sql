-- Marasim Platform - Supabase Database Schema
-- Version: 1.0.0 MVP

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- VERIFICATION CODES TABLE (Email OTP)
-- ============================================
CREATE TABLE IF NOT EXISTS verification_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow service role full access (no RLS needed, server-only table)
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE (Extended with subscription fields)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone_number TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'super_admin')),
    account_type TEXT NOT NULL DEFAULT 'free' CHECK (account_type IN ('free', 'paid')),
    subscription_status TEXT NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('inactive', 'active', 'trial', 'suspended', 'cancelled')),
    plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'basic', 'pro', 'enterprise')),
    subscription_expiry TIMESTAMPTZ,
    demo_expiry TIMESTAMPTZ,
    event_limit INTEGER DEFAULT 1,
    guest_limit INTEGER DEFAULT 20,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT,
    whatsapp_limit_per_month INTEGER DEFAULT 0,
    whatsapp_sent_this_month INTEGER DEFAULT 0,
    last_month_reset TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUBSCRIPTION PLANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    price_monthly DECIMAL(10, 2) NOT NULL,
    price_yearly DECIMAL(10, 2),
    event_limit INTEGER,
    guest_limit INTEGER,
    whatsapp_limit INTEGER,
    features JSONB NOT NULL DEFAULT '{}',
    stripe_price_id_monthly TEXT,
    stripe_price_id_yearly TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, event_limit, guest_limit, whatsapp_limit, features, display_order) VALUES
    ('Basic', 'Perfect for getting started', 29.99, 299.90, 1, 200, 1000, '{"qr_codes": true, "basic_reports": true, "csv_export": false, "priority_support": false}', 1),
    ('Pro', 'For growing businesses', 99.99, 999.90, 5, 1000, 5000, '{"qr_codes": true, "advanced_reports": true, "csv_export": true, "excel_export": true, "priority_support": false}', 2),
    ('Enterprise', 'Full power and support', 299.99, 2999.90, NULL, NULL, NULL, '{"qr_codes": true, "advanced_reports": true, "csv_export": true, "excel_export": true, "priority_support": true, "api_access": true, "custom_branding": true}', 3)
ON CONFLICT DO NOTHING;

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT UNIQUE,
    plan_id UUID REFERENCES subscription_plans(id),
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
    payment_method TEXT,
    last_4_digits TEXT,
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    stripe_subscription_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired', 'cancelled')),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    auto_renew BOOLEAN DEFAULT TRUE,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ============================================
-- EVENTS TABLE (Extended)
-- ============================================
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL DEFAULT '18:00',
    venue TEXT NOT NULL,
    description TEXT,
    event_type TEXT DEFAULT 'wedding',
    expected_guests INTEGER DEFAULT 100,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'upcoming', 'ongoing', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_status ON events(status);

-- ============================================
-- GUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'no_response' CHECK (status IN ('confirmed', 'declined', 'no_response', 'not_delivered')),
    qr_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    checked_in BOOLEAN DEFAULT FALSE,
    checked_in_at TIMESTAMPTZ,
    plus_ones INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, phone) -- Prevent duplicate guests per event
);

CREATE INDEX idx_guests_event_id ON guests(event_id);
CREATE INDEX idx_guests_status ON guests(status);
CREATE INDEX idx_guests_qr_token ON guests(qr_token);

-- ============================================
-- INVITATION TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invitation_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'ar')),
    header_image TEXT,
    title TEXT NOT NULL DEFAULT 'You''re Invited!',
    title_ar TEXT DEFAULT 'أنت مدعو!',
    message TEXT NOT NULL,
    message_ar TEXT,
    footer_text TEXT NOT NULL DEFAULT 'Please confirm your attendance.',
    footer_text_ar TEXT DEFAULT 'يرجى تأكيد حضورك.',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_event_id ON invitation_templates(event_id);
CREATE INDEX idx_templates_user_id ON invitation_templates(user_id);

-- ============================================
-- MESSAGES TABLE (WhatsApp tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    message_type TEXT NOT NULL DEFAULT 'invitation' CHECK (message_type IN ('invitation', 'reminder', 'update')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_guest_id ON messages(guest_id);
CREATE INDEX idx_messages_event_id ON messages(event_id);
CREATE INDEX idx_messages_status ON messages(status);

-- ============================================
-- CHECKINS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    checked_in_by UUID REFERENCES users(id),
    checked_in_at TIMESTAMPTZ DEFAULT NOW(),
    check_in_method TEXT DEFAULT 'qr_scan' CHECK (check_in_method IN ('qr_scan', 'manual'))
);

CREATE INDEX idx_checkins_event_id ON checkins(event_id);
CREATE INDEX idx_checkins_guest_id ON checkins(guest_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Subscription Plans policies (public read)
CREATE POLICY "Anyone can view subscription plans" ON subscription_plans
    FOR SELECT USING (is_active = TRUE);

-- Subscriptions policies
CREATE POLICY "Users can view their own subscription" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Payments policies
CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

-- Events policies
CREATE POLICY "Users can view their own events" ON events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create events" ON events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events" ON events
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events" ON events
    FOR DELETE USING (auth.uid() = user_id);

-- Guests policies
CREATE POLICY "Users can view guests of their events" ON guests
    FOR SELECT USING (
        event_id IN (SELECT id FROM events WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can manage guests of their events" ON guests
    FOR ALL USING (
        event_id IN (SELECT id FROM events WHERE user_id = auth.uid())
    );

-- Templates policies
CREATE POLICY "Users can view their templates" ON invitation_templates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their templates" ON invitation_templates
    FOR ALL USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages of their events" ON messages
    FOR SELECT USING (
        event_id IN (SELECT id FROM events WHERE user_id = auth.uid())
    );

-- Checkins policies
CREATE POLICY "Users can view checkins of their events" ON checkins
    FOR SELECT USING (
        event_id IN (SELECT id FROM events WHERE user_id = auth.uid())
    );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guests_updated_at
    BEFORE UPDATE ON guests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON invitation_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (Optional - for development)
-- ============================================
-- Uncomment below to insert sample data

/*
INSERT INTO events (id, name, date, time, venue, event_type, expected_guests, status)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Wedding - Sarah & Ahmed', '2026-03-15', '18:00', 'Grand Ballroom, Riyadh', 'wedding', 250, 'upcoming'),
    ('22222222-2222-2222-2222-222222222222', 'Corporate Gala 2026', '2026-04-20', '19:00', 'Convention Center, Jeddah', 'corporate', 500, 'upcoming');
*/
