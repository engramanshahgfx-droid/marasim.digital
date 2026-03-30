import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

// Initialize Twilio for WhatsApp
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

// Upload proof image for bank transfer
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userPhone = formData.get('userPhone') as string
    const planId = formData.get('planId') as string
    const userId = formData.get('userId') as string
    const amount = formData.get('amount') as string

    // Validate required fields
    if (!file || !userId || !planId) {
      return NextResponse.json({ error: 'Missing required fields: file, userId, or planId' }, { status: 400 })
    }

    console.log('Processing bank transfer proof:', {
      fileName: file.name,
      userId,
      planId,
      amount,
    })

    // Get user details
    const { data: userData, error: userError } = await supabase.from('users').select('*').eq('id', userId).single()

    if (userError || !userData) {
      console.error('User not found:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get plan details
    const { data: planData, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !planData) {
      console.error('Plan not found:', planError)
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Upload image to storage
    const buffer = await file.arrayBuffer()
    const fileName = `bank-transfer/${userId}/${Date.now()}-${file.name}`

    console.log('Uploading to storage:', fileName)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload failed:', uploadError)
      return NextResponse.json({ error: 'Failed to upload image: ' + uploadError.message }, { status: 500 })
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage.from('payment-proofs').getPublicUrl(fileName)

    const proofImageUrl = publicUrlData.publicUrl

    console.log('Image uploaded, URL:', proofImageUrl)

    // Create payment record - using only existing columns
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        plan_id: planId,
        amount: parseFloat(amount) || planData.price_monthly,
        currency: 'USD',
        status: 'pending',
        payment_method: 'bank_transfer',
        receipt_url: proofImageUrl, // Store proof URL in receipt_url column
      })
      .select('*')
      .single()

    if (paymentError) {
      console.error('Failed to create payment record:', paymentError)
      return NextResponse.json({ error: 'Failed to save payment: ' + paymentError.message }, { status: 500 })
    }

    console.log('Payment record created:', paymentData.id)

    // Send WhatsApp notification to user
    const formatPhone = (phone: string) => {
      if (!phone.startsWith('+')) {
        if (phone.startsWith('966')) return '+' + phone
        if (phone.startsWith('0')) return '+966' + phone.substring(1)
        return '+966' + phone
      }
      return phone
    }

    if (userPhone) {
      try {
        const receiptMessage = `
✅ *Payment Proof Received*

Thank you for your payment, ${userData.full_name}!

Your bank transfer proof has been successfully submitted.

📋 *Details:*
Plan: ${planData.name}
Amount: $${amount || planData.price_monthly}

⏳ *Next Step:*
Our admin team will verify your bank transfer within 24 hours.
Once confirmed, your account will be automatically upgraded.

Thank you!
        `.trim()

        await twilioClient.messages.create({
          from: 'whatsapp:' + process.env.TWILIO_PHONE_NUMBER,
          to: 'whatsapp:' + formatPhone(userPhone),
          body: receiptMessage,
        })
      } catch (whatsappError) {
        console.warn('WhatsApp notification failed (non-blocking):', whatsappError)
      }
    }

    // Notify admin
    try {
      const adminMessage = `
🔔 *New Bank Transfer Payment Proof*

Customer: ${userData.full_name}
Email: ${userData.email}
Plan: ${planData.name}
Amount: $${amount || planData.price_monthly}

📋 Action Required: Check your bank account and approve in admin dashboard if payment is confirmed.
      `.trim()

      await twilioClient.messages.create({
        from: 'whatsapp:' + process.env.TWILIO_PHONE_NUMBER,
        to: 'whatsapp:' + process.env.BANK_RECEIPT_WHATSAPP,
        body: adminMessage,
      })
    } catch (adminError) {
      console.warn('Admin notification failed:', adminError)
    }

    return NextResponse.json({
      success: true,
      paymentId: paymentData.id,
      proofUrl: proofImageUrl,
      message: 'Payment proof submitted successfully!',
    })
  } catch (error) {
    console.error('Upload error:', error)
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to process: ' + errorMsg }, { status: 500 })
  }
}
