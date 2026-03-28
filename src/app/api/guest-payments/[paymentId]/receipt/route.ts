import { validateInvitationLinkForEvent } from '@/lib/invitationTemplateCompat'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

async function hasOwnerAccess(request: NextRequest, eventId: string) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false

  const token = authHeader.replace('Bearer ', '')
  const {
    data: { user },
  } = await supabase.auth.getUser(token)

  if (!user) return false

  const { data: event } = await supabase.from('events').select('id, user_id').eq('id', eventId).maybeSingle()

  return Boolean(event && event.user_id === user.id)
}

async function hasGuestAccess(request: NextRequest, eventId: string, guestId: string) {
  const shareLink = request.nextUrl.searchParams.get('shareLink')
  if (!shareLink) return false

  const invitation = await validateInvitationLinkForEvent(supabase as any, eventId, shareLink)

  if (!invitation) return false

  const { data: guest } = await supabase
    .from('guests')
    .select('id')
    .eq('id', guestId)
    .eq('event_id', eventId)
    .maybeSingle()

  return Boolean(guest)
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ paymentId: string }> }) {
  try {
    const { paymentId } = await params

    const { data: payment, error } = await supabase
      .from('guest_payments')
      .select(
        'id, event_id, guest_id, amount, payment_date, status, bank_account_holder, bank_name, bank_account_number, bank_iban, guests(name), events(name)'
      )
      .eq('id', paymentId)
      .maybeSingle()

    if (error || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    const ownerAllowed = await hasOwnerAccess(request, (payment as any).event_id)
    const guestIdParam = request.nextUrl.searchParams.get('guestId') || ''
    const guestAllowed = guestIdParam ? await hasGuestAccess(request, (payment as any).event_id, guestIdParam) : false

    if (!ownerAllowed && (!guestAllowed || guestIdParam !== (payment as any).guest_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const doc = await PDFDocument.create()
    const page = doc.addPage([595.28, 841.89])
    const titleFont = await doc.embedFont(StandardFonts.HelveticaBold)
    const bodyFont = await doc.embedFont(StandardFonts.Helvetica)

    const eventName = (payment as any).events?.name || 'Event'
    const guestName = (payment as any).guests?.name || 'Guest'

    page.drawText('Bank Transfer Receipt', {
      x: 72,
      y: 770,
      size: 24,
      font: titleFont,
      color: rgb(0.11, 0.31, 0.85),
    })

    const lines = [
      `Receipt ID: ${paymentId}`,
      `Event: ${eventName}`,
      `Guest: ${guestName}`,
      `Amount: ${String((payment as any).amount || '')}`,
      `Payment Date: ${String((payment as any).payment_date || '')}`,
      `Status: ${String((payment as any).status || '')}`,
      '',
      'Bank Details:',
      `Account Holder: ${String((payment as any).bank_account_holder || '-')}`,
      `Bank Name: ${String((payment as any).bank_name || '-')}`,
      `Account Number: ${String((payment as any).bank_account_number || '-')}`,
      `IBAN: ${String((payment as any).bank_iban || '-')}`,
    ]

    let y = 730
    for (const line of lines) {
      page.drawText(line, {
        x: 72,
        y,
        size: 12,
        font: bodyFont,
        color: rgb(0.1, 0.1, 0.1),
      })
      y -= 22
    }

    const bytes = await doc.save()

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${paymentId}.pdf"`,
      },
    })
  } catch (routeError) {
    console.error('Receipt generation error:', routeError)
    return NextResponse.json({ error: 'Failed to generate receipt' }, { status: 500 })
  }
}
