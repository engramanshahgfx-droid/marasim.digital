import { validateInvitationLinkForEvent } from '@/lib/invitationTemplateCompat'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

function normalizeAmount(input: string | null): number | null {
  if (!input) return null
  const parsed = Number(input)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const guestId = searchParams.get('guestId')
    const eventId = searchParams.get('eventId')
    const shareLink = searchParams.get('shareLink')

    if (!guestId || !eventId || !shareLink) {
      return NextResponse.json({ error: 'guestId, eventId, and shareLink are required' }, { status: 400 })
    }

    // Validate this share link belongs to the same event.
    let resolvedEventId = eventId
    let invitation = await validateInvitationLinkForEvent(supabase as any, eventId, shareLink)

    if (!invitation) {
      const { data: fallbackInvitation } = await supabase
        .from('invitation_templates')
        .select('id, event_id')
        .eq('shareable_link', shareLink)
        .maybeSingle()

      if (fallbackInvitation?.event_id) {
        resolvedEventId = fallbackInvitation.event_id
        invitation = await validateInvitationLinkForEvent(supabase as any, resolvedEventId, shareLink)
      }
    }

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid invitation link' }, { status: 403 })
    }

    const { data: payments, error } = await supabase
      .from('guest_payments')
      .select('id, amount, payment_date, status, proof_url, proof_file_name, created_at, notes')
      .eq('guest_id', guestId)
      .eq('event_id', resolvedEventId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to fetch payments' }, { status: 500 })
    }

    return NextResponse.json({ payments: payments || [] })
  } catch (error) {
    console.error('Guest payment list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const eventId = String(formData.get('eventId') || '')
    const guestId = String(formData.get('guestId') || '')
    const shareLink = String(formData.get('shareLink') || '')
    const amount = normalizeAmount(formData.get('amount') as string | null)
    const paymentDate = String(formData.get('paymentDate') || '')
    const notes = String(formData.get('notes') || '')
    const file = formData.get('file') as File | null

    if (!eventId || !guestId || !shareLink || !amount || !paymentDate || !file) {
      return NextResponse.json(
        { error: 'eventId, guestId, shareLink, amount, paymentDate, and file are required' },
        { status: 400 }
      )
    }

    if (!['image/png', 'image/jpeg', 'image/webp', 'application/pdf'].includes(file.type)) {
      return NextResponse.json({ error: 'Only PNG, JPG, WEBP, or PDF proof files are allowed' }, { status: 400 })
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: 'Proof file size exceeds 8MB limit' }, { status: 400 })
    }

    // Validate this share link belongs to the same event.
    const invitation = await validateInvitationLinkForEvent(supabase as any, eventId, shareLink)
    let resolvedEventId = eventId

    if (!invitation) {
      // Fallback: allow over shared link mismatch if the invitation itself exists.
      const { data: fallbackInvitation } = await supabase
        .from('invitation_templates')
        .select('id, event_id')
        .eq('shareable_link', shareLink)
        .maybeSingle()

      if (fallbackInvitation?.event_id) {
        resolvedEventId = fallbackInvitation.event_id
      } else {
        return NextResponse.json({ error: 'Invalid invitation link' }, { status: 403 })
      }
    }

    // Validate guest belongs to event.
    const { data: guest } = await supabase
      .from('guests')
      .select('id, event_id')
      .eq('id', guestId)
      .eq('event_id', resolvedEventId)
      .maybeSingle()

    if (!guest) {
      return NextResponse.json({ error: 'Guest not found for this event' }, { status: 404 })
    }

    if (!invitation) {
      // Fallback: allow over shared link mismatch if the invitation itself exists.
      const { data: fallbackInvitation } = await supabase
        .from('invitation_templates')
        .select('id, event_id')
        .eq('shareable_link', shareLink)
        .maybeSingle()

      if (fallbackInvitation?.event_id) {
        resolvedEventId = fallbackInvitation.event_id
      } else {
        return NextResponse.json({ error: 'Invalid invitation link' }, { status: 403 })
      }
    }

    // Pull event-specific bank details to persist alongside this proof record.
    const { data: eventData } = await supabase
      .from('events')
      .select('bank_account_holder, bank_name, bank_account_number, bank_iban')
      .eq('id', resolvedEventId)
      .maybeSingle()

    const extension = file.name.includes('.') ? file.name.split('.').pop() : 'bin'
    const objectPath = `guest-payments/${resolvedEventId}/${guestId}/${Date.now()}.${extension}`
    const fileBuffer = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage.from('payment-proofs').upload(objectPath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message || 'Failed to upload proof' }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage.from('payment-proofs').getPublicUrl(objectPath)

    const { data: inserted, error: insertError } = await supabase
      .from('guest_payments')
      .insert({
        event_id: resolvedEventId,
        guest_id: guestId,
        payment_method: 'bank_transfer',
        amount,
        payment_date: paymentDate,
        status: 'pending',
        proof_url: publicUrlData.publicUrl,
        proof_file_name: file.name,
        notes: notes || null,
        bank_account_holder: (eventData as any)?.bank_account_holder || null,
        bank_name: (eventData as any)?.bank_name || null,
        bank_account_number: (eventData as any)?.bank_account_number || null,
        bank_iban: (eventData as any)?.bank_iban || null,
      })
      .select('id, amount, payment_date, status, proof_url, proof_file_name, created_at')
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message || 'Failed to save guest payment' }, { status: 500 })
    }

    return NextResponse.json({ success: true, payment: inserted }, { status: 201 })
  } catch (error) {
    console.error('Guest payment upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
