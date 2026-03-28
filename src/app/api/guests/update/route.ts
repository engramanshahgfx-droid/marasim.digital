/* eslint-disable no-useless-escape */
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

// Helper to get authorized user
async function getAuthorizedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return null
  }

  const token = authHeader.replace('Bearer ', '')
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)
  return error ? null : user
}

// Helper to normalize phone numbers for consistent comparison
function normalizePhone(phone: string): string {
  if (!phone) return ''
  // Remove all whitespace, dashes, parentheses, and dots
  return phone.replace(/[\s().-]/g, '').trim()
}

// Helper to validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Helper to validate phone number format
function isValidPhone(phone: string): boolean {
  const normalized = normalizePhone(phone)
  // Basic validation: should be numbers with optional + prefix, minimum 10 digits
  return /^\+?\d{10,15}$/.test(normalized)
}

export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthorizedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { guestId, name, phone, email, plusOnes, notes } = body

    // Validate required fields
    if (!guestId) {
      return NextResponse.json({ error: 'Guest ID is required' }, { status: 400 })
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Guest name is required' }, { status: 400 })
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 })
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Validate phone format
    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Please include country code (e.g., +966)' },
        { status: 400 }
      )
    }

    // Verify guest exists and user has access
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('id, event_id, events!inner(user_id)')
      .eq('id', guestId)
      .single()

    if (guestError || !guest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
    }

    // Check if the event belongs to the user
    if ((guest as any).events.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check for duplicate phone number in this event (excluding current guest)
    const normalizedPhone = normalizePhone(phone)
    const { data: existingGuests } = await supabase
      .from('guests')
      .select('phone, id')
      .eq('event_id', guest.event_id)
      .neq('id', guestId)

    if (existingGuests && existingGuests.length > 0) {
      const duplicate = existingGuests.find((g) => normalizePhone(g.phone) === normalizedPhone)

      if (duplicate) {
        return NextResponse.json(
          { error: 'A guest with this phone number already exists for this event' },
          { status: 409 }
        )
      }
    }

    // Parse plus ones (default to 0)
    const plusOnesCount = parseInt(String(plusOnes || '0'), 10) || 0

    // Update guest record
    const updateData = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      plus_ones: plusOnesCount,
      notes: notes?.trim() || null,
      updated_at: new Date().toISOString(),
    }

    const { data: updatedGuest, error: updateError } = await supabase
      .from('guests')
      .update(updateData)
      .eq('id', guestId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating guest:', updateError)
      return NextResponse.json({ error: `Failed to update guest: ${updateError.message}` }, { status: 500 })
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Guest updated successfully',
        guest: {
          id: updatedGuest.id,
          name: updatedGuest.name,
          phone: updatedGuest.phone,
          email: updatedGuest.email,
          plusOnes: updatedGuest.plus_ones,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in update guest API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
