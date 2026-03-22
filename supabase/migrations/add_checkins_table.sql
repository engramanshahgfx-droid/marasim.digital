-- Create checkins audit table for QR check-in tracking
CREATE TABLE IF NOT EXISTS checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_id UUID REFERENCES guests(id) ON DELETE CASCADE NOT NULL,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    checked_in_by UUID REFERENCES users(id) ON DELETE SET NULL,
    checked_in_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    check_in_method TEXT DEFAULT 'qr_scan' CHECK (check_in_method IN ('qr_scan', 'manual'))
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_checkins_event_id  ON checkins(event_id);
CREATE INDEX IF NOT EXISTS idx_checkins_guest_id  ON checkins(guest_id);
CREATE INDEX IF NOT EXISTS idx_checkins_checked_at ON checkins(checked_in_at DESC);

-- Ensure guests table has the QR / check-in columns (idempotent)
ALTER TABLE guests
    ADD COLUMN IF NOT EXISTS qr_token   TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

-- Back-fill qr_token for any existing rows that have none
UPDATE guests SET qr_token = encode(gen_random_bytes(32), 'hex') WHERE qr_token IS NULL;
