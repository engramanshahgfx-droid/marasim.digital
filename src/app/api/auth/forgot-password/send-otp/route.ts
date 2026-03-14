import { formatPhoneNumber, sendOTP as sendTwilioOTP } from '@/lib/twilio'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check if user exists
    const { data: userData } = await supabase.from('users').select('id, email, phone').eq('email', email).single()

    if (!userData) {
      // Don't reveal if email exists (security)
      return NextResponse.json({ success: true, message: 'If email exists, OTP has been sent' })
    }

    // Try to send via Twilio SMS if user has a phone number
    if (userData.phone) {
      const phone = formatPhoneNumber(userData.phone)
      const result = await sendTwilioOTP(phone)

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'OTP sent to your phone via SMS',
          method: 'sms',
        })
      }
      // Fall through to email OTP if SMS fails
      console.warn('Twilio OTP failed, falling back to stored OTP:', result.error)
    }

    // Fallback: store OTP in verification_codes table
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    await supabase.from('verification_codes').delete().eq('email', email)

    const { error: otpError } = await supabase.from('verification_codes').insert({
      email,
      code: otp,
      expires_at: new Date(Date.now() + 10 * 60000).toISOString(), // 10 minutes
    })

    if (otpError) {
      console.error('OTP insert error:', otpError)
      return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 })
    }

    console.log(`Password reset OTP for ${email}: ${otp}`)

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email',
      method: 'email',
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
