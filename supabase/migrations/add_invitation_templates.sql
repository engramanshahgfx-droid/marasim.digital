-- Migration: Add invitation template support to events
-- Location: supabase/migrations/add_invitation_templates.sql

-- Add invitation template columns to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS template_id VARCHAR(50) DEFAULT 'modern'
  REFERENCES pg_enum_types.template_style(enumlabel);

ALTER TABLE events ADD COLUMN IF NOT EXISTS template_customization JSONB DEFAULT '{
  "primary_color": null,
  "secondary_color": null,
  "accent_color": null,
  "font_family": "sans-serif",
  "show_guest_count": true,
  "show_dress_code": true,
  "show_special_instructions": false,
  "language": "en"
}'::jsonb;

-- Create invitation templates table for storing generated invitations
CREATE TABLE IF NOT EXISTS invitation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  template_id VARCHAR(50) NOT NULL,
  customization JSONB NOT NULL DEFAULT '{}',
  invitation_data JSONB NOT NULL DEFAULT '{}',
  shareable_link VARCHAR(255) UNIQUE,
  shared_at TIMESTAMP WITH TIME ZONE,
  exported_formats TEXT[] DEFAULT '{}'::TEXT[],
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_invitation_templates_event_id 
  ON invitation_templates(event_id);

CREATE INDEX IF NOT EXISTS idx_invitation_templates_created_by 
  ON invitation_templates(created_by);

CREATE INDEX IF NOT EXISTS idx_invitation_templates_shareable_link 
  ON invitation_templates(shareable_link);

-- Create table for invitation views/analytics
CREATE TABLE IF NOT EXISTS invitation_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_template_id UUID NOT NULL REFERENCES invitation_templates(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  viewer_ip VARCHAR(45),
  user_agent TEXT,
  referrer VARCHAR(300),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_invitation_views_template_id 
  ON invitation_views(invitation_template_id);

-- Add RLS Policies
ALTER TABLE invitation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_views ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own invitation templates
CREATE POLICY "Users can read own invitation templates"
  ON invitation_templates FOR SELECT
  USING (
    auth.uid() = created_by OR
    auth.uid() IN (
      SELECT user_id FROM event_users 
      WHERE event_id = invitation_templates.event_id
    )
  );

-- Allow users to create invitation templates for their events
CREATE POLICY "Users can create invitation templates for own events"
  ON invitation_templates FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM event_users 
      WHERE event_id = invitation_templates.event_id
    )
  );

-- Allow users to update their own invitation templates
CREATE POLICY "Users can update own invitation templates"
  ON invitation_templates FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Allow users to delete their own invitation templates
CREATE POLICY "Users can delete own invitation templates"
  ON invitation_templates FOR DELETE
  USING (auth.uid() = created_by);

-- Allow public read of invitation views (for analytics)
CREATE POLICY "Anonymous can create invitation views"
  ON invitation_views FOR INSERT
  WITH CHECK (true);

-- Function to track invitation views
CREATE OR REPLACE FUNCTION track_invitation_view(
  invitation_id UUID,
  p_viewer_ip VARCHAR(45) DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_referrer VARCHAR(300) DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO invitation_views (
    invitation_template_id,
    viewer_ip,
    user_agent,
    referrer
  ) VALUES (
    invitation_id,
    p_viewer_ip,
    p_user_agent,
    p_referrer
  );

  -- Update view count on invitation template
  UPDATE invitation_templates 
  SET view_count = view_count + 1
  WHERE id = invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate shareable link
CREATE OR REPLACE FUNCTION generate_shareable_link(
  invitation_id UUID
)
RETURNS TEXT AS $$
DECLARE
  v_link VARCHAR(255);
BEGIN
  v_link := 'inv_' || ENCODE(gen_random_bytes(12), 'hex');
  
  UPDATE invitation_templates 
  SET shareable_link = v_link, shared_at = CURRENT_TIMESTAMP
  WHERE id = invitation_id;
  
  RETURN v_link;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_invitation_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invitation_templates_updated_at_trigger
  BEFORE UPDATE ON invitation_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_invitation_templates_updated_at();

-- Create enum type for template styles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'template_style') THEN
    CREATE TYPE template_style AS ENUM (
      'elegant',
      'modern',
      'minimal',
      'playful',
      'professional'
    );
  END IF;
END
$$;

-- Update events table with enum constraint
ALTER TABLE events ALTER COLUMN template_id TYPE template_style 
  USING template_id::template_style;

-- Add comments
COMMENT ON TABLE invitation_templates IS 'Stores invitation templates created for events with customization options';
COMMENT ON TABLE invitation_views IS 'Tracks analytics for invitation views and shares';
COMMENT ON COLUMN events.template_id IS 'Reference to the selected invitation template design';
COMMENT ON COLUMN events.template_customization IS 'JSON customization options for the selected template';
