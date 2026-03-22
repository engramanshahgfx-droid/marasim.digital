-- Marketplace Tables Migration
-- Run this migration in Supabase SQL editor or via migrations folder
-- Created: March 2026

-- 1. Service Categories Table
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL UNIQUE,
  name_ar VARCHAR NOT NULL,
  description TEXT,
  description_ar TEXT,
  icon VARCHAR,
  icon_color VARCHAR DEFAULT '#3B82F6',
  parent_category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX idx_service_categories_parent ON service_categories(parent_category_id);
CREATE INDEX idx_service_categories_active ON service_categories(is_active);

-- Insert default categories
INSERT INTO service_categories (name, name_ar, description, description_ar, display_order) VALUES
  ('Invitations & Designs', 'الدعوات والتصاميم', 'Digital and printed invitation designs', 'تصاميم الدعوات الرقمية والمطبوعة', 1),
  ('Gifts & Favors', 'الهدايا والتذكارات', 'Gift boxes and guest favors', 'صناديق الهدايا والتذكارات', 2),
  ('Flowers & Decorations', 'الزهور والديكورات', 'Floral arrangements and event decoration', 'الزهور والديكورات الحدثية', 3),
  ('Catering & Food', 'الطعام والضيافة', 'Catering and food services', 'خدمات الطعام والضيافة', 4),
  ('Photography & Video', 'التصوير والفيديو', 'Photography and videography services', 'خدمات التصوير والفيديو', 5),
  ('Venues', 'الأماكن', 'Event venues and locations', 'أماكن وقاعات الفعاليات', 6),
  ('Clothing & Beauty', 'الملابس والتجميل', 'Fashion and beauty services', 'خدمات الملابس والتجميل', 7),
  ('Additional Services', 'خدمات إضافية', 'DJ, lighting, event planning', 'DJ والإضاءة وتنظيم الفعاليات', 8)
ON CONFLICT (name) DO NOTHING;

-- 2. Providers Table
CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name VARCHAR NOT NULL,
  business_name_ar VARCHAR,
  business_description TEXT,
  business_description_ar TEXT,
  category VARCHAR NOT NULL,
  category_ar VARCHAR,
  phone VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  business_license VARCHAR,
  logo_url TEXT,
  cover_image_url TEXT,
  website_url TEXT,
  social_media JSONB, -- {instagram: '@', tiktok: '@', facebook: ''}
  rating DECIMAL(3,2) DEFAULT 0,
  reviews_count INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id),
  is_featured BOOLEAN DEFAULT FALSE,
  featured_until TIMESTAMP WITH TIME ZONE,
  commission_rate DECIMAL(5,2) DEFAULT 10,
  bank_account_verified BOOLEAN DEFAULT FALSE,
  stripe_connect_id VARCHAR,
  is_active BOOLEAN DEFAULT TRUE,
  activation_requested_at TIMESTAMP WITH TIME ZONE,
  suspension_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_providers_user ON providers(user_id);
CREATE INDEX idx_providers_category ON providers(category);
CREATE INDEX idx_providers_verified ON providers(is_verified);
CREATE INDEX idx_providers_featured ON providers(is_featured);
CREATE INDEX idx_providers_active ON providers(is_active);

-- 3. Services Table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  name_ar VARCHAR,
  description TEXT,
  description_ar TEXT,
  category VARCHAR NOT NULL,
  category_ar VARCHAR,
  subcategory VARCHAR,
  subcategory_ar VARCHAR,
  price DECIMAL(10,2) NOT NULL,
  price_currency VARCHAR DEFAULT 'SAR',
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  final_price DECIMAL(10,2),
  images JSONB NOT NULL, -- [{url: '', caption: ''}, ...]
  features JSONB, -- [{name: '', value: ''}, ...]
  duration_value INT,
  duration_unit VARCHAR, -- 'hours', 'days', 'packages'
  max_bookings_per_month INT,
  current_bookings_this_month INT DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  reviews_count INT DEFAULT 0,
  availability JSONB NOT NULL, -- {monday: {available: true, start: '09:00', end: '18:00'}}
  blackout_dates TEXT[], -- Array of dates when service unavailable
  is_active BOOLEAN DEFAULT TRUE,
  requires_approval BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT TRUE,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_services_provider ON services(provider_id);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_active ON services(is_active);
