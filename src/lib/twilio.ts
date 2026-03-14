import twilio from 'twilio'

let twilioClient: ReturnType<typeof twilio> | null = null

function getTwilioClient() {
  if (twilioClient) {
    return twilioClient
  }

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    throw new Error('Twilio credentials are not properly configured')
  }

  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  return twilioClient
}

function formatTwilioWhatsAppError(error: any): string {
  const twilioCode = error?.code
  const twilioMessage = error?.message || 'Unknown error from Twilio'

  // Sandbox-specific guidance
  if (twilioCode === 63007) {
    return 'Twilio WhatsApp sender is not configured. Set TWILIO_WHATSAPP_NUMBER to your Sandbox/approved sender (e.g. +14155238886) or configure a registered WhatsApp sender.'
  }

  if (twilioCode === 63015) {
    return 'Recipient is not joined to Twilio WhatsApp Sandbox. Send the sandbox join code to +14155238886 from the recipient WhatsApp number first.'
  }

  const baseMessage = twilioMessage || 'An unknown Twilio error occurred while sending WhatsApp message.'
  return twilioCode ? `Twilio error ${twilioCode}: ${baseMessage}` : baseMessage
}

function getTwilioWhatsAppErrorHint(errorCode?: number | null): string | null {
  if (!errorCode) return null

  if (errorCode === 63015) {
    return 'Recipient is not joined to Twilio WhatsApp Sandbox. Send the sandbox join code to +14155238886 from the recipient WhatsApp number first.'
  }

  if (errorCode === 63007) {
    return 'Twilio WhatsApp sender is not configured for this account. Set TWILIO_WHATSAPP_NUMBER to sandbox sender or your approved WhatsApp sender.'
  }

  return null
}

/**
 * Send a free-form WhatsApp message
 * Note: In Sandbox, this only works after the recipient has replied to a template message
 * For initial business-initiated messages, use sendWhatsAppTemplate()
 */
export async function sendWhatsAppMessage(toPhoneNumber: string, message: string, mediaUrl?: string) {
  try {
    // Use dedicated WhatsApp sender if set, otherwise fall back to TWILIO_PHONE_NUMBER
    const whatsappSender = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER
    if (!whatsappSender) {
      throw new Error('TWILIO_WHATSAPP_NUMBER or TWILIO_PHONE_NUMBER is not configured')
    }

    const fromAddress = normalizeWhatsAppAddress(whatsappSender)
    const toAddress = normalizeWhatsAppAddress(toPhoneNumber)

    const msgData: any = {
      from: fromAddress,
      to: toAddress,
    }

    if (mediaUrl) {
      msgData.mediaUrl = [mediaUrl]
    } else {
      msgData.body = message
    }

    const response = await getTwilioClient().messages.create(msgData)
    return response
  } catch (error: any) {
    const formatted = formatTwilioWhatsAppError(error)
    console.error('Error sending WhatsApp message:', formatted, error)
    throw new Error(formatted)
  }
}

/**
 * Send a template-based WhatsApp message (required for Sandbox business-initiated conversations)
 * @param toPhoneNumber - Recipient's WhatsApp number
 * @param contentSid - Twilio template SID (e.g. 'HXb5b62575e6e4ff6129ad7c8efe1f983e')
 * @param contentVariables - JSON string with template variables (e.g. '{"1":"12/1","2":"3pm"}')
 */
export async function sendWhatsAppTemplate(toPhoneNumber: string, contentSid: string, contentVariables?: string) {
  try {
    const whatsappSender = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER
    if (!whatsappSender) {
      throw new Error('TWILIO_WHATSAPP_NUMBER or TWILIO_PHONE_NUMBER is not configured')
    }

    const fromAddress = normalizeWhatsAppAddress(whatsappSender)
    const toAddress = normalizeWhatsAppAddress(toPhoneNumber)

    const msgData: any = {
      from: fromAddress,
      to: toAddress,
      contentSid,
    }

    if (contentVariables) {
      msgData.contentVariables = contentVariables
    }

    const response = await getTwilioClient().messages.create(msgData)
    return response
  } catch (error: any) {
    const formatted = formatTwilioWhatsAppError(error)
    console.error('Error sending WhatsApp template:', formatted, error)
    throw new Error(formatted)
  }
}

export async function sendBulkWhatsAppMessages(
  recipients: Array<{ phone: string; message: string; mediaUrl?: string }>
) {
  const results = []
  const errors = []

  for (const recipient of recipients) {
    try {
      const response = await sendWhatsAppMessage(recipient.phone, recipient.message, recipient.mediaUrl)
      results.push({ phone: recipient.phone, status: response.status || 'queued', sid: response.sid })
    } catch (error) {
      errors.push({ phone: recipient.phone, error: String(error) })
    }
  }

  return { results, errors }
}

/**
 * Send bulk WhatsApp template messages
 * Useful for Sandbox business-initiated conversations requiring pre-approved templates
 */
export async function sendBulkWhatsAppTemplates(
  recipients: Array<{ phone: string; contentSid: string; contentVariables?: string }>
) {
  const results = []
  const errors = []

  for (const recipient of recipients) {
    try {
      const response = await sendWhatsAppTemplate(recipient.phone, recipient.contentSid, recipient.contentVariables)
      results.push({ phone: recipient.phone, status: response.status || 'queued', sid: response.sid })
    } catch (error) {
      errors.push({ phone: recipient.phone, error: String(error) })
    }
  }

  return { results, errors }
}

