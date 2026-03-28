import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

function toCsv(rows: string[][]) {
  return rows.map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: events } = await supabase
      .from('events')
      .select('id, name, date, venue, status')
      .eq('user_id', user.id)
    const eventIds = (events || []).map((event: any) => event.id)
    const { data: guests } = eventIds.length
      ? await supabase.from('guests').select('id, event_id, name, status, checked_in').in('event_id', eventIds)
      : { data: [] as any[] }
    const { data: invitations } = eventIds.length
      ? await supabase.from('invitation_templates').select('id, event_id, view_count').in('event_id', eventIds)
      : { data: [] as any[] }
    const templateIds = (invitations || []).map((invitation: any) => invitation.id)
    const { data: views } = templateIds.length
      ? await supabase
          .from('invitation_views')
          .select('invitation_template_id, viewed_at, metadata')
          .in('invitation_template_id', templateIds)
      : { data: [] as any[] }

    const templateToEvent = new Map((invitations || []).map((invitation: any) => [invitation.id, invitation.event_id]))
    const guestById = new Map((guests || []).map((guest: any) => [guest.id, guest]))
    const eventById = new Map((events || []).map((event: any) => [event.id, event]))

    const rows: string[][] = [
      [
        'Event',
        'Date',
        'Venue',
        'Status',
        'Guests',
        'Confirmed',
        'Declined',
        'Pending',
        'Checked In',
        'Total Opens',
        'Unique Guest Opens',
        'Open Rate %',
      ],
    ]

    for (const event of events || []) {
      const eventGuests = (guests || []).filter((guest: any) => guest.event_id === (event as any).id)
      const eventInvitations = (invitations || []).filter(
        (invitation: any) => invitation.event_id === (event as any).id
      )
      const totalOpens = eventInvitations.reduce(
        (sum: number, invitation: any) => sum + (invitation.view_count || 0),
        0
      )
      const uniqueGuestOpens = new Set(
        (views || [])
          .filter((view: any) => templateToEvent.get(view.invitation_template_id) === (event as any).id)
          .map((view: any) => view.metadata?.guest_id)
          .filter(Boolean)
      ).size

      rows.push([
        (event as any).name,
        (event as any).date,
        (event as any).venue,
        (event as any).status,
        String(eventGuests.length),
        String(eventGuests.filter((guest: any) => guest.status === 'confirmed').length),
        String(eventGuests.filter((guest: any) => guest.status === 'declined').length),
        String(eventGuests.filter((guest: any) => guest.status === 'no_response').length),
        String(eventGuests.filter((guest: any) => guest.checked_in).length),
        String(totalOpens),
        String(uniqueGuestOpens),
        String(eventGuests.length > 0 ? Math.round((uniqueGuestOpens / eventGuests.length) * 100) : 0),
      ])
    }

    rows.push([])
    rows.push(['Recent Guest Opens'])
    rows.push(['Event', 'Guest', 'Viewed At', 'Email'])

    for (const view of (views || []).slice(0, 25)) {
      const guestId = (view as any).metadata?.guest_id
      const eventId = templateToEvent.get((view as any).invitation_template_id)
      const guest = guestId ? guestById.get(guestId) : null
      const event = eventId ? eventById.get(eventId) : null
      if (!guest || !event) continue
      rows.push([(event as any).name, (guest as any).name, (view as any).viewed_at, (guest as any).email || ''])
    }

    return new NextResponse(toCsv(rows), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="dashboard-report.csv"',
      },
    })
  } catch (error) {
    console.error('Export dashboard report error:', error)
    return NextResponse.json({ error: 'Failed to export dashboard report' }, { status: 500 })
  }
}
