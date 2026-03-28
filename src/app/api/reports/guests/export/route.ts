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

    const eventId = request.nextUrl.searchParams.get('eventId')
    const { data: events } = await supabase.from('events').select('id, name').eq('user_id', user.id)
    const allowedEventIds = (events || []).map((event: any) => event.id)
    const targetEventIds = eventId ? allowedEventIds.filter((id) => id === eventId) : allowedEventIds

    const eventNameById = new Map((events || []).map((event: any) => [event.id, event.name]))
    const { data: guests } = targetEventIds.length
      ? await supabase
          .from('guests')
          .select('id, event_id, name, email, phone, status, plus_ones, checked_in, checked_in_at, created_at')
          .in('event_id', targetEventIds)
          .order('created_at', { ascending: false })
      : { data: [] as any[] }

    const rows: string[][] = [
      [
        'Event',
        'Guest Name',
        'Email',
        'Phone',
        'RSVP Status',
        'Plus Ones',
        'Checked In',
        'Checked In At',
        'Created At',
      ],
    ]

    for (const guest of guests || []) {
      rows.push([
        eventNameById.get((guest as any).event_id) || '',
        (guest as any).name,
        (guest as any).email || '',
        (guest as any).phone || '',
        (guest as any).status || '',
        String((guest as any).plus_ones || 0),
        (guest as any).checked_in ? 'Yes' : 'No',
        (guest as any).checked_in_at || '',
        (guest as any).created_at || '',
      ])
    }

    return new NextResponse(toCsv(rows), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="guest-list.csv"',
      },
    })
  } catch (error) {
    console.error('Export guests report error:', error)
    return NextResponse.json({ error: 'Failed to export guest report' }, { status: 500 })
  }
}
