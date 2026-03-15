import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const resendApiKey = process.env.RESEND_API_KEY
const resendFromEmail = process.env.RESEND_FROM_EMAIL

function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function getFirstNameFromEmail(email: string) {
  const localPart = email.split('@')[0] || ''
  const normalized = localPart.replace(/[._-]+/g, ' ').trim()
  const first = normalized.split(' ')[0] || 'there'
  return first.charAt(0).toUpperCase() + first.slice(1)
}

const resend = resendApiKey ? new Resend(resendApiKey) : null

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    const normalizedEmail = String(email || '')
      .trim()
      .toLowerCase()

    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!resend || !resendFromEmail) {
      return NextResponse.json(
        { error: 'Email service is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.' },
        { status: 500 }
      )
    }

    // Store OTP in Supabase
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Check if email already exists in auth.users
    let existingUser = null
    try {
      const { data, error: listError } = await supabaseAdmin.auth.admin.listUsers()

      if (listError) {
        throw listError
      }

      existingUser = data.users.find((user) => user.email?.toLowerCase() === normalizedEmail) ?? null
    } catch (err) {
      console.error('Error checking existing users:', err)
      // Continue even if list fails - don't block registration
    }

    if (existingUser) {
      return NextResponse.json({ error: 'This email already exists. Please sign in instead.' }, { status: 400 })
    }

    // Also check public.users table
    const { data: existingProfile } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .single()

    if (existingProfile) {
      return NextResponse.json({ error: 'This email already exists. Please sign in instead.' }, { status: 400 })
    }

    const otp = generateOtpCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 min

    // Delete any existing codes for this email
    await supabaseAdmin.from('verification_codes').delete().eq('email', normalizedEmail)

    // Insert new code
    const { error: insertError } = await supabaseAdmin
      .from('verification_codes')
      .insert([{ email: normalizedEmail, code: otp, expires_at: expiresAt }])

    if (insertError) {
      console.error('Failed to store OTP:', insertError.message)
      return NextResponse.json({ error: 'Failed to generate verification code' }, { status: 500 })
    }

    const firstName = getFirstNameFromEmail(normalizedEmail)

    const { error: resendError } = await resend.emails.send({
      from: resendFromEmail,
      to: [normalizedEmail],
      subject: 'Your Marasim verification code',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
          <h2 style="margin: 0 0 12px;">Welcome, ${firstName}!</h2>
          <p style="margin: 0 0 12px;">Use this one-time code to complete your Marasim registration:</p>
          <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 16px 0;">${otp}</div>
          <p style="margin: 0 0 8px;">This code expires in 15 minutes.</p>
          <p style="margin: 0; color: #6b7280;">If you did not request this code, you can ignore this email.</p>
        </div>
      `,
      text: `Welcome, ${firstName}! Your Marasim verification code is ${otp}. It expires in 15 minutes.`,
    })

    if (resendError) {
      await supabaseAdmin.from('verification_codes').delete().eq('email', normalizedEmail)
      const providerMessage = resendError.message || 'Resend delivery failed'
      console.error('Resend OTP delivery failed:', providerMessage)
      return NextResponse.json(
        {
          error: `Failed to send verification email. ${providerMessage}`,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email.',
      method: 'resend',
    })
  } catch (error: any) {
    console.error('Send OTP error:', error)
    return NextResponse.json({ error: error.message || 'Failed to send verification code' }, { status: 500 })
  }
}
