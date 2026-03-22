// API Route: Generate Shareable Link
// Location: src/app/api/invitations/[invitationId]/share/route.ts

import InvitationService from '@/lib/invitationService'
import supabase from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: {
    invitationId: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Generate shareable link
    const shareLink = await InvitationService.generateShareableLink(invitationId)

    // Get base URL from request
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
    const baseUrl = `${protocol}://${host}`

    return NextResponse.json({
      shareable_link: shareLink,
      shareable_url: `${baseUrl}/en/invitations/${shareLink}`,
      success: true,
    })
  } catch (error) {
    console.error('Error generating shareable link:', error)
    return NextResponse.json({ error: 'Failed to generate shareable link' }, { status: 500 })
  }
}
