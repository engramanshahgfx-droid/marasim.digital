// Invitation Template Types
// Location: src/types/invitations.ts

export type TemplateStyle = 'elegant' | 'modern' | 'minimal' | 'playful' | 'professional'
export type TemplateCategory = 'wedding' | 'birthday' | 'corporate' | 'conference' | 'other'
export type StyleVariation = 'light' | 'dark' | 'classic' | 'modern'
export type FontFamily = 'serif' | 'sans-serif' | 'script'
export type PreviewType = 'card' | 'fullPage'
export type DeviceType = 'mobile' | 'desktop'

export interface InvitationTemplate {
  id: TemplateStyle
  name: string
  name_ar: string
  style_label: string
  style_label_ar: string
  description: string
  description_ar: string
  thumbnail?: string
  preview_image_url?: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
  }
  category: TemplateCategory
  supported_categories: TemplateCategory[]
  features: string[]
  style_variations: StyleVariation[]
  default_style_variation: StyleVariation
}

export interface TemplateCategoryInfo {
  id: string
  name: string
  name_ar: string
  description: string
  description_ar: string
  emoji: string
  icon?: string
  color?: string
}

export interface InvitationData {
  template_id: TemplateStyle
  event_id: string
  guest_name?: string
  guest_email?: string
  guest_phone?: string
  special_note?: string
  plus_ones?: number
  personalized_message?: string
  event_name: string
  event_name_ar?: string
  date: string
  time: string
  timezone: string
  location: string
  location_ar?: string
  description: string
  description_ar?: string
  title?: string
  title_ar?: string
  host_name: string
  host_name_ar?: string
  dress_code?: string
  dress_code_ar?: string
  footer_text?: string
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
  special_instructions_ar?: string
}

export interface InvitationCustomization {
  template_id: TemplateStyle
  primary_color: string
  secondary_color: string
  accent_color: string
  font_family: FontFamily
  style_variation: StyleVariation
  show_guest_count: boolean
  show_dress_code: boolean
  show_special_instructions: boolean
  language: 'en' | 'ar' | 'both'
  images?: {
    banner_url?: string
    logo_url?: string
    gallery?: string[]
  }
}

export const EVENT_TYPE_TO_TEMPLATE_CATEGORY: Record<string, TemplateCategory> = {
  wedding: 'wedding',
  birthday: 'birthday',
  corporate: 'corporate',
  conference: 'conference',
  other: 'other',
}

export function normalizeTemplateCategory(eventType?: string | null): TemplateCategory {
  if (!eventType) {
    return 'other'
  }

  const normalized = eventType.trim().toLowerCase()
  return EVENT_TYPE_TO_TEMPLATE_CATEGORY[normalized] || 'other'
}

export function getTemplatesForCategory(category: TemplateCategory): InvitationTemplate[] {
  return Object.values(INVITATION_TEMPLATES)
    .filter((template) => template.supported_categories.includes(category))
    .sort((left, right) => {
      const leftPriority = left.category === category ? 0 : 1
      const rightPriority = right.category === category ? 0 : 1

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority
      }

      return left.name.localeCompare(right.name)
    })
}

