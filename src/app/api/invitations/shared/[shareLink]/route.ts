// API Route: Get Invitation by Shareable Link
// Location: src/app/api/invitations/shared/[shareLink]/route.ts

import InvitationService from '@/lib/invitationService'
import { personalizeInvitationData } from '@/lib/invitationPersonalization'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: {
    shareLink: string
  }
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { shareLink } = params
    const url = new URL(request.url)
    const guestId = url.searchParams.get('guestId') || url.searchParams.get('guest_id')

    // Get invitation by shareable link
    const invitation = await InvitationService.getInvitationByLink(shareLink)
    let invitationWithPersonalization = invitation

    let qrToken: string | undefined

    if (guestId) {
      const { data: guest } = await supabase
        .from('guests')
        .select('id, event_id, name, email, phone, notes, plus_ones, qr_token')
        .eq('id', guestId)
        .eq('event_id', invitation.event_id)
        .single()

      if (guest) {
        invitationWithPersonalization = {
          ...invitation,
          invitation_data: personalizeInvitationData(invitation.invitation_data, guest),
        }
        qrToken = guest.qr_token ?? undefined
      }
    }

    // Track view
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-client-ip')
    const userAgent = request.headers.get('user-agent') || undefined
    const referrer = request.headers.get('referer') || undefined

    await InvitationService.trackInvitationView(invitation.id, ip || undefined, userAgent, referrer)

    return NextResponse.json({ ...invitationWithPersonalization, qr_token: qrToken ?? null })
  } catch (error) {
    console.error('Error fetching shared invitation:', error)
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
  }
}
