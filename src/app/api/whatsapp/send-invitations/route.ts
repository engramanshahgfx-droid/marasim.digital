import {
  checkWhatsAppMessageStatus,
  formatInvitationTemplateVariables,
  formatPhoneNumber,
  getInvitationTemplateConfig,
  getWhatsAppSenderInfo,
  sendBulkWhatsAppTemplates,
  sendWhatsAppMessage,
} from '@/lib/twilio'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

import { ErrorResponses } from '@/lib/errorHandler'
import {
  createDefaultInvitationForEvent,
  ensureInvitationLinkForEvent,
  generateShareableLinkCompat,
  getInvitationByPublicLink,
  getLatestInvitationForEvent,
  validateInvitationLinkForEvent,
} from '@/lib/invitationTemplateCompat'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

async function getEventForWhatsApp(eventId: string, userId: string) {
  const withBankResult = await supabase
    .from('events')
    .select('id, name, date, time, venue, description, bank_account_holder, bank_name, bank_account_number, bank_iban')
    .eq('id', eventId)
    .eq('user_id', userId)
    .single()

  if (!withBankResult.error && withBankResult.data) {
    return withBankResult
  }

  if (!String(withBankResult.error?.message || '').includes('bank_account_holder')) {
    return withBankResult
  }

  const fallbackResult = await supabase
    .from('events')
    .select('id, name, date, time, venue, description')
    .eq('id', eventId)
    .eq('user_id', userId)
    .single()

  return {
    data: fallbackResult.data
      ? {
          ...fallbackResult.data,
          bank_account_holder: null,
          bank_name: null,
          bank_account_number: null,
          bank_iban: null,
        }
      : null,
    error: fallbackResult.error,
  }
}

function normalizeMessageStatus(status?: string | null): 'pending' | 'sent' | 'delivered' | 'read' | 'failed' {
  const normalized = (status || '').toLowerCase()

  if (normalized === 'delivered') return 'delivered'
  if (normalized === 'read') return 'read'
  if (normalized === 'failed' || normalized === 'undelivered') return 'failed'
  if (normalized === 'sent') return 'sent'

  return 'pending'
}

function buildGuestInvitationLink(appBaseUrl: string, shareLink: string, guestId: string) {
  if (!appBaseUrl || !shareLink || !guestId) {
    return ''
  }

  return `${appBaseUrl}/en/invitations/${shareLink}?guestId=${encodeURIComponent(guestId)}`
}

function buildQrMediaUrl(qrToken?: string | null) {
  if (!qrToken) {
    return ''
  }

  return `https://quickchart.io/qr?size=360&text=${encodeURIComponent(qrToken)}`
}

function buildInvitationImageUrl(appBaseUrl: string, shareLink: string, guestId: string) {
  if (!appBaseUrl || !shareLink || !guestId) {
    return ''
  }

  return `${appBaseUrl}/api/invitations/shared/${shareLink}/export?format=image&guestId=${encodeURIComponent(guestId)}`
}