export const INVITATION_TEMPLATES: Record<TemplateStyle, InvitationTemplate> = {
  elegant: {
    id: 'elegant',
    name: 'Elegant',
    name_ar: 'أنيق',
    style_label: 'Classic Formal',
    style_label_ar: 'كلاسيكي رسمي',
    description: 'Sophisticated design perfect for weddings and formal events',
    description_ar: 'تصميم متطور مثالي للأعراس والفعاليات الرسمية',
    colors: {
      primary: '#1a1a2e',
      secondary: '#ffd700',
      accent: '#c9a961',
      background: '#f5f5f0',
      text: '#2d2d2d',
    },
    category: 'wedding' as TemplateCategory,
    supported_categories: ['wedding', 'other'],
    features: ['Gold accents', 'Classic typography', 'Ornamental borders', 'RTL/LTR support'],
    style_variations: ['light', 'dark', 'classic'],
    default_style_variation: 'light',
  },
  modern: {
    id: 'modern',
    name: 'Modern',
    name_ar: 'عصري',
    style_label: 'Minimal Modern',
    style_label_ar: 'حديث بسيط',
    description: 'Contemporary design with vibrant colors and clean layout',
    description_ar: 'تصميم معاصر بألوان حية وتخطيط نظيف',
    colors: {
      primary: '#667eea',
      secondary: '#764ba2',
      accent: '#f093fb',
      background: '#ffffff',
      text: '#2d3748',
    },
    category: 'other' as TemplateCategory,
    supported_categories: ['wedding', 'birthday', 'conference', 'other'],
    features: ['Gradient background', 'Dynamic animations', 'Modern typography', 'Responsive design'],
    style_variations: ['light', 'dark', 'modern'],
    default_style_variation: 'light',
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    name_ar: 'بسيط',
    style_label: 'Clean Editorial',
    style_label_ar: 'تحريري نظيف',
    description: 'Clean and simple design with focus on readability',
    description_ar: 'تصميم نظيف وبسيط مع التركيز على سهولة القراءة',
    colors: {
      primary: '#000000',
      secondary: '#ffffff',
      accent: '#e0e0e0',
      background: '#f9f9f9',
      text: '#333333',
    },
    category: 'corporate' as TemplateCategory,
    supported_categories: ['wedding', 'corporate', 'conference', 'other'],
    features: ['Whitespace design', 'Minimal colors', 'Clear hierarchy', 'Print-friendly'],
    style_variations: ['light', 'dark', 'classic'],
    default_style_variation: 'light',
  },
  playful: {
    id: 'playful',
    name: 'Playful',
    name_ar: 'مرح',
    style_label: 'Fun Celebration',
    style_label_ar: 'احتفالي مرح',
    description: 'Fun and colorful design perfect for birthday parties',
    description_ar: 'تصميم مرح وملون مثالي لحفلات أعياد الميلاد',
    colors: {
      primary: '#ff6b6b',
      secondary: '#4ecdc4',
      accent: '#ffe66d',
      background: '#fff5f7',
      text: '#2c3e50',
    },
    category: 'birthday' as TemplateCategory,
    supported_categories: ['birthday', 'other'],
    features: ['Colorful balloons', 'Playful fonts', 'Confetti effects', 'Kid-friendly'],
    style_variations: ['light', 'modern'],
    default_style_variation: 'light',
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    name_ar: 'احترافي',
    style_label: 'Business Formal',
    style_label_ar: 'رسمي للأعمال',
    description: 'Corporate style design for business events',
    description_ar: 'تصميم بأسلوب احترافي للفعاليات التجارية',
    colors: {
      primary: '#003366',
      secondary: '#0066cc',
      accent: '#cccccc',
      background: '#ffffff',
      text: '#333333',
    },
    category: 'corporate' as TemplateCategory,
    supported_categories: ['corporate', 'conference', 'other'],
    features: ['Logo support', 'Professional fonts', 'Company branding', 'Formal layout'],
    style_variations: ['light', 'dark', 'classic'],
    default_style_variation: 'light',
  },
}

// Template Categories
export const TEMPLATE_CATEGORIES: Record<TemplateCategory, TemplateCategoryInfo> = {
  wedding: {
    id: 'wedding',
    name: 'Wedding',
    name_ar: 'أعراس',
    description: 'Beautiful designs for wedding celebrations',
    description_ar: 'تصاميم جميلة لحفلات الأعراس',
    emoji: '👰',
    color: '#e8dcc4',
  },
  birthday: {
    id: 'birthday',
    name: 'Birthday',
    name_ar: 'أعياد الميلاد',
    description: 'Fun and colorful designs for birthday parties',
    description_ar: 'تصاميم مرحة وملونة لحفلات أعياد الميلاد',
    emoji: '🎂',
    color: '#ffe66d',
  },
  corporate: {
    id: 'corporate',
    name: 'Corporate Event',
    name_ar: 'فعالية شركية',
    description: 'Professional designs for business events',
    description_ar: 'تصاميم احترافية للفعاليات التجارية',
    emoji: '💼',
    color: '#b3d9e8',
  },
  conference: {
    id: 'conference',
    name: 'Conference',
    name_ar: 'مؤتمر',
    description: 'Conference and networking event designs',
    description_ar: 'تصاميم فعاليات المؤتمرات والشبكات',
    emoji: '🎤',
    color: '#d4c5e2',
  },
  other: {
    id: 'other',
    name: 'Other',
    name_ar: 'أخرى',
    description: 'Designs for other types of events',
    description_ar: 'تصاميم لأنواع أخرى من الفعاليات',
    emoji: '⭐',
    color: '#f0e6d2',
  },
}
