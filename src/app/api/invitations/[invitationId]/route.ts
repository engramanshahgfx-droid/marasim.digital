// API Route: Get/Update/Delete Invitation
// Location: src/app/api/invitations/[invitationId]/route.ts

import InvitationService from '@/lib/invitationService'
import supabase from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: {
    invitationId: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { invitationId } = params

    // Get invitation (no auth required for public view if shared link)
    const invitation = await InvitationService.getInvitation(invitationId)

    // Track view
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-client-ip')
    const userAgent = request.headers.get('user-agent') || undefined
    const referrer = request.headers.get('referer') || undefined

    await InvitationService.trackInvitationView(invitationId, ip || undefined, userAgent, referrer)

    return NextResponse.json(invitation)
  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json({ error: 'Failed to fetch invitation' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { invitationId } = params

    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check authorization
    const { data: invitationData, error: fetchError } = await (supabase.from('invitation_templates') as any)
      .select('created_by')
      .eq('id', invitationId)
      .single()

    if (fetchError || !invitationData || invitationData.created_by !== userData.user.id) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { customization, invitation_data } = body

    let updated

    if (customization) {
      updated = await InvitationService.updateInvitationCustomization(invitationId, customization)
    }

    if (invitation_data) {
      updated = await InvitationService.updateInvitationData(invitationId, invitation_data)
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating invitation:', error)
    return NextResponse.json({ error: 'Failed to update invitation' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { invitationId } = params

    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check authorization
    const { data: invitationData, error: fetchError } = await (supabase.from('invitation_templates') as any)
      .select('created_by')
      .eq('id', invitationId)
      .single()

    if (fetchError || !invitationData || invitationData.created_by !== userData.user.id) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Delete invitation
    await InvitationService.deleteInvitation(invitationId)

    return NextResponse.json({ message: 'Invitation deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting invitation:', error)
    return NextResponse.json({ error: 'Failed to delete invitation' }, { status: 500 })
  }
}
