// Marketplace checkout via bank transfer
// POST /api/checkout/bank-transfer
// Creates a bulk order (without Stripe) and returns bank details + reference code.
// GET  /api/checkout/bank-transfer?orderId=xxx
// Returns existing bulk order details + bank details for the order page.

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

function makeSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')
}

async function getBankDetails(supabase: ReturnType<typeof makeSupabase>) {
  try {
    const { data } = await supabase.from('bank_accounts').select('*').eq('is_active', true).single()
    if (data) return data
  } catch {
    // fall through to env vars
  }
  return {
    account_holder: process.env.BANK_HOLDER_NAME || 'Account Holder',
    bank_name: process.env.BANK_NAME || 'Al Rajhi Bank',
    account_number: process.env.BANK_ACCOUNT_NUMBER || '',
    iban: process.env.BANK_IBAN || '',
    branch_code: process.env.BANK_BRANCH_CODE || '',
    branch_name: process.env.BANK_BRANCH_NAME || '',
    currency: 'SAR',
  }
}

// GET — fetch an existing order + bank details (for the checkout page on reload)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('orderId')
  if (!orderId) {
    return NextResponse.json({ error: 'orderId required' }, { status: 400 })
  }

  const supabase = makeSupabase()

  const { data: order, error } = await supabase
    .from('bulk_orders')
    .select('id, order_number, total_amount, payment_status, bank_reference_code, proof_image_url, event_id')
    .eq('id', orderId)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const bankDetails = await getBankDetails(supabase)

  return NextResponse.json({ success: true, order, bankDetails })
}

// POST — convert cart to bulk order using bank transfer
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = makeSupabase()

    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: authError } = await supabase.auth.getUser(token)
    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customerId = userData.user.id
    const body = await request.json()
    const { event_id, guest_notes } = body

    if (!event_id) {
      return NextResponse.json({ error: 'Missing event_id' }, { status: 400 })
    }

    // Get cart items
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('guest_id', customerId)
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

    // Calculate totals (same as Stripe checkout)
    const subtotal = cartItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
    const platformFee = subtotal * 0.05
    const taxAmount = (subtotal + platformFee) * 0.15
    const totalAmount = subtotal + platformFee + taxAmount

    const orderNumber = `ORD-BT-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
    const referenceCode = `REF-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`

    // Create bulk order
    const { data: bulkOrder, error: bulkOrderError } = await supabase
      .from('bulk_orders')
      .insert({
        event_id,
        customer_id: customerId,
        order_number: orderNumber,
        status: 'pending',
        subtotal,
        platform_fee: platformFee,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        payment_status: 'unpaid',
        payment_method: 'bank_transfer',
        bank_reference_code: referenceCode,
        notes: guest_notes || null,
      })
      .select()
      .single()

    if (bulkOrderError || !bulkOrder) {
      console.error('Error creating bulk order:', bulkOrderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Create individual bookings per cart item
    for (const cartItem of cartItems) {
      const { data: service } = await supabase
        .from('services')
        .select('provider_id')
        .eq('id', cartItem.service_id)
        .single()

      if (!service) continue

      const bookingRef = `BK-${bulkOrder.id.substring(0, 8)}-${cartItem.service_id.substring(0, 8)}`
      await supabase.from('bookings').insert({
        event_id,
        service_id: cartItem.service_id,
        provider_id: service.provider_id,
        customer_id: customerId,
        booking_reference: bookingRef,
        booking_date: new Date().toISOString().split('T')[0],
        quantity: cartItem.quantity,
        unit_price: cartItem.unit_price,
        subtotal: cartItem.unit_price * cartItem.quantity,
        platform_fee: platformFee * ((cartItem.unit_price * cartItem.quantity) / subtotal),
        total_amount: cartItem.unit_price * cartItem.quantity,
        status: 'pending',
        payment_status: 'unpaid',
        notes: cartItem.notes,
        is_part_of_bulk_order: true,
        bulk_order_id: bulkOrder.id,
        checkout_session_id: bulkOrder.id,
      })
    }

    // Clear cart
    await supabase.from('cart_items').delete().eq('guest_id', customerId).eq('event_id', event_id)

    const bankDetails = await getBankDetails(supabase)

    return NextResponse.json(
      {
        success: true,
        data: {
          bulk_order_id: bulkOrder.id,
          order_number: orderNumber,
          reference_code: referenceCode,
          total_amount: totalAmount,
          bank_details: bankDetails,
          items_count: cartItems.length,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Bank transfer checkout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
