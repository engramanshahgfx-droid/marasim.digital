// API Route: Get Event Invitations
// Location: src/app/api/invitations/event/[eventId]/route.ts

import InvitationService from '@/lib/invitationService'
import supabase from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: {
    eventId: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId } = params

    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to this event
    const { data: eventData, error: eventError } = await (supabase.from('events') as any)
      .select('id')
      .eq('id', eventId)
      .eq('user_id', userData.user.id)
      .single()

    if (eventError || !eventData) {
      return NextResponse.json({ error: 'Event not found or access denied' }, { status: 403 })
    }

    // Get event invitations
    const invitations = await InvitationService.getEventInvitations(eventId)

    return NextResponse.json({
      invitations,
      count: invitations.length,
    })
  } catch (error) {
    console.error('Error fetching event invitations:', error)
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 })
  }
}