function resolveAppBaseUrl(request: NextRequest) {
  const envUrl = (process.env.NEXT_PUBLIC_APP_URL || '').trim()
  if (envUrl) {
    return envUrl.replace(/\/$/, '')
  }

  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`.replace(/\/$/, '')
  }

  const originHeader = request.headers.get('origin')
  if (originHeader) {
    return originHeader.replace(/\/$/, '')
  }

  return (request.nextUrl.origin || '').replace(/\/$/, '')
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return ErrorResponses.unauthorized('Missing authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return ErrorResponses.unauthorized('Invalid session')
    }

    const rawBody = await request.text()
    if (!rawBody) {
      return ErrorResponses.missingFields(['userId', 'eventId', 'guestIds'])
    }

    const { userId, eventId, guestIds } = JSON.parse(rawBody)

    if (!userId || !eventId || !guestIds || guestIds.length === 0) {
      return ErrorResponses.missingFields(['userId', 'eventId', 'guestIds'])
    }

    if (user.id !== userId) {
      return ErrorResponses.forbidden('User mismatch')
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
    const { data: eventData, error: eventError } = await getEventForWhatsApp(eventId, userId)

    if (eventError || !eventData) {
      return ErrorResponses.notFound('Event')
    }

    let shareLink = ''
    const adoptValidShareLink = async (candidate: unknown) => {
      const normalizedCandidate = String(candidate || '').trim()
      if (!normalizedCandidate) {
        return ''
      }

      try {
        const validated = await validateInvitationLinkForEvent(supabase as any, eventId, normalizedCandidate)
        if (!validated) {
          return ''
        }

        return String((validated as any).shareable_link || normalizedCandidate)
      } catch {
        return ''
      }
    }

    try {
      const linkData = await ensureInvitationLinkForEvent(supabase as any, eventData as any, userId)
      shareLink =
        (await adoptValidShareLink(linkData.shareLink)) || (await adoptValidShareLink(linkData.invitationId)) || ''
    } catch (linkError) {
      // Do not fail invitation sending if link creation fails due schema/env issues.
      console.warn('Failed to ensure invitation link for WhatsApp send:', linkError)
    }

    if (!shareLink) {
      try {
        const latestInvitation = await getLatestInvitationForEvent(supabase as any, eventId)
        const latestGeneratedLink = latestInvitation?.id
          ? await generateShareableLinkCompat(supabase as any, latestInvitation.id)
          : ''
        shareLink =
          (await adoptValidShareLink(latestInvitation?.shareable_link)) ||
          (await adoptValidShareLink(latestGeneratedLink)) ||
          (await adoptValidShareLink(latestInvitation?.id)) ||
          ''
      } catch (fallbackLinkError) {
        console.warn('Failed to resolve fallback invitation link for WhatsApp send:', fallbackLinkError)
      }
    }

    if (!shareLink) {
      try {
        const createdInvitation = await createDefaultInvitationForEvent(supabase as any, eventData as any, userId)
        const createdGeneratedLink = (createdInvitation as any)?.id
          ? await generateShareableLinkCompat(supabase as any, (createdInvitation as any).id)
          : ''
        shareLink =
          (await adoptValidShareLink((createdInvitation as any)?.shareable_link)) ||
          (await adoptValidShareLink(createdGeneratedLink)) ||
          (await adoptValidShareLink((createdInvitation as any)?.id)) ||
          ''
      } catch (createLinkError) {
        console.warn('Failed to create fallback invitation link for WhatsApp send:', createLinkError)
      }
    }

    if (!shareLink) {
      const { data: legacyLatestInvitation } = await supabase
        .from('invitation_templates')
        .select('id, shareable_link, updated_at')
        .eq('event_id', eventId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      shareLink =
        (await adoptValidShareLink((legacyLatestInvitation as any)?.shareable_link)) ||
        (await adoptValidShareLink((legacyLatestInvitation as any)?.id)) ||
        ''

      // Final fallback for mixed legacy schemas: use invitation UUID directly.
      if (!shareLink) {
        shareLink =
          String((legacyLatestInvitation as any)?.shareable_link || '').trim() ||
          String((legacyLatestInvitation as any)?.id || '').trim() ||
          ''
      }
    }

    let invitationTemplate: any = null
    if (shareLink) {
      try {
        invitationTemplate = await getInvitationByPublicLink(supabase as any, shareLink)
      } catch (invitationLookupError) {
        console.warn('Failed to resolve invitation template for WhatsApp send:', invitationLookupError)
      }
    }

    const savedInvitationData = (invitationTemplate as any)?.invitation_data || {}
    const invitationEventName =
      String(savedInvitationData.event_name || '').trim() || (eventData as any).name || 'Event'
    const invitationDate = String(savedInvitationData.date || '').trim() || (eventData as any).date || ''
    const invitationTime = String(savedInvitationData.time || '').trim() || (eventData as any).time || '14:00'
    const invitationLocation = String(savedInvitationData.location || '').trim() || (eventData as any).venue || null
    const invitationBaseNote = [
      String(savedInvitationData.description || '').trim(),
      String(savedInvitationData.special_instructions || '').trim(),
    ]
      .filter(Boolean)
      .join(' | ')

    const appBaseUrl = resolveAppBaseUrl(request)
    const hasPrivateBaseUrl = /localhost|127\.0\.0\.1|::1/i.test(appBaseUrl)
    // Get guest details
    const { data: guests, error: guestsError } = await supabase
      .from('guests')
      .select('id, phone, name, notes, qr_token')
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
        const invitationLink = buildGuestInvitationLink(appBaseUrl, shareLink, guest.id)
        const invitationImageLink = buildInvitationImageUrl(appBaseUrl, shareLink, guest.id)
        const mergedGuestNote = [
          invitationBaseNote,
          String(guest.notes || '').trim(),
          'Pay via direct bank transfer and upload proof in your invitation page.',
        ]
          .filter(Boolean)
          .join(' | ')
        const contentVariables = formatInvitationTemplateVariables(
          guest.name,
          invitationEventName,
          invitationDate,
          invitationTime,
          invitationLocation,
          guest.qr_token,
          invitationLink,
          mergedGuestNote
        )
        return {
          guestId: guest.id,
          phone: formatPhoneNumber(guest.phone),
          invitationLink,
          invitationImageLink,
          qrToken: guest.qr_token,
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

    const messageByPhone = new Map(messages.map((message: any) => [message.phone, message]))

    const followUpAttempts = await Promise.all(
      statusChecks.map(async (result: any) => {
        const normalizedStatus = normalizeMessageStatus(result.status)
        if (normalizedStatus === 'failed') {
          return {
            phone: result.phone,
            status: 'skipped',
            reason: 'template_failed',
            mediaAttachment: {
              attempted: false,
              reason: 'template_failed',
              mode: 'none',
            },
          }
        }

        const messageMeta = messageByPhone.get(result.phone) as any
        if (!messageMeta?.invitationLink && !messageMeta?.invitationImageLink && !messageMeta?.qrToken) {
          return {
            phone: result.phone,
            status: 'skipped',
            reason: 'no_follow_up_content',
            mediaAttachment: {
              attempted: false,
              reason: 'no_follow_up_content',
              mode: 'none',
            },
          }
        }

        const mediaAttachment = {
          attempted: false,
          reason: messageMeta?.invitationImageLink ? 'private_base_url' : 'no_image_url',
          mode: hasPrivateBaseUrl ? 'text_fallback' : 'media',
          mediaUrl: messageMeta?.invitationImageLink || null,
        }

        const invitationCardMessage = [
          messageMeta.invitationLink ? `Open your invitation: ${messageMeta.invitationLink}` : '',
          'The attached invitation card can be shared with guests.',
        ]
          .filter(Boolean)
          .join(' ')

        const qrMessage = [
          messageMeta.qrToken ? `Check-in code: ${messageMeta.qrToken}` : '',
          messageMeta.qrToken ? `QR link: ${buildQrMediaUrl(messageMeta.qrToken)}` : '',
          messageMeta.invitationLink ? `Invitation: ${messageMeta.invitationLink}` : '',
          'The attached QR can be shown at entry.',
        ]
          .filter(Boolean)
          .join(' ')

        const stepResults: Array<{
          step: 'invitation_card' | 'qr'
          status: string
          sid?: string
          error?: string
        }> = []

        if (messageMeta.invitationImageLink && !hasPrivateBaseUrl) {
          mediaAttachment.attempted = true
          mediaAttachment.reason = 'attempting_media_send'
          try {
            const invitationCardResponse = await sendWhatsAppMessage(
              result.phone,
              invitationCardMessage,
              messageMeta.invitationImageLink
            )

            stepResults.push({
              step: 'invitation_card',
              status: invitationCardResponse.status || 'queued',
              sid: invitationCardResponse.sid,
            })
            mediaAttachment.reason = 'media_sent'
          } catch (error) {
            stepResults.push({
              step: 'invitation_card',
              status: 'failed',
              error: error instanceof Error ? error.message : String(error),
            })
            mediaAttachment.reason = 'media_send_failed'
          }
        } else if (messageMeta.invitationLink) {
          mediaAttachment.reason = hasPrivateBaseUrl ? 'private_base_url_text_fallback' : 'no_image_url_text_fallback'
          try {
            const invitationCardResponse = await sendWhatsAppMessage(result.phone, invitationCardMessage)

            stepResults.push({
              step: 'invitation_card',
              status: invitationCardResponse.status || 'queued',
              sid: invitationCardResponse.sid,
            })
          } catch (error) {
            stepResults.push({
              step: 'invitation_card',
              status: 'failed',
              error: error instanceof Error ? error.message : String(error),
            })
          }
        }

        if (messageMeta.qrToken) {
          try {
            const qrResponse = hasPrivateBaseUrl
              ? await sendWhatsAppMessage(result.phone, qrMessage)
              : await sendWhatsAppMessage(result.phone, qrMessage, buildQrMediaUrl(messageMeta.qrToken))

            stepResults.push({
              step: 'qr',
              status: qrResponse.status || 'queued',
              sid: qrResponse.sid,
            })
          } catch (error) {
            stepResults.push({
              step: 'qr',
              status: 'failed',
              error: error instanceof Error ? error.message : String(error),
            })
          }
        }

        if (stepResults.length === 0) {
          return {
            phone: result.phone,
            status: 'skipped',
            reason: 'no_follow_up_content',
            mediaAttachment,
          }
        }

        const succeededSteps = stepResults.filter(
          (stepResult) => normalizeMessageStatus(stepResult.status) !== 'failed'
        )
        const failedStep = stepResults.find((stepResult) => normalizeMessageStatus(stepResult.status) === 'failed')

        return {
          phone: result.phone,
          status: succeededSteps.length > 0 ? 'sent' : 'failed',
          sid: succeededSteps[0]?.sid,
          steps: stepResults,
          error: succeededSteps.length > 0 ? null : failedStep?.error || 'Follow-up messages failed',
          invitationLink: messageMeta.invitationLink,
          mediaAttachment,
        }
      })
    )

    const privateBaseUrlHint = hasPrivateBaseUrl
      ? ' Configure NEXT_PUBLIC_APP_URL to a public HTTPS domain so Twilio can fetch invitation card media and guests can open invitation/PDF links.'
      : ''
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

    const followUpRecords = followUpAttempts
      .filter((attempt: any) => ['queued', 'sent', 'delivered', 'read', 'pending', 'failed'].includes(attempt.status))
      .map((attempt: any) => {
        const guest = guestByFormattedPhone.get(attempt.phone) as any
        const normalizedStatus = normalizeMessageStatus(attempt.status)
        return {
          guest_id: guest?.id,
          event_id: eventId,
          message_type: 'invitation_follow_up',
          status: normalizedStatus,
          sent_at: new Date().toISOString(),
          delivered_at:
            normalizedStatus === 'delivered' || normalizedStatus === 'read' ? new Date().toISOString() : null,
          error_message: attempt.error || null,
        }
      })

    if (followUpRecords.length > 0) {
      await supabase.from('messages').insert(followUpRecords)
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
      followUpSent: followUpAttempts.filter((attempt: any) =>
        ['queued', 'sent', 'delivered', 'read', 'pending'].includes(attempt.status)
      ).length,
      followUpFailed: followUpAttempts.filter((attempt: any) => attempt.status === 'failed').length,
      followUpResults: followUpAttempts,
      mediaAttachmentAttempts: followUpAttempts.map((attempt: any) => ({
        phone: attempt.phone,
        attempted: Boolean(attempt.mediaAttachment?.attempted),
        reason: attempt.mediaAttachment?.reason || null,
        mode: attempt.mediaAttachment?.mode || null,
        mediaUrl: attempt.mediaAttachment?.mediaUrl || null,
      })),
      senderMode: senderInfo.isSandbox ? 'sandbox' : 'registered',
      sender: senderInfo.sender,
      hint: senderInfo.isSandbox
        ? `Twilio Sandbox may queue or delay international WhatsApp delivery. The QR follow-up message is sent best-effort after the template. If replies still show the default Twilio message, configure the sandbox inbound webhook.${privateBaseUrlHint}`
        : 'If status stays pending, check recipient WhatsApp availability and Twilio message logs for carrier restrictions.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return ErrorResponses.internalError(message)
  }
}
