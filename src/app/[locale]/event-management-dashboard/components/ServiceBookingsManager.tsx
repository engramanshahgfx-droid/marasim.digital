'use client'

import type { BulkOrder } from '@/types/marketplace'
import { createClient } from '@supabase/supabase-js'
import { useLocale } from 'next-intl'
import { useEffect, useState } from 'react'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'

interface ServiceBookingsManagerProps {
  eventId: string
}

function makeSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!)
}

async function getAuthToken() {
  const supabase = makeSupabase()
  const { data } = await supabase.auth.getSession()
  return data?.session?.access_token || ''
}

export default function ServiceBookingsManager({ eventId }: ServiceBookingsManagerProps) {
  const locale = useLocale()
  const isArabic = locale === 'ar'

  const [orders, setOrders] = useState<BulkOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState<'all' | 'pending' | 'completed' | 'refunded'>('all')
  const [proofModalOrder, setProofModalOrder] = useState<any | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [actionNote, setActionNote] = useState('')

  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const token = await getAuthToken()
        const response = await fetch(
          `/api/events/${eventId}/service-bookings${selectedTab !== 'all' ? `?status=${selectedTab}` : ''}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        if (!response.ok) throw new Error('Failed to fetch service bookings')
        const data = await response.json()
        setOrders(data.data || [])
      } catch (err) {
        console.error('Error loading service bookings:', err)
        setError(isArabic ? 'فشل تحميل الطلبات' : 'Failed to load orders')
      } finally {
        setIsLoading(false)
      }
    }
    loadOrders()
  }, [eventId, selectedTab, isArabic])

  const handleApproveReject = async (orderId: string, action: 'approve' | 'reject') => {
    setProcessing(orderId)
    try {
      const token = await getAuthToken()
      const res = await fetch('/api/checkout/bank-transfer/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId, action, note: actionNote }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                payment_status: action === 'approve' ? 'paid' : 'rejected',
                status: action === 'approve' ? 'completed' : 'cancelled',
              }
            : o
        )
      )
      setProofModalOrder(null)
      setActionNote('')
    } catch {
      alert(isArabic ? 'فشلت العملية' : 'Operation failed')
    } finally {
      setProcessing(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'refunded':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 font-semibold'
      case 'unpaid':
        return 'text-red-600 font-semibold'
      case 'pending_verification':
        return 'text-orange-600 font-semibold'
      case 'rejected':
        return 'text-red-700 font-semibold'
      case 'refunded':
        return 'text-gray-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: isArabic ? 'قيد الانتظار' : 'Pending',
      confirmed: isArabic ? 'مؤكد' : 'Confirmed',
      processing: isArabic ? 'قيد المعالجة' : 'Processing',
      completed: isArabic ? 'مكتمل' : 'Completed',
      cancelled: isArabic ? 'ملغى' : 'Cancelled',
      refunded: isArabic ? 'مستردة' : 'Refunded',
    }
    return labels[status] || status
  }

  const getPaymentStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      unpaid: isArabic ? 'لم يتم الدفع' : 'Unpaid',
      paid: isArabic ? 'مدفوع' : 'Paid',
      refunded: isArabic ? 'تم استرداده' : 'Refunded',
      partial_refund: isArabic ? 'استرجاع جزئي' : 'Partial Refund',
      pending_verification: isArabic ? 'قيد المراجعة' : 'Pending Review',
      rejected: isArabic ? 'مرفوض' : 'Rejected',
    }
    return labels[status] || status
  }

  const pendingReviewOrders = orders.filter((o) => (o as any).payment_status === 'pending_verification')

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <AiOutlineLoading3Quarters className="mx-auto mb-2 h-8 w-8 animate-spin text-purple-600" />
          <p className="text-gray-600">{isArabic ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{isArabic ? 'طلبات الخدمات' : 'Service Bookings'}</h2>
          <p className="mt-1 text-gray-600">
            {isArabic
              ? 'عرض جميع حجوزات الخدمات والمدفوعات للحدث'
              : 'View all service bookings and payments for this event'}
          </p>
        </div>

        {/* Bank transfer pending review alert */}
        {pendingReviewOrders.length > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4">
            <span className="text-xl">🔔</span>
            <p className="text-sm font-medium text-orange-800">
              {isArabic
                ? `${pendingReviewOrders.length} طلب تحويل بنكي ينتظر مراجعتك`
                : `${pendingReviewOrders.length} bank transfer order${pendingReviewOrders.length > 1 ? 's' : ''} awaiting your review`}
            </p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-gray-200">
          {['all', 'pending', 'completed', 'refunded'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab as any)}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                selectedTab === tab
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'all' && (isArabic ? 'الكل' : 'All')}
              {tab === 'pending' && (isArabic ? 'قيد الانتظار' : 'Pending')}
              {tab === 'completed' && (isArabic ? 'مكتمل' : 'Completed')}
              {tab === 'refunded' && (isArabic ? 'مستردة' : 'Refunded')}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-500">{isArabic ? 'لا توجد طلبات' : 'No orders found'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
              >
                {/* Order Header */}
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{order.order_number}</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleDateString(isArabic ? 'ar-SA' : 'en-SA')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs ${getPaymentStatusColor(order.payment_status)}`}>
                      {getPaymentStatusLabel(order.payment_status)}
                    </span>
                  </div>
                </div>

                {/* Order Details Grid */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-xs text-gray-600">{isArabic ? 'المبلغ الفرعي' : 'Subtotal'}</p>
                    <p className="font-semibold text-gray-900">SAR {order.subtotal.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">{isArabic ? 'الرسوم' : 'Fees'}</p>
                    <p className="font-semibold text-gray-900">SAR {order.platform_fee.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">{isArabic ? 'الضريبة' : 'Tax'}</p>
                    <p className="font-semibold text-gray-900">SAR {order.tax_amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">{isArabic ? 'الإجمالي' : 'Total'}</p>
                    <p className="text-lg font-bold text-purple-600">SAR {order.total_amount.toFixed(2)}</p>
                  </div>
                </div>

                {/* Notes */}
                {order.notes && (
                  <div className="mt-3 border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-600">{isArabic ? 'ملاحظات' : 'Notes'}:</p>
                    <p className="mt-1 text-sm text-gray-700">{order.notes}</p>
                  </div>
                )}

                {/* Details link */}
                <div className="mt-4 border-t border-gray-100 pt-3">
                  <a
                    href={`/${locale}/event-management-dashboard/orders/${order.id}`}
                    className="text-sm font-semibold text-purple-600 transition-colors hover:text-purple-700"
                  >
                    {isArabic ? 'عرض التفاصيل' : 'View Details'} →
                  </a>
                </div>

                {/* Bank transfer receipt review panel */}
                {(order as any).payment_method === 'bank_transfer' &&
                  (order as any).payment_status === 'pending_verification' && (
                    <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3">
                      <p className="mb-2 text-xs font-semibold text-orange-700">
                        {isArabic ? '📎 إيصال تحويل بنكي – يحتاج مراجعة' : '📎 Bank Transfer Receipt – Needs Review'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(order as any).proof_image_url && (
                          <button
                            onClick={() => {
                              setProofModalOrder(order)
                              setActionNote('')
                            }}
                            className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            {isArabic ? '👁️ عرض الإيصال' : '👁️ View Receipt'}
                          </button>
                        )}
                        <button
                          onClick={() => handleApproveReject(order.id, 'approve')}
                          disabled={processing === order.id}
                          className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {processing === order.id ? '...' : isArabic ? '✅ تأكيد الدفع' : '✅ Confirm Payment'}
                        </button>
                        <button
                          onClick={() => handleApproveReject(order.id, 'reject')}
                          disabled={processing === order.id}
                          className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {processing === order.id ? '...' : isArabic ? '❌ رفض' : '❌ Reject'}
                        </button>
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {orders.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <div>
                <p className="text-xs text-gray-600">{isArabic ? 'إجمالي الطلبات' : 'Total Orders'}</p>
                <p className="text-xl font-bold text-gray-900">{orders.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">{isArabic ? 'الإجمالي' : 'Total Revenue'}</p>
                <p className="text-xl font-bold text-gray-900">
                  SAR {orders.reduce((sum, o) => sum + o.total_amount, 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">{isArabic ? 'المدفوع' : 'Amount Paid'}</p>
                <p className="text-xl font-bold text-green-600">
                  SAR{' '}
                  {orders
                    .filter((o) => o.payment_status === 'paid')
                    .reduce((sum, o) => sum + o.total_amount, 0)
                    .toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Receipt Preview Modal */}
      {proofModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b bg-gray-50 px-6 py-4">
              <div>
                <h3 className="font-bold text-gray-900">
                  {isArabic ? 'مراجعة إيصال التحويل' : 'Bank Transfer Receipt Review'}
                </h3>
                <p className="text-sm text-gray-500">{proofModalOrder.order_number}</p>
              </div>
              <button onClick={() => setProofModalOrder(null)} className="text-2xl text-gray-400 hover:text-gray-700">
                ✕
              </button>
            </div>
            <div className="space-y-5 p-6">
              <div className="overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-50">
                {proofModalOrder.proof_image_url ? (
                  <img src={proofModalOrder.proof_image_url} alt="Receipt" className="h-auto w-full" />
                ) : (
                  <div className="flex h-48 items-center justify-center text-gray-400">
                    {isArabic ? 'لا توجد صورة' : 'No image uploaded'}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="text-xs text-gray-500">{isArabic ? 'الإجمالي' : 'Total'}</p>
                  <p className="text-lg font-bold text-green-700">SAR {proofModalOrder.total_amount?.toFixed(2)}</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="text-xs text-gray-500">{isArabic ? 'المرجع' : 'Reference'}</p>
                  <p className="font-mono font-semibold text-blue-700">{proofModalOrder.bank_reference_code || '—'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {isArabic ? 'ملاحظة (للرفض)' : 'Note (for rejection)'}
                </label>
                <textarea
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder={isArabic ? 'سبب الرفض...' : 'Reason for rejection...'}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleApproveReject(proofModalOrder.id, 'approve')}
                  disabled={processing === proofModalOrder.id}
                  className="flex-1 rounded-lg bg-green-600 py-3 font-bold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {processing === proofModalOrder.id ? '...' : isArabic ? '✅ تأكيد الدفع' : '✅ Confirm Payment'}
                </button>
                <button
                  onClick={() => handleApproveReject(proofModalOrder.id, 'reject')}
                  disabled={processing === proofModalOrder.id}
                  className="flex-1 rounded-lg bg-red-600 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {processing === proofModalOrder.id ? '...' : isArabic ? '❌ رفض' : '❌ Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
