'use client'

import Header from '@/components/common/Header'
import UserAuthGuard from '@/components/UserAuthGuard'
import { getCurrentSession } from '@/lib/auth'
import { useLocale } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

interface EventItem {
  id: string
  name: string
  date?: string
  venue?: string
  guestCount?: number
  invitationsSent?: number
  confirmed?: number
  checkedIn?: number
}

type RsvpStatus = 'confirmed' | 'declined' | 'no_response'
type PaymentStatus = 'pending' | 'paid' | 'unpaid' | 'rejected'

function extractUuidCandidate(input: string): string | null {
  const uuidPattern = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/
  const found = input.match(uuidPattern)
  return found ? found[0] : null
}

function cleanEventId(input: string | null): string {
  if (!input) return ''

  const trimmed = input.trim()

  // If someone has a malformed query fragment (e.g. eventId=... plus text), prefer first UUID candidate.
  const explicitMatch = extractUuidCandidate(trimmed)
  if (explicitMatch) {
    return explicitMatch
  }

  // Parse repasted query string segments like "...eventId=...".
  if (trimmed.includes('eventId=')) {
    try {
      const maybeSearch = trimmed.includes('?') ? trimmed.split('?').slice(1).join('?') : trimmed
      const params = new URLSearchParams(maybeSearch)
      const paramValue = params.get('eventId')
      if (paramValue) {
        const candidate = extractUuidCandidate(paramValue.trim())
        if (candidate) return candidate
        return paramValue.trim().split(/[^0-9a-fA-F-]/)[0] || paramValue.trim()
      }
    } catch {
      // fall back to generic extraction
    }
  }

  // Fix malformed query values that may include a concatenated URL or repeated params.
  const splitOnHttp = trimmed.split(/https?:\/\//)
  if (splitOnHttp.length > 1) {
    const fallback = splitOnHttp[0]
    const sanitized = fallback.split(/[&?]/)[0]
    return sanitized
  }

  const eventIdMatch = trimmed.match(/^[0-9a-fA-F-]+$/)
  if (eventIdMatch) {
    return eventIdMatch[0]
  }

  const [firstPart] = trimmed.split(/[^0-9a-fA-F-]/)
  return firstPart || trimmed
}

function getEventSignature(event: Partial<EventItem>) {
  const normalizedName = String(event.name || '')
    .trim()
    .toLowerCase()
  const normalizedVenue = String(event.venue || '')
    .trim()
    .toLowerCase()
  return `${normalizedName}|${normalizedVenue}`
}

function getEventActivityScore(event: Partial<EventItem>) {
  return (
    Number(event.guestCount || 0) +
    Number(event.invitationsSent || 0) +
    Number(event.confirmed || 0) +
    Number(event.checkedIn || 0)
  )
}

function dedupeEventsBySignature(items: EventItem[]) {
  const bySignature = new Map<string, EventItem>()

  for (const item of items) {
    const signature = getEventSignature(item)
    if (!signature || signature === '||') {
      bySignature.set(String(item.id), item)
      continue
    }

    const existing = bySignature.get(signature)
    if (!existing) {
      bySignature.set(signature, item)
      continue
    }

    if (getEventActivityScore(item) > getEventActivityScore(existing)) {
      bySignature.set(signature, item)
    }
  }

  return Array.from(bySignature.values())
}

interface GuestItem {
  id: string
  name: string
  email: string | null
  phone: string | null
  status: RsvpStatus
  checked_in?: boolean
  checked_in_at?: string | null
  qr_token?: string | null
  created_at: string
  payment: {
    id: string
    amount: number
    payment_date: string
    status: PaymentStatus
    proof_url: string
    proof_file_name?: string
    notes?: string
    created_at: string
  } | null
  has_paid: boolean
}

function rsvpLabel(status: RsvpStatus, isArabic: boolean) {
  if (status === 'confirmed') return isArabic ? 'مؤكد' : 'Confirmed'
  if (status === 'declined') return isArabic ? 'اعتذر' : 'Declined'
  return isArabic ? 'بانتظار الرد' : 'Awaiting RSVP'
}

function paymentLabel(status: PaymentStatus, isArabic: boolean) {
  if (status === 'paid') return isArabic ? 'مدفوع' : 'Paid'
  if (status === 'pending') return isArabic ? 'قيد المراجعة' : 'Pending Review'
  if (status === 'unpaid') return isArabic ? 'غير مدفوع' : 'Unpaid'
  return isArabic ? 'مرفوض' : 'Rejected'
}

export default function EventGuestPaymentsPage() {
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const router = useRouter()
  const searchParams = useSearchParams()

  const [token, setToken] = useState<string | null>(null)
  const [events, setEvents] = useState<EventItem[]>([])
  const [eventId, setEventId] = useState('')
  const [guests, setGuests] = useState<GuestItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualQrToken, setManualQrToken] = useState('')
  const [checkInNotice, setCheckInNotice] = useState<string | null>(null)
  const [isCheckingIn, setIsCheckingIn] = useState(false)

  const [filterType, setFilterType] = useState<
    'all' | 'confirmed' | 'declined' | 'no_response' | 'checked_in' | 'not_checked_in' | 'paid' | 'pending'
  >('all')

  const filterOptions = useMemo(
    () => [
      { value: 'all', label: isArabic ? 'كل الضيوف' : 'All Guests' },
      { value: 'confirmed', label: isArabic ? 'مؤكد الحضور' : 'Confirmed RSVP' },
      { value: 'declined', label: isArabic ? 'اعتذر' : 'Declined RSVP' },
      { value: 'no_response', label: isArabic ? 'بانتظار الرد' : 'Awaiting RSVP' },
      { value: 'checked_in', label: isArabic ? 'تم تسجيل وصوله' : 'Checked In' },
      { value: 'not_checked_in', label: isArabic ? 'لم يسجل وصوله' : 'Not Checked In' },
      { value: 'paid', label: isArabic ? 'مدفوع' : 'Paid' },
      { value: 'pending', label: isArabic ? 'قيد المراجعة' : 'Pending Payment Review' },
    ],
    [isArabic]
  )

  const loadGuestData = async (targetEventId: string, accessToken: string, fallbackAttempted = false) => {
    if (!targetEventId || !accessToken) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/events/${targetEventId}/guest-payments`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || (isArabic ? 'تعذر تحميل بيانات الضيوف' : 'Failed to load guest details'))
      }

      const payload = await response.json()
      const loadedGuests = payload.guests || []

      if (!fallbackAttempted && loadedGuests.length === 0 && payload.event) {
        const activeSignature = getEventSignature(payload.event)

        const candidate = events.find(
          (event) => event.id !== payload.event.id && getEventSignature(event) === activeSignature
        )

        if (candidate) {
          setEventId(candidate.id)
          const url = new URL(window.location.href)
          url.searchParams.set('eventId', candidate.id)
          router.replace(url.pathname + url.search)
          await loadGuestData(candidate.id, accessToken, true)
          return
        }
      }

      setGuests(loadedGuests)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : isArabic ? 'حدث خطأ' : 'An error occurred')
      setGuests([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      try {
        const session = await getCurrentSession()
        if (!session?.access_token) {
          setError(isArabic ? 'جلسة غير صالحة' : 'Invalid session')
          return
        }

        setToken(session.access_token)

        const eventsResponse = await fetch('/api/events/list', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })

        if (!eventsResponse.ok) {
          const errPayload = await eventsResponse.json().catch(() => null)
          throw new Error(
            errPayload?.error || errPayload?.message || (isArabic ? 'تعذر تحميل الفعاليات' : 'Failed to load events')
          )
        }

        const payload = await eventsResponse.json()
        const mapped = (payload || []).map((event: any) => ({
          id: String(event.id),
          name: String(event.name || ''),
          date: String(event.date || ''),
          venue: String(event.venue || ''),
          guestCount: Number(event.guestCount || 0),
          invitationsSent: Number(event.invitationsSent || 0),
          confirmed: Number(event.confirmed || 0),
          checkedIn: Number(event.checkedIn || 0),
        }))

        const dedupedEvents = dedupeEventsBySignature(mapped)

        console.log('payment page events loaded', {
          mappedCount: mapped.length,
          dedupedCount: dedupedEvents.length,
          mapped,
          dedupedEvents,
        })

        const rawRequestedEventId = searchParams.get('eventId')
        const requestedEventId = cleanEventId(rawRequestedEventId)
        const requestedSource = requestedEventId
          ? mapped.find((event: EventItem) => event.id === requestedEventId)
          : undefined
        const requestedSignature = requestedSource ? getEventSignature(requestedSource) : ''
        const resolvedDuplicate = requestedSignature
          ? dedupedEvents.find((event: EventItem) => getEventSignature(event) === requestedSignature)
          : undefined

        let finalEvents = dedupedEvents
        if (requestedSource && !dedupedEvents.some((event: EventItem) => event.id === requestedEventId)) {
          // Keep the requested event in dropdown for visibility and link consistency.
          finalEvents = [requestedSource, ...dedupedEvents]
        }

        setEvents(finalEvents)

        let selectedEventId = ''

        if (requestedSource && resolvedDuplicate) {
          // Prefer the most active event row for this signature (if different) to surface actual guest/payment data.
          selectedEventId = resolvedDuplicate.id
        } else if (requestedSource) {
          selectedEventId = requestedEventId
        } else if (resolvedDuplicate) {
          selectedEventId = resolvedDuplicate.id
        } else {
          selectedEventId = finalEvents[0]?.id || ''
        }

        if (selectedEventId && selectedEventId !== requestedEventId) {
          const url = new URL(window.location.href)
          url.searchParams.set('eventId', selectedEventId)
          router.replace(url.pathname + url.search)
        }

        if (selectedEventId) {
          setEventId(selectedEventId)
          await loadGuestData(selectedEventId, session.access_token)
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : isArabic ? 'حدث خطأ' : 'An error occurred')
      }
    }

    init()
  }, [isArabic, searchParams])

  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      if (filterType === 'all') return true
      if (filterType === 'confirmed' || filterType === 'declined' || filterType === 'no_response') {
        return guest.status === filterType
      }
      if (filterType === 'checked_in') return Boolean(guest.checked_in)
      if (filterType === 'not_checked_in') return !guest.checked_in
      if (filterType === 'paid') return guest.payment?.status === 'paid'
      if (filterType === 'pending') return guest.payment?.status === 'pending'
      return true
    })
  }, [filterType, guests])

  const metrics = useMemo(() => {
    const totalGuests = guests.length
    const confirmedGuests = guests.filter((guest) => guest.status === 'confirmed').length
    const declinedGuests = guests.filter((guest) => guest.status === 'declined').length
    const awaitingRsvp = guests.filter((guest) => guest.status === 'no_response').length
    const checkedInGuests = guests.filter((guest) => guest.checked_in).length
    const paidGuests = guests.filter((guest) => guest.payment?.status === 'paid').length
    const pendingReview = guests.filter((guest) => guest.payment?.status === 'pending').length

    return {
      totalGuests,
      confirmedGuests,
      declinedGuests,
      awaitingRsvp,
      checkedInGuests,
      paidGuests,
      pendingReview,
      attendanceRate: confirmedGuests > 0 ? Math.round((checkedInGuests / confirmedGuests) * 100) : 0,
    }
  }, [guests])

  const updatePaymentStatus = async (paymentId: string, status: PaymentStatus) => {
    if (!token || !eventId) return

    const response = await fetch(`/api/events/${eventId}/guest-payments`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentId, status }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      alert(payload?.error || (isArabic ? 'فشل تحديث حالة الدفع' : 'Failed to update payment status'))
      return
    }

    await loadGuestData(eventId, token)
  }

  const submitManualCheckIn = async () => {
    if (!manualQrToken.trim() || !eventId || !token) return

    try {
      setIsCheckingIn(true)
      setCheckInNotice(null)
      setError(null)

      const response = await fetch('/api/guests/checkin', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qr_token: manualQrToken.trim(), event_id: eventId }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error || (isArabic ? 'تعذر تسجيل الوصول' : 'Failed to check in guest'))
      }

      setManualQrToken('')
      setCheckInNotice(
        isArabic
          ? `تم تسجيل وصول ${payload?.guest?.name || 'الضيف'} بنجاح`
          : `Checked in ${payload?.guest?.name || 'guest'} successfully`
      )

      await loadGuestData(eventId, token)
    } catch (checkInError) {
      setError(checkInError instanceof Error ? checkInError.message : isArabic ? 'حدث خطأ' : 'An error occurred')
    } finally {
      setIsCheckingIn(false)
    }
  }

  const onEventChange = async (nextEventId: string) => {
    const cleanedEventId = cleanEventId(nextEventId)
    setEventId(cleanedEventId)
    setGuests([])
    setFilterType('all')
    setCheckInNotice(null)

    if (!token) return
    await loadGuestData(cleanedEventId, token)

    const url = new URL(window.location.href)
    url.searchParams.set('eventId', cleanedEventId)
    router.replace(url.pathname + url.search)
  }

  return (
    <UserAuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />

        <main className="container mx-auto mt-20 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isArabic ? 'تفاصيل الضيوف والمدفوعات للفعالية' : 'Event Guest Details, Check-In, and Payments'}
              </h1>
              <p className="text-sm text-gray-600">
                {isArabic
                  ? 'شاهد من أكد الحضور، من حضر فعليا، ومن دفع مع إثبات الدفع لكل ضيف.'
                  : 'See who RSVP’d, who actually checked in, and who uploaded payment proof for this event.'}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <select
                value={eventId}
                onChange={(event) => void onEventChange(event.target.value)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2"
              >
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => router.push(`/${locale}/checkin`)}
                className="rounded-md bg-indigo-600 px-3 py-2 font-medium text-white hover:bg-indigo-700"
              >
                {isArabic ? 'فتح ماسح QR' : 'Open QR Scanner'}
              </button>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4">
            <select
              value={filterType}
              onChange={(event) => setFilterType(event.target.value as typeof filterType)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2"
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder={isArabic ? 'أدخل رمز QR يدويا' : 'Enter QR token manually'}
              value={manualQrToken}
              onChange={(event) => setManualQrToken(event.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2"
            />

            <button
              onClick={() => void submitManualCheckIn()}
              disabled={isCheckingIn || !manualQrToken.trim()}
              className="rounded-md bg-emerald-600 px-3 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isCheckingIn
                ? isArabic
                  ? 'جارٍ التسجيل...'
                  : 'Checking in...'
                : isArabic
                  ? 'تسجيل حضور يدوي'
                  : 'Manual Check-In'}
            </button>
          </div>

          {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}
          {checkInNotice && (
            <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-green-700">
              {checkInNotice}
            </div>
          )}

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-7">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-500">{isArabic ? 'كل الضيوف' : 'Total Guests'}</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalGuests}</p>
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-xs text-green-700">{isArabic ? 'مؤكدون' : 'Confirmed'}</p>
              <p className="text-2xl font-bold text-green-800">{metrics.confirmedGuests}</p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-xs text-red-700">{isArabic ? 'معتذرون' : 'Declined'}</p>
              <p className="text-2xl font-bold text-red-800">{metrics.declinedGuests}</p>
            </div>
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-xs text-yellow-700">{isArabic ? 'بانتظار الرد' : 'Awaiting RSVP'}</p>
              <p className="text-2xl font-bold text-yellow-800">{metrics.awaitingRsvp}</p>
            </div>
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
              <p className="text-xs text-indigo-700">{isArabic ? 'تم تسجيل حضورهم' : 'Checked In'}</p>
              <p className="text-2xl font-bold text-indigo-800">{metrics.checkedInGuests}</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs text-emerald-700">{isArabic ? 'مدفوع' : 'Paid'}</p>
              <p className="text-2xl font-bold text-emerald-800">{metrics.paidGuests}</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs text-blue-700">{isArabic ? 'نسبة حضور المؤكدين' : 'Attendance Rate'}</p>
              <p className="text-2xl font-bold text-blue-800">{metrics.attendanceRate}%</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">{isArabic ? 'الضيف' : 'Guest'}</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">{isArabic ? 'الجوال' : 'Phone'}</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">{isArabic ? 'حالة RSVP' : 'RSVP'}</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    {isArabic ? 'تسجيل الوصول' : 'Check-In'}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    {isArabic ? 'حالة الدفع' : 'Payment'}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    {isArabic ? 'إثبات الدفع' : 'Payment Proof'}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">{isArabic ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      {isArabic ? 'جارٍ التحميل...' : 'Loading event details...'}
                    </td>
                  </tr>
                ) : filteredGuests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      {isArabic ? 'لا يوجد ضيوف لهذا الفلتر' : 'No guests for this filter'}
                    </td>
                  </tr>
                ) : (
                  filteredGuests.map((guest) => (
                    <tr key={guest.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{guest.name}</p>
                        <p className="text-xs text-gray-500">{guest.email || '-'}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{guest.phone || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                          {rsvpLabel(guest.status, isArabic)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {guest.checked_in ? (
                          <div>
                            <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">
                              {isArabic ? 'تم' : 'Checked In'}
                            </span>
                            <p className="mt-1 text-xs text-gray-500">
                              {guest.checked_in_at ? new Date(guest.checked_in_at).toLocaleString(locale) : ''}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">{isArabic ? 'لم يسجل بعد' : 'Not checked in'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {guest.payment ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                            {paymentLabel(guest.payment.status, isArabic)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">{isArabic ? 'لا يوجد دفع' : 'No payment yet'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {guest.payment?.proof_url ? (
                          <a
                            href={guest.payment.proof_url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {isArabic ? 'عرض الإثبات' : 'View Proof'}
                          </a>
                        ) : (
                          <span className="text-xs text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {guest.payment ? (
                          <div className="flex flex-wrap gap-2">
                            {guest.payment.status !== 'paid' && (
                              <button
                                onClick={() => void updatePaymentStatus(guest.payment!.id, 'paid')}
                                className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                              >
                                {isArabic ? 'اعتماد' : 'Approve'}
                              </button>
                            )}
                            {guest.payment.status !== 'rejected' && (
                              <button
                                onClick={() => void updatePaymentStatus(guest.payment!.id, 'rejected')}
                                className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                              >
                                {isArabic ? 'رفض' : 'Reject'}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </UserAuthGuard>
  )
}
