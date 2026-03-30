import { ensureInvitationLinkForEvent } from '@/lib/invitationTemplateCompat'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')
const resendApiKey = process.env.RESEND_API_KEY
const resendFromEmail = process.env.RESEND_FROM_EMAIL
const resend = resendApiKey ? new Resend(resendApiKey) : null

async function ensureShareLinkForEvent(event: any) {
  const { shareLink } = await ensureInvitationLinkForEvent(supabase as any, event, event.user_id)
  return shareLink
}

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET
    const providedSecret = request.headers.get('x-cron-secret')
    const authorizationHeader = request.headers.get('authorization')
    const bearerSecret = authorizationHeader?.startsWith('Bearer ') ? authorizationHeader.replace('Bearer ', '') : null

    if (!cronSecret || (providedSecret !== cronSecret && bearerSecret !== cronSecret)) {
      return NextResponse.json({ error: 'Unauthorized cron invocation' }, { status: 401 })
    }

    if (!resend || !resendFromEmail) {
      return NextResponse.json(
        { error: 'Missing RESEND_API_KEY or RESEND_FROM_EMAIL for reminder cron' },
        { status: 500 }
      )
    }

    const { data: events, error } = await supabase
      .from('events')
      .select('id, user_id, status, name, date, time, venue, description')
      .in('status', ['upcoming', 'ongoing'])

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch events for reminders' }, { status: 500 })
    }

    const isDevelopment = process.env.NODE_ENV !== 'production'
    const envBaseUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
    const appUrl =
      (isDevelopment ? (request.nextUrl.origin || '').replace(/\/$/, '') : '') ||
      envBaseUrl ||
      (request.nextUrl.origin || '').replace(/\/$/, '')
    const results: Array<{ eventId: string; sent: number; failed: number; pendingGuests: number }> = []

    for (const event of events || []) {
      let sent = 0
      let failed = 0

      try {
        const shareLink = await ensureShareLinkForEvent(event)
        const eventDate = (event as any).date ? new Date((event as any).date).toLocaleDateString('en-US') : 'TBD'

        const { data: guests } = await supabase
          .from('guests')
          .select('id, name, email')
          .eq('event_id', (event as any).id)
          .eq('status', 'no_response')

        for (const guest of guests || []) {
          const email = (guest as any).email as string | null
          if (!email) {
            failed += 1
            continue
          }

          const invitationUrl = `${appUrl}/en/invitations/${shareLink}?guestId=${encodeURIComponent((guest as any).id)}`

          const result = await resend.emails.send({
            from: resendFromEmail,
            to: [email],
            subject: `Reminder: RSVP for ${(event as any).name}`,
            html: `
              <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
                <h2 style="margin-bottom: 8px;">Hello ${(guest as any).name || 'Guest'},</h2>
                <p>This is a reminder to RSVP for <strong>${(event as any).name}</strong>.</p>
                <p>Date: ${eventDate}</p>
                <p style="margin: 16px 0;">
                  <a href="${invitationUrl}" style="display: inline-block; padding: 10px 16px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px;">Open Invitation and RSVP</a>
                </p>
              </div>
            `,
            text: `Reminder: RSVP for ${(event as any).name} on ${eventDate}. Open invitation: ${invitationUrl}`,
          })

          const status = (result as any)?.error ? 'failed' : 'sent'
          if (status === 'sent') {
            sent += 1
          } else {
            failed += 1
          }

          await supabase.from('messages').insert({
            guest_id: (guest as any).id,
            event_id: (event as any).id,
            message_type: 'reminder',
            status,
            sent_at: new Date().toISOString(),
            delivered_at: null,
            error_message: status === 'failed' ? String((result as any)?.error || 'Reminder send failed') : null,
          })
        }

        results.push({ eventId: (event as any).id, sent, failed, pendingGuests: (guests || []).length })
      } catch {
        results.push({ eventId: (event as any).id, sent, failed: failed + 1, pendingGuests: 0 })
      }
    }

    return NextResponse.json({
      success: true,
      processedEvents: (events || []).length,
      results,
    })
  } catch (error) {
    console.error('Cron reminders error:', error)
    return NextResponse.json({ error: 'Failed to run reminder cron' }, { status: 500 })
  }
}
