// RSVP Update API - guests can accept or decline invitation via web
// Location: src/app/api/guests/rsvp/route.ts

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    const body = await request.json()
    const { guest_id, event_id, status, notes } = body

    // Validate input
    if (!guest_id || !event_id || !status) {
      return NextResponse.json({ error: 'Missing required fields: guest_id, event_id, status' }, { status: 400 })
    }

    const validStatuses = ['confirmed', 'declined', 'no_response']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Verify guest exists and try to resolve event mismatch.
    let guest: any
    const result = await supabase
      .from('guests')
      .select('id, event_id, status')
      .eq('id', guest_id)
      .eq('event_id', event_id)
      .single()

    guest = result.data

    if (!guest) {
      const fallbackResult = await supabase.from('guests').select('id, event_id, status').eq('id', guest_id).single()
      if (fallbackResult.error || !fallbackResult.data) {
        return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
      }
      guest = fallbackResult.data
    }

    // Update guest status
    const { data: updatedGuest, error: updateError } = await supabase
      .from('guests')
      .update({
        status,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', guest_id)
      .select()
      .single()

    if (updateError) {
      console.error('RSVP update error:', updateError)
      return NextResponse.json({ error: 'Failed to update RSVP status' }, { status: 500 })
    }

    // Log the RSVP action
    await supabase.from('messages').insert({
      guest_id,
      event_id,
      message_type: 'rsvp',
      recipient: 'internal',
      status: 'processed',
      metadata: {
        previous_status: guest.status,
        new_status: status,
        response_method: 'web_ui',
      },
    })

    return NextResponse.json({
      success: true,
      message: `RSVP status updated to: ${status}`,
      data: updatedGuest,
    })
  } catch (error) {
    console.error('RSVP error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
