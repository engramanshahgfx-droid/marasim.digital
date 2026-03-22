import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json()

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 })
    }

    const normalizedEmail = String(email || '')
      .trim()
      .toLowerCase()

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: otpRecord, error: otpError } = await supabaseAdmin
      .from('verification_codes')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('code', otp)
      .single()

    if (otpError || !otpRecord) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 })
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      await supabaseAdmin.from('verification_codes').delete().eq('email', normalizedEmail)
      return NextResponse.json({ error: 'OTP has expired' }, { status: 401 })
    }

    // Delete used code
    await supabaseAdmin.from('verification_codes').delete().eq('email', normalizedEmail)

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully. You can now reset your password.',
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 })
  }
}
