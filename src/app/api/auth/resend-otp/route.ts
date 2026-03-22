import { getVerifyErrorMessage, resendVerification } from '@/lib/verifyService'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Resend verification code via different channel
 * Used when user didn't receive code or wants to try another channel
 */
export async function POST(request: NextRequest) {
  try {
    const { phone, channel, email } = await request.json()

    // Must provide either phone or email and a channel
    if (!phone && !email) {
      return NextResponse.json({ error: 'Phone number or email is required' }, { status: 400 })
    }

    if (!channel) {
      return NextResponse.json({ error: 'Channel is required (sms, whatsapp, email, or voice)' }, { status: 400 })
    }

    // If email provided, resend via Resend (email service)
    if (email && channel === 'email') {
      return NextResponse.json({ error: 'Email resend not yet implemented. Please contact support.' }, { status: 501 })
    }

    // For phone, use Twilio Verify
    if (phone) {
      const result = await resendVerification(phone, channel as any)

      if (!result.success) {
        const errorMessage = getVerifyErrorMessage(result)
        console.error('Resend verification failed:', result)
        return NextResponse.json({ error: errorMessage }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: `Verification code resent via ${channel}.`,
        channel: result.channels?.[0] || channel,
        recipient: phone,
      })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error: any) {
    console.error('Resend OTP error:', error)
    return NextResponse.json({ error: error.message || 'Failed to resend verification code' }, { status: 500 })
  }
}
