// Checkout status endpoint
// Location: src/app/api/checkout/status/route.ts
// Methods: GET

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get('orderId')
    const paymentIntentId = request.nextUrl.searchParams.get('paymentIntentId')

    if (!orderId && !paymentIntentId) {
      return NextResponse.json({ error: 'Missing orderId or paymentIntentId' }, { status: 400 })
    }

    // Get authenticated user
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: authError } = await supabase.auth.getUser(token)

    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = userData.user.id

    // Get bulk order details
    let query = supabase.from('bulk_orders').select('*').eq('customer_id', userId)

    if (orderId) {
      query = query.eq('id', orderId)
    } else if (paymentIntentId) {
      query = query.eq('stripe_payment_intent_id', paymentIntentId)
    }

    const { data: order, error: orderError } = await query.single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Get associated bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('bulk_order_id', order.id)

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        bookings: bookings || [],
        items_count: (bookings || []).length,
      },
    })
  } catch (error) {
    console.error('Checkout status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
