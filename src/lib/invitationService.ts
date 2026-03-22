// Invitation Template Service
// Location: src/lib/invitationService.ts

'use client'

import supabase from '@/lib/supabase'
import { InvitationCustomization, InvitationData, TemplateStyle } from '@/types/invitations'

interface CreatedInvitation {
  id: string
  event_id: string
  template_id: TemplateStyle
  customization: InvitationCustomization
  shareable_link: string | null
  view_count: number
  created_at: string
}

interface InvitationTemplate {
  id: string
  event_id: string
  template_id: TemplateStyle
  customization: InvitationCustomization
  invitation_data: InvitationData
  shareable_link?: string
  shared_at?: string
  view_count: number
  created_at: string
  updated_at: string
  created_by: string
}

export class InvitationService {
  private static supabase = supabase

  /**
   * Create a new invitation template for an event
   */
  static async createInvitation(
    eventId: string,
    templateId: TemplateStyle,
    invitationData: InvitationData,
    customization?: Partial<InvitationCustomization>,
    createdBy?: string
  ): Promise<CreatedInvitation> {
    try {
      const { data: invitationData_response, error } = await (this.supabase.from('invitation_templates') as any)
        .insert({
          event_id: eventId,
          template_id: templateId,
          customization: {
            primary_color: customization?.primary_color || null,
            secondary_color: customization?.secondary_color || null,
            accent_color: customization?.accent_color || null,
            font_family: customization?.font_family || 'sans-serif',
            show_guest_count: customization?.show_guest_count ?? true,
            show_dress_code: customization?.show_dress_code ?? true,
            show_special_instructions: customization?.show_special_instructions ?? false,
            language: customization?.language || 'en',
          },
          invitation_data: invitationData,
          created_by: createdBy || (await this.getCurrentUserId()) || '',
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create invitation: ${error.message}`)
      }

      return invitationData_response as CreatedInvitation
    } catch (error) {
      console.error('Error creating invitation:', error)
      throw error
    }
  }

  /**
   * Get invitation template by ID
   */
  static async getInvitation(invitationId: string): Promise<InvitationTemplate> {
    try {
      const { data, error } = await (this.supabase.from('invitation_templates') as any)
        .select('*')
        .eq('id', invitationId)
        .single()

      if (error) {
        throw new Error(`Failed to fetch invitation: ${error.message}`)
      }

      return data as InvitationTemplate
    } catch (error) {
      console.error('Error fetching invitation:', error)
      throw error
    }
  }

  /**
   * Get all invitations for an event
   */
  static async getEventInvitations(eventId: string): Promise<InvitationTemplate[]> {
    try {
      const { data, error } = await (this.supabase.from('invitation_templates') as any)
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch event invitations: ${error.message}`)
      }

      return (data || []) as InvitationTemplate[]
    } catch (error) {
      console.error('Error fetching event invitations:', error)
      throw error
    }
  }

