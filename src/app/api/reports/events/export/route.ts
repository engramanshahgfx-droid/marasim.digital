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
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true })
    const eventIds = (events || []).map((event: any) => event.id)

    const { data: guests } = eventIds.length
      ? await supabase.from('guests').select('event_id, status, checked_in').in('event_id', eventIds)
      : { data: [] as any[] }
    const { data: invitations } = eventIds.length
      ? await supabase.from('invitation_templates').select('event_id, view_count').in('event_id', eventIds)
      : { data: [] as any[] }

    const rows: string[][] = [
      [
        'Event Name',
        'Date',
        'Venue',
        'Status',
        'Guests',
        'Confirmed',
        'Declined',
        'Pending',
        'Checked In',
        'Invitation Opens',
        'Open Rate %',
      ],
    ]

    for (const event of events || []) {
      const eventGuests = (guests || []).filter((guest: any) => guest.event_id === (event as any).id)
      const invitationOpens = (invitations || [])
        .filter((invitation: any) => invitation.event_id === (event as any).id)
        .reduce((sum: number, invitation: any) => sum + (invitation.view_count || 0), 0)

      const guestCount = eventGuests.length
      rows.push([
        (event as any).name,
        (event as any).date,
        (event as any).venue,
        (event as any).status,
        String(guestCount),
        String(eventGuests.filter((guest: any) => guest.status === 'confirmed').length),
        String(eventGuests.filter((guest: any) => guest.status === 'declined').length),
        String(eventGuests.filter((guest: any) => guest.status === 'no_response').length),
        String(eventGuests.filter((guest: any) => guest.checked_in).length),
        String(invitationOpens),
        String(guestCount > 0 ? Math.round((invitationOpens / guestCount) * 100) : 0),
      ])
    }

    return new NextResponse(toCsv(rows), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="event-summary.csv"',
      },
    })
  } catch (error) {
    console.error('Export events report error:', error)
    return NextResponse.json({ error: 'Failed to export event report' }, { status: 500 })
  }
}
