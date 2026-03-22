import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

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

    // Get fresh user data from database
    const { data: userData, error: userError } = await (supabase as any)
      .from('users')
      .select('id, email, account_type, subscription_status, plan_type, subscription_expiry, event_limit, guest_limit')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User data not found' }, { status: 404 })
    }

    // Return refreshed user data
    return NextResponse.json({
      success: true,
      user: userData,
      message: 'Session refreshed successfully',
    })
  } catch (error) {
    console.error('Session refresh error:', error)
    return NextResponse.json({ error: 'Failed to refresh session' }, { status: 500 })
  }
}
