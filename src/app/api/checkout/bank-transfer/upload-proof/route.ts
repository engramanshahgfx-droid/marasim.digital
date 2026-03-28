// Upload receipt/proof for marketplace bank transfer payment
// POST /api/checkout/bank-transfer/upload-proof
// Body: multipart/form-data  { file, orderId, guestPhone? }
// - Uploads image to Supabase storage
// - Updates bulk_order status to 'pending_verification'
// - Notifies event organizer + admin via WhatsApp

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

function makeSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')
}

function getTwilio() {
  try {
    return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_API_KEY_SECRET)
  } catch {
    return null
  }
}

function formatPhone(phone: string) {
  if (phone.startsWith('+')) return phone
  if (phone.startsWith('966')) return '+' + phone
  if (phone.startsWith('0')) return '+966' + phone.substring(1)
  return '+966' + phone
}

async function sendWhatsApp(to: string | undefined, body: string) {
  if (!to) return
  const client = getTwilio()
  if (!client) return
  try {
    await client.messages.create({
      from: 'whatsapp:' + process.env.TWILIO_PHONE_NUMBER,
      to: 'whatsapp:' + formatPhone(to),
      body,
    })
  } catch (err) {
    console.warn('WhatsApp send failed (non-blocking):', err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const orderId = formData.get('orderId') as string | null
    const guestPhone = formData.get('guestPhone') as string | null

    if (!file || !orderId) {
      return NextResponse.json({ error: 'Missing required fields: file and orderId' }, { status: 400 })
    }

    // Only accept images
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are accepted' }, { status: 400 })
    }

    const supabase = makeSupabase()

    // Load order + event + organizer
    const { data: order, error: orderError } = await supabase
      .from('bulk_orders')
      .select(
        `
        id,
        order_number,
        total_amount,
        bank_reference_code,
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

    if (order.payment_status === 'paid') {
      return NextResponse.json({ error: 'Order already paid' }, { status: 409 })
    }

    // Upload to Supabase storage
    const buffer = await file.arrayBuffer()
    const fileName = `marketplace-receipts/${orderId}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(fileName, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error('Storage upload failed:', uploadError)
      return NextResponse.json({ error: 'Failed to upload receipt: ' + uploadError.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from('payment-proofs').getPublicUrl(fileName)
    const proofUrl = urlData.publicUrl

    // Update bulk_order
    const { error: updateError } = await supabase
      .from('bulk_orders')
      .update({
        proof_image_url: proofUrl,
        payment_status: 'pending_verification',
        proof_submitted_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Failed to update order:', updateError)
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
    }

    // Update bookings inside this order too
    await supabase
      .from('bookings')
      .update({ payment_status: 'pending_verification' } as any)
      .eq('bulk_order_id', orderId)

    const eventAny = order.events as any
    const eventName = eventAny?.name || 'Event'
    const organizerId = eventAny?.organizer_id

    // Notify event organizer via service_notifications table
    if (organizerId) {
      await supabase.from('service_notifications').insert({
        organizer_id: organizerId,
        event_id: order.event_id,
        bulk_order_id: orderId,
        notification_type: 'payment_proof_received',
        title: `Bank Transfer Receipt Received – Order ${order.order_number}`,
        message: `A guest submitted a bank transfer receipt for order ${order.order_number} (SAR ${(order.total_amount as number).toFixed(2)}). Please verify and approve.`,
        action_url: `/event-management-dashboard?tab=bookings&order=${orderId}`,
      })

      // WhatsApp to organizer if they have a phone on file
      const { data: orgUser } = await supabase.from('users').select('phone, full_name').eq('id', organizerId).single()

      if (orgUser?.phone) {
        await sendWhatsApp(
          orgUser.phone,
          `🔔 *New Payment Receipt – ${eventName}*\n\nA guest submitted a bank transfer receipt for order ${order.order_number}.\nAmount: SAR ${(order.total_amount as number).toFixed(2)}\n\n⚡ Please check your dashboard to review and approve.`
        )
      }
    }

    // WhatsApp confirmation back to guest
    if (guestPhone) {
      await sendWhatsApp(
        guestPhone,
        `✅ *Receipt Submitted Successfully*\n\nThank you! Your payment receipt for order ${order.order_number} (${eventName}) has been received.\n\nWe'll notify you once the event organizer confirms your payment.\n\nReference: ${order.bank_reference_code}`
      )
    }

    // Notify super admin
    const adminPhone = process.env.BANK_RECEIPT_WHATSAPP
    if (adminPhone) {
      await sendWhatsApp(
        adminPhone,
        `🔔 *Marketplace Bank Transfer Receipt*\n\nOrder: ${order.order_number}\nEvent: ${eventName}\nAmount: SAR ${(order.total_amount as number).toFixed(2)}\nRef: ${order.bank_reference_code}\n\nPlease review in admin dashboard.`
      )
    }

    return NextResponse.json({
      success: true,
      proofUrl,
      message: 'Receipt submitted. The event organizer will verify your payment.',
    })
  } catch (error) {
    console.error('Upload proof error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
