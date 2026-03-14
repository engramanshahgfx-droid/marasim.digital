import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

export async function GET(request: NextRequest) {
  try {
    const eventId = request.nextUrl.searchParams.get('eventId')
    const userId = request.nextUrl.searchParams.get('userId')

    if (!eventId || !userId) {
      // Return aggregated stats for all user's events
      const { data: guests, error } = await supabase
        .from('guests')
        .select('status, checked_in, events(user_id)')
        .eq('events.user_id', userId)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      const stats = {
        invitationsSent: guests?.length || 0,
        confirmedGuests: guests?.filter((g) => g.status === 'confirmed').length || 0,
        pendingResponses: guests?.filter((g) => g.status === 'no_response').length || 0,
        checkedIn: guests?.filter((g) => g.checked_in).length || 0,
      }

      return NextResponse.json(stats)
    }

    // Return stats for specific event
    const { data: guests, error } = await supabase.from('guests').select('status, checked_in').eq('event_id', eventId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const stats = {
      invitationsSent: guests?.length || 0,
      confirmedGuests: guests?.filter((g) => g.status === 'confirmed').length || 0,
      pendingResponses: guests?.filter((g) => g.status === 'no_response').length || 0,
      checkedIn: guests?.filter((g) => g.checked_in).length || 0,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching event statistics:', error)
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
