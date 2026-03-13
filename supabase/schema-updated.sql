-- Marasim Platform - Supabase Database Schema (Updated)
-- Version: 2.0.0 - PayPal + Bank Transfer

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

ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE (Updated for new role system)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'super_admin')),
    account_type TEXT NOT NULL DEFAULT 'free' CHECK (account_type IN ('free', 'paid')),
    subscription_status TEXT NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('inactive', 'active', 'trial', 'suspended', 'cancelled')),
    plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'basic', 'pro')),
    subscription_expiry TIMESTAMPTZ,
    event_limit INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- SUBSCRIPTION PLANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    price_paypal DECIMAL(10, 2) NOT NULL,
    event_limit INTEGER,
    features JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO subscription_plans (name, description, price_paypal, event_limit, features, display_order) VALUES
    ('Basic Plan', 'Unlimited events, QR codes, standard features', 9.99, NULL, '{"qr_codes": true, "basic_reports": true, "csv_export": false, "priority_support": false}', 1),
    ('Pro Plan', 'Unlimited everything with advanced reports and exports', 19.99, NULL, '{"qr_codes": true, "advanced_reports": true, "csv_export": true, "excel_export": true, "priority_support": true}', 2)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- PAYMENTS TABLE (Updated for PayPal & Bank Transfer)
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT NOT NULL CHECK (payment_method IN ('paypal', 'bank_transfer')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'failed')),
    
    -- PayPal fields
    paypal_transaction_id TEXT UNIQUE,
    paypal_payer_email TEXT,
    
    -- Bank Transfer fields
    reference_code TEXT UNIQUE,
    proof_image_url TEXT,
    bank_name TEXT,
    account_holder TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_payment_method ON payments(payment_method);

-- ============================================
-- BANK ACCOUNT INFO TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_number TEXT NOT NULL,
    iban TEXT NOT NULL,
    account_holder TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    currency TEXT DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Al Rajhi Bank account details
INSERT INTO bank_accounts (account_number, iban, account_holder, bank_name, currency, is_active) VALUES
    ('0108089585850010', 'SA9230400108089585850010', 'SAJJAD BAQER BIN IBRAHIM ALMURAYHIL', 'Al Rajhi Bank', 'SAR', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================
-- EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL DEFAULT '18:00',
    venue TEXT NOT NULL,
    description TEXT,
    event_type TEXT DEFAULT 'general',
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
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'no_response' CHECK (status IN ('confirmed', 'declined', 'no_response', 'not_delivered')),
    qr_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    checked_in BOOLEAN DEFAULT FALSE,
    checked_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, phone)
);

CREATE INDEX idx_guests_event_id ON guests(event_id);
CREATE INDEX idx_guests_status ON guests(status);
CREATE INDEX idx_guests_qr_token ON guests(qr_token);

-- ============================================
-- INVITATION TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invitation_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

-- ============================================
-- MESSAGES TABLE (WhatsApp tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
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
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    checked_in_by UUID REFERENCES users(id),
    checked_in_at TIMESTAMPTZ DEFAULT NOW(),
    check_in_method TEXT DEFAULT 'qr_scan' CHECK (check_in_method IN ('qr_scan', 'manual'))
);

CREATE INDEX idx_checkins_event_id ON checkins(event_id);
CREATE INDEX idx_checkins_guest_id ON checkins(guest_id);

-- ============================================
-- CONTACT MESSAGES TABLE (Public Contact Us Form)
-- ============================================
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied')),
    reply TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contact_messages_email ON contact_messages(email);
CREATE INDEX idx_contact_messages_status ON contact_messages(status);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id OR role = 'super_admin');

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Super admin can view all users" ON users
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
    );

-- Subscription Plans policies (public read)
CREATE POLICY "Anyone can view active subscription plans" ON subscription_plans
    FOR SELECT USING (is_active = TRUE);

-- Payments policies
CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Super admin can view all payments" ON payments
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
    );

-- Bank accounts (super admin only)
CREATE POLICY "Super admin can view bank accounts" ON bank_accounts
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
    );

-- Events policies
CREATE POLICY "Users can view their own events" ON events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own events" ON events
    FOR ALL USING (auth.uid() = user_id);

-- Guests policies
CREATE POLICY "Users can manage guests of their events" ON guests
    FOR ALL USING (
        event_id IN (SELECT id FROM events WHERE user_id = auth.uid())
    );

-- Templates policies
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

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON guests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON invitation_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contact_messages_updated_at BEFORE UPDATE ON contact_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
