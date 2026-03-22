// API Route: Create Invitation
// Location: src/app/api/invitations/create/route.ts

import InvitationService from '@/lib/invitationService'
import { createClient } from '@supabase/supabase-js'
import { InvitationData, TemplateStyle } from '@/types/invitations'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

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
    }: {
      event_id: string
      template_id: TemplateStyle
      invitation_data: InvitationData
      customization?: any
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

    // Create invitation using service
    const invitation = await InvitationService.createInvitation(
      event_id,
      template_id,
      { ...invitation_data, template_id },
      customization,
      user.id
    )

    return NextResponse.json(invitation, { status: 201 })
  } catch (error) {
    console.error('Error creating invitation:', error)
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
  }
}
