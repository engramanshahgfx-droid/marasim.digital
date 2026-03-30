import { ensureInvitationLinkForEvent } from '@/lib/invitationTemplateCompat'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')
const resendApiKey = process.env.RESEND_API_KEY
const resendFromEmail = process.env.RESEND_FROM_EMAIL
const resend = resendApiKey ? new Resend(resendApiKey) : null

async function getOrCreateShareLink(eventId: string, userId: string) {
  const { data: eventData } = await supabase
    .from('events')
    .select('id, name, date, time, venue, description')
    .eq('id', eventId)
    .eq('user_id', userId)
    .single()

  if (!eventData) {
    throw new Error('Event not found or access denied')
  }

  const { shareLink } = await ensureInvitationLinkForEvent(supabase as any, eventData as any, userId)

  return {
    eventData,
    shareLink,
  }
}

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

    const { eventId } = await request.json()
    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 })
    }

    const { eventData, shareLink } = await getOrCreateShareLink(eventId, user.id)

    const { data: guests, error: guestsError } = await supabase
      .from('guests')
      .select('id, name, email, status')
      .eq('event_id', eventId)
      .eq('status', 'no_response')

    if (guestsError) {
      return NextResponse.json({ error: 'Failed to fetch pending guests' }, { status: 500 })
    }

    const isDevelopment = process.env.NODE_ENV !== 'production'
    const envBaseUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
    const appBaseUrl =
      (isDevelopment ? (request.nextUrl.origin || '').replace(/\/$/, '') : '') ||
      envBaseUrl ||
      (request.nextUrl.origin || '').replace(/\/$/, '')
    const eventDate = (eventData as any).date ? new Date((eventData as any).date).toLocaleDateString('en-US') : 'TBD'

    let sent = 0
    let failed = 0
    const messageRows: any[] = []

    for (const guest of guests || []) {
      const invitationUrl = `${appBaseUrl}/en/invitations/${shareLink}?guestId=${encodeURIComponent((guest as any).id)}`
      const email = (guest as any).email as string | null

      if (!email || !resend || !resendFromEmail) {
        failed += 1
        messageRows.push({
          guest_id: (guest as any).id,
          event_id: eventId,
          message_type: 'reminder',
          status: 'failed',
          sent_at: new Date().toISOString(),
          delivered_at: null,
          error_message: 'Missing recipient email or email provider configuration',
        })
        continue
      }

      try {
        const result = await resend.emails.send({
          from: resendFromEmail,
          to: [email],
          subject: `Reminder: RSVP for ${String((eventData as any).name || 'your event')}`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
              <h2 style="margin-bottom: 8px;">Hello ${(guest as any).name || 'Guest'},</h2>
              <p>This is a reminder to RSVP for <strong>${String((eventData as any).name || 'our event')}</strong>.</p>
              <p>Date: ${eventDate}</p>
              <p style="margin: 16px 0;">
                <a href="${invitationUrl}" style="display: inline-block; padding: 10px 16px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px;">Open Invitation and RSVP</a>
              </p>
              <p>If the button does not work, copy and paste this link:<br/>${invitationUrl}</p>
            </div>
          `,
          text: `Reminder: RSVP for ${(eventData as any).name || 'our event'} on ${eventDate}. Open invitation: ${invitationUrl}`,
        })

        const status = (result as any)?.error ? 'failed' : 'sent'
        if (status === 'sent') {
          sent += 1
        } else {
          failed += 1
        }

        messageRows.push({
          guest_id: (guest as any).id,
          event_id: eventId,
          message_type: 'reminder',
          status,
          sent_at: new Date().toISOString(),
          delivered_at: null,
          error_message: status === 'failed' ? String((result as any)?.error || 'Reminder send failed') : null,
        })
      } catch (error) {
        failed += 1
        messageRows.push({
          guest_id: (guest as any).id,
          event_id: eventId,
          message_type: 'reminder',
          status: 'failed',
          sent_at: new Date().toISOString(),
          delivered_at: null,
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    if (messageRows.length > 0) {
      await supabase.from('messages').insert(messageRows)
    }

    return NextResponse.json({
      success: true,
      eventId,
      pendingGuests: (guests || []).length,
      sent,
      failed,
    })
  } catch (error) {
    console.error('Send reminders error:', error)
    return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 })
  }
}
