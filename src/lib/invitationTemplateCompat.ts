type SupabaseLike = {
  from: (table: string) => any
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: any; error: any }>
}

type EventLike = {
  id: string
  name?: string | null
  date?: string | null
  time?: string | null
  venue?: string | null
  description?: string | null
  template_id?: string | null
  template_customization?: Record<string, unknown> | null
}

type LegacySerializedPayload = {
  template_id?: string
  invitation_data?: Record<string, unknown>
  customization?: Record<string, unknown>
}

const LEGACY_PAYLOAD_PREFIX = '__MARASIM_INVITATION_JSON__:'

function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return ''
  }

  return String((error as { message?: string }).message || '')
}

function asError(error: unknown, fallback: string): Error {
  if (error instanceof Error) {
    return error
  }

  const message = getErrorMessage(error)
  return new Error(message || fallback)
}

function isMissingColumn(error: unknown, column: string): boolean {
  const message = getErrorMessage(error)
  const normalized = message.toLowerCase()
  const normalizedColumn = column.toLowerCase()
  return (
    normalized.includes(`could not find the '${normalizedColumn}' column`) ||
    normalized.includes(`column "${normalizedColumn}" does not exist`) ||
    normalized.includes(`column ${normalizedColumn} does not exist`) ||
    normalized.includes(`column invitation_templates.${normalizedColumn} does not exist`) ||
    normalized.includes(`column events.${normalizedColumn} does not exist`)
  )
}

function isCompatibilityError(error: unknown): boolean {
  return (
    isMissingColumn(error, 'shareable_link') ||
    isMissingColumn(error, 'template_id') ||
    isMissingColumn(error, 'created_by') ||
    isMissingColumn(error, 'invitation_data') ||
    isMissingColumn(error, 'customization')
  )
}

function parseLegacySerializedPayload(value: unknown): LegacySerializedPayload | null {
  const raw = String(value || '').trim()
  if (!raw.startsWith(LEGACY_PAYLOAD_PREFIX)) {
    return null
  }

  const jsonPayload = raw.slice(LEGACY_PAYLOAD_PREFIX.length)
  if (!jsonPayload) {
    return null
  }

  try {
    const parsed = JSON.parse(jsonPayload)
    if (!parsed || typeof parsed !== 'object') {
      return null
    }

    return parsed as LegacySerializedPayload
  } catch {
    return null
  }
}

function buildLegacyInvitationRecord(invitation: any, event: EventLike) {
  const serializedPayload = parseLegacySerializedPayload(invitation.message_ar)
  const serializedTemplateId = String(serializedPayload?.template_id || '').trim()
  const resolvedTemplateId = serializedTemplateId || event.template_id || 'modern'
  const serializedCustomization =
    serializedPayload?.customization && typeof serializedPayload.customization === 'object'
      ? serializedPayload.customization
      : {}
  const serializedInvitationData =
    serializedPayload?.invitation_data && typeof serializedPayload.invitation_data === 'object'
      ? serializedPayload.invitation_data
      : {}

  return {
    id: invitation.id,
    event_id: invitation.event_id,
    template_id: resolvedTemplateId,
    customization: {
      font_family: 'sans-serif',
      language: invitation.language || 'en',
      show_guest_count: true,
      show_dress_code: true,
      show_special_instructions: false,
      ...(event.template_customization || {}),
      ...serializedCustomization,
    },
    invitation_data: {
      template_id: resolvedTemplateId,
      event_id: event.id,
      event_name: event.name || 'Event',
      host_name: event.name || 'Host',
      date: event.date || '',
      time: event.time || '18:00',
      timezone: 'UTC',
      location: event.venue || '',
      description: event.description || invitation.message || '',
      title: invitation.title || "You're Invited!",
      footer_text: invitation.footer_text || 'Please confirm your attendance.',
      ...serializedInvitationData,
    },
    shareable_link: invitation.id,
    view_count: 0,
    created_at: invitation.created_at,
    updated_at: invitation.updated_at,
    created_by: invitation.user_id,
  }
}

async function fetchLegacyInvitationById(supabase: SupabaseLike, invitationId: string) {
  const { data: invitation, error: invitationError } = await supabase
    .from('invitation_templates')
    .select('id, event_id, user_id, language, title, message, message_ar, footer_text, created_at, updated_at')
    .eq('id', invitationId)
    .maybeSingle()

  if (invitationError) {
    throw invitationError
  }

  if (!invitation) {
    return null
  }

  let event: any = null

  const modernEventResult = await supabase
    .from('events')
    .select('id, name, date, time, venue, description, template_id, template_customization')
    .eq('id', invitation.event_id)
    .maybeSingle()

  if (modernEventResult.data) {
    event = modernEventResult.data
  } else if (
    modernEventResult.error &&
    (isMissingColumn(modernEventResult.error, 'template_id') ||
      isMissingColumn(modernEventResult.error, 'template_customization'))
  ) {
    const legacyEventResult = await supabase
      .from('events')
      .select('id, name, date, time, venue, description')
      .eq('id', invitation.event_id)
      .maybeSingle()

    if (legacyEventResult.error) {
      throw legacyEventResult.error
    }

    event = legacyEventResult.data
  } else if (modernEventResult.error) {
    throw modernEventResult.error
  }

  if (!event) {
    return null
  }

  return buildLegacyInvitationRecord(invitation, event)
}

