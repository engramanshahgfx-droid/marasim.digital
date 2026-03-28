import { sendPendingReminders } from '@/lib/reminderService'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/cron/reminders
 * This endpoint is called by Vercel Cron to send pending reminders
 * Vercel automatically verifies the request using the CRON_SECRET
 */
export async function GET(request: NextRequest) {
  try {
    // Verify that the request is from Vercel Cron
    const authHeader = request.headers.get('authorization')
    const expectedSecret = process.env.CRON_SECRET || ''

    if (!expectedSecret) {
      console.warn('CRON_SECRET not set - cron jobs disabled')
      return NextResponse.json({ message: 'Cron not configured' }, { status: 400 })
    }

    if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Determine which reminders to send based on query parameter
    const reminderType = request.nextUrl.searchParams.get('type') || 'initial'

    // Send reminders
    const result = await sendPendingReminders(reminderType)

    return NextResponse.json({
      success: true,
      message: `Cron job completed: ${result.message}`,
      remindersCount: result.remindersCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cron reminder error:', error)
    return NextResponse.json(
      {
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
