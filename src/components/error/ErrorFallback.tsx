// Reusable Error Fallback Component
// Location: src/components/error/ErrorFallback.tsx

'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

interface ErrorFallbackProps {
  error?: string
  title?: string
  description?: string
  showContactSupport?: boolean
  actionLabel?: string
  actionHref?: string
}

export function ErrorFallback({
  error = 'An unexpected error occurred',
  title,
  description,
  showContactSupport = true,
  actionLabel,
  actionHref,
}: ErrorFallbackProps) {
  const params = useParams()
  const locale = (params.locale as string) || 'en'
  const isArabic = locale === 'ar'

  const defaultTitle = isArabic ? 'حدث خطأ' : 'Error'
  const defaultDescription = isArabic
    ? 'يرجى المحاولة مرة أخرى أو الاتصال بالدعم'
    : 'Please try again or contact support'

  return (
    <div
      className={`flex min-h-64 items-center justify-center rounded-lg border border-red-200 bg-gradient-to-br from-red-50 to-pink-50 p-6 ${
        isArabic ? 'rtl' : 'ltr'
      }`}
    >
      <div className="w-full max-w-sm text-center">
        {/* Error Icon */}
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Title and Description */}
        <h3 className="mb-2 text-lg font-bold text-red-900">{title || defaultTitle}</h3>
        <p className="mb-4 text-sm text-red-700">{description || defaultDescription}</p>

        {/* Error Details */}
        {error && (
          <p className="mb-4 break-words rounded bg-red-100 px-3 py-2 font-mono text-xs text-red-600">{error}</p>
        )}

        {/* Action Buttons */}
        <div className={`flex gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 rounded bg-red-600 px-4 py-2 font-semibold text-white transition duration-200 hover:bg-red-700"
          >
            {isArabic ? 'إعادة محاولة' : 'Retry'}
          </button>

          {actionHref && actionLabel && (
            <Link
              href={actionHref}
              className="flex-1 rounded bg-gray-200 px-4 py-2 font-semibold text-gray-900 transition duration-200 hover:bg-gray-300"
            >
              {actionLabel}
            </Link>
          )}

          {showContactSupport && (
            <Link
              href={`/${locale}/contact`}
              className="flex-1 rounded bg-blue-600 px-4 py-2 font-semibold text-white transition duration-200 hover:bg-blue-700"
            >
              {isArabic ? 'الدعم' : 'Support'}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