export async function getInvitationByPublicLink(supabase: SupabaseLike, shareLink: string) {
  const modernResult = await supabase
    .from('invitation_templates')
    .select('*')
    .eq('shareable_link', shareLink)
    .maybeSingle()

  if (modernResult.data) {
    return modernResult.data
  }

  // Some environments fall back to invitation UUID tokens instead of shareable_link values.
  // Resolve direct invitation ID first so downstream link validation works reliably.
  const byIdResult = await supabase.from('invitation_templates').select('*').eq('id', shareLink).maybeSingle()

  if (byIdResult.data) {
    const hasModernShape =
      Object.prototype.hasOwnProperty.call(byIdResult.data, 'invitation_data') ||
      Object.prototype.hasOwnProperty.call(byIdResult.data, 'customization') ||
      Object.prototype.hasOwnProperty.call(byIdResult.data, 'template_id')

    if (hasModernShape) {
      return byIdResult.data
    }
  }

  if (modernResult.error && !isMissingColumn(modernResult.error, 'shareable_link')) {
    throw modernResult.error
  }

  if (byIdResult.error) {
    throw byIdResult.error
  }

  const legacyInvitation = await fetchLegacyInvitationById(supabase, shareLink)
  if (legacyInvitation) {
    return legacyInvitation
  }

  if (modernResult.error) {
    throw modernResult.error
  }

  throw new Error('Invitation not found')
}

export async function validateInvitationLinkForEvent(supabase: SupabaseLike, eventId: string, shareLink: string) {
  const invitation = await getInvitationByPublicLink(supabase, shareLink)
  return invitation && invitation.event_id === eventId ? invitation : null
}

export async function getLatestInvitationForEvent(supabase: SupabaseLike, eventId: string) {
  const modernResult = await supabase
    .from('invitation_templates')
    .select('id, event_id, shareable_link, updated_at')
    .eq('event_id', eventId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (modernResult.data) {
    return modernResult.data
  }

  if (modernResult.error && !isMissingColumn(modernResult.error, 'shareable_link')) {
    throw modernResult.error
  }

  const legacyResult = await supabase
    .from('invitation_templates')
    .select('id, event_id, updated_at')
    .eq('event_id', eventId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (legacyResult.error) {
    throw legacyResult.error
  }

  if (!legacyResult.data) {
    return null
  }

  return {
    ...legacyResult.data,
    shareable_link: null,
  }
}

export async function createDefaultInvitationForEvent(supabase: SupabaseLike, event: EventLike, userId: string) {
  const modernInsert = await (supabase as any)
    .from('invitation_templates')
    .insert({
      event_id: event.id,
      template_id: 'modern',
      created_by: userId,
      invitation_data: {
        template_id: 'modern',
        event_id: event.id,
        event_name: event.name || 'Event',
        host_name: event.name || 'Host',
        date: event.date || '',
        time: event.time || '18:00',
        timezone: 'UTC',
        location: event.venue || '',
        description: event.description || '',
      },
      customization: {
        language: 'en',
        font_family: 'sans-serif',
        show_guest_count: true,
        show_dress_code: true,
        show_special_instructions: false,
      },
    })
    .select('id, event_id, shareable_link')
    .single()

  if (!modernInsert.error && modernInsert.data) {
    return modernInsert.data
  }

  if (!isCompatibilityError(modernInsert.error)) {
    throw asError(modernInsert.error, 'Failed to create default invitation template')
  }

  const dateLabel = event.date || 'TBD'
  const timeLabel = event.time || '18:00'
  const venueLabel = event.venue || 'Venue details to follow'

  const legacyInsert = await (supabase as any)
    .from('invitation_templates')
    .insert({
      event_id: event.id,
      user_id: userId,
      language: 'en',
      title: "You're Invited!",
      message: `You are invited to ${event.name || 'our event'} on ${dateLabel} at ${timeLabel}. Venue: ${venueLabel}`,
      footer_text: 'Please confirm your attendance.',
      is_active: true,
    })
    .select('id, event_id, updated_at')
    .single()

  if (legacyInsert.error || !legacyInsert.data) {
    const modernReason = getErrorMessage(modernInsert.error)
    const legacyReason = getErrorMessage(legacyInsert.error)
    throw new Error(
      `Failed to create default invitation template. Modern schema attempt: ${modernReason || 'unknown'}. Legacy schema attempt: ${legacyReason || 'unknown'}.`
    )
  }

  return {
    ...legacyInsert.data,
    shareable_link: null,
  }
}

export async function generateShareableLinkCompat(supabase: SupabaseLike, invitationId: string) {
  const { data, error } = await supabase.rpc('generate_shareable_link', {
    invitation_id: invitationId,
  })

  if (!error && data) {
    return data as string
  }

  return invitationId
}

export async function ensureInvitationLinkForEvent(supabase: SupabaseLike, event: EventLike, userId: string) {
  let invitation = await getLatestInvitationForEvent(supabase, event.id)

  if (!invitation?.id) {
    invitation = await createDefaultInvitationForEvent(supabase, event, userId)
  }

  const shareLink = invitation.shareable_link || (await generateShareableLinkCompat(supabase, invitation.id))

  return {
    invitationId: invitation.id,
    shareLink,
  }
}