export function getInvitationTemplateConfig(): { contentSid: string; templateName: string } {
  const templateSid = process.env.TWILIO_INVITATION_TEMPLATE_SID || 'HXb5b62575e6e4ff6129ad7c8efe1f983e'
  return {
    contentSid: templateSid,
    templateName: 'Appointment Reminders',
  }
}

/**
 * Format template variables for WhatsApp invitation template
 * @param guestName - Name of the guest
 * @param eventName - Name of the event
 * @param eventDate - Event date (e.g., "March 15, 2026")
 * @param eventTime - Event time (e.g., "3:00 PM")
 * @returns JSON string with template variables for {{1}} and {{2}}
 */
export function formatInvitationTemplateVariables(
  guestName: string,
  eventName: string,
  eventDate: string,
  eventTime: string,
  qrToken?: string
): string {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
  const checkInLink = qrToken ? `${appUrl}/check-in?code=${encodeURIComponent(qrToken)}` : ''
  const qrLink = qrToken ? `https://quickchart.io/qr?size=320&text=${encodeURIComponent(qrToken)}` : ''

  // Template uses {{1}} and {{2}} placeholders from Twilio's sample template.
  const variables = {
    1: `${eventDate} at ${eventTime}`,
    2: qrToken
      ? `Please confirm your attendance. Event: ${eventName}. Your check-in code: ${qrToken}. QR: ${qrLink}${checkInLink ? ` | Link: ${checkInLink}` : ''}`
      : `Please confirm your attendance. Event: ${eventName}`,
  }

  void guestName
  return JSON.stringify(variables)
}

export async function checkWhatsAppMessageStatus(messageSid: string) {
  try {
    const message = await getTwilioClient().messages(messageSid).fetch()
    const errorHint = getTwilioWhatsAppErrorHint(message.errorCode)
    return {
      status: message.status,
      sentAt: message.dateSent,
      errorMessage: message.errorMessage,
      errorCode: message.errorCode,
      errorHint,
    }
  } catch (error) {
    console.error('Error checking message status:', error)
    throw error
  }
}

export async function getLatestWhatsAppStatusForRecipient(toPhoneNumber: string) {
  try {
    const senderInfo = getWhatsAppSenderInfo()
    const toAddress = normalizeWhatsAppAddress(toPhoneNumber)
    const messages = await getTwilioClient().messages.list({ to: toAddress, limit: 20 })
    const latestOutbound = messages.find((message) => {
      if (!senderInfo.sender) return true
      return message.direction === 'outbound-api' && message.from === senderInfo.sender
    })

    if (!latestOutbound) {
      return null
    }

    return {
      sid: latestOutbound.sid,
      status: latestOutbound.status,
      sentAt: latestOutbound.dateSent,
      errorCode: latestOutbound.errorCode,
      errorMessage: latestOutbound.errorMessage,
      errorHint: getTwilioWhatsAppErrorHint(latestOutbound.errorCode),
    }
  } catch (error) {
    console.error('Error fetching latest WhatsApp status for recipient:', error)
    return null
  }
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '')

  if (!cleaned.startsWith('+')) {
    return `+966${cleaned.slice(-9)}`
  }

  return cleaned
}

function normalizeWhatsAppAddress(value: string): string {
  const trimmed = value.trim()

  if (trimmed.startsWith('whatsapp:')) {
    return trimmed
  }

  return `whatsapp:${formatPhoneNumber(trimmed)}`
}

export function getWhatsAppSenderInfo(): { sender: string | null; isSandbox: boolean } {
  const sender = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER || null
  if (!sender) {
    return { sender: null, isSandbox: false }
  }

  const normalizedSender = formatPhoneNumber(sender)
  return {
    sender: `whatsapp:${normalizedSender}`,
    isSandbox: normalizedSender === '+14155238886',
  }
}

// ── Twilio Verify (OTP)

export async function sendOTP(toPhoneNumber: string): Promise<{ success: boolean; error?: string }> {
  try {
    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID
    if (!serviceSid) throw new Error('TWILIO_VERIFY_SERVICE_SID is not configured')

    await getTwilioClient().verify.v2.services(serviceSid).verifications.create({ to: toPhoneNumber, channel: 'sms' })

    return { success: true }
  } catch (error) {
    console.error('Error sending OTP:', error)
    return { success: false, error: String(error) }
  }
}

export async function verifyOTP(
  toPhoneNumber: string,
  code: string
): Promise<{ success: boolean; valid: boolean; error?: string }> {
  try {
    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID
    if (!serviceSid) throw new Error('TWILIO_VERIFY_SERVICE_SID is not configured')

    const check = await getTwilioClient()
      .verify.v2.services(serviceSid)
      .verificationChecks.create({ to: toPhoneNumber, code })

    return { success: true, valid: check.status === 'approved' }
  } catch (error) {
    console.error('Error verifying OTP:', error)
    return { success: false, valid: false, error: String(error) }
  }
}
