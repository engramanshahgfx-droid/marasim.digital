// API Route: Create Invitation
// Location: src/app/api/invitations/create/route.ts

import { generateShareableLinkCompat, getLatestInvitationForEvent } from '@/lib/invitationTemplateCompat'
import { InvitationData, TemplateStyle } from '@/types/invitations'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')
const LEGACY_PAYLOAD_PREFIX = '__MARASIM_INVITATION_JSON__:'

function getErrorMessage(error: unknown): string {
  if (!error) return ''
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (typeof error === 'object') {
    const maybeMessage = (error as any).message
    const maybeDetails = (error as any).details
    const maybeHint = (error as any).hint
    return [maybeMessage, maybeDetails, maybeHint].filter(Boolean).join(' | ')
  }
  return String(error)
}

function isMissingColumn(error: any, column: string) {
  const message = String(error?.message || '')
  const normalized = message.toLowerCase()
  const normalizedColumn = String(column || '').toLowerCase()
  return (
    normalized.includes(`could not find the '${normalizedColumn}' column`) ||
    normalized.includes(`column "${normalizedColumn}" does not exist`) ||
    normalized.includes(`column ${normalizedColumn} does not exist`) ||
    normalized.includes(`column invitation_templates.${normalizedColumn} does not exist`) ||
    normalized.includes(`column events.${normalizedColumn} does not exist`)
  )
}

function isLegacyTemplateSchema(error: any) {
  return (
    isMissingColumn(error, 'template_id') ||
    isMissingColumn(error, 'customization') ||
    isMissingColumn(error, 'invitation_data') ||
    isMissingColumn(error, 'created_by') ||
    isMissingColumn(error, 'shareable_link')
  )
}

function buildLegacyTextPayload(invitationData: InvitationData) {
  const eventName = String(invitationData?.event_name || 'Event').trim()
  const dateLabel = String(invitationData?.date || '').trim() || 'TBD'
  const timeLabel = String(invitationData?.time || '').trim() || '18:00'
  const locationLabel = String(invitationData?.location || '').trim() || 'Venue details to follow'
  const description = String(invitationData?.description || '').trim()

  return {
    title: String(invitationData?.title || '').trim() || "You're Invited!",
    message: description || `You are invited to ${eventName} on ${dateLabel} at ${timeLabel}. Venue: ${locationLabel}`,
    footer_text: String(invitationData?.footer_text || '').trim() || 'Please confirm your attendance.',
    language: 'en',
    is_active: true,
  }
}

function buildLegacySerializedPayload(
  templateId: TemplateStyle,
  invitationData: InvitationData,
  customization?: Record<string, unknown>
) {
  return `${LEGACY_PAYLOAD_PREFIX}${JSON.stringify({
    template_id: templateId,
    invitation_data: invitationData,
    customization: customization || {},
  })}`
}