CREATE INDEX idx_services_rating ON services(rating DESC);
CREATE INDEX idx_services_price ON services(price);

-- 4. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  provider_id UUID NOT NULL REFERENCES providers(id),
  customer_id UUID NOT NULL REFERENCES auth.users(id),
  booking_reference VARCHAR UNIQUE NOT NULL,
  booking_date DATE NOT NULL,
  event_date DATE,
  start_time TIME,
  end_time TIME,
  quantity INT DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  platform_fee DECIMAL(10,2),
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR DEFAULT 'pending', -- pending, confirmed, in_progress, completed, cancelled, refunded
  payment_status VARCHAR DEFAULT 'unpaid', -- unpaid, paid, refunded, deposit_paid
  notes TEXT,
  customer_notes TEXT,
  provider_response TEXT,
  cancellation_reason TEXT,
  cancellation_requested_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  refund_amount DECIMAL(10,2),
  refund_reason TEXT,
  refunded_at TIMESTAMP WITH TIME ZONE,
  stripe_payment_intent_id VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bookings_event ON bookings(event_id);
CREATE INDEX idx_bookings_service ON bookings(service_id);
CREATE INDEX idx_bookings_provider ON bookings(provider_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX idx_bookings_date ON bookings(booking_date);

-- 5. Service Reviews Table
CREATE TABLE IF NOT EXISTS service_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES auth.users(id),
  provider_response TEXT,
  provider_response_at TIMESTAMP WITH TIME ZONE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR NOT NULL,
  review_text TEXT NOT NULL,
  images TEXT[], -- Array of image URLs
  is_verified_purchase BOOLEAN DEFAULT TRUE,
  helpful_count INT DEFAULT 0,
  unhelpful_count INT DEFAULT 0,
  status VARCHAR DEFAULT 'published', -- draft, pending, published, hidden
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reviews_service ON service_reviews(service_id);
CREATE INDEX idx_reviews_customer ON service_reviews(customer_id);
CREATE INDEX idx_reviews_rating ON service_reviews(rating DESC);
CREATE INDEX idx_reviews_verified ON service_reviews(is_verified_purchase);

-- 6. Marketplace Settings Table
CREATE TABLE IF NOT EXISTS marketplace_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_commission_rate DECIMAL(5,2) DEFAULT 10,
  minimum_service_price DECIMAL(10,2) DEFAULT 50,
  maximum_service_price DECIMAL(10,2) DEFAULT 100000,
  featured_listing_7d_price DECIMAL(10,2) DEFAULT 19.99,
  featured_listing_14d_price DECIMAL(10,2) DEFAULT 34.99,
  featured_listing_30d_price DECIMAL(10,2) DEFAULT 59.99,
  featured_listing_90d_price DECIMAL(10,2) DEFAULT 149.99,
  provider_verification_required BOOLEAN DEFAULT FALSE,
  require_service_approval BOOLEAN DEFAULT FALSE,
  max_service_images INT DEFAULT 10,
  storage_limit_gb INT DEFAULT 100,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO marketplace_settings (platform_commission_rate)
VALUES (10)
ON CONFLICT DO NOTHING;

-- 7. Provider Featured Listings History Table
CREATE TABLE IF NOT EXISTS featured_listings_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  duration_days INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  stripe_charge_id VARCHAR,
  status VARCHAR DEFAULT 'active', -- active, expired, cancelled
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT
);

CREATE INDEX idx_featured_provider ON featured_listings_history(provider_id);
CREATE INDEX idx_featured_expires ON featured_listings_history(expires_at);

