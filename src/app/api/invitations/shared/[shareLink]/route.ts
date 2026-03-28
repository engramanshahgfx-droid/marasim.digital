// API Route: Get Invitation by Shareable Link
// Location: src/app/api/invitations/shared/[shareLink]/route.ts

import { personalizeInvitationData } from '@/lib/invitationPersonalization'
import { getInvitationByPublicLink } from '@/lib/invitationTemplateCompat'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: {
    shareLink: string
  }
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

async function resolveInvitationBankDetails(eventId: string) {
  const eventWithBank = await supabase
    .from('events')
    .select('bank_account_holder, bank_name, bank_account_number, bank_iban')
    .eq('id', eventId)
    .maybeSingle()

  const bankColumnMissing = String(eventWithBank.error?.message || '').includes('bank_account_holder')
  const hasEventBankDetails = Boolean(
    (eventWithBank.data as any)?.bank_account_holder ||
    (eventWithBank.data as any)?.bank_name ||
    (eventWithBank.data as any)?.bank_account_number ||
    (eventWithBank.data as any)?.bank_iban
  )

  if (!eventWithBank.error && hasEventBankDetails) {
    return {
      bank_account_holder: (eventWithBank.data as any)?.bank_account_holder || null,
      bank_name: (eventWithBank.data as any)?.bank_name || null,
      bank_account_number: (eventWithBank.data as any)?.bank_account_number || null,
      bank_iban: (eventWithBank.data as any)?.bank_iban || null,
    }
  }

  if (!eventWithBank.error || bankColumnMissing) {
    const activeBankAccount = await supabase
      .from('bank_accounts')
      .select('account_holder, bank_name, account_number, iban')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (!activeBankAccount.error && activeBankAccount.data) {
      return {
        bank_account_holder: (activeBankAccount.data as any)?.account_holder || null,
        bank_name: (activeBankAccount.data as any)?.bank_name || null,
        bank_account_number: (activeBankAccount.data as any)?.account_number || null,
        bank_iban: (activeBankAccount.data as any)?.iban || null,
      }
    }
  }

  return {
    bank_account_holder: (eventWithBank.data as any)?.bank_account_holder || null,
    bank_name: (eventWithBank.data as any)?.bank_name || null,
    bank_account_number: (eventWithBank.data as any)?.bank_account_number || null,
    bank_iban: (eventWithBank.data as any)?.bank_iban || null,
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { shareLink } = params
    const url = new URL(request.url)
    const guestId = url.searchParams.get('guestId') || url.searchParams.get('guest_id')

    // Get invitation by shareable link
    const invitation = await getInvitationByPublicLink(supabase as any, shareLink)
    let invitationWithPersonalization = invitation

    let qrToken: string | undefined

    if (guestId) {
      const { data: guest } = await supabase
        .from('guests')
        .select('id, event_id, name, email, phone, notes, plus_ones, qr_token')
        .eq('id', guestId)
        .eq('event_id', invitation.event_id)
        .single()

      if (guest) {
        invitationWithPersonalization = {
          ...invitation,
          invitation_data: personalizeInvitationData(invitation.invitation_data, guest),
        }
        qrToken = guest.qr_token ?? undefined
      }
    }

    // Track view with guest-level metadata when available.
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-client-ip')
    const userAgent = request.headers.get('user-agent') || undefined
    const referrer = request.headers.get('referer') || undefined

    try {
      await supabase.from('invitation_views').insert({
        invitation_template_id: invitation.id,
        viewer_ip: ip || null,
        user_agent: userAgent || null,
        referrer: referrer || null,
        metadata: guestId
          ? {
              guest_id: guestId,
              event_id: invitation.event_id,
              share_link: shareLink,
            }
          : {
              event_id: invitation.event_id,
              share_link: shareLink,
            },
      })
    } catch {
      // Older schemas may not have invitation_views yet.
    }

    try {
      await supabase
        .from('invitation_templates')
        .update({ view_count: ((invitation as any).view_count || 0) + 1 })
        .eq('id', invitation.id)
    } catch {
      // Older schemas may not store view counts on invitation_templates.
    }

    const bankDetails = await resolveInvitationBankDetails(invitation.event_id)

    let guestPaymentSummary: { has_payment: boolean; latest_status: string | null } | null = null
    if (guestId) {
      const { data: latestPayment } = await supabase
        .from('guest_payments')
        .select('status')
        .eq('event_id', invitation.event_id)
        .eq('guest_id', guestId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      guestPaymentSummary = {
        has_payment: Boolean(latestPayment),
        latest_status: latestPayment?.status || null,
      }
    }

    return NextResponse.json({
      ...invitationWithPersonalization,
      qr_token: qrToken ?? null,
      bank_details: {
        bank_account_holder: bankDetails.bank_account_holder,
        bank_name: bankDetails.bank_name,
        bank_account_number: bankDetails.bank_account_number,
        bank_iban: bankDetails.bank_iban,
      },
      guest_payment_summary: guestPaymentSummary,
    })
  } catch (error) {
    console.error('Error fetching shared invitation:', error)
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
  }
}
