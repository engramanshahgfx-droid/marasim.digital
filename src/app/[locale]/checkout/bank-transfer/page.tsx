'use client'

import { useLocale } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

// Helper – generate a reference code on the client as fallback
function generateRef() {
  const arr = new Uint8Array(3)
  crypto.getRandomValues(arr)
  return (
    'REF-' +
    Date.now() +
    '-' +
    Array.from(arr)
      .map((n) => n.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  )
}

type Step = 'info' | 'upload' | 'success'

interface BankDetails {
  account_holder: string
  bank_name: string
  account_number: string
  iban: string
  branch_code?: string
  branch_name?: string
  currency?: string
}

interface OrderData {
  bulk_order_id: string
  order_number: string
  reference_code: string
  total_amount: number
  items_count: number
}

export default function CheckoutBankTransferPage() {
  const router = useRouter()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const searchParams = useSearchParams()
  const eventId = searchParams.get('eventId')

  const [step, setStep] = useState<Step>('info')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [guestPhone, setGuestPhone] = useState('')
  const [uploading, setUploading] = useState(false)

  const t = {
    title: isAr ? 'الدفع بالتحويل البنكي' : 'Bank Transfer Payment',
    loading: isAr ? 'جارٍ إنشاء طلبك...' : 'Creating your order...',
    orderSummary: isAr ? 'ملخص الطلب' : 'Order Summary',
    items: isAr ? 'عدد الخدمات' : 'Services',
    total: isAr ? 'الإجمالي (شامل الضريبة والرسوم)' : 'Total (incl. fees & VAT)',
    bankDetails: isAr ? 'تفاصيل الحساب البنكي' : 'Bank Account Details',
    accountHolder: isAr ? 'اسم صاحب الحساب' : 'Account Holder',
    bankName: isAr ? 'اسم البنك' : 'Bank Name',
    accountNumber: isAr ? 'رقم الحساب' : 'Account Number',
    iban: 'IBAN',
    branch: isAr ? 'الفرع' : 'Branch',
    reference: isAr ? 'رمز المرجع' : 'Reference Code',
    importantNote: isAr
      ? 'يرجى كتابة رمز المرجع أعلاه في خانة الملاحظة عند التحويل حتى نتمكن من تأكيد دفعتك.'
      : 'Please include the reference code above in the transfer note so we can match your payment.',
    sentPayment: isAr ? 'لقد أجريت التحويل – رفع الإيصال' : "I've Made the Transfer – Upload Receipt",
    cancel: isAr ? 'إلغاء والعودة' : 'Cancel & Go Back',
    uploadTitle: isAr ? 'رفع إيصال التحويل' : 'Upload Transfer Receipt',
    phonePlaceholder: '+966 55 1234 5678',
    phoneLabel: isAr ? 'رقم واتساب (اختياري)' : 'WhatsApp Number (optional)',
    phoneHint: isAr
      ? 'سنرسل لك تأكيداً عند مراجعة الدفعة'
      : "We'll send you a confirmation when the payment is reviewed",
    uploadLabel: isAr ? 'صورة إيصال التحويل البنكي' : 'Bank Transfer Receipt Screenshot',
    uploadHint: isAr
      ? 'صورة واضحة للإيصال أو لقطة شاشة من التطبيق البنكي'
      : 'Clear image or screenshot from your banking app',
    submit: isAr ? 'إرسال الإيصال' : 'Submit Receipt',
    submitting: isAr ? 'جارٍ الإرسال...' : 'Submitting...',
    back: isAr ? 'رجوع' : 'Back',
    successTitle: isAr ? 'تم إرسال الإيصال!' : 'Receipt Submitted!',
    successMsg: isAr
      ? 'تم استلام إيصالك. سيراجعه صاحب الحدث ويؤكد دفعتك خلال فترة قصيرة.'
      : 'Your receipt has been received. The event organizer will review and confirm your payment shortly.',
    whatNext: isAr ? 'ماذا يحدث بعد ذلك؟' : 'What happens next?',
    steps: isAr
      ? [
          'سيراجع صاحب الحدث إيصالك ويتحقق من التحويل.',
          'ستصلك رسالة واتساب بتأكيد الموافقة أو رفضها.',
          'بعد الموافقة تصبح خدماتك مؤكدة.',
        ]
      : [
          'The event organizer will review your receipt and verify the transfer.',
          "You'll receive a WhatsApp message with the approval or rejection decision.",
          'Once approved, your booked services are confirmed.',
        ],
    goHome: isAr ? 'العودة للصفحة الرئيسية' : 'Return Home',
    orderLabel: isAr ? 'رقم الطلب' : 'Order',
    refLabel: isAr ? 'المرجع' : 'Reference',
  }

  useEffect(() => {
    if (!eventId) {
      setError(isAr ? 'معرّف الحدث مفقود' : 'Missing event ID')
      setLoading(false)
      return
    }
    createOrder()
  }, [eventId])

  const createOrder = async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
      )
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token

      if (!token) {
        router.push(`/${locale}/auth/login`)
        return
      }

      const res = await fetch('/api/checkout/bank-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ event_id: eventId }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error || (isAr ? 'فشل إنشاء الطلب' : 'Failed to create order'))
        return
      }

      setOrderData(json.data)
      setBankDetails(json.data.bank_details)
    } catch (err) {
      console.error(err)
      setError(isAr ? 'خطأ في الاتصال بالخادم' : 'Server connection error')
    } finally {
      setLoading(false)
    }
  }

  const handleProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!proofFile || !orderData) return

    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', proofFile)
      form.append('orderId', orderData.bulk_order_id)
      if (guestPhone) form.append('guestPhone', guestPhone)

      const res = await fetch('/api/checkout/bank-transfer/upload-proof', {
        method: 'POST',
        body: form,
      })

      const json = await res.json()
      if (res.ok) {
        setStep('success')
      } else {
        alert(json.error || (isAr ? 'فشل إرسال الإيصال' : 'Failed to submit receipt'))
      }
    } catch (err) {
      console.error(err)
      alert(isAr ? 'خطأ في الاتصال' : 'Connection error')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">{t.loading}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 rounded-lg bg-red-600 px-6 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            {t.cancel}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>

        {/* ── STEP 1: Bank Details ──────────────────────────────── */}
        {step === 'info' && orderData && bankDetails && (
          <div className="mt-6 space-y-6">
            {/* Order summary */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
              <h2 className="mb-3 font-semibold text-gray-800">{t.orderSummary}</h2>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t.orderLabel}</span>
                  <span className="font-mono font-semibold">{orderData.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t.items}</span>
                  <span>{orderData.items_count}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold">
                  <span>{t.total}</span>
                  <span className="text-blue-700">SAR {orderData.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Bank details */}
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-5">
              <h2 className="mb-4 font-semibold text-gray-800">{t.bankDetails}</h2>
              <dl className="space-y-3 text-sm">
                {[
                  [t.accountHolder, bankDetails.account_holder],
                  [t.bankName, bankDetails.bank_name],
                  [t.accountNumber, bankDetails.account_number],
                  [t.iban, bankDetails.iban],
                  ...(bankDetails.branch_name
                    ? [[t.branch, `${bankDetails.branch_name} (${bankDetails.branch_code})`]]
                    : []),
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <dt className="text-gray-500">{label}</dt>
                    <dd className="break-all text-right font-mono font-semibold text-gray-900">{value}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-4 border-t border-blue-200 pt-3">
                  <dt className="text-gray-500">{t.reference}</dt>
                  <dd className="text-right font-mono font-bold text-green-700">{orderData.reference_code}</dd>
                </div>
              </dl>
            </div>

            {/* Important note */}
            <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">📌 {t.importantNote}</div>

            <button
              onClick={() => setStep('upload')}
              className="w-full rounded-lg bg-blue-600 py-3 font-bold text-white hover:bg-blue-700"
            >
              {t.sentPayment}
            </button>
            <button
              onClick={() => router.back()}
              className="w-full rounded-lg border-2 border-gray-200 py-3 font-bold text-gray-600 hover:bg-gray-50"
            >
              {t.cancel}
            </button>
          </div>
        )}

        {/* ── STEP 2: Upload Receipt ────────────────────────────── */}
        {step === 'upload' && orderData && (
          <form onSubmit={handleProofSubmit} className="mt-6 space-y-5">
            <p className="text-sm font-medium text-gray-600">
              {t.refLabel}: <span className="font-mono font-bold text-green-700">{orderData.reference_code}</span>
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700">{t.phoneLabel}</label>
              <input
                type="tel"
                placeholder={t.phonePlaceholder}
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-400">{t.phoneHint}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">{t.uploadLabel}</label>
              <div className="mt-2 rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-blue-400">
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-700"
                />
                {proofFile && <p className="mt-2 text-sm text-green-600">✓ {proofFile.name}</p>}
              </div>
              <p className="mt-1 text-xs text-gray-400">{t.uploadHint}</p>
            </div>

            <button
              type="submit"
              disabled={uploading || !proofFile}
              className="w-full rounded-lg bg-green-600 py-3 font-bold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {uploading ? t.submitting : t.submit}
            </button>
            <button
              type="button"
              onClick={() => setStep('info')}
              className="w-full rounded-lg border-2 border-gray-200 py-3 font-bold text-gray-600 hover:bg-gray-50"
            >
              {t.back}
            </button>
          </form>
        )}

        {/* ── STEP 3: Success ───────────────────────────────────── */}
        {step === 'success' && orderData && (
          <div className="mt-8 space-y-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">
              ✅
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{t.successTitle}</h2>
            <p className="text-gray-600">{t.successMsg}</p>

            <div className="rounded-lg bg-gray-50 p-4 text-left text-sm">
              <p className="mb-2 font-semibold text-gray-700">{t.whatNext}</p>
              <ol className="list-decimal space-y-1 pl-5 text-gray-600">
                {t.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>

            <div className="rounded-lg bg-blue-50 p-4 text-sm text-gray-600">
              <span className="font-medium">{t.orderLabel}:</span>{' '}
              <span className="font-mono">{orderData.order_number}</span>
              {'  '}
              <span className="font-medium">{t.refLabel}:</span>{' '}
              <span className="font-mono text-green-700">{orderData.reference_code}</span>
            </div>

            <button
              onClick={() => router.push(`/${locale}`)}
              className="w-full rounded-lg bg-blue-600 py-3 font-bold text-white hover:bg-blue-700"
            >
              {t.goHome}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
