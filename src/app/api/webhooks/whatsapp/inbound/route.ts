import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

import { getLatestInvitationForEvent, validateInvitationLinkForEvent } from '@/lib/invitationTemplateCompat'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

function normalizePhone(value: string) {
  const cleaned = value.replace(/^whatsapp:/, '').trim()
  return cleaned.replace(/[^\d+]/g, '')
}

function parseResponseStatus(body: string): 'confirmed' | 'declined' | null {
  const normalized = body.trim().toLowerCase()

  if (['confirm', 'confirmed', 'yes', 'y', 'attending'].includes(normalized)) {
    return 'confirmed'
  }

  if (['decline', 'declined', 'no', 'n', 'not attending'].includes(normalized)) {
    return 'declined'
  }

  return null
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const from = String(formData.get('From') || '')
    const body = String(formData.get('Body') || '')
    const phone = normalizePhone(from)
    const responseStatus = parseResponseStatus(body)

    if (!phone) {
      return new NextResponse('<Response></Response>', {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      })
    }

    let guestData: { id: string; qr_token: string | null; share_link?: string | null } | null = null

    if (responseStatus) {
      const { data: guest } = await supabase
        .from('guests')
        .select('id, qr_token, event_id')
        .eq('phone', phone)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (guest?.id) {
        let shareLink: string | null = null

        if (guest.event_id) {
          const invitation = await getLatestInvitationForEvent(supabase as any, guest.event_id)
          const validatedShareLink = invitation?.shareable_link
            ? await validateInvitationLinkForEvent(supabase as any, guest.event_id, invitation.shareable_link)
            : null
          const validatedById =
            !validatedShareLink && invitation?.id
              ? await validateInvitationLinkForEvent(supabase as any, guest.event_id, invitation.id)
              : null
          shareLink =
            (validatedShareLink && ((validatedShareLink as any).shareable_link || invitation?.shareable_link)) ||
            (validatedById && ((validatedById as any).shareable_link || invitation?.id)) ||
            null
        }

        guestData = {
          id: guest.id,
          qr_token: guest.qr_token,
          share_link: shareLink,
        }

        await supabase
          .from('guests')
          .update({ status: responseStatus, updated_at: new Date().toISOString() })
          .eq('id', guest.id)
      }
    }

    const appBaseUrl = (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin || '').replace(/\/$/, '')
    const qrLink = guestData?.qr_token
      ? `https://quickchart.io/qr?size=320&text=${encodeURIComponent(guestData.qr_token)}`
      : null
    const invitationLink = guestData?.share_link
      ? `${appBaseUrl}/en/invitations/${guestData.share_link}?guestId=${encodeURIComponent(guestData.id)}`
      : null

    const replyMessage =
      responseStatus === 'confirmed'
        ? guestData?.qr_token
          ? invitationLink
            ? `Thanks, your attendance is confirmed. Your check-in code is ${guestData.qr_token}. Open your invitation to display your QR at entry: ${invitationLink}`
            : `Thanks, your attendance is confirmed. Your check-in code is ${guestData.qr_token}.`
          : 'Thanks, your attendance is confirmed.'
        : responseStatus === 'declined'
          ? 'Understood, we have marked you as unable to attend.'
          : 'Reply with Confirm to accept or Decline if you cannot attend.'

    const messageBody = escapeXml(replyMessage)
    const mediaTag = responseStatus === 'confirmed' && qrLink ? `<Media>${escapeXml(qrLink)}</Media>` : ''
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message><Body>${messageBody}</Body>${mediaTag}</Message></Response>`
    return new NextResponse(twiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    })
  } catch (error) {
    console.error('WhatsApp inbound webhook error:', error)
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    })
  }
}
