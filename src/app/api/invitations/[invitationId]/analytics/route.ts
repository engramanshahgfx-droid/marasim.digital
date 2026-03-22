// API Route: Get Invitation Analytics
// Location: src/app/api/invitations/[invitationId]/analytics/route.ts

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

    // Get analytics
    const analytics = await InvitationService.getInvitationAnalytics(invitationId)

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching invitation analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
