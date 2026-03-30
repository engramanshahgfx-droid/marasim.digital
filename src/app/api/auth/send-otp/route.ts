import {
  checkRateLimit,
  getClientIdentifier,
  isValidEmail,
  isValidPhoneFormat,
  logSecurityEvent,
  RATE_LIMITS,
  sanitizeInput,
} from '@/lib/authSecurity'
import { getVerifyErrorMessage, sendVerification } from '@/lib/verifyService'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const resendApiKey = process.env.RESEND_API_KEY
const resendFromEmail = process.env.RESEND_FROM_EMAIL
const useTwilioVerify = !!process.env.TWILIO_VERIFY_SERVICE_SID

function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function getFirstNameFromEmail(email: string) {
  const localPart = email.split('@')[0] || ''
  const normalized = localPart.replace(/[._-]+/g, ' ').trim()
  const first = normalized.split(' ')[0] || 'there'
  return first.charAt(0).toUpperCase() + first.slice(1)
}

function formatPhoneE164(phone: string | undefined): string | undefined {
  if (!phone) return undefined
  let cleaned = phone.replace(/[^\d+]/g, '')
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('966')) {
      cleaned = '+' + cleaned
    } else if (cleaned.startsWith('0')) {
      cleaned = '+966' + cleaned.substring(1)
    } else {
      cleaned = '+966' + cleaned
    }
  }
  if (/^\+[1-9]\d{1,14}$/.test(cleaned)) {
    return cleaned
  }
  return undefined
}

const resend = resendApiKey ? new Resend(resendApiKey) : null

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const { email, phone, channel = 'auto', method } = await request.json()

    // Sanitize inputs
    const normalizedEmail = email ? sanitizeInput(String(email)).trim().toLowerCase() : null
    const normalizedPhone = phone ? formatPhoneE164(sanitizeInput(String(phone))) : null

    // Validate input - need either email or phone
    if (!normalizedEmail && !normalizedPhone) {
      logSecurityEvent('send-otp-no-contact', { ip, userAgent, error: 'No email or phone provided' })
      return NextResponse.json({ error: 'Email or phone number is required' }, { status: 400 })
    }

    // Validate formats
    if (normalizedEmail && !isValidEmail(normalizedEmail)) {
      logSecurityEvent('send-otp-invalid-email', { identifier: normalizedEmail, ip, userAgent })
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    if (normalizedPhone && !isValidPhoneFormat(normalizedPhone)) {
      logSecurityEvent('send-otp-invalid-phone', { identifier: normalizedPhone, ip, userAgent })
      return NextResponse.json({ error: 'Invalid phone format' }, { status: 400 })
    }

    // Check rate limit using email or phone as identifier
    const identifier = getClientIdentifier(normalizedEmail || undefined, normalizedPhone || undefined, ip)
    const rateLimit = checkRateLimit(identifier, RATE_LIMITS.sendOTP)

    if (!rateLimit.allowed) {
      logSecurityEvent('send-otp-rate-limited', { identifier, ip, userAgent })
      return NextResponse.json(
        {
          error: RATE_LIMITS.sendOTP.message,
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
        },
        { status: 429, headers: { 'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString() } }
      )
    }

    // ===== EMAIL-BASED VERIFICATION (Resend) =====
    // Always use email path when email is present — phone is optional profile data only
    if (normalizedEmail) {
      if (!resend || !resendFromEmail) {
        return NextResponse.json(
          { error: 'Email service is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.' },
          { status: 500 }
        )
      }

      // Check if email already exists
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      let existingUser = null
      try {
        const { data } = await supabaseAdmin.auth.admin.listUsers()
        existingUser = data.users.find((user) => user.email?.toLowerCase() === normalizedEmail) ?? null
      } catch (err) {
        console.error('Error checking existing users:', err)
      }

      if (existingUser) {
        logSecurityEvent('send-otp-user-exists', { identifier, ip, userAgent })
        return NextResponse.json({ error: 'This email already exists. Please sign in instead.' }, { status: 400 })
      }

      // Check in public.users table
      const { data: existingProfile } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', normalizedEmail)
        .single()

      if (existingProfile) {
        logSecurityEvent('send-otp-user-exists', { identifier, ip, userAgent })
        return NextResponse.json({ error: 'This email already exists. Please sign in instead.' }, { status: 400 })
      }

      // Generate and store OTP
      const otp = generateOtpCode()
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

      // Delete any existing codes
      await supabaseAdmin.from('verification_codes').delete().eq('email', normalizedEmail)

      // Insert new code
      const { error: insertError } = await supabaseAdmin
        .from('verification_codes')
        .insert([{ email: normalizedEmail, code: otp, expires_at: expiresAt }])

      if (insertError) {
        console.error('Failed to store OTP:', insertError.message)
        return NextResponse.json({ error: 'Failed to generate verification code' }, { status: 500 })
      }

      // Send email
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
        console.error('Resend OTP delivery failed:', resendError)
        return NextResponse.json({ error: 'Failed to send verification email. Please try again.' }, { status: 500 })
      }

      logSecurityEvent('send-otp-success', { identifier, ip, userAgent, success: true })

      return NextResponse.json({
        success: true,
        message: 'Verification code sent to your email.',
        method: 'email',
        recipient: normalizedEmail,
      })
    }

    // ===== PHONE-BASED VERIFICATION (Twilio Verify) =====
    if (normalizedPhone) {
      if (!useTwilioVerify) {
        return NextResponse.json(
          { error: 'SMS verification is not configured. Please use email instead.' },
          { status: 400 }
        )
      }

      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      // Check if phone already exists
      const { data: existingPhone } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('phone', normalizedPhone)
        .single()

      if (existingPhone) {
        logSecurityEvent('send-otp-phone-exists', { identifier, ip, userAgent })
        return NextResponse.json({ error: 'This phone number is already registered.' }, { status: 400 })
      }

      // Send via Twilio Verify
      const verificationResult = await sendVerification(normalizedPhone, channel as any)

      if (!verificationResult.success) {
        const errorMessage = getVerifyErrorMessage(verificationResult)
        logSecurityEvent('send-otp-twilio-failed', {
          identifier,
          ip,
          userAgent,
          error: errorMessage,
        })
        return NextResponse.json({ error: errorMessage }, { status: 400 })
      }

      logSecurityEvent('send-otp-success', { identifier, ip, userAgent, success: true })

      return NextResponse.json({
        success: true,
        message: `Verification code sent via ${verificationResult.channels?.[0] || channel}.`,
        method: 'twilio-verify',
        channel: verificationResult.channels?.[0] || channel,
        recipient: normalizedPhone,
        verificationSid: verificationResult.sid,
      })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error: any) {
    console.error('Send OTP error:', error)
    return NextResponse.json({ error: error.message || 'Failed to send verification code' }, { status: 500 })
  }
}
