import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface ReminderConfig {
  eventId: string
  reminderType: 'initial' | 'reminder_1_week' | 'reminder_1_day' | 'reminder_1_hour'
  templateSubject?: string
  templateBody?: string
}

/**
 * Send reminders to guests who haven't responded
 * Used by cron job to periodically send reminders
 */
export async function sendPendingReminders(reminderType: string = 'initial') {
  try {
    const now = new Date()
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)

    // Get events that need reminders based on type
    let eventFilter = null
    if (reminderType === 'reminder_1_week') {
      eventFilter = {
        event_date: {
          gte: new Date().toISOString(),
          lte: oneWeekFromNow.toISOString(),
        },
      }
    } else if (reminderType === 'reminder_1_day') {
      eventFilter = {
        event_date: {
          gte: new Date().toISOString(),
          lte: oneDayFromNow.toISOString(),
        },
      }
    } else if (reminderType === 'reminder_1_hour') {
      eventFilter = {
        event_date: {
          gte: new Date().toISOString(),
          lte: oneHourFromNow.toISOString(),
        },
      }
    }

    // Fetch events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, event_name, event_date, invitation_templates(template_name)')
      .eq('reminder_enabled', true)
      .gte('event_date', now.toISOString())
      .limit(100)

    if (eventsError) throw eventsError
    if (!events || events.length === 0) {
      return {
        success: true,
        message: 'No events requiring reminders',
        remindersCount: 0,
      }
    }

    let totalReminders = 0

    // For each event, send reminders to guests with no_response status
    for (const event of events) {
      const { data: guests, error: guestsError } = await supabase
        .from('guests')
        .select('id, email, name, phone, status')
        .eq('event_id', event.id)
        .eq('status', 'no_response')

      if (guestsError) {
        console.error(`Error fetching guests for event ${event.id}:`, guestsError)
        continue
      }

      if (!guests || guests.length === 0) continue

      // Send reminders to each guest
      for (const guest of guests) {
        // Check if reminder was already sent
        const { data: previousReminder } = await supabase
          .from('messages')
          .select('id')
          .eq('guest_id', guest.id)
          .eq('event_id', event.id)
          .eq('message_type', `reminder_${reminderType}`)
          .single()

        if (previousReminder) {
          // Reminder already sent, skip
          continue
        }

        // Send email reminder via Resend
        try {
          const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/reminders/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              guestId: guest.id,
              eventId: event.id,
              eventName: event.event_name,
              guestName: guest.name,
              guestEmail: guest.email,
              reminderType,
            }),
          })

          if (emailResponse.ok) {
            totalReminders++

            // Log the reminder in messages table
            await supabase.from('messages').insert({
              guest_id: guest.id,
              event_id: event.id,
              message_type: `reminder_${reminderType}`,
              channel: 'email',
              status: 'sent',
              content: {
                subject: `Reminder: ${event.event_name}`,
                template: reminderType,
              },
              sent_at: new Date().toISOString(),
            })
          }
        } catch (error) {
          console.error(`Failed to send reminder to guest ${guest.id}:`, error)
        }
      }
    }

    return {
      success: true,
      message: `Sent ${totalReminders} reminders`,
      remindersCount: totalReminders,
    }
  } catch (error) {
    console.error('Error in sendPendingReminders:', error)
    throw error
  }
}

/**
 * Get reminder statistics for an event
 */
export async function getReminderStats(eventId: string) {
  try {
    const { data: reminders, error } = await supabase
      .from('messages')
      .select('message_type, status')
      .eq('event_id', eventId)
      .ilike('message_type', 'reminder_%')

    if (error) throw error

    return {
      totalSent: reminders?.length || 0,
      byType: {
        initial: reminders?.filter((r) => r.message_type === 'initial').length || 0,
        oneWeek: reminders?.filter((r) => r.message_type === 'reminder_1_week').length || 0,
        oneDay: reminders?.filter((r) => r.message_type === 'reminder_1_day').length || 0,
        oneHour: reminders?.filter((r) => r.message_type === 'reminder_1_hour').length || 0,
      },
    }
  } catch (error) {
    console.error('Error getting reminder stats:', error)
    throw error
  }
}

/**
 * Enable/disable reminders for an event
 */
export async function toggleEventReminders(eventId: string, enabled: boolean) {
  try {
    const { error } = await supabase.from('events').update({ reminder_enabled: enabled }).eq('id', eventId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error updating reminder settings:', error)
    throw error
  }
}

/**
 * Generate reminder email templates
 */
export function getReminderTemplate(reminderType: string, guestName: string, eventName: string) {
  const templates: Record<string, { subject: string; body: string }> = {
    initial: {
      subject: `You're Invited: ${eventName}`,
      body: `
Hi ${guestName},

We're excited to have you at our event!

Event: ${eventName}

Please confirm your attendance by clicking the link below:
[Confirmation Link]

We hope to see you there!

Best regards,
Event Team
      `,
    },
    reminder_1_week: {
      subject: `Reminder: ${eventName} is next week`,
      body: `
Hi ${guestName},

Just a friendly reminder that ${eventName} is coming up next week!

We'd love to have you attend. If you haven't already, please confirm your attendance:
[Confirmation Link]

Looking forward to seeing you!

Best regards,
Event Team
      `,
    },
    reminder_1_day: {
      subject: `Reminder: ${eventName} is tomorrow`,
      body: `
Hi ${guestName},

${eventName} is tomorrow! We hope you're ready for a great event.

If you haven't confirmed yet, please do so now:
[Confirmation Link]

See you soon!

Best regards,
Event Team
      `,
    },
    reminder_1_hour: {
      subject: `Happening now: ${eventName}`,
      body: `
Hi ${guestName},

${eventName} is happening right now! 

We hope you can make it. Join us!

Best regards,
Event Team
      `,
    },
  }

  return templates[reminderType] || templates.initial
}