async function runLegacyUpdate(
  invitationId: string,
  eventId: string,
  legacyText: ReturnType<typeof buildLegacyTextPayload>,
  legacySerializedPayload: string
) {
  let legacyUpdate = await (supabase.from('invitation_templates') as any)
    .update({
      ...legacyText,
      message_ar: legacySerializedPayload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invitationId)
    .eq('event_id', eventId)
    .select('*')
    .single()

  if (legacyUpdate.error && isMissingColumn(legacyUpdate.error, 'message_ar')) {
    legacyUpdate = await (supabase.from('invitation_templates') as any)
      .update({
        ...legacyText,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitationId)
      .eq('event_id', eventId)
      .select('*')
      .single()
  }

  return legacyUpdate
}

async function runLegacyInsert(
  eventId: string,
  userId: string,
  legacyText: ReturnType<typeof buildLegacyTextPayload>,
  legacySerializedPayload: string
) {
  let legacyInsert = await (supabase.from('invitation_templates') as any)
    .insert({
      event_id: eventId,
      user_id: userId,
      ...legacyText,
      message_ar: legacySerializedPayload,
    })
    .select('*')
    .single()

  if (legacyInsert.error && isMissingColumn(legacyInsert.error, 'message_ar')) {
    legacyInsert = await (supabase.from('invitation_templates') as any)
      .insert({
        event_id: eventId,
        user_id: userId,
        ...legacyText,
      })
      .select('*')
      .single()
  }

  return legacyInsert
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const {
      event_id,
      template_id,
      invitation_data,
      customization,
      invitation_id,
      share_link,
    }: {
      event_id: string
      template_id: TemplateStyle
      invitation_data: InvitationData
      customization?: any
      invitation_id?: string
      share_link?: string
    } = body

    // Validate required fields
    if (!event_id || !template_id || !invitation_data) {
      return NextResponse.json(
        {
          error: 'Missing required fields: event_id, template_id, invitation_data',
        },
        { status: 400 }
      )
    }

    // Check if user has access to this event
    const { data: eventData, error: eventError } = await (supabase.from('events') as any)
      .select('id')
      .eq('id', event_id)
      .eq('user_id', user.id)
      .single()

    if (eventError || !eventData) {
      return NextResponse.json({ error: 'Event not found or access denied' }, { status: 403 })
    }

    const normalizedInvitationData = { ...invitation_data, template_id }
    const normalizedCustomization = {
      ...(customization || {}),
      language: (customization as any)?.language || 'en',
    }

    let targetInvitationId = ''

    if (invitation_id) {
      const explicitById = await (supabase.from('invitation_templates') as any)
        .select('id')
        .eq('id', invitation_id)
        .eq('event_id', event_id)
        .maybeSingle()

      if (!explicitById.error && explicitById.data?.id) {
        targetInvitationId = explicitById.data.id
      }
    }

    if (!targetInvitationId && share_link) {
      const explicitByShareLink = await (supabase.from('invitation_templates') as any)
        .select('id')
        .eq('shareable_link', share_link)
        .eq('event_id', event_id)
        .maybeSingle()

      if (!explicitByShareLink.error && explicitByShareLink.data?.id) {
        targetInvitationId = explicitByShareLink.data.id
      }

      if (
        !targetInvitationId &&
        explicitByShareLink.error &&
        isMissingColumn(explicitByShareLink.error, 'shareable_link')
      ) {
        const explicitByLegacyShareId = await (supabase.from('invitation_templates') as any)
          .select('id')
          .eq('id', share_link)
          .eq('event_id', event_id)
          .maybeSingle()

        if (!explicitByLegacyShareId.error && explicitByLegacyShareId.data?.id) {
          targetInvitationId = explicitByLegacyShareId.data.id
        }
      }
    }

    if (!targetInvitationId) {
      const byTemplate = await (supabase.from('invitation_templates') as any)
        .select('id')
        .eq('event_id', event_id)
        .eq('template_id', template_id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!byTemplate.error && byTemplate.data?.id) {
        targetInvitationId = byTemplate.data.id
      }
    }

    const latestInvitation = await getLatestInvitationForEvent(supabase as any, event_id)
    let savedInvitation: any = null
    const failureReasons: string[] = []

    if (!targetInvitationId && latestInvitation?.id) {
      targetInvitationId = latestInvitation.id
    }

    if (targetInvitationId) {
      const modernUpdate = await (supabase.from('invitation_templates') as any)
        .update({
          template_id,
          invitation_data: normalizedInvitationData,
          customization: normalizedCustomization,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetInvitationId)
        .eq('event_id', event_id)
        .select('*')
        .single()

      if (!modernUpdate.error && modernUpdate.data) {
        savedInvitation = modernUpdate.data
      } else if (isLegacyTemplateSchema(modernUpdate.error)) {
        const legacyText = buildLegacyTextPayload(normalizedInvitationData as InvitationData)
        const legacySerializedPayload = buildLegacySerializedPayload(
          template_id,
          normalizedInvitationData as InvitationData,
          normalizedCustomization
        )
        const legacyUpdate = await runLegacyUpdate(targetInvitationId, event_id, legacyText, legacySerializedPayload)

        if (legacyUpdate.error || !legacyUpdate.data) {
          failureReasons.push(getErrorMessage(legacyUpdate.error) || 'Legacy update failed')
        } else {
          savedInvitation = legacyUpdate.data
        }
      } else if (modernUpdate.error) {
        failureReasons.push(getErrorMessage(modernUpdate.error) || 'Modern update failed')
      }

      // Last-resort update for legacy schemas: update basic text columns only.
      if (!savedInvitation) {
        const legacyText = buildLegacyTextPayload(normalizedInvitationData as InvitationData)
        const fallbackUpdate = await (supabase.from('invitation_templates') as any)
          .update({
            ...legacyText,
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetInvitationId)
          .eq('event_id', event_id)
          .select('*')
          .single()

        if (!fallbackUpdate.error && fallbackUpdate.data) {
          savedInvitation = fallbackUpdate.data
        } else {
          failureReasons.push(getErrorMessage(fallbackUpdate.error) || 'Fallback text update failed')
        }
      }
    }

    if (!savedInvitation) {
      const modernInsert = await (supabase.from('invitation_templates') as any)
        .insert({
          event_id,
          template_id,
          invitation_data: normalizedInvitationData,
          customization: normalizedCustomization,
          created_by: user.id,
        })
        .select('*')
        .single()

      if (!modernInsert.error && modernInsert.data) {
        savedInvitation = modernInsert.data
      } else if (isLegacyTemplateSchema(modernInsert.error)) {
        const legacyText = buildLegacyTextPayload(normalizedInvitationData as InvitationData)
        const legacySerializedPayload = buildLegacySerializedPayload(
          template_id,
          normalizedInvitationData as InvitationData,
          normalizedCustomization
        )
        const legacyInsert = await runLegacyInsert(event_id, user.id, legacyText, legacySerializedPayload)

        if (legacyInsert.error || !legacyInsert.data) {
          failureReasons.push(getErrorMessage(legacyInsert.error) || 'Legacy insert failed')
        } else {
          savedInvitation = legacyInsert.data
        }
      } else {
        failureReasons.push(getErrorMessage(modernInsert.error) || 'Modern insert failed')
      }

      // Final fallback for legacy schemas where user_id/created_by mapping differs.
      if (!savedInvitation) {
        const legacyText = buildLegacyTextPayload(normalizedInvitationData as InvitationData)
        const fallbackInsertWithUser = await (supabase.from('invitation_templates') as any)
          .insert({
            event_id,
            user_id: user.id,
            ...legacyText,
          })
          .select('*')
          .single()

        if (!fallbackInsertWithUser.error && fallbackInsertWithUser.data) {
          savedInvitation = fallbackInsertWithUser.data
        } else {
          failureReasons.push(getErrorMessage(fallbackInsertWithUser.error) || 'Fallback insert with user_id failed')
        }
      }

      if (!savedInvitation) {
        const fallbackInsertWithCreator = await (supabase.from('invitation_templates') as any)
          .insert({
            event_id,
            created_by: user.id,
            template_id,
            invitation_data: normalizedInvitationData,
            customization: normalizedCustomization,
          })
          .select('*')
          .single()

        if (!fallbackInsertWithCreator.error && fallbackInsertWithCreator.data) {
          savedInvitation = fallbackInsertWithCreator.data
        } else {
          failureReasons.push(
            getErrorMessage(fallbackInsertWithCreator.error) || 'Fallback insert with created_by failed'
          )
        }
      }
    }

    if (!savedInvitation) {
      throw new Error(failureReasons.filter(Boolean).join(' || ') || 'Failed to create invitation')
    }

    let shareLink = (savedInvitation as any)?.shareable_link || ''
    if (!shareLink && (savedInvitation as any)?.id) {
      shareLink = await generateShareableLinkCompat(supabase as any, (savedInvitation as any).id)
    }

    return NextResponse.json(
      {
        ...savedInvitation,
        shareable_link: shareLink || (savedInvitation as any)?.id || null,
      },
      { status: targetInvitationId ? 200 : 201 }
    )
  } catch (error) {
    console.error('Error creating invitation:', error)
    const message = getErrorMessage(error) || 'Failed to create invitation'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
