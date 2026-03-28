'use client'

import { useLocale } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AiOutlineCheckCircle, AiOutlineCloseCircle, AiOutlineLoading3Quarters } from 'react-icons/ai'

export default function CheckoutPage() {
  const locale = useLocale()
  const router = useRouter()
  const isArabic = locale === 'ar'
  const searchParams = useSearchParams()

  const [status, setStatus] = useState<'processing' | 'success' | 'error' | 'loading'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [orderData, setOrderData] = useState<any>(null)

  useEffect(() => {
    const handlePaymentStatus = async () => {
      try {
        const eventId = searchParams.get('eventId')
        if (eventId && !searchParams.get('redirect_status')) {
          router.replace(`/${locale}/checkout/bank-transfer?eventId=${encodeURIComponent(eventId)}`)
          return
        }

        // Check if this is a success or error redirect from Stripe
        const paymentIntent = searchParams.get('payment_intent')
        const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret')
        const redirectStatus = searchParams.get('redirect_status')

        if (redirectStatus === 'succeeded') {
          setStatus('success')
        } else if (redirectStatus === 'processing') {
          setStatus('processing')
        } else if (redirectStatus === 'requires_action') {
          setError(isArabic ? 'يتطلب إجراء إضافي' : 'Action required')
          setStatus('error')
        } else if (redirectStatus === 'requires_payment_method') {
          setError(isArabic ? 'طريقة دفع مطلوبة' : 'Payment method required')
          setStatus('error')
        } else {
          setStatus('loading')
        }

        // Optionally fetch order details if we have order ID
        const orderId = searchParams.get('orderId')
        if (orderId) {
          const response = await fetch(`/api/checkout/status?orderId=${orderId}`)
          if (response.ok) {
            const data = await response.json()
            setOrderData(data.data)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setStatus('error')
      }
    }

    handlePaymentStatus()
  }, [searchParams, isArabic, locale, router])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="space-y-4 text-center">
            <AiOutlineLoading3Quarters className="mx-auto h-16 w-16 animate-spin text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              {isArabic ? 'جاري معالجة الدفع...' : 'Processing Payment...'}
            </h1>
            <p className="text-gray-600">
              {isArabic ? 'يرجى عدم إغلاق هذه الصفحة' : 'Please wait, do not close this page'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="space-y-4 rounded-xl border border-green-200 bg-white p-8 text-center shadow-sm">
            <AiOutlineCheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h1 className="text-2xl font-bold text-gray-900">{isArabic ? 'شكراً لك!' : 'Thank You!'}</h1>
            <p className="text-gray-600">
              {isArabic
                ? 'تم استقبال دفعتك بنجاح وجاري معالجة طلبك'
                : 'Your payment has been received and your order is being processed'}
            </p>

            {orderData && (
              <div className="mt-6 space-y-2 rounded-lg bg-gray-50 p-4 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{isArabic ? 'رقم الطلب' : 'Order Number'}:</span>
                  <span className="font-semibold">{orderData.order_number}</span>
                </div>
                {orderData.total_amount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{isArabic ? 'المبلغ الإجمالي' : 'Total Amount'}:</span>
                    <span className="font-semibold">SAR {orderData.total_amount.toFixed(2)}</span>
                  </div>
                )}
                {orderData.items_count && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{isArabic ? 'عدد العناصر' : 'Items'}:</span>
                    <span className="font-semibold">{orderData.items_count}</span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 space-y-2">
              <p className="text-sm text-gray-600">
                {isArabic
                  ? 'ستتلقى رسالة تأكيد على بريدك الإلكتروني قريباً'
                  : 'You will receive a confirmation email shortly'}
              </p>
              <a
                href={`/${locale}`}
                className="mt-4 inline-block rounded-lg bg-purple-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-purple-700"
              >
                {isArabic ? 'العودة للصفحة الرئيسية' : 'Return Home'}
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'processing') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="space-y-4 rounded-xl border border-blue-200 bg-white p-8 text-center shadow-sm">
            <AiOutlineLoading3Quarters className="mx-auto h-16 w-16 animate-spin text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">{isArabic ? 'جاري المعالجة' : 'Processing'}</h1>
            <p className="text-gray-600">
              {isArabic
                ? 'يتم معالجة دفعتك. قد يستغرق الأمر بضع دقائق'
                : 'Your payment is being processed. This may take a few minutes'}
            </p>
            <p className="text-sm text-gray-500">{isArabic ? 'لا تغلق هذه الصفحة' : 'Do not close this page'}</p>
          </div>
        </div>
      </div>
    )
  }

  // Error status
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="space-y-4 rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <AiOutlineCloseCircle className="mx-auto h-16 w-16 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900">{isArabic ? 'فشل الدفع' : 'Payment Failed'}</h1>
          <p className="text-gray-600">
            {error || (isArabic ? 'حدث خطأ أثناء المعالجة' : 'An error occurred during processing')}
          </p>

          <div className="mt-6 space-y-2">
            <p className="text-sm text-gray-600">
              {isArabic ? 'يرجى محاولة مرة أخرى أو التواصل مع الدعم' : 'Please try again or contact support'}
            </p>
            <div className="space-y-2">
              <a
                href={`/${locale}/marketplace`}
                className="block rounded-lg bg-purple-600 px-6 py-2 text-center font-semibold text-white transition-colors hover:bg-purple-700"
              >
                {isArabic ? 'العودة للتسوق' : 'Go Back to Shopping'}
              </a>
              <a
                href="mailto:support@marasim.com"
                className="block rounded-lg border border-purple-600 px-6 py-2 text-center font-semibold text-purple-600 transition-colors hover:bg-purple-50"
              >
                {isArabic ? 'التواصل بالدعم' : 'Contact Support'}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
