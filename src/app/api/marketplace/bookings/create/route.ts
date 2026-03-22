// Example API Endpoint: Create Booking
// Location: src/app/api/marketplace/bookings/create/route.ts
// Method: POST

import { MarketplaceService } from '@/lib/marketplaceService'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '')
    const { data, error: verifyError } = await supabase.auth.getUser(token)

    if (verifyError || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = data.user

    const body = await request.json()

    // Validate required fields
    const { event_id, service_id, booking_date, quantity = 1, notes, customer_notes } = body

    if (!event_id || !service_id || !booking_date) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'event_id, service_id, and booking_date are required',
        },
        { status: 400 }
      )
    }

    if (quantity < 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid quantity',
          message: 'Quantity must be at least 1',
        },
        { status: 400 }
      )
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(booking_date)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid date format',
          message: 'Date must be in YYYY-MM-DD format',
        },
        { status: 400 }
      )
    }

    // Create booking
    const booking = await MarketplaceService.createBooking(user.id, {
      event_id,
      service_id,
      booking_date,
      quantity,
      notes,
      customer_notes,
      event_date: body.event_date,
      start_time: body.start_time,
      end_time: body.end_time,
    })

    return NextResponse.json(
      {
        success: true,
        data: booking,
        message: 'Booking created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create booking error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create booking',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
