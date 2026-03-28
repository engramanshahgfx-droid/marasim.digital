import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * POST /api/reminders/send-email
 * Send a reminder email to a guest
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader || authHeader !== `Bearer ${process.env.REMINDERS_SECRET_KEY}`) {
      // Allow internal calls and cron jobs
      const origin = request.headers.get('origin')
      if (origin !== process.env.NEXT_PUBLIC_APP_URL && !authHeader?.includes('cron')) {
        // For testing, allow any internal call
        if (!process.env.NODE_ENV?.includes('development')) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
      }
    }

    const { guestId, eventId, eventName, guestName, guestEmail, reminderType } = await request.json()

    if (!guestEmail || !eventName || !reminderType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate reminder template
    const templates: Record<string, { subject: string; body: string }> = {
      initial: {
        subject: `You're Invited: ${eventName}`,
        body: `
<h2>You're Invited!</h2>
<p>Hi ${guestName || 'Guest'},</p>
<p>We're excited to have you at our event: <strong>${eventName}</strong></p>
<p>Please confirm your attendance at your earliest convenience.</p>
<p><a href="${process.env.NEXT_PUBLIC_APP_URL}/app/invitations?guestId=${guestId}" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Confirm Attendance</a></p>
<p>Best regards,<br/>Event Team</p>
        `,
      },
      reminder_1_week: {
        subject: `Reminder: ${eventName} is next week`,
        body: `
<h2>Event Reminder</h2>
<p>Hi ${guestName || 'Guest'},</p>
<p>Just a friendly reminder that <strong>${eventName}</strong> is coming up next week!</p>
<p>We'd love to have you attend. If you haven't already, please confirm your attendance:</p>
<p><a href="${process.env.NEXT_PUBLIC_APP_URL}/app/invitations?guestId=${guestId}" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Confirm Now</a></p>
<p>Looking forward to seeing you!</p>
<p>Best regards,<br/>Event Team</p>
        `,
      },
      reminder_1_day: {
        subject: `Reminder: ${eventName} is tomorrow`,
        body: `
<h2>Event Tomorrow!</h2>
<p>Hi ${guestName || 'Guest'},</p>
<p><strong>${eventName}</strong> is happening tomorrow!</p>
<p>If you haven't confirmed yet, please do so now:</p>
<p><a href="${process.env.NEXT_PUBLIC_APP_URL}/app/invitations?guestId=${guestId}" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Confirm Now</a></p>
<p>See you soon!</p>
<p>Best regards,<br/>Event Team</p>
        `,
      },
      reminder_1_hour: {
        subject: `Happening now: ${eventName}`,
        body: `
<h2>Event Happening Now!</h2>
<p>Hi ${guestName || 'Guest'},</p>
<p><strong>${eventName}</strong> is happening right now!</p>
<p>We hope you can make it. Join us!</p>
<p><a href="${process.env.NEXT_PUBLIC_APP_URL}/app/invitations?guestId=${guestId}" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Open Invitation</a></p>
<p>Best regards,<br/>Event Team</p>
        `,
      },
    }

    const template = templates[reminderType] || templates.initial

    // Send email via Resend
    const emailResult = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@invitationmanagement.com',
      to: guestEmail,
      subject: template.subject,
      html: template.body,
    })

    if (!emailResult.id) {
      throw new Error('Failed to send email')
    }

    // Update guest if guestId provided
    if (guestId && eventId) {
      await supabase.from('messages').insert({
        guest_id: guestId,
        event_id: eventId,
        message_type: `reminder_${reminderType}`,
        channel: 'email',
        status: 'sent',
        content: {
          subject: template.subject,
          resendId: emailResult.id,
        },
        sent_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Reminder sent successfully',
      emailId: emailResult.id,
    })
  } catch (error) {
    console.error('Error sending reminder email:', error)
    return NextResponse.json(
      {
        error: 'Failed to send reminder',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
