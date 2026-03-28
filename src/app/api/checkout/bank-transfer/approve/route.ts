// Approve or reject a marketplace bank transfer payment
// POST /api/checkout/bank-transfer/approve
// Body: { orderId, action: 'approve' | 'reject', note? }
// Accessible by the event organizer (owns the event) or super_admin

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

function makeSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')
}

async function sendWhatsApp(to: string, body: string) {
  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_API_KEY_SECRET)
    const formatted = to.startsWith('+') ? to : to.startsWith('966') ? '+' + to : '+966' + to
    await client.messages.create({
      from: 'whatsapp:' + process.env.TWILIO_PHONE_NUMBER,
      to: 'whatsapp:' + formatted,
      body,
    })
  } catch (err) {
    console.warn('WhatsApp send failed (non-blocking):', err)
  }
}

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

    const reviewerId = userData.user.id

    // Check role
    const { data: reviewerUser } = await supabase.from('users').select('role').eq('id', reviewerId).single()

    const isSuperAdmin = (reviewerUser as any)?.role === 'super_admin'

    const body = await request.json()
    const { orderId, action, note } = body as {
      orderId: string
      action: 'approve' | 'reject'
      note?: string
    }

    if (!orderId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Missing or invalid orderId / action' }, { status: 400 })
    }

    // Load order + event
    const { data: order, error: orderError } = await supabase
      .from('bulk_orders')
      .select(
        `
        id,
        order_number,
        total_amount,
        payment_status,
        customer_id,
        event_id,
        events ( id, name, organizer_id )
      `
      )
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const eventAny = order.events as any
    const organizerId = eventAny?.organizer_id

    // Authorization: must be organizer of the event OR super_admin
    if (!isSuperAdmin && reviewerId !== organizerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json({ error: 'Order already approved' }, { status: 409 })
    }

    const newStatus = action === 'approve' ? 'paid' : 'rejected'
    const orderStatus = action === 'approve' ? 'completed' : 'cancelled'

    // Update bulk_order
    await supabase
      .from('bulk_orders')
      .update({
        payment_status: newStatus,
        status: orderStatus,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        review_note: note || null,
      })
      .eq('id', orderId)

    // Update all bookings in this order
    await supabase
      .from('bookings')
      .update({
        payment_status: action === 'approve' ? 'paid' : 'failed',
        status: orderStatus,
      } as any)
      .eq('bulk_order_id', orderId)

    // Notify customer via WhatsApp
    const { data: customer } = await supabase
      .from('users')
      .select('phone, full_name')
      .eq('id', order.customer_id)
      .single()

    const eventName = eventAny?.name || 'Event'

    if (customer?.phone) {
      const msg =
        action === 'approve'
          ? `✅ *Payment Confirmed!*\n\nYour bank transfer for order ${order.order_number} (${eventName}) has been approved.\nAmount: SAR ${(order.total_amount as number).toFixed(2)}\n\nThank you! Your services are confirmed. 🎉`
          : `❌ *Payment Not Confirmed*\n\nUnfortunately your bank transfer for order ${order.order_number} (${eventName}) could not be verified.\n${note ? 'Reason: ' + note + '\n' : ''}Please contact the event organizer if you believe this is an error.`
      await sendWhatsApp(customer.phone, msg)
    }

    return NextResponse.json({
      success: true,
      action,
      order_number: order.order_number,
      new_status: newStatus,
    })
  } catch (error) {
    console.error('Approve/reject error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
