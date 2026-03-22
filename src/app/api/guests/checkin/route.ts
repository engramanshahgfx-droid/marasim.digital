import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function getAuthorizedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)
  return error ? null : user
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthorizedUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { qr_token, event_id } = body as { qr_token?: string; event_id?: string }

    if (!qr_token || typeof qr_token !== 'string' || qr_token.trim() === '') {
      return NextResponse.json({ error: 'QR token is required' }, { status: 400 })
    }

    // Look up guest by QR token
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('id, name, phone, email, event_id, checked_in, checked_in_at, plus_ones, status')
      .eq('qr_token', qr_token.trim())
      .single()

    if (guestError || !guest) {
      return NextResponse.json({ error: 'Invalid QR code — guest not found' }, { status: 404 })
    }

    // Verify the guest's event is owned by this user
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, name')
      .eq('id', guest.event_id)
      .eq('user_id', user.id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // If a specific event_id was supplied, validate it matches the guest's event
    if (event_id && guest.event_id !== event_id) {
      return NextResponse.json({ error: 'Guest does not belong to this event' }, { status: 400 })
    }

    // --- Duplicate-entry prevention ---
    if (guest.checked_in) {
      return NextResponse.json(
        {
          success: false,
          already_checked_in: true,
          guest: {
            id: guest.id,
            name: guest.name,
            phone: guest.phone,
            plus_ones: guest.plus_ones ?? 0,
            checked_in_at: guest.checked_in_at,
            status: guest.status,
          },
          event: { id: event.id, name: event.name },
        },
        { status: 200 }
      )
    }

    const now = new Date().toISOString()

    // Mark guest as checked in
    const { error: updateError } = await supabase
      .from('guests')
      .update({ checked_in: true, checked_in_at: now, updated_at: now })
      .eq('id', guest.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update check-in status' }, { status: 500 })
    }

    // Write audit record
    await supabase.from('checkins').insert({
      guest_id: guest.id,
      event_id: guest.event_id,
      checked_in_by: user.id,
      checked_in_at: now,
      check_in_method: 'qr_scan',
    })

    return NextResponse.json(
      {
        success: true,
        already_checked_in: false,
        guest: {
          id: guest.id,
          name: guest.name,
          phone: guest.phone,
          plus_ones: guest.plus_ones ?? 0,
          checked_in_at: now,
          status: guest.status,
        },
        event: { id: event.id, name: event.name },
      },
      { status: 200 }
    )
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
