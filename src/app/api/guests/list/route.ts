import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

import { getLatestWhatsAppStatusForRecipient } from '@/lib/twilio'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

function normalizeDeliveryStatus(status?: string | null): 'delivered' | 'failed' | 'pending' | 'read' {
  const normalized = (status || '').toLowerCase()

  if (normalized === 'read') return 'read'
  if (normalized === 'failed' || normalized === 'undelivered') return 'failed'
  if (normalized === 'delivered' || normalized === 'sent') return 'delivered'

  return 'pending'
}

// Helper to get authorized user
async function getAuthorizedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return null
  }

  const token = authHeader.replace('Bearer ', '')
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)
  return error ? null : user
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthorizedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get eventId from query params
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    // Verify event belongs to user
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('user_id', user.id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found or access denied' }, { status: 404 })
    }

    // Fetch guests for the event
    const { data: guests, error: guestsError } = await supabase
      .from('guests')
      .select(
        `
        id,
        name,
        phone,
        email,
        status,
        qr_token,
        checked_in,
        checked_in_at,
        plus_ones,
        notes,
        created_at,
        updated_at
      `
      )
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (guestsError) {
      console.error('Error fetching guests:', guestsError)
      return NextResponse.json({ error: 'Failed to fetch guests' }, { status: 500 })
    }

    // Fetch message statuses for these guests (latest message per guest)
    const guestIds = guests?.map((g) => g.id) || []
    const messageStatuses: Record<
      string,
      { messageId?: string; deliveryStatus: string; sentAt: string | null; errorMessage?: string | null }
    > = {}

    if (guestIds.length > 0) {
      const { data: messages } = await supabase
        .from('messages')
        .select('id, guest_id, status, sent_at, error_message')
        .in('guest_id', guestIds)
        .order('created_at', { ascending: false })

      // Group by guest_id and take the latest status
      if (messages) {
        messages.forEach((msg: any) => {
          if (!messageStatuses[msg.guest_id]) {
            messageStatuses[msg.guest_id] = {
              messageId: msg.id,
              deliveryStatus: msg.status,
              sentAt: msg.sent_at,
              errorMessage: msg.error_message,
            }
          }
        })
      }
    }

    const liveStatusUpdates = await Promise.all(
      (guests || []).map(async (guest) => {
        const current = messageStatuses[guest.id]
        if (!guest.phone || !current || !['pending', 'sent'].includes((current.deliveryStatus || '').toLowerCase())) {
          return null
        }

        const latest = await getLatestWhatsAppStatusForRecipient(guest.phone)
        if (!latest) {
          return null
        }

        const normalizedStatus = normalizeDeliveryStatus(latest.status)
        if (
          normalizedStatus === normalizeDeliveryStatus(current.deliveryStatus) &&
          !latest.errorHint &&
          !latest.errorMessage
        ) {
          return null
        }

        messageStatuses[guest.id] = {
          ...current,
          deliveryStatus: latest.status || current.deliveryStatus,
          sentAt: latest.sentAt?.toISOString?.() || current.sentAt,
          errorMessage: latest.errorMessage || latest.errorHint || current.errorMessage || null,
        }

        if (current.messageId) {
          await supabase
            .from('messages')
            .update({
              status: normalizedStatus,
              delivered_at:
                normalizedStatus === 'delivered' || normalizedStatus === 'read' ? new Date().toISOString() : null,
              error_message: latest.errorMessage || latest.errorHint || null,
            })
            .eq('id', current.messageId)
        }

        return true
      })
    )

    // Transform guests data to match frontend interface
    const transformedGuests =
      guests?.map((guest) => {
        const msgStatus = messageStatuses[guest.id]
        return {
          id: guest.id,
          name: guest.name,
          phone: guest.phone,
          email: guest.email,
          invitationStatus: msgStatus?.sentAt ? 'sent' : 'pending',
          deliveryStatus: normalizeDeliveryStatus(msgStatus?.deliveryStatus),
          responseStatus: guest.status === 'no_response' ? 'no-response' : guest.status,
          checkInTime: guest.checked_in_at,
          qrCode: guest.qr_token,
          plusOnes: guest.plus_ones || 0,
          notes: guest.notes,
          checkedIn: guest.checked_in,
          createdAt: guest.created_at,
          updatedAt: guest.updated_at,
        }
      }) || []

    return NextResponse.json(
      {
        success: true,
        guests: transformedGuests,
        total: transformedGuests.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in guests list API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
