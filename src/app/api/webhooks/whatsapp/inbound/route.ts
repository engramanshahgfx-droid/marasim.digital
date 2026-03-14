import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

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

    let guestData: { id: string; qr_token: string | null } | null = null

    if (responseStatus) {
      const { data: guest } = await supabase
        .from('guests')
        .select('id, qr_token')
        .eq('phone', phone)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (guest?.id) {
        guestData = guest
        await supabase
          .from('guests')
          .update({ status: responseStatus, updated_at: new Date().toISOString() })
          .eq('id', guest.id)
      }
    }

    const qrLink = guestData?.qr_token
      ? `https://quickchart.io/qr?size=320&text=${encodeURIComponent(guestData.qr_token)}`
      : null

    const replyMessage =
      responseStatus === 'confirmed'
        ? guestData?.qr_token
          ? `Thanks, your attendance is confirmed. Your check-in code: ${guestData.qr_token}. Show this QR at entry: ${qrLink}`
          : 'Thanks, your attendance is confirmed.'
        : responseStatus === 'declined'
          ? 'Understood, we have marked you as unable to attend.'
          : 'Reply with Confirm to accept or Decline if you cannot attend.'

    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${replyMessage}</Message></Response>`
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
