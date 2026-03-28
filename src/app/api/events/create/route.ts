import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

async function persistFallbackBankAccount(details: {
  bankAccountHolder?: string
  bankName?: string
  bankAccountNumber?: string
  bankIban?: string
}) {
  if (!details.bankAccountHolder || !details.bankName || !details.bankAccountNumber) {
    return
  }

  const { data: activeBankAccount } = await supabase
    .from('bank_accounts')
    .select('id')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if ((activeBankAccount as any)?.id) {
    await supabase
      .from('bank_accounts')
      .update({
        account_holder: details.bankAccountHolder,
        bank_name: details.bankName,
        account_number: details.bankAccountNumber,
        iban: details.bankIban || null,
        is_active: true,
      })
      .eq('id', (activeBankAccount as any).id)
  } else {
    await supabase.from('bank_accounts').insert({
      account_holder: details.bankAccountHolder,
      bank_name: details.bankName,
      account_number: details.bankAccountNumber,
      iban: details.bankIban || null,
      is_active: true,
    })
  }
}

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

    const {
      userId,
      name,
      date,
      time,
      venue,
      description,
      eventType,
      expectedGuests,
      status,
      bankAccountHolder,
      bankName,
      bankAccountNumber,
      bankIban,
    } = await request.json()

    if (!name || !date || !venue) {
      return NextResponse.json({ error: 'name, date, and venue are required' }, { status: 400 })
    }

    let resolvedBankAccountHolder = bankAccountHolder
    let resolvedBankName = bankName
    let resolvedBankAccountNumber = bankAccountNumber
    let resolvedBankIban = bankIban

    if (!resolvedBankAccountHolder || !resolvedBankName || !resolvedBankAccountNumber) {
      const { data: activeBankAccount } = await supabase
        .from('bank_accounts')
        .select('account_holder, bank_name, account_number, iban')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()

      resolvedBankAccountHolder = resolvedBankAccountHolder || (activeBankAccount as any)?.account_holder || null
      resolvedBankName = resolvedBankName || (activeBankAccount as any)?.bank_name || null
      resolvedBankAccountNumber = resolvedBankAccountNumber || (activeBankAccount as any)?.account_number || null
      resolvedBankIban = resolvedBankIban || (activeBankAccount as any)?.iban || null
    }

    // Ensure userId matches authenticated user
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized: userId mismatch' }, { status: 403 })
    }

    const { data: userProfile, error: profileError } = await (supabase as any)
      .from('users')
      .select('account_type, event_limit, plan_type')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const { count: eventCount, error: countError } = await (supabase as any)
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (countError) {
      console.error('Event count error:', countError)
      return NextResponse.json({ error: 'Failed to verify event limit' }, { status: 500 })
    }

    const currentEventCount = eventCount || 0
    const eventLimit = userProfile.event_limit

    if (typeof eventLimit === 'number' && currentEventCount >= eventLimit) {
      const isFreeUser = userProfile.account_type === 'free'

      return NextResponse.json(
        {
          error: isFreeUser
            ? 'Free plan allows only 1 event. Upgrade your plan to create more events.'
            : `Your current plan allows only ${eventLimit} events. Upgrade to create more events.`,
          code: 'EVENT_LIMIT_REACHED',
          limitDetails: {
            feature: 'events',
            current: currentEventCount,
            limit: eventLimit,
            planType: userProfile.plan_type,
            accountType: userProfile.account_type,
          },
        },
        { status: 403 }
      )
    }

    const { data: existingDuplicateCandidate } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .eq('name', name)
      .eq('date', date)
      .eq('venue', venue)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingDuplicateCandidate) {
      const createdAt = new Date((existingDuplicateCandidate as any).created_at || '').getTime()
      const isRecentDuplicate = Number.isFinite(createdAt) && Date.now() - createdAt < 2 * 60 * 1000

      if (isRecentDuplicate) {
        return NextResponse.json(existingDuplicateCandidate, { status: 200 })
      }
    }

    const basePayload = {
      user_id: user.id,
      name,
      date,
      time: time || '18:00',
      venue,
      description: description || '',
      event_type: eventType || 'wedding',
      expected_guests: expectedGuests || 100,
      status: status || 'draft',
    }

    const payloadWithBank = {
      ...basePayload,
      bank_account_holder: resolvedBankAccountHolder,
      bank_name: resolvedBankName,
      bank_account_number: resolvedBankAccountNumber,
      bank_iban: resolvedBankIban || null,
    }

    let event: any = null
    let error: any = null

    const insertWithBank = await supabase.from('events').insert(payloadWithBank).select().single()
    event = insertWithBank.data
    error = insertWithBank.error

    if (error && String(error.message || '').includes('bank_account_holder')) {
      const insertWithoutBank = await supabase.from('events').insert(basePayload).select().single()
      event = insertWithoutBank.data
      error = insertWithoutBank.error

      if (!error) {
        await persistFallbackBankAccount({
          bankAccountHolder: resolvedBankAccountHolder,
          bankName: resolvedBankName,
          bankAccountNumber: resolvedBankAccountNumber,
          bankIban: resolvedBankIban,
        })
      }
    }

    if (error) {
      console.error('Event creation error:', error)
      return NextResponse.json({ error: error.message || 'Failed to create event' }, { status: 400 })
    }

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Event creation exception:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
