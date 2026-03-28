// Update/Remove individual cart items
// Location: src/app/api/cart/items/[id]/route.ts
// Methods: PATCH (update), DELETE (remove)

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// PATCH: Update cart item
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cartItemId = params.id

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    const guestIdParam = request.nextUrl.searchParams.get('guestId')
    let guestId = guestIdParam || ''

    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: userData, error: authError } = await supabase.auth.getUser(token)
      if (!authError && userData.user) {
        guestId = userData.user.id
      }
    }

    if (!guestId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { quantity, notes } = body

    // Verify cart item belongs to user
    const { data: existingItem, error: fetchError } = await supabase
      .from('cart_items')
      .select('id, guest_id')
      .eq('id', cartItemId)
      .single()

    if (fetchError || !existingItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 })
    }

    if (existingItem.guest_id !== guestId) {
      return NextResponse.json({ error: 'Unauthorized access to cart item' }, { status: 403 })
    }

    // Update the item
    const updateData: any = { updated_at: new Date().toISOString() }
    if (quantity !== undefined) {
      if (quantity < 1) {
        return NextResponse.json({ error: 'Quantity must be at least 1' }, { status: 400 })
      }
      updateData.quantity = quantity
    }
    if (notes !== undefined) {
      updateData.notes = notes
    }

    const { data: updatedItem, error: updateError } = await supabase
      .from('cart_items')
      .update(updateData)
      .eq('id', cartItemId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating cart item:', updateError)
      return NextResponse.json({ error: 'Failed to update cart item' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: updatedItem })
  } catch (error) {
    console.error('Update cart item error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Remove cart item
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cartItemId = params.id

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    const guestIdParam = request.nextUrl.searchParams.get('guestId')
    let guestId = guestIdParam || ''

    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: userData, error: authError } = await supabase.auth.getUser(token)
      if (!authError && userData.user) {
        guestId = userData.user.id
      }
    }

    if (!guestId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify cart item belongs to user
    const { data: existingItem, error: fetchError } = await supabase
      .from('cart_items')
      .select('id, guest_id')
      .eq('id', cartItemId)
      .single()

    if (fetchError || !existingItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 })
    }

    if (existingItem.guest_id !== guestId) {
      return NextResponse.json({ error: 'Unauthorized access to cart item' }, { status: 403 })
    }

    // Delete the item
    const { error: deleteError } = await supabase.from('cart_items').delete().eq('id', cartItemId)

    if (deleteError) {
      console.error('Error deleting cart item:', deleteError)
      return NextResponse.json({ error: 'Failed to delete cart item' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Item removed from cart' })
  } catch (error) {
    console.error('Delete cart item error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
