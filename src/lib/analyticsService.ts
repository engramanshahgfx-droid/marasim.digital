import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface GuestAnalytics {
  total_invited: number
  confirmed: number
  declined: number
  no_response: number
  opened: number
  open_rate: number
  rsvp_rate: number
  average_response_time?: number
}

export interface EventAnalytics extends GuestAnalytics {
  event_id: string
  event_name: string
  top_guests?: Array<{
    id: string
    name: string
    email: string
    status: string
    opened_at?: string
    confirmed_at?: string
  }>
}

/**
 * Get comprehensive analytics for an event
 */
export async function getEventAnalytics(eventId: string): Promise<EventAnalytics | null> {
  try {
    // Get event info
    const { data: event } = await supabase
      .from('events')
      .select('id, event_name, event_date')
      .eq('id', eventId)
      .single()

    if (!event) return null

    // Get guest counts by status
    const { data: guests } = await supabase
      .from('guests')
      .select('id, status, email, phone, created_at, updated_at')
      .eq('event_id', eventId)

    if (!guests) {
      return {
        event_id: eventId,
        event_name: event.event_name,
        total_invited: 0,
        confirmed: 0,
        declined: 0,
        no_response: 0,
        opened: 0,
        open_rate: 0,
        rsvp_rate: 0,
      }
    }

    // Get view analytics
    const { data: views } = await supabase
      .from('invitation_views')
      .select('guest_id, viewed_at')
      .eq('event_id', eventId)

    // Calculate metrics
    const total = guests.length
    const confirmed = guests.filter((g) => g.status === 'confirmed').length
    const declined = guests.filter((g) => g.status === 'declined').length
    const noResponse = guests.filter((g) => g.status === 'no_response').length
    const opened = views?.length || 0
    const openRate = total > 0 ? Math.round((opened / total) * 100) : 0
    const rsvpResponses = confirmed + declined
    const rsvpRate = total > 0 ? Math.round((rsvpResponses / total) * 100) : 0

    // Calculate average response time
    let avgResponseTime: number | undefined
    const responseTimes = guests
      .filter((g) => g.status !== 'no_response' && g.created_at && g.updated_at)
      .map((g) => {
        const created = new Date(g.created_at).getTime()
        const updated = new Date(g.updated_at).getTime()
        return updated - created
      })

    if (responseTimes.length > 0) {
      avgResponseTime = Math.round(
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / (1000 * 60 * 60 * 24)
      ) // days
    }

    return {
      event_id: eventId,
      event_name: event.event_name,
      total_invited: total,
      confirmed,
      declined,
      no_response: noResponse,
      opened,
      open_rate: openRate,
      rsvp_rate: rsvpRate,
      average_response_time: avgResponseTime,
    }
  } catch (error) {
    console.error('Error calculating event analytics:', error)
    throw error
  }
}

/**
 * Get guest-level analytics for an event
 */
export async function getGuestLevelAnalytics(eventId: string) {
  try {
    const { data: guests } = await supabase
      .from('guests')
      .select('id, name, email, phone, status, created_at, updated_at')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (!guests) return []

    // Get open times for each guest
    const { data: views } = await supabase
      .from('invitation_views')
      .select('guest_id, viewed_at')
      .eq('event_id', eventId)

    // Map guest analytics
    return guests.map((guest) => {
      const guestViews = views?.filter((v) => v.guest_id === guest.id) || []
      const firstOpen = guestViews[0]?.viewed_at
      const openCount = guestViews.length

      return {
        id: guest.id,
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        status: guest.status,
        invited_at: guest.created_at,
        responded_at: guest.updated_at || null,
        opened: openCount > 0,
        open_count: openCount,
        first_opened_at: firstOpen,
        response_time:
          guest.status !== 'no_response' && guest.created_at && guest.updated_at
            ? Math.round(
                (new Date(guest.updated_at).getTime() - new Date(guest.created_at).getTime()) / (1000 * 60 * 60)
              )
            : null, // hours
      }
    })
  } catch (error) {
    console.error('Error fetching guest-level analytics:', error)
    throw error
  }
}

/**
 * Get analytics trends over time
 */
export async function getAnalyticsTrends(eventId: string) {
  try {
    const { data: guests } = await supabase
      .from('guests')
      .select('status, created_at, updated_at')
      .eq('event_id', eventId)

    if (!guests || guests.length === 0) {
      return {
        daily: [],
        by_status: { confirmed: 0, declined: 0, no_response: 0, pending: 0 },
      }
    }

    // Group responses by day
    const dailyStats: Record<string, { date: string; confirmed: number; declined: number }> = {}

    guests.forEach((guest) => {
      if (guest.status !== 'no_response' && guest.updated_at) {
        const date = new Date(guest.updated_at).toISOString().split('T')[0]
        if (!dailyStats[date]) {
          dailyStats[date] = { date, confirmed: 0, declined: 0 }
        }
        if (guest.status === 'confirmed') dailyStats[date].confirmed++
        if (guest.status === 'declined') dailyStats[date].declined++
      }
    })

    const daily = Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date))

    const byStatus = {
      confirmed: guests.filter((g) => g.status === 'confirmed').length,
      declined: guests.filter((g) => g.status === 'declined').length,
      no_response: guests.filter((g) => g.status === 'no_response').length,
      pending: guests.length - guests.filter((g) => g.status !== 'no_response').length,
    }

    return { daily, by_status: byStatus }
  } catch (error) {
    console.error('Error calculating analytics trends:', error)
    throw error
  }
}
