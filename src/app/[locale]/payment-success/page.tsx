'use client'

import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)
  const [verified, setVerified] = useState(false)

  const content = {
    verifying: isArabic ? 'جارٍ التحقق من الدفع...' : 'Verifying your payment...',
    title: isArabic ? 'تم الدفع بنجاح!' : 'Payment Successful!',
    subtitle: isArabic
      ? 'شكرًا لشرائك. اشتراكك مفعل الآن.'
      : 'Thank you for your purchase. Your subscription is now active.',
    verified: isArabic ? '✓ تم التحقق من الدفع وتفعيل الاشتراك' : '✓ Payment verified and subscribed',
    dashboard: isArabic ? 'الذهاب إلى لوحة التحكم' : 'Go to Dashboard',
    home: isArabic ? 'العودة إلى الرئيسية' : 'Back to Home',
  }

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        if (!sessionId) {
          setLoading(false)
          return
        }

        const response = await fetch('/api/stripe/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })

        if (response.ok) {
          setVerified(true)
        }
      } catch (error) {
        console.error('Error verifying payment:', error)
      } finally {
        setLoading(false)
      }
    }

    verifyPayment()
  }, [sessionId])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600">{content.verifying}</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-gray-900">{content.title}</h2>
          <p className="mt-2 text-gray-600">{content.subtitle}</p>
          {verified && <p className="mt-4 text-sm font-medium text-green-600">{content.verified}</p>}
          <div className="mt-8 space-y-3">
            <button
              onClick={() => router.push(`/${locale}/event-management-dashboard`)}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
            >
              {content.dashboard}
            </button>
            <Link href={`/${locale}`} className="block text-center text-gray-600 hover:text-gray-900">
              {content.home}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