  /**
   * Update invitation customization
   */
  static async updateInvitationCustomization(
    invitationId: string,
    customization: Partial<InvitationCustomization>
  ): Promise<InvitationTemplate> {
    try {
      const { data, error } = await (this.supabase.from('invitation_templates') as any)
        .update({
          customization: {
            ...customization,
          },
        })
        .eq('id', invitationId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update invitation: ${error.message}`)
      }

      return data as InvitationTemplate
    } catch (error) {
      console.error('Error updating invitation customization:', error)
      throw error
    }
  }

  /**
   * Update invitation data
   */
  static async updateInvitationData(
    invitationId: string,
    invitationData: Partial<InvitationData>
  ): Promise<InvitationTemplate> {
    try {
      // First get the current data
      const current = await this.getInvitation(invitationId)

      const { data, error } = await (this.supabase.from('invitation_templates') as any)
        .update({
          invitation_data: {
            ...current.invitation_data,
            ...invitationData,
          },
        })
        .eq('id', invitationId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update invitation data: ${error.message}`)
      }

      return data as InvitationTemplate
    } catch (error) {
      console.error('Error updating invitation data:', error)
      throw error
    }
  }

  /**
   * Generate a shareable link for an invitation
   */
  static async generateShareableLink(invitationId: string): Promise<string> {
    try {
      const { data, error } = await (this.supabase as any).rpc('generate_shareable_link', {
        invitation_id: invitationId,
      })

      if (error) {
        throw new Error(`Failed to generate shareable link: ${error.message}`)
      }

      return data as string
    } catch (error) {
      console.error('Error generating shareable link:', error)
      throw error
    }
  }

  /**
   * Get invitation by shareable link
   */
  static async getInvitationByLink(shareLink: string): Promise<InvitationTemplate> {
    try {
      const { data, error } = await (this.supabase.from('invitation_templates') as any)
        .select('*')
        .eq('shareable_link', shareLink)
        .single()

      if (error) {
        throw new Error(`Failed to fetch invitation: ${error.message}`)
      }

      return data as InvitationTemplate
    } catch (error) {
      console.error('Error fetching invitation by link:', error)
      throw error
    }
  }

  /**
   * Track invitation view
   */
  static async trackInvitationView(
    invitationId: string,
    viewerIP?: string,
    userAgent?: string,
    referrer?: string
  ): Promise<void> {
    try {
      await (this.supabase as any).rpc('track_invitation_view', {
        invitation_id: invitationId,
        p_viewer_ip: viewerIP || null,
        p_user_agent: userAgent || null,
        p_referrer: referrer || null,
      })
    } catch (error) {
      console.error('Error tracking invitation view:', error)
      // Don't throw - this is non-critical analytics
    }
  }

  /**
   * Get invitation analytics
   */
  static async getInvitationAnalytics(invitationId: string) {
    try {
      const { data: views, error } = await (this.supabase.from('invitation_views') as any)
        .select('*')
        .eq('invitation_template_id', invitationId)
        .order('viewed_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch analytics: ${error.message}`)
      }

      return {
        total_views: views?.length || 0,
        views: views || [],
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      throw error
    }
  }

  /**
   * Delete invitation template
   */
  static async deleteInvitation(invitationId: string): Promise<void> {
    try {
      const { error } = await (this.supabase.from('invitation_templates') as any).delete().eq('id', invitationId)

      if (error) {
        throw new Error(`Failed to delete invitation: ${error.message}`)
      }
    } catch (error) {
      console.error('Error deleting invitation:', error)
      throw error
    }
  }

  /**
   * Set template for event
   */
  static async setEventTemplate(
    eventId: string,
    templateId: TemplateStyle,
    customization?: Partial<InvitationCustomization>
  ): Promise<void> {
    try {
      const { error } = await (this.supabase.from('events') as any)
        .update({
          template_id: templateId,
          template_customization: customization || {},
        })
        .eq('id', eventId)

      if (error) {
        throw new Error(`Failed to set event template: ${error.message}`)
      }
    } catch (error) {
      console.error('Error setting event template:', error)
      throw error
    }
  }

  /**
   * Get event template settings
   */
  static async getEventTemplateSettings(
    eventId: string
  ): Promise<{ template_id: TemplateStyle; template_customization: InvitationCustomization }> {
    try {
      const { data, error } = await (this.supabase.from('events') as any)
        .select('template_id, template_customization')
        .eq('id', eventId)
        .single()

      if (error) {
        throw new Error(`Failed to fetch event template settings: ${error.message}`)
      }

      return {
        template_id: data.template_id || 'modern',
        template_customization: data.template_customization || {},
      }
    } catch (error) {
      console.error('Error fetching template settings:', error)
      throw error
    }
  }

  /**
   * Export invitation to PDF (via API)
   */
  static async exportInvitationPDF(invitationId: string): Promise<Blob> {
    try {
      const response = await fetch(`/api/invitations/${invitationId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format: 'pdf' }),
      })

      if (!response.ok) {
        throw new Error('Failed to export invitation')
      }

      return await response.blob()
    } catch (error) {
      console.error('Error exporting invitation:', error)
      throw error
    }
  }

  /**
   * Send invitation via email
   */
  static async sendInvitationEmail(
    invitationId: string,
    recipients: string[]
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`/api/invitations/${invitationId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipients }),
      })

      if (!response.ok) {
        throw new Error('Failed to send invitations')
      }

      return await response.json()
    } catch (error) {
      console.error('Error sending invitations:', error)
      throw error
    }
  }

  /**
   * Get current user ID
   */
  private static async getCurrentUserId(): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.auth.getUser()
      if (error) return null
      return data.user?.id || null
    } catch {
      return null
    }
  }
}

export default InvitationService
