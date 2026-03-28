import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

export async function GET(request: NextRequest) {
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

    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, name, date, venue, status')
      .eq('user_id', user.id)
      .order('date', { ascending: true })

    if (eventsError) {
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
    }

    const eventIds = (events || []).map((event: any) => event.id)
    if (eventIds.length === 0) {
      return NextResponse.json({
        metrics: {
          totalEvents: 0,
          totalGuests: 0,
          confirmedGuests: 0,
          declinedGuests: 0,
          pendingGuests: 0,
          checkedInGuests: 0,
          totalInvitationOpens: 0,
          uniqueGuestsOpened: 0,
          guestOpenRate: 0,
        },
        eventPerformance: [],
        recentGuestOpens: [],
      })
    }

    const { data: guests } = await supabase
      .from('guests')
      .select('id, event_id, name, email, phone, status, checked_in, checked_in_at')
      .in('event_id', eventIds)

    const { data: invitationTemplates } = await supabase
      .from('invitation_templates')
      .select('id, event_id, view_count')
      .in('event_id', eventIds)

    const templateIds = (invitationTemplates || []).map((invitation: any) => invitation.id)
    const { data: invitationViews } = templateIds.length
      ? await supabase
          .from('invitation_views')
          .select('invitation_template_id, viewed_at, metadata')
          .in('invitation_template_id', templateIds)
          .order('viewed_at', { ascending: false })
      : { data: [] as any[] }

    const eventById = new Map((events || []).map((event: any) => [event.id, event]))
    const guestById = new Map((guests || []).map((guest: any) => [guest.id, guest]))
    const templateToEvent = new Map(
      (invitationTemplates || []).map((invitation: any) => [invitation.id, invitation.event_id])
    )

    const eventMetrics = new Map<
      string,
      {
        invitationsSent: number
        confirmed: number
        declined: number
        pending: number
        checkedIn: number
        openCount: number
        uniqueGuestOpenIds: Set<string>
      }
    >()

    for (const event of events || []) {
      eventMetrics.set((event as any).id, {
        invitationsSent: 0,
        confirmed: 0,
        declined: 0,
        pending: 0,
        checkedIn: 0,
        openCount: 0,
        uniqueGuestOpenIds: new Set<string>(),
      })
    }

    for (const guest of guests || []) {
      const metrics = eventMetrics.get((guest as any).event_id)
      if (!metrics) continue
      metrics.invitationsSent += 1
      if ((guest as any).status === 'confirmed') metrics.confirmed += 1
      if ((guest as any).status === 'declined') metrics.declined += 1
      if ((guest as any).status === 'no_response') metrics.pending += 1
      if ((guest as any).checked_in) metrics.checkedIn += 1
    }

    for (const invitation of invitationTemplates || []) {
      const metrics = eventMetrics.get((invitation as any).event_id)
      if (!metrics) continue
      metrics.openCount += (invitation as any).view_count || 0
    }

    const recentGuestOpens: Array<{
      guestId: string
      guestName: string
      email: string | null
      phone: string | null
      eventId: string
      eventName: string
      viewedAt: string
    }> = []

    for (const view of invitationViews || []) {
      const metadata = ((view as any).metadata || {}) as Record<string, any>
      const guestId = typeof metadata.guest_id === 'string' ? metadata.guest_id : null
      const eventId = templateToEvent.get((view as any).invitation_template_id)
      if (!guestId || !eventId) continue

      const guest = guestById.get(guestId)
      const event = eventById.get(eventId)
      if (!guest || !event) continue

      eventMetrics.get(eventId)?.uniqueGuestOpenIds.add(guestId)
      recentGuestOpens.push({
        guestId,
        guestName: (guest as any).name,
        email: (guest as any).email || null,
        phone: (guest as any).phone || null,
        eventId,
        eventName: (event as any).name,
        viewedAt: (view as any).viewed_at,
      })
    }

    const eventPerformance = (events || []).map((event: any) => {
      const metrics = eventMetrics.get(event.id)
      const uniqueGuestOpens = metrics?.uniqueGuestOpenIds.size || 0
      return {
        eventId: event.id,
        eventName: event.name,
        date: event.date,
        venue: event.venue,
        status: event.status,
        invitationsSent: metrics?.invitationsSent || 0,
        confirmed: metrics?.confirmed || 0,
        declined: metrics?.declined || 0,
        pending: metrics?.pending || 0,
        checkedIn: metrics?.checkedIn || 0,
        openCount: metrics?.openCount || 0,
        uniqueGuestOpens,
        openRate:
          (metrics?.invitationsSent || 0) > 0
            ? Math.round((uniqueGuestOpens / (metrics?.invitationsSent || 1)) * 100)
            : 0,
        attendanceRate:
          (metrics?.confirmed || 0) > 0 ? Math.round(((metrics?.checkedIn || 0) / (metrics?.confirmed || 1)) * 100) : 0,
      }
    })

    const totals = eventPerformance.reduce(
      (acc, event) => {
        acc.totalEvents += 1
        acc.totalGuests += event.invitationsSent
        acc.confirmedGuests += event.confirmed
        acc.declinedGuests += event.declined
        acc.pendingGuests += event.pending
        acc.checkedInGuests += event.checkedIn
        acc.totalInvitationOpens += event.openCount
        acc.uniqueGuestsOpened += event.uniqueGuestOpens
        return acc
      },
      {
        totalEvents: 0,
        totalGuests: 0,
        confirmedGuests: 0,
        declinedGuests: 0,
        pendingGuests: 0,
        checkedInGuests: 0,
        totalInvitationOpens: 0,
        uniqueGuestsOpened: 0,
      }
    )

    return NextResponse.json({
      metrics: {
        ...totals,
        guestOpenRate: totals.totalGuests > 0 ? Math.round((totals.uniqueGuestsOpened / totals.totalGuests) * 100) : 0,
      },
      eventPerformance,
      recentGuestOpens: recentGuestOpens.slice(0, 15),
    })
  } catch (error) {
    console.error('Dashboard overview report error:', error)
    return NextResponse.json({ error: 'Failed to generate dashboard overview' }, { status: 500 })
  }
}
