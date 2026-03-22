import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

// Auto-approve pending bank transfer payments (for demo mode)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get pending bank transfer payment for this user
    const { data: payment, error: paymentError } = (await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .eq('payment_method', 'bank_transfer')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()) as any

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: 'No pending bank transfer payment found. Please upload payment proof first.' },
        { status: 404 }
      )
    }

    // Get plan details
    const { data: plan } = await supabase.from('subscription_plans').select('*').eq('id', payment.plan_id).single()

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Update payment status to approved
    const { error: updatePaymentError } = await supabase
      .from('payments')
      .update({
        status: 'approved',
        updated_at: new Date(),
      })
      .eq('id', payment.id)

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
      .eq('id', user.id)

    if (userError) throw userError

    return NextResponse.json({
      success: true,
      message: 'Payment approved successfully! Your subscription is now active.',
      updatedUser: {
        event_limit: plan.event_limit || (isEnterprise ? 999 : isPro ? 5 : 1),
        guest_limit: plan.guest_limit || (isEnterprise ? 5000 : isPro ? 1000 : 200),
        plan_type: plan.name,
        subscription_status: 'active',
      },
    })
  } catch (error) {
    console.error('Auto-approve payment error:', error)
    return NextResponse.json({ error: 'Failed to approve payment' }, { status: 500 })
  }
}
