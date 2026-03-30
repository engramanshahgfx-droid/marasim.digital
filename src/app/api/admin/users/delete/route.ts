import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const { adminId, userId } = await request.json()

    if (!adminId || !userId) {
      return NextResponse.json({ error: 'adminId and userId are required' }, { status: 400 })
    }

    // Verify requester is a super_admin
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('role')
      .eq('id', adminId)
      .single()

    if (adminError || (admin as any)?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }

    // Prevent admin from deleting themselves
    if (adminId === userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Prevent deleting other super_admins
    const { data: targetUser, error: targetError } = await supabase
      .from('users')
      .select('role, email')
      .eq('id', userId)
      .single()

    if (targetError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if ((targetUser as any).role === 'super_admin') {
      return NextResponse.json({ error: 'Cannot delete a super admin account' }, { status: 403 })
    }

    // Delete from app users table first
    const { error: deleteProfileError } = await supabase.from('users').delete().eq('id', userId)

    if (deleteProfileError) {
      return NextResponse.json({ error: deleteProfileError.message || 'Failed to delete user profile' }, { status: 500 })
    }

    // Delete from Supabase Auth
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId)

    if (deleteAuthError) {
      // Profile already deleted — log but don't fail
      console.error('Failed to delete auth user:', deleteAuthError.message)
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (error: any) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
