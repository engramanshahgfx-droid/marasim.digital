# Invitation Template System Documentation

## Overview

The Invitation Template System allows users to create, customize, and share beautiful invitation designs for their events. The system includes 5 professionally designed templates with full bilingual support (Arabic/English) and RTL layout awareness.

## File Structure

```
src/
├── types/
│   └── invitations.ts                 # TypeScript types and interfaces
├── components/
│   └── invitations/
│       ├── ElegantInvitation.tsx      # Elegant wedding template
│       ├── ModernInvitation.tsx       # Modern gradient template
│       ├── MinimalInvitation.tsx      # Minimal corporate template
│       ├── PlayfulInvitation.tsx      # Playful birthday template
│       ├── ProfessionalInvitation.tsx # Professional business template
│       └── TemplateSelector.tsx       # Template selection UI
├── lib/
│   └── invitationService.ts           # Backend service layer
└── app/api/
    └── invitations/
        ├── create/route.ts            # Create invitation
        ├── [invitationId]/
        │   ├── route.ts               # Get/Update/Delete
        │   ├── share/route.ts         # Generate shareable link
        │   └── analytics/route.ts     # View analytics
        ├── shared/[shareLink]/route.ts # Get by share link
        └── event/[eventId]/route.ts   # Get event invitations

supabase/migrations/
└── add_invitation_templates.sql       # Database schema

```

## Templates

