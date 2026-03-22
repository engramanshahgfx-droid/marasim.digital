import { InvitationData } from '@/types/invitations'

interface GuestPersonalizationInput {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  notes?: string | null
  plus_ones?: number | null
}

const PLACEHOLDER_PATTERN = /{{\s*(guest_name|event_name|event_date|event_time|venue|special_note|plus_ones)\s*}}/gi

function replacePlaceholders(value: string, tokens: Record<string, string>): string {
  return value.replace(PLACEHOLDER_PATTERN, (match, rawToken: string) => {
    const normalized = String(rawToken || '').toLowerCase()
    if (!(normalized in tokens)) {
      return match
    }

    return tokens[normalized] || ''
  })
}

function applyTokensRecursively(value: unknown, tokens: Record<string, string>): unknown {
  if (typeof value === 'string') {
    return replacePlaceholders(value, tokens)
  }

  if (Array.isArray(value)) {
    return value.map((entry) => applyTokensRecursively(entry, tokens))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, applyTokensRecursively(entry, tokens)])
    )
  }

  return value
}

export function personalizeInvitationData(baseData: InvitationData, guest: GuestPersonalizationInput): InvitationData {
  const tokens: Record<string, string> = {
    guest_name: guest.name || '',
    event_name: baseData.event_name || '',
    event_date: baseData.date || '',
    event_time: baseData.time || '',
    venue: baseData.location || '',
    special_note: guest.notes || '',
    plus_ones: String(guest.plus_ones ?? 0),
  }

  const personalized = applyTokensRecursively(baseData, tokens) as InvitationData

  return {
    ...personalized,
    guest_name: guest.name,
    guest_email: guest.email || undefined,
    guest_phone: guest.phone || undefined,
    special_note: guest.notes || undefined,
    plus_ones: guest.plus_ones || 0,
    personalized_message:
      personalized.personalized_message ||
      personalized.description ||
      `Dear ${guest.name}, you are invited to ${baseData.event_name}.`,
  }
}

export type { GuestPersonalizationInput }