-- 8. Provider Earnings/Transactions Table
CREATE TABLE IF NOT EXISTS provider_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id),
  featured_listing_id UUID REFERENCES featured_listings_history(id),
  amount DECIMAL(10,2) NOT NULL,
  type VARCHAR NOT NULL, -- 'booking', 'featured_listing', 'refund'
  status VARCHAR DEFAULT 'pending', -- pending, completed, payout_pending, settled
  description TEXT,
  payout_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_earnings_provider ON provider_earnings(provider_id);
CREATE INDEX idx_earnings_status ON provider_earnings(status);
CREATE INDEX idx_earnings_date ON provider_earnings(created_at);

-- 9. Extension to existing events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS services_booked JSONB DEFAULT '[]';
ALTER TABLE events ADD COLUMN IF NOT EXISTS total_service_cost DECIMAL(10,2) DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS marketplace_enabled BOOLEAN DEFAULT TRUE;

-- 10. Create RLS policies for marketplace tables

-- Enable RLS
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_reviews ENABLE ROW LEVEL SECURITY;

-- Providers policies
CREATE POLICY "providers_insert_own" ON providers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "providers_update_own" ON providers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "providers_view_public" ON providers
  FOR SELECT USING (is_active = TRUE);

-- Services policies
CREATE POLICY "services_select_active" ON services
  FOR SELECT USING (is_active = TRUE AND is_approved = TRUE);

CREATE POLICY "services_insert_own_provider" ON services
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM providers WHERE id = provider_id AND user_id = auth.uid()
  ));

CREATE POLICY "services_update_own_provider" ON services
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM providers WHERE id = provider_id AND user_id = auth.uid()
  ));

-- Bookings policies
CREATE POLICY "bookings_insert_own" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "bookings_view_own" ON bookings
  FOR SELECT USING (
    auth.uid() = customer_id OR
    auth.uid() IN (SELECT user_id FROM providers WHERE id = provider_id)
  );

-- Reviews policies
CREATE POLICY "reviews_insert_own" ON service_reviews
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "reviews_view_published" ON service_reviews
  FOR SELECT USING (status = 'published');

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_providers_timestamp BEFORE UPDATE ON providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_timestamp BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_timestamp BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_timestamp BEFORE UPDATE ON service_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create materialized view for service statistics
CREATE MATERIALIZED VIEW service_stats AS
SELECT 
  s.id,
  s.provider_id,
  COUNT(DISTINCT b.id) as total_bookings,
  COUNT(DISTINCT sr.id) as total_reviews,
  AVG(sr.rating)::DECIMAL(3,2) as avg_rating,
  SUM(b.total_amount)::DECIMAL(10,2) as total_revenue,
  MAX(b.booking_date) as last_booking_date
FROM services s
LEFT JOIN bookings b ON s.id = b.service_id AND b.status IN ('completed', 'in_progress')
LEFT JOIN service_reviews sr ON s.id = sr.service_id
GROUP BY s.id, s.provider_id;

-- Index for materialized view
CREATE INDEX idx_service_stats_provider ON service_stats(provider_id);

-- Grant permissions
GRANT SELECT ON service_stats TO anon, authenticated;

-- Create function to calculate available slots
CREATE OR REPLACE FUNCTION get_available_slots(
  service_id UUID,
  booking_date DATE,
  duration_minutes INT DEFAULT 60
)
RETURNS TABLE(start_time TIME, end_time TIME) AS $$
DECLARE
  v_availability JSONB;
  v_day_name VARCHAR;
  v_slots INT;
BEGIN
  SELECT availability INTO v_availability FROM services WHERE id = service_id;
  
  SELECT LOWER(TO_CHAR(booking_date, 'day')) INTO v_day_name;
  
  -- Get available hours from the day's availability
  RETURN QUERY
  SELECT 
    (v_availability -> v_day_name ->> 'start')::TIME,
    (v_availability -> v_day_name ->> 'end')::TIME
  WHERE (v_availability -> v_day_name ->> 'available')::BOOLEAN = TRUE;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_available_slots TO anon, authenticated;

-- Create notification/audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR NOT NULL, -- INSERT, UPDATE, DELETE
  user_id UUID REFERENCES auth.users(id),
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);

-- Finish
COMMIT;
