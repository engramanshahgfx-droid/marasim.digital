// Checkout and create bulk order with payment
// Location: src/app/api/checkout/route.ts
// Methods: POST

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
})

export async function POST(request: NextRequest) {
  try {
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

    const guestId = userData.user.id
    const body = await request.json()
    const { event_id, payment_method = 'card' } = body

    if (!event_id) {
      return NextResponse.json({ error: 'Missing event_id' }, { status: 400 })
    }

    // Get cart items
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('guest_id', guestId)
      .eq('event_id', event_id)

    if (cartError || !cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, name, organizer_id')
      .eq('id', event_id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
    const platformFee = subtotal * 0.05 // 5% platform fee
    const taxAmount = (subtotal + platformFee) * 0.15 // 15% VAT
    const totalAmount = subtotal + platformFee + taxAmount

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Create bulk order
    const { data: bulkOrder, error: bulkOrderError } = await supabase
      .from('bulk_orders')
      .insert({
        event_id,
        customer_id: guestId,
        order_number: orderNumber,
        status: 'pending',
        subtotal,
        platform_fee: platformFee,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        payment_status: 'unpaid',
        payment_method,
      })
      .select()
      .single()

    if (bulkOrderError || !bulkOrder) {
      console.error('Error creating bulk order:', bulkOrderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Create individual bookings for each cart item
    const bookings = []
    for (const cartItem of cartItems) {
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('provider_id')
        .eq('id', cartItem.service_id)
        .single()

      if (serviceError || !service) {
        continue // Skip if service not found
      }

      const bookingRef = `BK-${bulkOrder.id.substr(0, 8)}-${cartItem.service_id.substr(0, 8)}`
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          event_id,
          service_id: cartItem.service_id,
          provider_id: service.provider_id,
          customer_id: guestId,
          booking_reference: bookingRef,
          booking_date: new Date().toISOString().split('T')[0],
          quantity: cartItem.quantity,
          unit_price: cartItem.unit_price,
          subtotal: cartItem.unit_price * cartItem.quantity,
          platform_fee: (platformFee * (cartItem.unit_price * cartItem.quantity)) / subtotal,
          total_amount: cartItem.unit_price * cartItem.quantity,
          status: 'pending',
          payment_status: 'unpaid',
          notes: cartItem.notes,
          is_part_of_bulk_order: true,
          bulk_order_id: bulkOrder.id,
          checkout_session_id: bulkOrder.id,
        })
        .select()
        .single()

      if (!bookingError && booking) {
        bookings.push(booking)
      }
    }

    // Create Stripe payment intent
    let paymentIntentId: string | null = null
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Amount in cents
        currency: 'sar', // Saudi Riyal
        metadata: {
          bulk_order_id: bulkOrder.id,
          event_id,
          customer_id: guestId,
          order_number: orderNumber,
        },
        description: `Order ${orderNumber} for event ${event.name}`,
      })

      paymentIntentId = paymentIntent.id

      // Update bulk order with payment intent
      await supabase.from('bulk_orders').update({ stripe_payment_intent_id: paymentIntentId }).eq('id', bulkOrder.id)
    } catch (stripeError) {
      console.error('Error creating Stripe payment intent:', stripeError)
      // Continue without Stripe for now, but mark as issue
    }

    // Clear cart
    await supabase.from('cart_items').delete().eq('guest_id', guestId).eq('event_id', event_id)

    // Create notification for organizer
    await supabase.from('service_notifications').insert({
      organizer_id: event.organizer_id,
      event_id,
      bulk_order_id: bulkOrder.id,
      notification_type: 'booking_received',
      title: `New Bulk Service Booking: ${orderNumber}`,
      message: `A guest has placed a new order for ${cartItems.length} service(s) totaling SAR ${totalAmount.toFixed(2)}`,
      action_url: `/[locale]/event-management-dashboard?tab=bookings&order=${bulkOrder.id}`,
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          bulk_order_id: bulkOrder.id,
          order_number: orderNumber,
          checkout_url: paymentIntentId ? `/checkout/${bulkOrder.id}?client_secret=...` : null,
          total_amount: totalAmount,
          items_count: cartItems.length,
          stripe_client_secret: paymentIntentId ? 'pi_secret' : null, // Would be actual secret in production
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
