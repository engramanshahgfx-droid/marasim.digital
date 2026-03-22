# 🎨 Template Selection & Customization System - Implementation Guide

**Project Status**: Ready to Build  
**Timeline**: 1 Week Development  
**Complexity**: Medium  
**Dependencies**: Existing invitation components, event system

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [User Flow](#user-flow)
3. [File Structure](#file-structure)
4. [Component Breakdown](#component-breakdown)
5. [API Specifications](#api-specifications)
6. [Implementation Checklist](#implementation-checklist)
7. [Database Schema Updates](#database-schema-updates)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  Event Management Dashboard                          │
│  └─ "Select Template" button                        │
└────────────────┬────────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────────┐
│  Step 1: Category Selection Page                     │
│  └─ Wedding | Corporate | Birthday | Conference     │
└────────────────┬────────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────────┐
│  Step 2: Template Browser Grid                       │
│  └─ Display templates in category                   │
│  └─ Preview, name, style info                       │
└────────────────┬────────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────────┐
│  Step 3: Template Customization Editor              │
│  ├─ Left: Form Controls                            │
│  │  ├─ Text fields (name, date, message)           │
│  │  ├─ Font selector                                │
│  │  ├─ Color picker                                 │
│  │  ├─ Style toggle (Light/Dark/Classic/Modern)    │
│  │  └─ Image uploader                               │
│  │                                                   │
│  └─ Right: Live Preview                             │
│     ├─ Card View (invitation style)                │
│     └─ Full Page View (website style)               │
└────────────────┬────────────────────────────────────┘
                 │
                 v
         Save & Publish
```

---

## 🎯 User Flow

### **Flow 1: Create Invitation from Scratch**
```
1. Click "Create Invitation" in event dashboard
2. See modal: "Select Template or Create from Scratch"
3. Choose "Select Template"
4. Browse categories
5. Select template
6. Customize in editor
7. Save as draft
8. Publish/Send
```

### **Flow 2: Edit Existing Invitation**
```
1. Click "Edit" on existing invitation
2. Open customization editor directly
3. Make changes
4. Live preview updates
5. Save changes
6. Republish
```

### **Flow 3: Duplicate & Modify**
```
1. Click "Duplicate" on invitation
2. Opens customization editor with copied data
3. Change colors/text/images
4. Save as new invitation
```

---

## 📁 File Structure

```
src/
├── components/
│   └── invitations/
│       ├── TemplateSelector.tsx               [EXISTING - enhance]
│       ├── TemplateBrowser.tsx                [NEW - grid view]
│       ├── TemplateCustomizationEditor.tsx    [NEW - main editor form]
│       ├── TemplatePreview.tsx                [NEW - live preview]
│       ├── StyleVariationToggle.tsx           [NEW - Light/Dark/Classic/Modern]
│       ├── TextEditSection.tsx                [NEW - text editing controls]
│       ├── FontSelector.tsx                   [NEW - font picker]
│       ├── ColorPicker.tsx                    [NEW - color selection UI]
│       ├── ImageUploader.tsx                  [NEW - image upload form]
│       └── PreviewToggle.tsx                  [NEW - Card vs Page view toggle]
│
├── app/
│   └── [locale]/
│       ├── invitations/
│       │   ├── templates/
│       │   │   ├── page.tsx                   [NEW - category selection]
│       │   │   ├── [category]/
│       │   │   │   └── page.tsx               [NEW - template browser]
│       │   │   └── [templateId]/
│       │   │       ├── customize/
│       │   │       │   └── page.tsx           [NEW - customization editor]
│       │   │       └── preview/
│       │   │           └── page.tsx           [NEW - full preview]
│       │   └── [invitationId]/edit/
│       │       └── page.tsx                   [MODIFY - edit existing]
│       │
│       └── events/
│           └── [eventId]/
│               └── dashboard/
│                   └── page.tsx               [MODIFY - add template button]
│
├── types/
│   └── invitations.ts                         [MODIFY - add new types]
│
├── lib/
│   ├── invitationService.ts                   [MODIFY - add methods]
│   └── templateService.ts                     [NEW - template utilities]
│
└── app/api/
    └── invitations/
        ├── templates/
        │   ├── categories/route.ts            [NEW - list categories]
        │   ├── [category]/route.ts            [NEW - templates by category]
        │   └── [templateId]/route.ts          [NEW - template details]
        │
        ├── customize/route.ts                 [NEW - save customization]
        └── preview/route.ts                   [NEW - generate preview]
```

---

## 🧩 Component Breakdown

### **1. Template Category Selection Page** 
**File**: `src/app/[locale]/invitations/templates/page.tsx`

**Features**:
- Display 5 category cards:
  - Wedding (wedding emoji, description)
  - Corporate Event (briefcase emoji, description)
  - Birthday (cake emoji, description)
  - Conference (presentation emoji, description)
  - Other (star emoji, description)
- Click to view templates in category
- Bilingual support (EN/AR)
- Back button to event dashboard

**Layout**:
```
┌─────────────────────────────────┐
│  Select Invitation Category      │
├─────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐        │
│ │ 👰 │ │ 💼 │ │ 🎂 │        │
│ │ Wed │ │ Corp│ │ Bday│        │
│ └─────┘ └─────┘ └─────┘        │
│ ┌─────┐ ┌─────┐                │
│ │ 🎤 │ │ ⭐ │                │
│ │ Conf│ │ Other│                │
│ └─────┘ └─────┘                │
└─────────────────────────────────┘
```

---

### **2. Template Browser Grid**
**File**: `src/components/invitations/TemplateBrowser.tsx`

**Props**:
```typescript
interface TemplateBrowserProps {
  category: string
  onSelectTemplate: (templateId: string) => void
  isLoading?: boolean
}
```

**Features**:
- Display templates in 2-3 column grid (responsive)
- Each card shows:
  - Template preview image
  - Template name
  - Style tags (Classic, Modern, Elegant, etc.)
  - "Customize" button
  - "Preview" link
- Hover effects
- Mobile-first responsive design

**Layout**:
```
┌──────────────┬──────────────┬──────────────┐
│ Template 1   │ Template 2   │ Template 3   │
│ [Preview]    │ [Preview]    │ [Preview]    │
│ Elegant      │ Modern       │ Minimal      │
│ [Customize]  │ [Customize]  │ [Customize]  │
└──────────────┴──────────────┴──────────────┘
```

---

### **3. Customization Editor** (Main Component)
**File**: `src/components/invitations/TemplateCustomizationEditor.tsx`

**Layout** (Side-by-side):
```
┌──────────────────────────────────────────┐
│  Left Sidebar (300px)   │ Right Side Preview
├──────────────────────────────────────────┤
│ Text Fields Section:    │
│ • Event Name            │ ┌─────────────┐
│ • Host Name             │ │   PREVIEW   │
│ • Date                  │ │  [CARD      │
│ • Time                  │ │   VIEW]     │
│ • Location              │ │             │
│ • Message               │ └─────────────┘
│                         │
│ Design Controls:        │ 📱 Mobile | 🖥️ Desktop
│ • Font Selector         │ 📄 Card | 📖 Full Page
│ • Color Picker          │
│ • Style Toggle          │
│ • Image Upload          │
│                         │
│ [Save Draft] [Publish]  │
└──────────────────────────────────────────┘
```

**Props**:
```typescript
interface TemplateCustomizationEditorProps {
  templateId: string
  eventId: string
  invitationId?: string  // for editing existing
  initialData?: InvitationData
  onSave?: (data: any) => void
}
```

---

### **4. Text Edit Section**
**File**: `src/components/invitations/TextEditSection.tsx`

**Fields**:
```
Event Name       [Text input with char count]
Host Name        [Text input]
Date             [Date picker]
Time             [Time picker]
Location         [Text input]
Dress Code       [Dropdown: Yes/No]
Message/Details  [Textarea]
RSVP By Date     [Date picker]
```

---

### **5. Font Selector**
**File**: `src/components/invitations/FontSelector.tsx`

**Options**:
```
Radio buttons:
○ Serif (Formal, elegant - Georgia, Garamond)
○ Sans-serif (Modern, clean - Inter, Helvetica)
○ Script (Playful, decorative - Playfair Display)
```

---

### **6. Color Picker**
**File**: `src/components/invitations/ColorPicker.tsx`

**Features**:
- Primary color picker
- Secondary color picker
- Accent color picker
- Preset palettes from each template
- Hex input for custom colors
- Live preview of color changes

---

### **7. Style Variation Toggle**
**File**: `src/components/invitations/StyleVariationToggle.tsx`

**Options**:
```
Segment Control:
[Light] [Dark] [Classic] [Modern]
```

**Effect**:
- Toggles background color, text color contrast
- Affects overall aesthetic
- Real-time preview update

---

### **8. Image Uploader**
**File**: `src/components/invitations/ImageUploader.tsx`

**Features**:
- Drag & drop file upload
- Click to browse
- Accepts: JPG, PNG, GIF
- Max size: 5MB
- Shows preview
- Progress indicator
- Error handling

**Upload Types**:
```
[ Background Image ] - Full card background
[ Logo/Monogram  ]   - Top of card
[ Gallery Images ] - Additional images (if template supports)
```

---

### **9. Live Preview Component**
**File**: `src/components/invitations/TemplatePreview.tsx`

**Features**:
- Real-time updates as you type
- Shows current template with customizations applied
- Mobile/Desktop toggle
- Card/Full Page view toggle
- Zoom controls (50%-200%)

**Props**:
```typescript
interface TemplatePreviewProps {
  templateId: string
  data: InvitationData
  customization: InvitationCustomization
  viewType: 'card' | 'fullPage'
  deviceType: 'mobile' | 'desktop'
}
```

---

### **10. Preview View Toggle**
**File**: `src/components/invitations/PreviewToggle.tsx`

**Options**:
```
Tabs:
[📄 Card View] [📖 Full Page]

[📱 Mobile] [🖥️ Desktop]

Zoom: [50%] [75%] [100%] [125%] [200%]
```

---

## 🔌 API Specifications

### **1. Get Template Categories**
```http
GET /api/invitations/templates/categories
```

**Response**:
```json
{
  "success": true,
  "categories": [
    {
      "id": "wedding",
      "name": "Wedding",
      "name_ar": "أعراس",
      "description": "Beautiful designs for weddings",
      "emoji": "👰",
      "count": 5
    },
    // ... more categories
  ]
}
```

---

### **2. Get Templates by Category**
```http
GET /api/invitations/templates/[category]
```

**Response**:
```json
{
  "success": true,
  "category": "wedding",
  "templates": [
    {
      "id": "elegant",
      "name": "Elegant",
      "description": "Sophisticated design...",
      "thumbnail": "https://...",
      "preview": "https://...",
      "style": "classic",
      "features": ["Gold accents", "Formal typography"]
    },
    // ... more templates
  ]
}
```

---

### **3. Get Template Details**
```http
GET /api/invitations/templates/[templateId]
```

**Response**:
```json
{
  "success": true,
  "template": {
    "id": "elegant",
    "name": "Elegant",
    "colors": {
      "primary": "#1a1a2e",
      "secondary": "#ffd700",
      "accent": "#c9a961",
      "background": "#f5f5f0",
      "text": "#2d2d2d"
    },
    "defaultData": {
      "event_name": "Your Event Name",
      "host_name": "Host Name",
      "date": "2026-03-19",
      "time": "18:00",
      "location": "Venue Location"
    }
  }
}
```

---

### **4. Save Customization**
```http
POST /api/invitations/customize
```

**Request**:
```json
{
  "event_id": "uuid",
  "template_id": "elegant",
  "invitation_data": {
    "event_name": "Catherine & Adrian's Wedding",
    "host_name": "The Susan House",
    "date": "2026-07-15",
    "time": "18:00",
    "location": "Atlanta, Georgia",
    "message": "Join us for our wedding celebration"
  },
  "customization": {
    "primary_color": "#1a1a2e",
    "secondary_color": "#ffd700",
    "font_family": "serif",
    "style_variation": "light"
  },
  "images": {
    "banner": "https://...",
    "logo": "https://..."
  }
}
```

**Response**:
```json
{
  "success": true,
  "invitation_id": "uuid",
  "message": "Invitation saved",
  "preview_url": "/invitations/uuid/preview"
}
```

---

### **5. Get Preview**
```http
POST /api/invitations/preview
```

**Request**:
```json
{
  "template_id": "elegant",
  "data": { ... },
  "customization": { ... }
}
```

**Response**:
```html
<!-- HTML rendered invitation -->
```

---

## ✅ Implementation Checklist

### **Phase 1: Backend Setup** (2 days)
- [ ] Create template categories data
- [ ] Add template metadata (preview images, styles)
- [ ] Create API endpoints for categories
- [ ] Create API endpoints for templates by category
- [ ] Update invitation types with new fields
- [ ] Create template utility service

### **Phase 2: Components** (3 days)
- [ ] Build TemplateBrowser component
- [ ] Build TextEditSection component
- [ ] Build FontSelector component
- [ ] Build ColorPicker component
- [ ] Build StyleVariationToggle component
- [ ] Build ImageUploader component
- [ ] Build TemplatePreview component
- [ ] Build PreviewToggle component
- [ ] Build TemplateCustomizationEditor (combines above)

### **Phase 3: Pages** (2 days)
- [ ] Create template category selection page
- [ ] Create template browser page
- [ ] Create customization editor page
- [ ] Create template preview page
- [ ] Add route redirects

### **Phase 4: Integration** (2 days)
- [ ] Add "Select Template" button to event dashboard
- [ ] Wire up navigation between pages
- [ ] Test full user flow end-to-end
- [ ] Fix hydration issues
- [ ] Add loading states
- [ ] Add error handling

### **Phase 5: Polish** (1 day)
- [ ] Test mobile responsiveness
- [ ] Add animations/transitions
- [ ] Optimize images
- [ ] Test with RTL (Arabic)
- [ ] Add success notifications
- [ ] Performance optimization

---

## 📊 Database Schema Updates

### **New Table: `template_customizations`**
```sql
CREATE TABLE IF NOT EXISTS template_customizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id),
  template_id VARCHAR(50) NOT NULL,
  
  -- Text data
  event_name VARCHAR(255),
  host_name VARCHAR(255),
  event_date DATE,
  event_time TIME,
  location VARCHAR(255),
  message TEXT,
  
  -- Design data
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  accent_color VARCHAR(7),
  font_family VARCHAR(50),
  style_variation VARCHAR(20),
  
  -- Media
  banner_image_url TEXT,
  logo_image_url TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by uuid REFERENCES auth.users(id),
  
  CONSTRAINT color_format CHECK (
    primary_color ~ '^\#[0-9A-Fa-f]{6}$' OR primary_color IS NULL
  )
);
```

### **Update `invitation_templates` Table**
Add columns:
```sql
ALTER TABLE invitation_templates ADD COLUMN IF NOT EXISTS (
  style_variation VARCHAR(20),  -- light, dark, classic, modern
  preview_image_url TEXT,
  full_preview_url TEXT
);
```

---

## 🎨 Color Schemes Reference

### **Elegant** (Wedding)
```
Primary: #1a1a2e (Dark Navy)
Secondary: #ffd700 (Gold)
Accent: #c9a961 (Muted Gold)
Background: #f5f5f0 (Cream)
Text: #2d2d2d (Dark Gray)
```

### **Modern** (Contemporary)
```
Primary: #667eea (Purple)
Secondary: #764ba2 (Dark Purple)
Accent: #f093fb (Pink)
Background: #ffffff (White)
Text: #2d3748 (Dark Slate)
```

### **Minimal** (Corporate)
```
Primary: #000000 (Black)
Secondary: #ffffff (White)
Accent: #e0e0e0 (Light Gray)
Background: #f9f9f9 (Off-White)
Text: #333333 (Dark Gray)
```

### **Playful** (Birthday)
```
Primary: #ff6b6b (Red)
Secondary: #4ecdc4 (Teal)
Accent: #ffe66d (Yellow)
Background: #fff5f7 (Pink Tint)
Text: #2c3e50 (Dark Blue)
```

### **Professional** (Business)
```
Primary: #003366 (Navy)
Secondary: #0066cc (Blue)
Accent: #cccccc (Gray)
Background: #ffffff (White)
Text: #333333 (Dark Gray)
```

---

## 🔧 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Form Handling** | React Hook Form + Zod validation |
| **Image Upload** | Supabase Storage or Vercel Blob |
| **Color Picker** | react-colorful or custom picker |
| **Date/Time** | react-day-picker + custom time picker |
| **Styling** | Tailwind CSS + custom CSS for preview |
| **Real-time** | useState for live preview |
| **API** | Next.js API routes |
| **State Management** | React Context (if needed) |

---

## 📝 Next Steps

1. **Review this architecture** with your team
2. **Start with Phase 1**: Set up template metadata and API endpoints
3. **Build Phase 2 independently**: Each component can be built in parallel
4. **Test Phase 3**: Integration of pages
5. **Polish Phase 4**: User experience refinements

---

**Estimated Timeline**: 1 week (with 1 developer)  
**Difficulty Level**: Medium  
**No breaking changes to existing code** ✅

