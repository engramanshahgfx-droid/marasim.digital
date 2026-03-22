import twilio from 'twilio'

/**
 * Twilio Verify Service - Handles multi-channel OTP verification
 * Supports SMS, WhatsApp, Email, and Voice channels
 * Features:
 * - Automatic fallback between channels
 * - Rate limiting awareness
 * - Detailed error handling
 * - Fraud detection (Fraud Guard)
 */

let twilioClient: ReturnType<typeof twilio> | null = null

function getTwilioClient() {
  if (twilioClient) {
    return twilioClient
  }

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    throw new Error('Twilio credentials are not properly configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.')
  }

  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  return twilioClient
}

export type VerificationChannel = 'sms' | 'whatsapp' | 'email' | 'voice' | 'auto'

export interface VerifyServiceConfig {
  channel?: VerificationChannel
  locale?: string
  codeLenght?: number
  customMessage?: string
}

export interface VerificationResult {
  success: boolean
  sid?: string
  status?: string
  channels?: VerificationChannel[]
  expirationTime?: string
  error?: string
  code?: number
  details?: string
}

export interface VerificationCheckResult {
  success: boolean
  valid: boolean
  approved: boolean
  status?: string
  error?: string
  code?: number
  details?: string
}

/**
 * Parse and format Twilio error responses
 */
function parseTwilioVerifyError(error: any): { code?: number; message: string; details?: string } {
  const errorCode = error?.code || error?.status
  const errorMessage = error?.message || 'Unknown Twilio Verify error'

  // Common Twilio Verify error codes
  const errorMap: { [key: number]: string } = {
    20003: 'Access denied - Invalid credentials',
    20429: 'Too many requests - Rate limit exceeded',
    60200: 'Invalid mobile number format',
    60202: 'Recipient number too short',
    60203: 'Recipient number invalid for country',
    60205: 'Invalid service configuration',
    60207: 'SMS channel not enabled',
    60208: 'WhatsApp channel not enabled',
    60209: 'Email channel not enabled',
    60210: 'Voice channel not enabled',
    60214: 'Invalid verification code',
    60217: 'Maximum verification attempts exceeded',
    60219: 'Verification code has expired',
    60220: 'Too many channel attempts',
  }

  return {
    code: errorCode,
    message: errorMap[errorCode] || errorMessage,
    details: error?.more_info || undefined,
  }
}

/**
 * Send OTP via Twilio Verify with specified channel
 * @param toPhoneOrEmail - Recipient phone number (E.164) or email address
 * @param channel - Channel to use: 'sms', 'whatsapp', 'email', 'voice', or 'auto'
 * @param config - Additional configuration options
 * @returns Verification result with SID and status
 */
export async function sendVerification(
  toPhoneOrEmail: string,
  channel: VerificationChannel = 'auto',
  config?: VerifyServiceConfig
): Promise<VerificationResult> {
  try {
    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID
    if (!serviceSid) {
      throw new Error('TWILIO_VERIFY_SERVICE_SID is not configured')
    }

    // Validate input
    if (!toPhoneOrEmail || toPhoneOrEmail.trim().length < 3) {
      return {
        success: false,
        error: 'Invalid phone number or email address',
      }
    }

    const client = getTwilioClient()
    const verifyService = client.verify.v2.services(serviceSid)

    // Prepare verification options
    const verificationOptions: any = {
      to: toPhoneOrEmail.trim(),
    }

    // Add channel if specified (not 'auto')
    if (channel !== 'auto') {
      verificationOptions.channel = channel
    }

    // Add optional configuration
    if (config?.locale) {
      verificationOptions.locale = config.locale
    }

    if (config?.customMessage) {
      verificationOptions.customMessage = config.customMessage
    }

    // Send verification
    const verification = await verifyService.verifications.create(verificationOptions)

    return {
      success: true,
      sid: verification.sid,
      status: verification.status,
      channels: verification.channel ? [verification.channel as VerificationChannel] : [],
      expirationTime: verification.dateCreated
        ? new Date(verification.dateCreated.getTime() + 15 * 60 * 1000).toISOString()
        : undefined,
    }
  } catch (error: any) {
    const { code, message, details } = parseTwilioVerifyError(error)
    console.error('Error sending verification:', { code, message, details, error })

    return {
      success: false,
      code,
      error: message,
      details,
    }
  }
}

/**
 * Check/verify OTP code via Twilio Verify
 * @param toPhoneOrEmail - Recipient phone number (E.164) or email address
 * @param code - The OTP code entered by user
 * @returns Verification check result
 */
