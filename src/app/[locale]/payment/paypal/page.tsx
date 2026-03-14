'use client'

import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useLocale } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PayPalCheckoutPage() {
  const router = useRouter()
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const searchParams = useSearchParams()
  const planId = searchParams.get('planId')

  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [processing, setProcessing] = useState(false)

  const content = {
    failed: isArabic
      ? 'فشلت عملية الدفع عبر PayPal. حاول مرة أخرى.'
      : 'Failed to process PayPal payment. Please try again.',
    loading: isArabic ? 'جارٍ تحميل صفحة الدفع...' : 'Loading checkout...',
    title: isArabic ? 'الدفع' : 'Checkout',
    total: isArabic ? 'الإجمالي:' : 'Total:',
    processing: isArabic ? 'جارٍ المعالجة...' : 'Processing...',
    payPal: isArabic ? 'الدفع عبر PayPal' : 'Pay with PayPal',
    cancel: isArabic ? 'إلغاء' : 'Cancel',
  }

  useEffect(() => {
    initializeCheckout()
  }, [planId])

  const initializeCheckout = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push(`/${locale}/auth/login`)
        return
      }

      setUser(currentUser)

      if (!planId) {
        router.push(`/${locale}/pricing`)
        return
      }

      const { data: planData } = await supabase.from('subscription_plans').select('*').eq('id', planId).single()

      setPlan(planData)
    } catch (error) {
      console.error('Error initializing checkout:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePayPalPayment = async () => {
    setProcessing(true)

    try {
      const response = await fetch('/api/payments/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      const verifyResponse = await fetch('/api/payments/paypal/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: data.paymentId,
          transactionId: data.transactionId,
          userId: user.id,
        }),
      })

      if (verifyResponse.ok) {
        router.push(`/${locale}/payment-success`)
      }
    } catch (error) {
      console.error('PayPal error:', error)
      alert(content.failed)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600">{content.loading}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900">{content.title}</h1>

        {plan && (
          <>
            <div className="mt-8 border-t border-gray-200 pt-8">
              <div className="flex justify-between">
                <span className="text-gray-600">{plan.name}</span>
                <span className="font-bold text-gray-900">${plan.price_paypal}</span>
              </div>
              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>{content.total}</span>
                  <span className="text-blue-600">${plan.price_paypal}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handlePayPalPayment}
              disabled={processing}
              className="mt-8 w-full rounded-lg bg-blue-600 px-6 py-3 text-center font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {processing ? content.processing : content.payPal}
            </button>

            <button
              onClick={() => router.back()}
              className="mt-4 w-full rounded-lg border-2 border-gray-200 px-6 py-3 text-center font-bold text-gray-700 hover:bg-gray-50"
            >
              {content.cancel}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
