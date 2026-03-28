import { ensureInvitationLinkForEvent } from '@/lib/invitationTemplateCompat'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')
const resendApiKey = process.env.RESEND_API_KEY
const resendFromEmail = process.env.RESEND_FROM_EMAIL
const resend = resendApiKey ? new Resend(resendApiKey) : null

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!resend || !resendFromEmail) {
      return NextResponse.json(
        { error: 'Email provider is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.' },
        { status: 500 }
      )
    }

    const { eventId, invitationId, guestIds } = await request.json()
    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 })
    }

    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('id, user_id, name, date, time, venue, description')
      .eq('id', eventId)
      .eq('user_id', user.id)
      .single()

    if (eventError || !eventData) {
      return NextResponse.json({ error: 'Event not found or access denied' }, { status: 404 })
    }

    const { shareLink } = await ensureInvitationLinkForEvent(supabase as any, eventData as any, user.id)

    let guestQuery = supabase.from('guests').select('id, name, email').eq('event_id', eventId).not('email', 'is', null)
    if (Array.isArray(guestIds) && guestIds.length > 0) {
      guestQuery = guestQuery.in('id', guestIds)
    }

    const { data: guests, error: guestsError } = await guestQuery
    if (guestsError) {
      return NextResponse.json({ error: 'Failed to fetch guests' }, { status: 500 })
    }

    const appBaseUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
    const eventDate = eventData.date ? new Date(eventData.date).toLocaleDateString('en-US') : 'TBD'

    let sent = 0
    let failed = 0
    const errors: Array<{ guestId: string; email: string; error: string }> = []
    const messageRecords: any[] = []

    for (const guest of guests || []) {
      const email = (guest as any).email as string
      const guestName = (guest as any).name || 'Guest'
      const invitationUrl = `${appBaseUrl}/en/invitations/${shareLink}?guestId=${encodeURIComponent((guest as any).id)}`

      try {
        const result = await resend.emails.send({
          from: resendFromEmail,
          to: [email],
          subject: `You're invited: ${eventData.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
              <h2 style="margin-bottom: 8px;">Hello ${guestName},</h2>
              <p>You are invited to <strong>${eventData.name}</strong>.</p>
              <p>Date: ${eventDate}</p>
              <p>Payment method: <strong>Direct bank transfer only</strong>. Open your invitation to view bank details and upload payment proof (image/PDF).</p>
              <p style="margin: 16px 0;">
                <a href="${invitationUrl}" style="display: inline-block; padding: 10px 16px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px;">Open Your Invitation</a>
              </p>
              <p>If the button does not work, copy and paste this link:<br/>${invitationUrl}</p>
            </div>
          `,
          text: `Hello ${guestName}, you are invited to ${eventData.name} on ${eventDate}. Payment method is direct bank transfer only. Open your invitation to view bank details and upload payment proof: ${invitationUrl}`,
        })

        const status = (result as any)?.error ? 'failed' : 'sent'
        if (status === 'sent') {
          sent += 1
        } else {
          failed += 1
          errors.push({ guestId: (guest as any).id, email, error: String((result as any)?.error) })
        }

        messageRecords.push({
          guest_id: (guest as any).id,
          event_id: eventId,
          message_type: 'invitation',
          status,
          sent_at: new Date().toISOString(),
          delivered_at: null,
          error_message: status === 'failed' ? String((result as any)?.error || 'Email send failed') : null,
        })
      } catch (error) {
        failed += 1
        errors.push({
          guestId: (guest as any).id,
          email,
          error: error instanceof Error ? error.message : 'Unknown error',
        })

        messageRecords.push({
          guest_id: (guest as any).id,
          event_id: eventId,
          message_type: 'invitation',
          status: 'failed',
          sent_at: new Date().toISOString(),
          delivered_at: null,
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    if (messageRecords.length > 0) {
      await supabase.from('messages').insert(messageRecords)
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      processed: (guests || []).length,
      errors,
    })
  } catch (error) {
    console.error('Send invitation email error:', error)
    return NextResponse.json({ error: 'Failed to send invitation emails' }, { status: 500 })
  }
}