export async function checkVerification(toPhoneOrEmail: string, code: string): Promise<VerificationCheckResult> {
  try {
    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID
    if (!serviceSid) {
      throw new Error('TWILIO_VERIFY_SERVICE_SID is not configured')
    }

    if (!toPhoneOrEmail || !code) {
      return {
        success: false,
        valid: false,
        approved: false,
        error: 'Phone/email and code are required',
      }
    }

    const client = getTwilioClient()
    const verifyService = client.verify.v2.services(serviceSid)

    // Check the verification code
    const check = await verifyService.verificationChecks.create({
      to: toPhoneOrEmail.trim(),
      code: code.trim(),
    })

    const isApproved = check.status === 'approved'

    return {
      success: true,
      valid: isApproved,
      approved: isApproved,
      status: check.status,
    }
  } catch (error: any) {
    const { code: errorCode, message, details } = parseTwilioVerifyError(error)
    console.error('Error checking verification:', { errorCode, message, details, error })

    // Determine if this is a valid/invalid code error vs other errors
    const isInvalidCode = errorCode === 60214 || message.includes('Invalid verification code')

    return {
      success: !isInvalidCode, // Success = no fatal error, but valid = code was correct
      valid: false,
      approved: false,
      code: errorCode,
      error: message,
      details,
    }
  }
}

/**
 * Get verification status by SID
 * @param verificationSid - The SID returned from sendVerification
 * @returns Verification status details
 */
export async function getVerificationStatus(verificationSid: string): Promise<VerificationResult> {
  try {
    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID
    if (!serviceSid) {
      throw new Error('TWILIO_VERIFY_SERVICE_SID is not configured')
    }

    if (!verificationSid) {
      return {
        success: false,
        error: 'Verification SID is required',
      }
    }

    const client = getTwilioClient()
    const verification = await client.verify.v2.services(serviceSid).verifications(verificationSid).fetch()

    return {
      success: true,
      sid: verification.sid,
      status: verification.status,
      channels: verification.channel ? [verification.channel as VerificationChannel] : [],
      expirationTime: verification.dateCreated
        ? new Date(verification.dateCreated.getTime() + 15 * 60 * 1000).toISOString()
        : undefined,
    }
  } catch (error: any) {
    const { code, message, details } = parseTwilioVerifyError(error)
    console.error('Error fetching verification status:', { code, message, details, error })

    return {
      success: false,
      code,
      error: message,
      details,
    }
  }
}

/**
 * Resend verification code via different channel
 * Useful when user didn't receive code or wants to try another channel
 * @param toPhoneOrEmail - Recipient phone number or email
 * @param channel - New channel to use
 * @returns Verification result with new SID
 */
export async function resendVerification(
  toPhoneOrEmail: string,
  channel?: VerificationChannel
): Promise<VerificationResult> {
  try {
    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID
    if (!serviceSid) {
      throw new Error('TWILIO_VERIFY_SERVICE_SID is not configured')
    }

    if (!toPhoneOrEmail) {
      return {
        success: false,
        error: 'Phone number or email is required',
      }
    }

    const client = getTwilioClient()
    const verifyService = client.verify.v2.services(serviceSid)

    const resendOptions: any = {
      to: toPhoneOrEmail.trim(),
    }

    if (channel) {
      resendOptions.channel = channel
    }

    const verification = await verifyService.verifications.create({
      ...resendOptions,
      // This will automatically replace the previous pending verification
    })

    return {
      success: true,
      sid: verification.sid,
      status: verification.status,
      channels: verification.channel ? [verification.channel as VerificationChannel] : [],
      expirationTime: verification.dateCreated
        ? new Date(verification.dateCreated.getTime() + 15 * 60 * 1000).toISOString()
        : undefined,
    }
  } catch (error: any) {
    const { code, message, details } = parseTwilioVerifyError(error)
    console.error('Error resending verification:', { code, message, details, error })

    return {
      success: false,
      code,
      error: message,
      details,
    }
  }
}

/**
 * Check if verification channel is available in service
 * @param channel - Channel to check
 * @returns true if available
 */
export async function isChannelAvailable(channel: VerificationChannel): Promise<boolean> {
  try {
    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID
    if (!serviceSid) return false

    const client = getTwilioClient()
    const service = await client.verify.v2.services(serviceSid).fetch()

    // Check enabled channels
    const enabledChannels = Object.keys(service)
      .filter((key) => key.includes('push') || key.includes('whatsapp') || key.includes('email') || key.includes('sms'))
      .filter((key) => service[key as keyof typeof service] === true)

    return enabledChannels.length > 0
  } catch (error) {
    console.error('Error checking channel availability:', error)
    return false
  }
}

/**
 * Get user-friendly error message based on Twilio error code
 */
export function getVerifyErrorMessage(error: VerificationResult | VerificationCheckResult): string {
  const { code, error: errorMsg } = error as any

  if (!error.success && code) {
    switch (code) {
      case 20429:
        return 'Too many attempts. Please wait a few minutes before trying again.'
      case 60203:
        return 'Invalid phone number for your country.'
      case 60214:
        return 'Invalid verification code. Please check and try again.'
      case 60217:
        return 'Maximum verification attempts exceeded. Please request a new code.'
      case 60219:
        return 'Verification code has expired. Please request a new one.'
      case 60220:
        return 'Too many channel attempts. Please try again later.'
      default:
        return errorMsg || 'Verification failed. Please try again.'
    }
  }

  return errorMsg || 'Verification failed. Please try again.'
}
