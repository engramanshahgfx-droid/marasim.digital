import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

function getEventSignature(event: { name?: string; venue?: string }) {
  const normalizedName = String(event.name || '').trim().toLowerCase()
  const normalizedVenue = String(event.venue || '').trim().toLowerCase()
  return `${normalizedName}|${normalizedVenue}`
}

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

// GET /api/events/:id/guest-payments - List all guest payments + attendance for an event (admin only)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')

    // Verify event belongs to user
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, user_id, name, date, venue')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found or not authorized' }, { status: 404 })
    }

    // Resolve duplicates by signature and include all related event IDs for reporting.
    const eventSignature = getEventSignature(event)
    const { data: relatedEvents, error: relatedEventsError } = await supabase
      .from('events')
      .select('id, name, date, venue')
      .eq('user_id', user.id)

    if (relatedEventsError) {
      console.error('Related events lookup error:', relatedEventsError)
      return NextResponse.json({ error: 'Failed to resolve related events' }, { status: 500 })
    }

    const eventIds = new Set<string>()

    ;(relatedEvents || []).forEach((item: any) => {
      if (getEventSignature(item) === eventSignature) {
        eventIds.add(String(item.id))
      }
    })

    // Fallback: include all same-name or same-venue events if no direct signature match
    if (eventIds.size === 0) {
      const normalizedName = String(event.name || '').trim().toLowerCase()
      const normalizedVenue = String(event.venue || '').trim().toLowerCase()

      ;(relatedEvents || []).forEach((item: any) => {
        const nameMatch = String(item.name || '').trim().toLowerCase() === normalizedName
        const venueMatch = String(item.venue || '').trim().toLowerCase() === normalizedVenue
        if (nameMatch || venueMatch) {
          eventIds.add(String(item.id))
        }
      })
    }

    // ensure at least the requested event is included
    eventIds.add(String(event.id))
    const eventIdList = Array.from(eventIds)

    // Build query for payments
    let query = supabase
      .from('guest_payments')
      .select(
        `
        id,
        event_id,
        guest_id,
        amount,
        payment_date,
        status,
        proof_url,
        proof_file_name,
        notes,
        created_at,
        guests(name, email, phone, status as guest_status)
      `
      )
      .in('event_id', eventIdList)

    // Filter by payment status if provided
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    // Order by created_at descending
    query = query.order('created_at', { ascending: false })

    const { data: payments, error: paymentsError } = await query

    if (paymentsError) {
      console.error('Payments query error:', paymentsError)
      // If guest_payments table doesn't exist yet, return empty
      if (
        String(paymentsError.message).includes('guest_payments') ||
        String(paymentsError.message).includes('does not exist')
      ) {
        return NextResponse.json({
          payments: [],
          guests: [],
          message: 'Payment system not yet initialized. Please run database migrations.',
        })
      }
      throw paymentsError
    }

    // Fetch all guests for this event to show attendance + no-payment guests
    const { data: allGuests, error: guestError } = await supabase
      .from('guests')
      .select('id, name, email, phone, status, checked_in, checked_in_at, qr_token, created_at, event_id')
      .in('event_id', eventIdList)
      .order('created_at', { ascending: false })

    if (guestError) {
      console.error('Guests query error:', guestError)
      throw guestError
    }

    const paymentRows = (payments || []) as any[]

    const paymentGuestIds = Array.from(
      new Set(paymentRows.map((payment: any) => String(payment.guest_id || '')).filter(Boolean))
    )

    let fallbackGuestsById: Record<string, any> = {}
    if (paymentGuestIds.length > 0) {
      const missingGuestIds = paymentGuestIds.filter(
        (guestId) => !(allGuests || []).some((guest: any) => String(guest.id) === guestId)
      )

      if (missingGuestIds.length > 0) {
        const { data: fallbackGuests } = await supabase
          .from('guests')
          .select('id, name, email, phone, status, checked_in, checked_in_at, qr_token, created_at')
          .in('id', missingGuestIds)

        fallbackGuestsById = Object.fromEntries((fallbackGuests || []).map((guest: any) => [String(guest.id), guest]))
      }
    }

    // Create a map of payments by guest_id
    const paymentsByGuestId: Record<string, any> = {}
    if (paymentRows.length > 0) {
      paymentRows.forEach((p: any) => {
        paymentsByGuestId[p.guest_id] = {
          id: p.id,
          amount: p.amount,
          payment_date: p.payment_date,
          status: p.status,
          proof_url: p.proof_url,
          proof_file_name: p.proof_file_name,
          notes: p.notes,
          created_at: p.created_at,
        }
      })
    }

    const guestsById = new Map<string, any>()

    for (const guest of allGuests || []) {
      guestsById.set(String(guest.id), guest)
    }

    for (const payment of paymentRows) {
      const guestId = String(payment.guest_id || '')
      if (!guestId || guestsById.has(guestId)) {
        continue
      }

      const fallbackGuest = fallbackGuestsById[guestId]
      const nestedGuest = Array.isArray((payment as any).guests) ? (payment as any).guests[0] : (payment as any).guests

      guestsById.set(guestId, {
        id: guestId,
        name: fallbackGuest?.name || nestedGuest?.name || 'Unknown guest',
        email: fallbackGuest?.email || nestedGuest?.email || null,
        phone: fallbackGuest?.phone || nestedGuest?.phone || null,
        status: fallbackGuest?.status || nestedGuest?.guest_status || 'no_response',
        checked_in: fallbackGuest?.checked_in || false,
        checked_in_at: fallbackGuest?.checked_in_at || null,
        qr_token: fallbackGuest?.qr_token || null,
        created_at: fallbackGuest?.created_at || payment.created_at,
      })
    }

    // Enrich guests with payment info
    const enrichedGuests = Array.from(guestsById.values()).map((guest: any) => ({
      ...guest,
      payment: paymentsByGuestId[guest.id] || null,
      has_paid: paymentsByGuestId[guest.id]?.status === 'paid',
    }))

    return NextResponse.json({
      payments: payments || [],
      guests: enrichedGuests,
      event,
    })
  } catch (error) {
    console.error('Error fetching guest payments:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/events/:id/guest-payments - Update payment status (admin only)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { paymentId, status } = await request.json()

    if (!paymentId || !status) {
      return NextResponse.json({ error: 'paymentId and status are required' }, { status: 400 })
    }

    // Verify event belongs to user
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, user_id, name, date, venue')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found or not authorized' }, { status: 404 })
    }

    const eventSignature = getEventSignature(event)
    const { data: relatedEvents, error: relatedEventsError } = await supabase
      .from('events')
      .select('id, name, date, venue')
      .eq('user_id', user.id)

    if (relatedEventsError) {
      console.error('Related events lookup error:', relatedEventsError)
      return NextResponse.json({ error: 'Failed to resolve related events' }, { status: 500 })
    }

    const eventIds = new Set<string>()
    ;(relatedEvents || []).forEach((item: any) => {
      if (getEventSignature(item) === eventSignature) {
        eventIds.add(String(item.id))
      }
    })

    eventIds.add(String(event.id))
    const eventIdList = Array.from(eventIds)

    // Make sure the payment belongs to one of the merged / related events
    const paymentCheck = await supabase
      .from('guest_payments')
      .select('id, event_id')
      .eq('id', paymentId)
      .maybeSingle()

    if (!paymentCheck.data || !eventIdList.includes(String(paymentCheck.data.event_id))) {
      return NextResponse.json({ error: 'Payment not found for this event' }, { status: 404 })
    }

    // Update payment status
    const { data: updated, error: updateError } = await supabase
      .from('guest_payments')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true, payment: updated }, { status: 200 })
  } catch (error) {
    console.error('Error updating payment status:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
