import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

// Initialize Twilio for WhatsApp
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_API_KEY_SECRET)

// Helper to format phone numbers
const formatPhone = (phone: string) => {
  if (!phone.startsWith('+')) {
    if (phone.startsWith('966')) {
      return '+' + phone
    } else if (phone.startsWith('0')) {
      return '+966' + phone.substring(1)
    }
    return '+966' + phone
  }
  return phone
}

// Approve bank transfer payment (Admin only)
export async function POST(request: NextRequest) {
  try {
    const { paymentId, adminId } = await request.json()

    // Verify admin role
    const { data: admin } = (await supabase.from('users').select('role').eq('id', adminId).single()) as any

    if ((admin as any)?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }

    // Get payment details with user info
    const { data: payment, error: paymentError } = (await supabase
      .from('payments')
      .select('*, users(email, full_name, phone_number)')
      .eq('id', paymentId)
      .single()) as any

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 400 })
    }

    // Get plan details
    const { data: plan, error: planError } = (await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', payment.plan_id)
      .single()) as any

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found for this payment' }, { status: 400 })
    }

    // Update payment status
    const { error: updatePaymentError } = await supabase
      .from('payments')
      .update({
        status: 'approved',
        updated_at: new Date(),
      })
      .eq('id', paymentId)

    if (updatePaymentError) throw updatePaymentError

    // Update user subscription
    const expiryDate = new Date()
    expiryDate.setMonth(expiryDate.getMonth() + 1)

    // Determine plan type and limits based on the plan
    const planName = plan.name.toLowerCase()
    const isPro = planName.includes('pro')
    const isEnterprise = planName.includes('enterprise')

    const { error: userError } = await supabase
      .from('users')
      .update({
        subscription_status: 'active',
        account_type: 'paid',
        plan_type: isEnterprise ? 'enterprise' : isPro ? 'pro' : 'basic',
        subscription_expiry: expiryDate.toISOString(),
        event_limit: plan.event_limit || (isEnterprise ? 999 : isPro ? 5 : 1),
        guest_limit: plan.guest_limit || (isEnterprise ? 5000 : isPro ? 1000 : 200),
        updated_at: new Date(),
      })
      .eq('id', payment.user_id)

    if (userError) throw userError

    // Send WhatsApp approval notification to customer
    try {
      if ((payment as any)?.users?.phone_number) {
        const approvalMessage = `
✅ *Payment Approved!*

Dear ${(payment as any)?.users?.full_name},

Great news! Your bank transfer payment has been verified and approved.

💰 *Payment Details:*
• Plan: ${plan.name}
• Amount: $${payment.amount}
• Status: ✅ APPROVED

🎉 Your subscription is now active!
• You can create unlimited events
• Full feature access enabled
• Valid until: ${new Date(expiryDate).toLocaleDateString()}

Thank you for your business!
📞 Support: ${process.env.BANK_RECEIPT_WHATSAPP}
        `.trim()

        await twilioClient.messages.create({
          from: 'whatsapp:' + process.env.TWILIO_PHONE_NUMBER,
          to: 'whatsapp:' + formatPhone((payment as any)?.users?.phone_number),
          body: approvalMessage,
        })
      }
    } catch (whatsappError) {
      console.warn('WhatsApp approval notification failed:', whatsappError)
    }

    return NextResponse.json({
      success: true,
      message: 'Payment approved successfully',
    })
  } catch (error) {
    console.error('Admin approve payment error:', error)
    return NextResponse.json({ error: 'Failed to approve payment' }, { status: 500 })
  }
}

// Reject bank transfer payment (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { paymentId, adminId } = await request.json()

    // Verify admin role
    const { data: admin } = (await supabase.from('users').select('role').eq('id', adminId).single()) as any

    if ((admin as any)?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }

    // Get payment and user details before deleting
    const { data: payment } = (await supabase
      .from('payments')
      .select('*, users(email, full_name, phone_number)')
      .eq('id', paymentId)
      .single()) as any

    // Update payment status to rejected
    const { error } = await supabase
      .from('payments')
      .update({
        status: 'rejected',
        updated_at: new Date(),
      })
      .eq('id', paymentId)

    if (error) throw error

    // Send WhatsApp rejection notification to customer
    try {
      if (payment?.users?.phone_number) {
        const rejectionMessage = `
❌ *Payment Verification Failed*

Dear ${payment?.users?.full_name},

Unfortunately, your bank transfer could not be verified.

📋 *Reasons may include:*
• Incomplete or unclear proof image
• Reference code mismatch
• Incorrect amount transferred
• Proof image quality issues

✏️ *Next Steps:*
1. Review the requirements for payment proof
2. Retake a clear screenshot of the transfer confirmation
3. Ensure the reference code is clearly visible
4. Submit new proof through your account

📞 Need help?
Contact support: ${process.env.BANK_RECEIPT_WHATSAPP}
        `.trim()

        await twilioClient.messages.create({
          from: 'whatsapp:' + process.env.TWILIO_PHONE_NUMBER,
          to: 'whatsapp:' + formatPhone(payment?.users?.phone_number),
          body: rejectionMessage,
        })
      }
    } catch (whatsappError) {
      console.warn('WhatsApp rejection notification failed:', whatsappError)
    }

    return NextResponse.json({
      success: true,
      message: 'Payment rejected successfully',
    })
  } catch (error) {
    console.error('Admin reject payment error:', error)
    return NextResponse.json({ error: 'Failed to reject payment' }, { status: 500 })
  }
}
