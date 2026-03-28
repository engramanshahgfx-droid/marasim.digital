import type { InsertTables, InvitationTemplate, UpdateTables } from '@/types/database'
import { getCurrentUser } from './auth'
import { isSupabaseConfigured, supabase } from './supabase'

// Local storage key for templates when Supabase is not configured
const LOCAL_STORAGE_KEY = 'Marasim_templates'

export interface TemplateData {
  language: 'en' | 'ar'
  headerImage: string
  title: string
  titleAr?: string
  message: string
  messageAr?: string
  eventDetails: {
    date: string
    time: string
    venue: string
  }
  footerText: string
  footerTextAr?: string
}

export interface SavedTemplate extends TemplateData {
  id: string
  eventId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

type InvitationTemplateInsert = InsertTables<'invitation_templates'>
type InvitationTemplateUpdate = UpdateTables<'invitation_templates'>
type InvitationTemplateMutation = {
  language: InvitationTemplateInsert['language']
  header_image: NonNullable<InvitationTemplateInsert['header_image']>
  title: InvitationTemplateInsert['title']
  title_ar: InvitationTemplateInsert['title_ar']
  message: InvitationTemplateInsert['message']
  message_ar: InvitationTemplateInsert['message_ar']
  footer_text: InvitationTemplateInsert['footer_text']
  footer_text_ar: InvitationTemplateInsert['footer_text_ar']
  is_active: boolean
}

// Default template for new events
export const defaultTemplate: TemplateData = {
  language: 'en',
  headerImage: 'https://images.unsplash.com/photo-1734250840052-f36fdf4d395f',
  title: "You're Invited!",
  titleAr: 'أنت مدعو!',
  message:
    'We are delighted to invite you to celebrate this special occasion with us. Your presence would mean the world to us.',
  messageAr: 'يسعدنا دعوتك للاحتفال بهذه المناسبة الخاصة معنا. حضورك سيعني لنا الكثير.',
  eventDetails: {
    date: '',
    time: '18:00',
    venue: '',
  },
  footerText: 'Please confirm your attendance by scanning the QR code below.',
  footerTextAr: 'يرجى تأكيد حضورك عن طريق مسح رمز QR أدناه.',
}

// Helper to get templates from localStorage
const getLocalTemplates = (): Record<string, SavedTemplate> => {
  if (typeof window === 'undefined') return {}
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

// Helper to save templates to localStorage
const saveLocalTemplates = (templates: Record<string, SavedTemplate>) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(templates))
}

export const templateService = {
  /**
   * Get template for an event
   */
  async getTemplate(eventId: string): Promise<SavedTemplate | null> {
    // If Supabase is configured, fetch from database
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('invitation_templates')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching template:', error)
        return null
      }

      if (data) {
        return transformFromDb(data as Record<string, unknown>)
      }
    }

    // Otherwise, use localStorage
    const templates = getLocalTemplates()
    return templates[eventId] || null
  },

  /**
   * Save or update template for an event
   */
  async saveTemplate(
    eventId: string,
    template: TemplateData
  ): Promise<{ success: boolean; error?: string; data?: SavedTemplate }> {
    const now = new Date().toISOString()

    // If Supabase is configured, save to database
    if (isSupabaseConfigured()) {
      // Check if template exists
      const { data: existing } = await supabase
        .from('invitation_templates')
        .select('id')
        .eq('event_id', eventId)
        .eq('is_active', true)
        .single()
      const existingTemplate = existing as { id: string } | null

      const dbData = transformToDb(template)

      if (existingTemplate) {
        // Update existing template
        const updateData: InvitationTemplateUpdate = {
          ...dbData,
        }

        const { data, error } = await (supabase as any)
          .from('invitation_templates')
          .update(updateData)
          .eq('id', existingTemplate.id)
          .select()
          .single()

        if (error) {
          return { success: false, error: error.message }
        }

        return { success: true, data: transformFromDb(data as any) }
      } else {
        // Insert new template
        const currentUser = await getCurrentUser()

        if (!currentUser?.id) {
          return { success: false, error: 'User not authenticated' }
        }

        const insertData: InvitationTemplateInsert = {
          event_id: eventId,
          user_id: currentUser.id,
          ...dbData,
        }

        const { data, error } = await (supabase as any)
          .from('invitation_templates')
          .insert(insertData)
          .select()
          .single()

        if (error) {
          return { success: false, error: error.message }
        }

        return { success: true, data: transformFromDb(data as any) }
      }
    }

    // Otherwise, save to localStorage
    const templates = getLocalTemplates()
    const existingTemplate = templates[eventId]

    const savedTemplate: SavedTemplate = {
      ...template,
      id: existingTemplate?.id || `local_${Date.now()}`,
      eventId,
      isActive: true,
      createdAt: existingTemplate?.createdAt || now,
      updatedAt: now,
    }

    templates[eventId] = savedTemplate
    saveLocalTemplates(templates)

    return { success: true, data: savedTemplate }
  },

  /**
   * Delete template for an event
   */
  async deleteTemplate(eventId: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('invitation_templates').delete().eq('event_id', eventId)

      if (error) {
        return { success: false, error: error.message }
      }
    }

    // Also clear from localStorage
    const templates = getLocalTemplates()
    delete templates[eventId]
    saveLocalTemplates(templates)

    return { success: true }
  },

  /**
   * Get all templates for a user
   */
  async getAllTemplates(): Promise<SavedTemplate[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('invitation_templates')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching templates:', error)
        return []
      }

      return (data as any[]).map(transformFromDb)
    }

    // Return localStorage templates as array
    const templates = getLocalTemplates()
    return Object.values(templates).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  },
}

// Transform database row to frontend format
function transformFromDb(row: InvitationTemplate): SavedTemplate {
  return {
    id: row.id,
    eventId: row.event_id,
    language: row.language,
    headerImage: row.header_image || defaultTemplate.headerImage,
    title: row.title,
    titleAr: row.title_ar || undefined,
    message: row.message,
    messageAr: row.message_ar || undefined,
    eventDetails: {
      date: '',
      time: '',
      venue: '',
    },
    footerText: row.footer_text,
    footerTextAr: row.footer_text_ar || undefined,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// Transform frontend format to database row
function transformToDb(template: TemplateData): InvitationTemplateMutation {
  return {
    language: template.language,
    header_image: template.headerImage,
    title: template.title,
    title_ar: template.titleAr || null,
    message: template.message,
    message_ar: template.messageAr || null,
    footer_text: template.footerText,
    footer_text_ar: template.footerTextAr || null,
    is_active: true,
  }
}

export default templateService
