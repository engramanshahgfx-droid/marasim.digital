import {
  checkRateLimit,
  getClientIdentifier,
  isValidEmail,
  isValidOTPFormat,
  isValidPhoneFormat,
  logSecurityEvent,
  RATE_LIMITS,
  resetRateLimit,
  sanitizeInput,
} from '@/lib/authSecurity'
import { checkVerification, getVerifyErrorMessage } from '@/lib/verifyService'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const useTwilioVerify = !!process.env.TWILIO_VERIFY_SERVICE_SID

// Format phone number to E.164 format (required by Supabase Auth)
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

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const { email, phone, code, fullName } = await request.json()

    // Sanitize inputs
    const normalizedEmail = email ? sanitizeInput(String(email)).trim().toLowerCase() : null
    const normalizedPhone = phone ? formatPhoneE164(sanitizeInput(String(phone))) : null
    const sanitizedCode = sanitizeInput(String(code || '').trim())
    const sanitizedFullName = fullName ? sanitizeInput(String(fullName)) : ''

    // Basic input validation
    if (!sanitizedCode) {
      return NextResponse.json({ error: 'Verification code is required' }, { status: 400 })
    }

    if (!isValidOTPFormat(sanitizedCode)) {
      logSecurityEvent('verify-otp-invalid-format', {
        ip,
        userAgent,
        error: 'Invalid OTP format',
      })
      return NextResponse.json({ error: 'Invalid verification code format' }, { status: 400 })
    }

    // Validate input - need either email or phone
    if (!normalizedEmail && !normalizedPhone) {
      return NextResponse.json({ error: 'Email or phone number is required' }, { status: 400 })
    }

    // Validate formats
    if (normalizedEmail && !isValidEmail(normalizedEmail)) {
      logSecurityEvent('verify-otp-invalid-email', { identifier: normalizedEmail, ip, userAgent })
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    if (normalizedPhone && !isValidPhoneFormat(normalizedPhone)) {
      logSecurityEvent('verify-otp-invalid-phone', { identifier: normalizedPhone, ip, userAgent })
      return NextResponse.json({ error: 'Invalid phone format' }, { status: 400 })
    }

    // Check rate limit
    const identifier = getClientIdentifier(normalizedEmail || undefined, normalizedPhone || undefined, ip)
    const rateLimit = checkRateLimit(identifier, RATE_LIMITS.verifyOTP)

    if (!rateLimit.allowed) {
      logSecurityEvent('verify-otp-rate-limited', { identifier, ip, userAgent })
      return NextResponse.json(
        {
          error: RATE_LIMITS.verifyOTP.message,
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
        },
        { status: 429, headers: { 'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString() } }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // ===== EMAIL-BASED VERIFICATION =====
    // Always use email OTP path when email is present (phone is optional profile data)
    if (normalizedEmail) {
      // Check OTP from verification_codes table
      const { data: otpRecord, error: otpError } = await supabaseAdmin
        .from('verification_codes')
        .select('*')
        .eq('email', normalizedEmail)
        .eq('code', sanitizedCode)
        .single()

      if (otpError || !otpRecord) {
        logSecurityEvent('verify-otp-invalid-code', { identifier, ip, userAgent })
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
      }

      // Check expiry
      if (new Date(otpRecord.expires_at) < new Date()) {
        await supabaseAdmin.from('verification_codes').delete().eq('email', normalizedEmail)
        logSecurityEvent('verify-otp-expired', { identifier, ip, userAgent })
        return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 })
      }

      // Delete used code
      await supabaseAdmin.from('verification_codes').delete().eq('email', normalizedEmail)

      // Create Supabase auth user
      const tempPassword = crypto.randomUUID()

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: sanitizedFullName },
      })

      if (authError) {
        if (authError.message?.includes('already been registered') || authError.message?.includes('already exists')) {
          logSecurityEvent('verify-otp-user-exists', { identifier, ip, userAgent })
          return NextResponse.json({
            success: true,
            verified: true,
            existingUser: true,
            message: 'Account already exists. Please sign in.',
          })
        }
        throw authError
      }

      // Create user profile
      const { error: profileError } = await supabaseAdmin.from('users').insert([
        {
          id: authData.user.id,
          email: normalizedEmail,
          phone: normalizedPhone || null,
          full_name: sanitizedFullName,
          account_type: 'free',
          subscription_status: 'trial',
          plan_type: 'free',
          event_limit: 1,
        },
      ])

      if (profileError) {
        console.error('Failed to create user profile:', profileError)
      }

      resetRateLimit(identifier)
      logSecurityEvent('verify-otp-success', { identifier, ip, userAgent, success: true })

      return NextResponse.json({
        success: true,
        verified: true,
        userId: authData.user.id,
        tempPassword,
        profileCreated: !profileError,
        method: 'email',
      })
    }

    // ===== PHONE-BASED VERIFICATION (Twilio Verify) =====
    if (normalizedPhone) {
      if (!useTwilioVerify) {
        return NextResponse.json({ error: 'Phone verification is not configured.' }, { status: 400 })
      }

      // Verify code with Twilio Verify
      const verificationResult = await checkVerification(normalizedPhone, sanitizedCode)

      if (!verificationResult.success || !verificationResult.approved) {
        const errorMessage = getVerifyErrorMessage(verificationResult)
        logSecurityEvent('verify-otp-twilio-failed', { identifier, ip, userAgent, error: errorMessage })
        return NextResponse.json({ error: errorMessage }, { status: 400 })
      }

      // Check if phone is already registered
      const { data: existingPhone } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('phone', normalizedPhone)
        .single()

      if (existingPhone) {
        logSecurityEvent('verify-otp-phone-exists', { identifier, ip, userAgent })
        return NextResponse.json({
          success: true,
          verified: true,
          existingUser: true,
          message: 'This phone number is already registered. Please sign in.',
        })
      }

      // Create Supabase auth user
      const tempPassword = crypto.randomUUID()

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: `user-${normalizedPhone}@auth.local`,
        password: tempPassword,
        email_confirm: true,
        phone: normalizedPhone,
        phone_confirm: true,
        user_metadata: { full_name: sanitizedFullName, phone_verified: true },
      })

      if (authError) {
        if (authError.message?.includes('already been registered') || authError.message?.includes('already exists')) {
          logSecurityEvent('verify-otp-user-exists', { identifier, ip, userAgent })
          return NextResponse.json({
            success: true,
            verified: true,
            existingUser: true,
            message: 'Account already exists. Please sign in.',
          })
        }
        throw authError
      }

      // Create user profile
      const { error: profileError } = await supabaseAdmin.from('users').insert([
        {
          id: authData.user.id,
          email: null,
          phone: normalizedPhone,
          full_name: sanitizedFullName,
          account_type: 'free',
          subscription_status: 'trial',
          plan_type: 'free',
          event_limit: 1,
          guest_limit: 50,
        },
      ])

      if (profileError) {
        console.error('Failed to create user profile:', profileError)
      }

      resetRateLimit(identifier)
      logSecurityEvent('verify-otp-success', { identifier, ip, userAgent, success: true })

      return NextResponse.json({
        success: true,
        verified: true,
        userId: authData.user.id,
        tempPassword,
        profileCreated: !profileError,
        method: 'phone',
      })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error: any) {
    console.error('Verify OTP error:', error)
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 })
  }
}
