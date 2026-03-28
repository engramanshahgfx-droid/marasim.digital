// Shopping cart items management
// Location: src/app/api/cart/items/route.ts
// Methods: POST (add item)

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// POST: Add item to cart
export async function POST(request: NextRequest) {
  try {
    const eventId = request.nextUrl.searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId parameter' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    const guestIdParam = request.nextUrl.searchParams.get('guestId')
    let guestId = guestIdParam || ''

    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: userData, error: authError } = await supabase.auth.getUser(token)
      if (!authError && userData.user) {
        guestId = userData.user.id
      }
    }

    if (!guestId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { service_id, quantity = 1, notes } = body

    if (!service_id || quantity < 1) {
      return NextResponse.json({ error: 'Missing or invalid service_id or quantity' }, { status: 400 })
    }

    // Get service details to validate and get price
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id, price, final_price')
      .eq('id', service_id)
      .single()

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    const unitPrice = service.final_price || service.price

    // Try to upsert cart item (update if exists, insert if not)
    const { data: cartItem, error: upsertError } = await supabase
      .from('cart_items')
      .upsert(
        {
          guest_id: guestId,
          event_id: eventId,
          service_id,
          quantity,
          unit_price: unitPrice,
          notes,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'guest_id,event_id,service_id',
        }
      )
      .select()
      .single()

    if (upsertError) {
      console.error('Error adding to cart:', upsertError)
      return NextResponse.json({ error: 'Failed to add item to cart' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: cartItem, message: 'Item added to cart' }, { status: 201 })
  } catch (error) {
    console.error('Add to cart error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
