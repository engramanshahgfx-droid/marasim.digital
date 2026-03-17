import { formatPhoneNumber, sendOTP as sendTwilioOTP } from '@/lib/twilio'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const resendApiKey = process.env.RESEND_API_KEY
const resendFromEmail = process.env.RESEND_FROM_EMAIL
const resend = resendApiKey ? new Resend(resendApiKey) : null

function getFirstNameFromEmail(email: string) {
  const localPart = email.split('@')[0] || ''
  const normalized = localPart.replace(/[._-]+/g, ' ').trim()
  const first = normalized.split(' ')[0] || 'there'
  return first.charAt(0).toUpperCase() + first.slice(1)
}

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
      console.warn('Twilio OTP failed, falling back to email:', result.error)
    }

    if (!resend || !resendFromEmail) {
      console.warn(`Email service not configured; OTP is in verification_codes for ${email}`)
      return NextResponse.json({
        success: true,
        message: `OTP generated: ${otp} (email delivery not configured)`,
        otp,
      })
    }

    const firstName = getFirstNameFromEmail(email)

    const { error: resendError } = await resend.emails.send({
      from: resendFromEmail,
      to: [email],
      subject: 'Your Marasim password reset code',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
          <h2 style="margin: 0 0 12px;">Hello, ${firstName}!</h2>
          <p style="margin: 0 0 12px;">Use this one-time code to reset your password:</p>
          <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 16px 0;">${otp}</div>
          <p style="margin: 0 0 8px;">This code expires in 10 minutes.</p>
          <p style="margin: 0; color: #6b7280;">If you did not request this code, you can ignore this email.</p>
        </div>
      `,
      text: `Hello, ${firstName}! Your password reset code is ${otp}. It expires in 10 minutes.`,
    })

    if (resendError) {
      console.error('Resend OTP delivery failed:', resendError)
      return NextResponse.json({
        success: true,
        message: 'OTP generated but email delivery failed (check server logs)',
      })
    }

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
