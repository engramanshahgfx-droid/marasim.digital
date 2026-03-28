'use client'

import { useLocale } from 'next-intl'
import { useState } from 'react'

interface BankDetails {
  bank_account_holder?: string | null
  bank_name?: string | null
  bank_account_number?: string | null
  bank_iban?: string | null
}

interface GuestPaymentProofCardProps {
  eventId: string
  guestId: string
  shareLink: string
  bankDetails: BankDetails
}

export default function GuestPaymentProofCard({
  eventId,
  guestId,
  shareLink,
  bankDetails,
}: GuestPaymentProofCardProps) {
  const locale = useLocale()
  const isArabic = locale === 'ar'

  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = Boolean(amount.trim() && paymentDate && file)

  // Removed: Payment history is intentionally hidden from guests
  // Only event admin can view payment history in the admin dashboard

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !file) return

    try {
      setIsSubmitting(true)
      setMessage(null)
      setError(null)

      const formData = new FormData()
      formData.append('eventId', eventId)
      formData.append('guestId', guestId)
      formData.append('shareLink', shareLink)
      formData.append('amount', amount)
      formData.append('paymentDate', paymentDate)
      formData.append('notes', notes)
      formData.append('file', file)

      const response = await fetch('/api/guest-payments/proof', {
        method: 'POST',
        body: formData,
      })

      const text = await response.text()
      let payload: any
      try {
        payload = JSON.parse(text)
      } catch {
        payload = null
      }

      if (!response.ok) {
        const message =
          payload?.error ||
          payload?.message ||
          text?.substring(0, 500) ||
          (isArabic ? 'فشل رفع الإثبات' : 'Failed to submit proof')
        throw new Error(message)
      }

      setMessage(
        isArabic ? 'تم رفع إثبات الدفع بنجاح وسيتم مراجعته.' : 'Payment proof uploaded successfully and pending review.'
      )
      setAmount('')
      setPaymentDate('')
      setNotes('')
      setFile(null)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : isArabic ? 'فشل رفع الإثبات' : 'Upload failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        {isArabic ? 'الدفع بالتحويل البنكي (يدوي)' : 'Direct Bank Transfer (Manual)'}
      </h3>

      <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-semibold">{isArabic ? 'بيانات الحساب البنكي' : 'Bank Account Details'}</p>
        <p>
          {isArabic ? 'اسم صاحب الحساب:' : 'Account Holder:'} {bankDetails.bank_account_holder || '-'}
        </p>
        <p>
          {isArabic ? 'اسم البنك:' : 'Bank Name:'} {bankDetails.bank_name || '-'}
        </p>
        <p>
          {isArabic ? 'رقم الحساب:' : 'Account Number:'} {bankDetails.bank_account_number || '-'}
        </p>
        <p>
          {isArabic ? 'الآيبان:' : 'IBAN:'} {bankDetails.bank_iban || '-'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{isArabic ? 'المبلغ' : 'Amount'}</label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {isArabic ? 'تاريخ الدفع' : 'Payment Date'}
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {isArabic ? 'إثبات الدفع (صورة أو PDF)' : 'Payment Proof (Image or PDF)'}
          </label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
            className="block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {isArabic ? 'ملاحظات (اختياري)' : 'Notes (optional)'}
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        {message && (
          <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>
        )}
        {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting
            ? isArabic
              ? 'جارٍ الرفع...'
              : 'Uploading...'
            : isArabic
              ? 'رفع إثبات الدفع'
              : 'Upload Payment Proof'}
        </button>
      </form>

      {/* Payment history is only visible to event admin/owner, not to guests */}
    </div>
  )
}
