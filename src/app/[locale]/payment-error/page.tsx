// Marketplace-Specific Error Page - Payment/Booking Error
// Location: src/app/[locale]/payment-error/page.tsx

'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'

export default function PaymentErrorPage() {
  const params = useParams()
  const locale = params.locale as string
  const isArabic = locale === 'ar'
  const [showDetails, setShowDetails] = useState(false)

  const errorCode =
    new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('code') || 'PAYMENT_FAILED'

  return (
    <div
      className={`flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 px-4 ${
        isArabic ? 'rtl' : 'ltr'
      }`}
    >
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-xl">
        <div className="mb-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">{isArabic ? 'فشل الدفع' : 'Payment Failed'}</h1>
        <p className="mb-6 text-gray-600">
          {isArabic
            ? 'للأسف، فشلت عملية الدفع. يرجى محاولة مرة أخرى.'
            : 'Unfortunately, your payment could not be processed. Please try again.'}
        </p>

        {/* Error Code */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="mb-6 text-sm font-medium text-gray-600 underline hover:text-gray-900"
        >
          {isArabic ? 'عرض التفاصيل' : 'Show Details'}
        </button>

        {showDetails && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="break-words font-mono text-xs text-red-600">Error Code: {errorCode}</p>
          </div>
        )}

        {/* Common Issues */}
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-left">
          <p className="mb-2 text-sm font-semibold text-blue-900">{isArabic ? 'أسباب محتملة:' : 'Common reasons:'}</p>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>{isArabic ? '• رصيد الحساب غير كافي' : '• Insufficient funds'}</li>
            <li>{isArabic ? '• انتهت صلاحية البطاقة' : '• Card expired'}</li>
            <li>{isArabic ? '• مشكلة في الاتصال' : '• Connection issue'}</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className={`flex gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <Link
            href={`/${locale}/my-bookings`}
            className="flex-1 rounded-lg bg-blue-600 py-3 font-semibold text-white transition duration-200 hover:bg-blue-700"
          >
            {isArabic ? 'حجوزاتي' : 'My Bookings'}
          </Link>
          <Link
            href={`/${locale}/contact`}
            className="flex-1 rounded-lg bg-gray-200 py-3 font-semibold text-gray-900 transition duration-200 hover:bg-gray-300"
          >
            {isArabic ? 'الدعم' : 'Support'}
          </Link>
        </div>
      </div>
    </div>
  )
}
