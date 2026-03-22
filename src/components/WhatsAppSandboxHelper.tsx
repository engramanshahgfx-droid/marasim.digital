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
}

export const WhatsAppSandboxHelper: React.FC<WhatsAppSandboxHelperProps> = ({
  recipientPhone,
  sandboxCode = 'welcome-mango-42',
  mode = 'inline',
}) => {
  const instructionText = `Send this message to +14155238886:\n\njoin ${sandboxCode}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`join ${sandboxCode}`)
  }

  if (mode === 'inline') {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm">
        <div className="flex gap-3">
          <div className="text-2xl">⚠️</div>
          <div className="flex-1">
            <h4 className="font-semibold text-yellow-900">WhatsApp Sandbox Mode</h4>
            <p className="mt-1 text-yellow-800">
              This message couldn't be delivered. The recipient hasn't joined the WhatsApp Sandbox yet.
            </p>

            <div className="mt-3 space-y-2">
              <p className="font-medium text-yellow-900">To fix this, the recipient must:</p>
              <ol className="list-inside list-decimal space-y-1 text-yellow-800">
                <li>
                  Send this message to <strong>+14155238886</strong> from WhatsApp:
                </li>
              </ol>

              <div className="mt-2 flex items-center gap-2 rounded bg-white p-2">
                <code className="flex-1 font-mono text-sm text-gray-900">join {sandboxCode}</code>
                <button
                  onClick={copyToClipboard}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-100"
                  title="Copy to clipboard"
                >
                  📋 Copy
                </button>
              </div>

              <p className="text-xs text-yellow-700">
                After they join, wait 2-3 minutes and try sending the invitation again.
              </p>
            </div>

            <div className="mt-4 border-t border-yellow-200 pt-3 text-xs text-yellow-700">
              <strong>Production Note:</strong> In production, use a registered WhatsApp Business Number instead of the
              sandbox.
            </div>
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
              Recipient needs to join sandbox. Send "join {sandboxCode}" to +14155238886 first.
            </p>
            <button
              onClick={copyToClipboard}
              className="mt-2 text-xs font-medium text-yellow-700 underline hover:text-yellow-900"
            >
              Copy join code
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
  return process.env.NEXT_PUBLIC_TWILIO_SANDBOX_CODE || null
}
