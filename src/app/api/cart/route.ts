// Get shopping cart for guest
// Location: src/app/api/cart/route.ts
// Methods: GET, DELETE

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// GET: Fetch guest's cart for specific event
export async function GET(request: NextRequest) {
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

    // Fetch cart items with service details
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select(
        `
        id,
        guest_id,
        event_id,
        service_id,
        quantity,
        unit_price,
        notes,
        added_at,
        updated_at,
        services (
          id,
          name,
          name_ar,
          description,
          price,
          discount_percentage,
          final_price,
          images,
          provider_id,
          providers (
            id,
            business_name,
            business_name_ar
          )
        )
      `
      )
      .eq('guest_id', guestId)
      .eq('event_id', eventId)

    if (cartError) {
      console.error('Error fetching cart items:', cartError)
      const message = String(cartError.message || cartError).toLowerCase()
      if (message.includes('could not find the table') || message.includes('table "cart_items" does not exist')) {
        // Missing migration / table not created yet: return empty cart as fallback.
        return NextResponse.json(
          {
            success: true,
            data: {
              items: [],
              event_id: eventId,
              guest_id: guestId,
              subtotal: 0,
              tax_amount: 0,
              platform_fee: 0,
              discount_amount: 0,
              total: 0,
              item_count: 0,
            },
            warning: 'Cart table not found; cart migration may be missing.',
          },
          { status: 200 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to fetch cart', details: cartError.message || cartError },
        { status: 500 }
      )
    }

    // Calculate totals
    const subtotal = (cartItems || []).reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
    const platformFee = subtotal * 0.05 // 5% platform fee
    const taxAmount = (subtotal + platformFee) * 0.15 // 15% VAT
    const total = subtotal + platformFee + taxAmount

    const cart = {
      items: cartItems || [],
      event_id: eventId,
      guest_id: guestId,
      subtotal,
      tax_amount: taxAmount,
      platform_fee: platformFee,
      discount_amount: 0,
      total,
      item_count: (cartItems || []).length,
    }

    return NextResponse.json({ success: true, data: cart })
  } catch (error) {
    console.error('Cart GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Clear all items from guest's cart
export async function DELETE(request: NextRequest) {
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

    // Delete all cart items for this guest and event
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('guest_id', guestId)
      .eq('event_id', eventId)

    if (deleteError) {
      console.error('Error clearing cart:', deleteError)
      return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Cart cleared' })
  } catch (error) {
    console.error('Cart DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