### 1. **Elegant Invitation** (`elegant`)
- **Best for**: Weddings, formal events, engagement celebrations
- **Design**: Classic typography, gold accents, ornamental borders
- **Colors**: Dark navy (#1a1a2e), Gold (#ffd700), Cream background
- **Features**: 
  - Formal serif typography
  - Ornamental decorative elements
  - Classic date/time/location table
  - Professional footer

### 2. **Modern Invitation** (`modern`)
- **Best for**: Contemporary events, product launches, modern celebrations
- **Design**: Gradient backgrounds, vibrant colors, clean layout
- **Colors**: Purple (#667eea), Pink (#764ba2), Gradient accents
- **Features**:
  - Gradient backgrounds
  - Modern sans-serif fonts
  - Grid-based information cards
  - Animated CTA button

### 3. **Minimal Invitation** (`minimal`)
- **Best for**: Corporate events, professional conferences, business meetings
- **Design**: Clean whitespace, minimal colors, high readability
- **Colors**: Black text, white background, subtle grays
- **Features**:
  - Whitespace design
  - Uppercase letters, letter spacing
  - Table layout for information
  - Print-friendly design

### 4. **Playful Invitation** (`playful`)
- **Best for**: Birthday parties, children's events, casual celebrations
- **Design**: Colorful, fun fonts, animated decorations
- **Colors**: Bright red (#ff6b6b), Teal (#4ecdc4), Yellow accents
- **Features**:
  - Animated emojis (balloons, confetti)
  - Bold colorful typography
  - Interactive hover effects
  - Guest count display

### 5. **Professional Invitation** (`professional`)
- **Best for**: Corporate events, formal business gatherings
- **Design**: Corporate styling, company branding, formal layout
- **Colors**: Navy (#003366), Corporate blue (#0066cc), Subtle accents
- **Features**:
  - Company logo support
  - Professional tone
  - Formal table layout
  - Company contact information

## Type Definitions

### `InvitationTemplate`
```typescript
interface InvitationTemplate {
  id: TemplateStyle
  name: string
  name_ar: string
  description: string
  description_ar: string
  thumbnail?: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
  }
  category: 'wedding' | 'birthday' | 'corporate' | 'engagement' | 'general'
  features: string[]
}
```

### `InvitationData`
```typescript
interface InvitationData {
  template_id: TemplateStyle
  event_id: string
  event_name: string
  date: string
  time: string
  timezone: string
  location: string
  description: string
  host_name: string
  dress_code?: string
  rsvp_by?: string
  guest_count?: number
  custom_colors?: {
    primary?: string
    secondary?: string
    accent?: string
  }
  images?: {
    banner?: string
    logo?: string
  }
  contact_info?: {
    phone?: string
    email?: string
    website?: string
  }
  special_instructions?: string
}
```

### `InvitationCustomization`
```typescript
interface InvitationCustomization {
  template_id: TemplateStyle
  primary_color: string
  secondary_color: string
  accent_color: string
  font_family: 'serif' | 'sans-serif' | 'script'
  show_guest_count: boolean
  show_dress_code: boolean
  show_special_instructions: boolean
  language: 'en' | 'ar' | 'both'
}
```

## Database Schema

### `invitation_templates` Table
```sql
CREATE TABLE invitation_templates (
  id UUID PRIMARY KEY
  event_id UUID REFERENCES events(id)
  template_id VARCHAR(50)
  customization JSONB
  invitation_data JSONB
  shareable_link VARCHAR(255) UNIQUE
  shared_at TIMESTAMP
  exported_formats TEXT[]
  view_count INTEGER
  created_at TIMESTAMP
  updated_at TIMESTAMP
  created_by UUID REFERENCES auth.users(id)
)
```

### `invitation_views` Table
```sql
CREATE TABLE invitation_views (
  id UUID PRIMARY KEY
  invitation_template_id UUID REFERENCES invitation_templates(id)
  viewed_at TIMESTAMP
  viewer_ip VARCHAR(45)
  user_agent TEXT
  referrer VARCHAR(300)
  metadata JSONB
)
```

## API Endpoints

### 1. Create Invitation
```
POST /api/invitations/create
Content-Type: application/json
Authorization: Required

Request:
{
  "event_id": "uuid",
  "template_id": "modern",
  "invitation_data": { ... },
  "customization": { ... }
}

Response: 201
{
  "id": "uuid",
  "event_id": "uuid",
  "template_id": "modern",
  "customization": { ... },
  "shareable_link": null,
  "view_count": 0,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### 2. Get Invitation
```
GET /api/invitations/{invitationId}

Response: 200
{
  "id": "uuid",
  "event_id": "uuid",
  "template_id": "modern",
  "customization": { ... },
  "invitation_data": { ... },
  "view_count": 5,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### 3. Update Invitation
```
PUT /api/invitations/{invitationId}
Content-Type: application/json
Authorization: Required

Request:
{
  "customization": { ... },
  "invitation_data": { ... }
}

Response: 200
{ Updated invitation object }
```

### 4. Delete Invitation
```
DELETE /api/invitations/{invitationId}
Authorization: Required

Response: 200
{ "message": "Invitation deleted successfully" }
```

### 5. Generate Shareable Link
```
POST /api/invitations/{invitationId}/share
Authorization: Required

Response: 200
{
  "shareable_link": "inv_abc123xyz",
  "shareable_url": "https://domain.com/invitations/inv_abc123xyz",
  "success": true
}
```

### 6. Get Invitation by Shareable Link
```
GET /api/invitations/shared/{shareLink}

Response: 200
{ Invitation object with updated view_count }
```

### 7. Get Event Invitations
```
GET /api/invitations/event/{eventId}
Authorization: Required

Response: 200
{
  "invitations": [ ... ],
  "count": 3
}
```

### 8. Get Analytics
```
GET /api/invitations/{invitationId}/analytics
Authorization: Required

Response: 200
{
  "total_views": 42,
  "views": [
    {
      "id": "uuid",
      "viewed_at": "2024-01-01T12:00:00Z",
      "viewer_ip": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "referrer": "https://..."
    }
  ]
}
```

## Service Layer (InvitationService)

### Key Methods

```typescript
// Create new invitation
static async createInvitation(
  eventId: string,
  templateId: TemplateStyle,
  invitationData: InvitationData,
  customization?: Partial<InvitationCustomization>
): Promise<CreatedInvitation>

// Get invitation by ID
static async getInvitation(invitationId: string): Promise<InvitationTemplate>

// Get all event invitations
static async getEventInvitations(eventId: string): Promise<InvitationTemplate[]>

// Update customization
static async updateInvitationCustomization(
  invitationId: string,
  customization: Partial<InvitationCustomization>
): Promise<InvitationTemplate>

// Update invitation data
static async updateInvitationData(
  invitationId: string,
  invitationData: Partial<InvitationData>
): Promise<InvitationTemplate>

// Generate shareable link
static async generateShareableLink(invitationId: string): Promise<string>

// Get invitation by share link
static async getInvitationByLink(shareLink: string): Promise<InvitationTemplate>

// Track view
static async trackInvitationView(
  invitationId: string,
  viewerIP?: string,
  userAgent?: string,
  referrer?: string
): Promise<void>

// Get analytics
static async getInvitationAnalytics(invitationId: string): Promise<Analytics>

// Delete invitation
static async deleteInvitation(invitationId: string): Promise<void>

// Set event template
static async setEventTemplate(
  eventId: string,
  templateId: TemplateStyle,
  customization?: Partial<InvitationCustomization>
): Promise<void>

// Get event template settings
static async getEventTemplateSettings(eventId: string): Promise<{ template_id, template_customization }>

// Export to PDF
static async exportInvitationPDF(invitationId: string): Promise<Blob>

// Send via email
static async sendInvitationEmail(
  invitationId: string,
  recipients: string[]
): Promise<{ success: boolean; message: string }>
```

## Component Usage

### Template Selector
```tsx
import { TemplateSelector } from '@/components/invitations/TemplateSelector'

export default function SelectTemplate() {
  return (
    <TemplateSelector
      onSelect={(templateId) => {
        console.log('Selected template:', templateId)
      }}
      selectedTemplate="modern"
    />
  )
}
```

### Individual Template
```tsx
import { ModernInvitation } from '@/components/invitations/ModernInvitation'

export default function Preview() {
  const data = {
    template_id: 'modern',
    event_id: 'abc123',
    event_name: 'You are Invited',
    date: '2024-12-15',
    time: '7:00 PM',
    timezone: 'GMT',
    location: 'Hotel Name',
    description: 'Join us for an evening of celebration',
    host_name: 'Ahmed & Fatima',
    contact_info: {
      email: 'event@example.com',
      phone: '+966 50 123 4567'
    }
  }

  return <ModernInvitation data={data} />
}
```

## Features

### ✅ Customization
- Color scheme adjustment (primary, secondary, accent)
- Font family selection (serif, sans-serif, script)
- Language preference (English, Arabic, Bilingual)
- Field visibility toggles
- Custom images (banner, logo)

### ✅ Bilingual Support
- Full Arabic/English support
- RTL/LTR layout awareness
- Translation for all UI elements
- Locale-aware date/time formatting

### ✅ Analytics
- View tracking with IP & user agent
- Referrer tracking
- View count per invitation
- Time-based analytics

### ✅ Sharing
- Generate unique shareable links
- Track shared invitation views
- Public access without authentication
- QR code support (future)

### ✅ Responsive Design
- Mobile-first design
- Perfect print layout
- Landscape & portrait modes
- Cross-browser compatibility

## Integration with Event Dashboard

### Add to Event Creation
1. Step 1: Event Details → Template Selection
2. Step 2: Template Customization
3. Step 3: Preview & Confirm

### Add to Event Management
- Edit template selection
- Update invitation details
- Generate shareable links
- View analytics
- Export/Share options

## Security

- Row-level security (RLS) policies
- User-based access control
- Authorization checks on all endpoints
- IP tracking for analytics

## Future Enhancements

- [ ] PDF export functionality
- [ ] Direct email sending
- [ ] WhatsApp integration
- [ ] QR code generation
- [ ] Template marketplace
- [ ] User-created templates
- [ ] Advanced design editor
- [ ] Template analytics dashboard
- [ ] Schedule sending
- [ ] SMS invitations

## Example: Complete Implementation

```tsx
'use client'

import { useState } from 'react'
import { TemplateSelector } from '@/components/invitations/TemplateSelector'
import InvitationService from '@/lib/invitationService'
import { TemplateStyle } from '@/types/invitations'

export function EventInvitationSetup({ eventId }: { eventId: string }) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateStyle>('modern')
  const [loading, setLoading] = useState(false)

  const handleSelectTemplate = async (templateId: TemplateStyle) => {
    setLoading(true)
    try {
      // Save template selection
      await InvitationService.setEventTemplate(eventId, templateId, {
        language: 'en',
      })

      setSelectedTemplate(templateId)

      // Create default invitation
      const invitation = await InvitationService.createInvitation(
        eventId,
        templateId,
        {
          template_id: templateId,
          event_id: eventId,
          event_name: 'Your Event',
          date: new Date().toISOString().split('T')[0],
          time: '7:00 PM',
          timezone: 'GMT',
          location: 'Event Location',
          description: 'Join us for this special event',
          host_name: 'Host Name',
        }
      )

      // Generate shareable link
      const shareLink = await InvitationService.generateShareableLink(invitation.id)

      console.log('Invitation created and shared:', shareLink)
    } catch (error) {
      console.error('Error setting up invitation:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>Select Your Invitation Template</h2>
      <TemplateSelector
        onSelect={handleSelectTemplate}
        selectedTemplate={selectedTemplate}
      />
      {loading && <p>Setting up your invitation...</p>}
    </div>
  )
}
```

## Troubleshooting

### Issue: Invitation not appearing
- Check that event exists and user has access
- Verify event_id is correct
- Check user authentication token

### Issue: Shareable link not working
- Ensure invitation has been created
- Check shareable_link field is not null
- Verify link hasn't changed

### Issue: Styles not applying
- Check custom colors are valid hex values
- Verify template_id is valid
- Check RTL/LTR setting matches locale

## Support

For issues or questions, contact: support@example.com
