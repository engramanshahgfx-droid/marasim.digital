import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Format phone number to E.164 format (required by Supabase Auth)
function formatPhoneE164(phone: string | undefined): string | undefined {
  if (!phone) return undefined

  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^\d+]/g, '')

  // If it doesn't start with +, assume it's a Saudi number (966)
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('966')) {
      // Already has country code
      cleaned = '+' + cleaned
    } else if (cleaned.startsWith('0')) {
      // Saudi number starting with 0, replace with +966
      cleaned = '+966' + cleaned.substring(1)
    } else {
      // Assume +966 for Saudi Arabia
      cleaned = '+966' + cleaned
    }
  }

  // Validate basic E.164 format: +[1-9]{1,15}
  if (/^\+[1-9]\d{1,14}$/.test(cleaned)) {
    return cleaned
  }

  return undefined
}

export async function POST(request: NextRequest) {
  try {
    const { email, code, fullName, phone } = await request.json()
    const normalizedEmail = String(email || '')
      .trim()
      .toLowerCase()

    if (!normalizedEmail || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Check OTP from verification_codes table
    const { data: otpRecord, error: otpError } = await supabaseAdmin
      .from('verification_codes')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('code', code)
      .single()

    if (otpError || !otpRecord) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
    }

    // Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      await supabaseAdmin.from('verification_codes').delete().eq('email', normalizedEmail)
      return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 })
    }

    // Delete used code
    await supabaseAdmin.from('verification_codes').delete().eq('email', normalizedEmail)

    // Format phone to E.164 if provided
    let formattedPhone = formatPhoneE164(phone)

    // Check if phone is already registered (if provided)
    if (formattedPhone) {
      const { data: existingPhone } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('phone', formattedPhone)
        .single()

      if (existingPhone) {
        // Phone already exists - don't use this phone number
        console.warn(`Phone number ${formattedPhone} already registered, skipping phone for this user`)
        formattedPhone = undefined
      }
    }

    // Create Supabase auth user
    const tempPassword = crypto.randomUUID()

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: tempPassword,
      email_confirm: true,
      // Only add phone if it's valid and not already registered
      ...(formattedPhone && { phone: formattedPhone, phone_confirm: true }),
      user_metadata: { full_name: fullName || '', original_phone: phone || '' },
    })

    if (authError) {
      if (authError.message?.includes('already been registered') || authError.message?.includes('already exists')) {
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
        phone: formattedPhone || null,
        full_name: fullName || '',
        account_type: 'free',
        subscription_status: 'trial',
        plan_type: 'free',
        event_limit: 1,
        guest_limit: 50,
      },
    ])

    if (profileError) {
      console.error('Failed to create user profile:', profileError)
      // Don't fail registration if profile creation fails - profile can be created later
      // But log it prominently so admin can investigate
    }

    return NextResponse.json({
      success: true,
      verified: true,
      userId: authData.user.id,
      tempPassword,
      profileCreated: !profileError,
      phoneAlreadyRegistered: phone && !formattedPhone, // Notify user if phone was skipped
    })
  } catch (error: any) {
    console.error('Verify OTP error:', error)
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 })
  }
}
