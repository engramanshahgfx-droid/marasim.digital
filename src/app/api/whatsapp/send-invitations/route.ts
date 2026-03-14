import {
  checkWhatsAppMessageStatus,
  formatInvitationTemplateVariables,
  formatPhoneNumber,
  getInvitationTemplateConfig,
  getWhatsAppSenderInfo,
  sendBulkWhatsAppTemplates,
} from '@/lib/twilio'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

import { ErrorResponses, handleAPIError } from '@/lib/errorHandler'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

function normalizeMessageStatus(status?: string | null): 'pending' | 'sent' | 'delivered' | 'read' | 'failed' {
  const normalized = (status || '').toLowerCase()

  if (normalized === 'delivered') return 'delivered'
  if (normalized === 'read') return 'read'
  if (normalized === 'failed' || normalized === 'undelivered') return 'failed'
  if (normalized === 'sent') return 'sent'

  return 'pending'
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    if (!rawBody) {
      return ErrorResponses.missingFields(['userId', 'eventId', 'guestIds'])
    }

    const { userId, eventId, guestIds } = JSON.parse(rawBody)

    if (!userId || !eventId || !guestIds || guestIds.length === 0) {
      return ErrorResponses.missingFields(['userId', 'eventId', 'guestIds'])
    }

    // Check user's subscription and limits
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('subscription_status, plan_type, whatsapp_limit_per_month, whatsapp_sent_this_month')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return ErrorResponses.userNotFound()
    }

    // Allow active, trialing, and free accounts to send
    const allowedStatuses = ['active', 'trialing', 'free', 'trial']
    if (
      !allowedStatuses.includes((userData as any).subscription_status) &&
      (userData as any).subscription_status !== null
    ) {
      return ErrorResponses.subscriptionRequired()
    }

    // Check monthly limit
    if (
      (userData as any).whatsapp_limit_per_month > 0 &&
      (userData as any).whatsapp_sent_this_month + guestIds.length > (userData as any).whatsapp_limit_per_month
    ) {
      return ErrorResponses.limitExceeded(
        'WhatsApp messages',
        (userData as any).whatsapp_sent_this_month + guestIds.length,
        (userData as any).whatsapp_limit_per_month
      )
    }

    // Get event details
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('name, date')
      .eq('id', eventId)
      .eq('user_id', userId)
      .single()

    if (eventError || !eventData) {
      return ErrorResponses.notFound('Event')
    }

    // Get guest details
    const { data: guests, error: guestsError } = await supabase
      .from('guests')
      .select('id, phone, name, qr_token')
      .in('id', guestIds)
      .eq('event_id', eventId)

    if (guestsError || !guests) {
      return ErrorResponses.internalError('Failed to fetch guests')
    }

    // Get template configuration (use templates for Sandbox business-initiated messaging)
    const templateConfig = getInvitationTemplateConfig()
    const senderInfo = getWhatsAppSenderInfo()

    // Prepare WhatsApp template messages
    const messages = (guests as any)
      .filter((guest: any) => Boolean(guest.phone))
      .map((guest: any) => {
        const contentVariables = formatInvitationTemplateVariables(
          guest.name,
          (eventData as any).name,
          (eventData as any).date,
          '14:00', // Default time; can be made dynamic
          guest.qr_token
        )
        return {
          phone: formatPhoneNumber(guest.phone),
          contentSid: templateConfig.contentSid,
          contentVariables,
        }
      })

    if (messages.length === 0) {
      return ErrorResponses.badRequest('No valid guest phone numbers found')
    }

    // Send WhatsApp template messages (required for Sandbox business-initiated conversations)
    const { results, errors } = await sendBulkWhatsAppTemplates(messages)

    if (results.length === 0 && errors.length > 0) {
      return ErrorResponses.badRequest(`WhatsApp send failed: ${errors[0].error}`)
    }

    // Fetch latest Twilio status so UI can show real delivery state instead of only API acceptance.
    const statusChecks = await Promise.all(
      results.map(async (result: any) => {
        try {
          const latest = await checkWhatsAppMessageStatus(result.sid)
          return {
            ...result,
            status: latest.status || result.status || 'pending',
            errorMessage: latest.errorMessage || latest.errorHint || null,
            errorCode: latest.errorCode || null,
            sentAt: latest.sentAt || null,
          }
        } catch {
          return {
            ...result,
            status: result.status || 'pending',
            errorMessage: null,
            errorCode: null,
            sentAt: null,
          }
        }
      })
    )

    const failedByStatusCount = statusChecks.filter((r: any) => normalizeMessageStatus(r.status) === 'failed').length

    const guestByFormattedPhone = new Map((guests as any).map((g: any) => [formatPhoneNumber(g.phone || ''), g]))

    // Record message statuses in database
    const messageRecords = statusChecks.map((result: any) => {
      const guest = guestByFormattedPhone.get(result.phone) as any
      const normalizedStatus = normalizeMessageStatus(result.status)
      return {
        guest_id: guest?.id,
        event_id: eventId,
        message_type: 'invitation',
        status: normalizedStatus,
        sent_at: new Date().toISOString(),
        delivered_at: normalizedStatus === 'delivered' || normalizedStatus === 'read' ? new Date().toISOString() : null,
        error_message: result.errorMessage,
      }
    })

    if (messageRecords.length > 0) {
      await supabase.from('messages').insert(messageRecords)
    }

    // Update user WhatsApp sent count
    await supabase
      .from('users')
      .update({
        whatsapp_sent_this_month: ((userData as any).whatsapp_sent_this_month || 0) + results.length,
      })
      .eq('id', userId)

    return NextResponse.json({
      success: true,
      sent: statusChecks.length,
      delivered: statusChecks.filter((r: any) => normalizeMessageStatus(r.status) === 'delivered').length,
      pending: statusChecks.filter((r: any) => normalizeMessageStatus(r.status) === 'pending').length,
      failed: failedByStatusCount + errors.length,
      results: statusChecks,
      errors,
      senderMode: senderInfo.isSandbox ? 'sandbox' : 'registered',
      sender: senderInfo.sender,
      hint: senderInfo.isSandbox
        ? 'Twilio Sandbox may queue or delay international WhatsApp delivery. If status stays pending, ensure recipient joined the sandbox and use a registered WhatsApp sender for production reliability.'
        : 'If status stays pending, check recipient WhatsApp availability and Twilio message logs for carrier restrictions.',
    })
  } catch (error) {
    return handleAPIError(error)
  }
}
