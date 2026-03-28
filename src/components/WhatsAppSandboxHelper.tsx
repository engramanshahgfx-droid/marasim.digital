/**
 * WhatsApp Sandbox Helper Component
 * Shows sandboxed recipients how to join the Twilio WhatsApp sandbox
 *
 * Usage:
 * <WhatsAppSandboxHelper
 *   recipientPhone="+923409557583"
 *   sandboxCode="welcome-mango-42"
 * />
 */

import React from 'react'

interface WhatsAppSandboxHelperProps {
  recipientPhone?: string
  sandboxCode?: string
  mode?: 'modal' | 'inline' | 'toast'
  isArabic?: boolean
}

export const WhatsAppSandboxHelper: React.FC<WhatsAppSandboxHelperProps> = ({
  recipientPhone,
  sandboxCode,
  mode = 'inline',
  isArabic = false,
}) => {
  const envSandboxCode = getSandboxCode()
  const resolvedSandboxCode = sandboxCode || envSandboxCode || ''
  const isUsingFallbackSandboxCode = !sandboxCode && !envSandboxCode
  const joinText = resolvedSandboxCode ? `join ${resolvedSandboxCode}` : 'join <your-sandbox-code>'
  const joinLink = resolvedSandboxCode
    ? `https://wa.me/14155238886?text=${encodeURIComponent(joinText)}`
    : 'https://wa.me/14155238886'

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(joinText)
    } catch {
      // Gracefully fallback when clipboard permissions are denied/dismissed.
      if (typeof window !== 'undefined') {
        window.prompt(isArabic ? 'انسخ رمز الانضمام:' : 'Copy this join code:', joinText)
      }
    }
  }

  if (mode === 'inline') {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm">
        <div className="flex gap-3">
          <div className="text-2xl">⚠️</div>
          <div className="flex-1">
            <h4 className="font-semibold text-yellow-900">WhatsApp Sandbox Mode</h4>
            <p className="mt-1 text-yellow-800">
              {isArabic
                ? 'تعذر تسليم الرسالة لأن المستلم لم ينضم إلى WhatsApp Sandbox بعد.'
                : "This message couldn't be delivered. The recipient hasn't joined the WhatsApp Sandbox yet."}
            </p>

            <div className="mt-3 space-y-2">
              <p className="font-medium text-yellow-900">
                {isArabic ? 'لإصلاح المشكلة، يجب على المستلم:' : 'To fix this, the recipient must:'}
              </p>
              <ol className="list-inside list-decimal space-y-1 text-yellow-800">
                <li>
                  {isArabic ? 'إرسال الرسالة التالية إلى ' : 'Send this message to '}
                  <strong>+14155238886</strong>
                  {isArabic ? ' من واتساب:' : ' from WhatsApp:'}
                </li>
              </ol>

              <div className="mt-2 flex items-center gap-2 rounded bg-white p-2">
                <code className="flex-1 font-mono text-sm text-gray-900">join {resolvedSandboxCode}</code>
                <button
                  onClick={copyToClipboard}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-100"
                  title="Copy to clipboard"
                >
                  {isArabic ? 'نسخ' : 'Copy'}
                </button>
              </div>

              <a
                href={joinLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded bg-yellow-700 px-3 py-2 text-xs font-medium text-white hover:bg-yellow-800"
              >
                {isArabic ? 'فتح واتساب مع رمز الانضمام' : 'Open WhatsApp with Join Code'}
              </a>

              <p className="text-xs text-yellow-700">
                {isArabic
                  ? 'بعد الانضمام، انتظر 2-3 دقائق ثم أعد إرسال الدعوة.'
                  : 'After they join, wait 2-3 minutes and try sending the invitation again.'}
              </p>

              <div className="rounded border border-yellow-300 bg-white/70 p-2 text-xs text-yellow-900">
                {isArabic
                  ? 'إذا كانت ميزات الخصوصية مفعلة في Twilio، فقد يتم الاحتفاظ برقم الهاتف مؤقتاً لمدة تصل إلى 3 أيام.'
                  : 'If Privacy features are enabled in Twilio, the sandbox may temporarily store the phone number for up to 3 days.'}
              </div>

              <div className="rounded border border-yellow-300 bg-white/70 p-2 text-xs text-yellow-900">
                {isArabic
                  ? 'قد لا ينجح Sandbox دائماً في تسليم الرسائل الدولية. للحصول على أفضل نتيجة، استخدم مرسل WhatsApp مسجلاً.'
                  : 'Sandbox may not reliably deliver international messages. For best results, register your own WhatsApp sender.'}
              </div>

              {isUsingFallbackSandboxCode && (
                <div className="rounded border border-amber-400 bg-amber-100 p-2 text-xs text-amber-900">
                  {isArabic
                    ? 'تنبيه إعدادات: لا يوجد رمز انضمام مضبوط. اضبط NEXT_PUBLIC_TWILIO_SANDBOX_CODE لعرض رمز الانضمام الصحيح.'
                    : 'Configuration warning: sandbox join code is not configured. Set NEXT_PUBLIC_TWILIO_SANDBOX_CODE to show the exact join command.'}
                </div>
              )}
            </div>

            <div className="mt-4 border-t border-yellow-200 pt-3 text-xs text-yellow-700">
              <strong>{isArabic ? 'ملاحظة الإنتاج:' : 'Production Note:'}</strong>{' '}
              {isArabic
                ? 'في بيئة الإنتاج، استخدم رقم WhatsApp Business مسجلًا بدلًا من Sandbox.'
                : 'In production, use a registered WhatsApp Business Number instead of the sandbox.'}
            </div>

            {recipientPhone && (
              <div className="mt-2 text-xs text-yellow-700">
                {isArabic ? `رقم المستلم الذي فشل: ${recipientPhone}` : `Failed recipient phone: ${recipientPhone}`}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'toast') {
    return (
      <div className="fixed bottom-4 right-4 max-w-md rounded-lg border border-yellow-300 bg-yellow-100 p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="text-xl">⚠️</div>
          <div className="flex-1">
            <p className="font-semibold text-yellow-900">WhatsApp Sandbox Message Failed</p>
            <p className="mt-1 text-sm text-yellow-800">
              {isArabic
                ? `يجب على المستلم الانضمام إلى Sandbox أولاً. أرسل "join ${resolvedSandboxCode}" إلى +14155238886.`
                : `Recipient needs to join sandbox. Send "join ${resolvedSandboxCode}" to +14155238886 first.`}
            </p>
            <button
              onClick={copyToClipboard}
              className="mt-2 text-xs font-medium text-yellow-700 underline hover:text-yellow-900"
            >
              {isArabic ? 'نسخ رمز الانضمام' : 'Copy join code'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

/**
 * Improve error messages from WhatsApp failures
 */
export function formatWhatsAppError(error: string, sandboxCode?: string): string {
  if (error.includes('not joined to')) {
    return `⚠️ Recipient hasn't joined WhatsApp Sandbox.\n\nHave them send: "join ${sandboxCode || 'CODE'}" to +14155238886`
  }

  if (error.includes('SMS pumping')) {
    return '❌ Message blocked for security (SMS pumping fraud detected)\n\nContact Twilio support or use a verified business account'
  }

  if (error.includes('invalid')) {
    return '❌ Invalid phone number format\n\nMake sure phone is in format: +{country-code}{number}'
  }

  return error
}

/**
 * Get sandbox code from environment or pass as prop
 */
export function getSandboxCode(): string | null {
  // This would come from your Twilio API in production
  // For now, return from env or null
  const configuredCode = (process.env.NEXT_PUBLIC_TWILIO_SANDBOX_CODE || '').trim()
  return configuredCode || null
}
