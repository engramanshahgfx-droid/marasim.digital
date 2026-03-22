import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

// Check if user's subscription has been approved by admin and refresh session
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

    // Get fresh user subscription data from database
    const { data: userData, error: userError } = (await supabase
      .from('users')
      .select(
        'id, email, account_type, subscription_status, plan_type, subscription_expiry, event_limit, guest_limit, payment_method'
      )
      .eq('id', user.id)
      .single()) as any

    if (userError || !userData) {
      return NextResponse.json({ error: 'User data not found' }, { status: 404 })
    }

    // Check if there's an approved payment for this user
    const { data: approvedPayments } = (await supabase
      .from('payments')
      .select('id, status, plan_id, created_at')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1)) as any

    return NextResponse.json({
      success: true,
      user: userData,
      hasApprovedPayment: approvedPayments && approvedPayments.length > 0,
      message: 'Session data refreshed',
    })
  } catch (error) {
    console.error('Check subscription status error:', error)
    return NextResponse.json({ error: 'Failed to check subscription status' }, { status: 500 })
  }
}
