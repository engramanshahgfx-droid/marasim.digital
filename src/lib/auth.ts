import { supabase } from './supabase'

// Send email OTP via Resend (server-side API route)
export async function sendOTP(email: string) {
  const res = await fetch('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to send verification code')
  return data
}

// Verify email OTP and create account (server-side API route)
export async function verifyOTPAndRegister(email: string, code: string, fullName?: string, phone?: string) {
  const res = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, fullName, phone }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Verification failed')

  if (data.existingUser) {
    throw new Error('Account already exists. Please sign in instead.')
  }

  // Auto sign-in with the temp password
  if (data.tempPassword) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: data.tempPassword,
    })
    if (error) {
      console.warn('Auto sign-in failed:', error.message)
    }
  }

  return data
}

export async function signUpUser(email: string, password: string, fullName?: string) {
  try {
    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
        },
      },
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('User creation failed')

    // Create free user profile
    const { error: profileError } = await (supabase as any).from('users').insert([
      {
        id: authData.user.id,
        email,
        full_name: fullName || '',
        account_type: 'free',
        subscription_status: 'trial',
        plan_type: 'free',
        event_limit: 1,
        guest_limit: 50,
      },
    ])

    if (profileError) {
      console.warn('Could not create user profile (table may not exist):', profileError.message)
    }

    return { user: authData.user, session: authData.session }
  } catch (error) {
    console.error('Sign up error:', error)
    throw error
  }
}

export async function signInUser(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    return { user: data.user, session: data.session }
  } catch (error) {
    console.error('Sign in error:', error)
    throw error
  }
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single()

  if (error) throw error
  return data as Database['public']['Tables']['users']['Row'] | undefined
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Database['public']['Tables']['users']['Update']>
) {
  const { data, error } = await supabase.from('users').update(updates).eq('id', userId).select().single()

  if (error) throw error
  return data as Database['public']['Tables']['users']['Row'] | undefined
}

export async function checkSubscriptionStatus(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(
        'subscription_status, plan_type, subscription_expiry, account_type, demo_expiry, event_limit, guest_limit'
      )
      .eq('id', userId)
      .single()

    if (error) throw error

    const userData = data as Database['public']['Tables']['users']['Row'] & {
      account_type?: string
      demo_expiry?: string
      event_limit?: number
      guest_limit?: number
    }
    const accountType = userData.account_type || 'free'
    const isFree = accountType === 'free'
    const isPaid = accountType === 'paid'
    const subscriptionStatus = userData.subscription_status

    const isActive =
      subscriptionStatus === 'trial' ||
      (subscriptionStatus === 'active' &&
        (!userData.subscription_expiry || new Date(userData.subscription_expiry) > new Date()))

    return {
      isActive,
      isFree,
      isPaid,
      status: subscriptionStatus,
      plan: userData.plan_type,
      accountType,
      expiryDate: userData.subscription_expiry,
      demoExpiry: userData.demo_expiry,
      eventLimit: userData.event_limit ?? (isFree ? 1 : null),
      guestLimit: userData.guest_limit ?? (isFree ? 50 : null),
    }
  } catch (error) {
    console.error('Error checking subscription:', error)
    return {
      isActive: true,
      isFree: true,
      isPaid: false,
      status: 'trial',
      plan: 'free',
      accountType: 'free',
      expiryDate: null,
      demoExpiry: null,
      eventLimit: 1,
      guestLimit: 50,
    }
  }
}

export async function getSubscriptionPlans() {
  const { data, error } = await (supabase as any)
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) throw error
  return data as any
}
