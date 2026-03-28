'use client'

import Header from '@/components/common/Header'
import UserAuthGuard from '@/components/UserAuthGuard'
import { useLocale } from 'next-intl'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'

// Dynamically import the camera scanner — no SSR because it needs browser APIs
const QRCameraScanner = dynamic(() => import('@/components/checkin/QRCameraScanner'), { ssr: false })

interface Event {
  id: string
  name: string
  date: string
}

interface CheckInGuest {
  id: string
  name: string
  phone: string
  plus_ones: number
  checked_in_at: string
  status: string
}

interface CheckInResult {
  success: boolean
  already_checked_in: boolean
  guest: CheckInGuest
  event: { id: string; name: string }
}

type ScanState = 'idle' | 'scanning' | 'processing' | 'success' | 'duplicate' | 'error'

export default function CheckInPage() {
  const locale = useLocale()
  const isArabic = locale === 'ar'

  const [token, setToken] = useState<string | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [isCameraOn, setIsCameraOn] = useState(false)
  const cooldownRef = useRef(false)

  // --- Auth token ---
  useEffect(() => {
    const stored =
      Object.entries(localStorage).find(
        ([k, v]) => k.includes('auth-token') || (k.includes('supabase') && v.includes('access_token'))
      )?.[1] ?? null

    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setToken(parsed?.access_token ?? stored)
      } catch {
        setToken(stored)
      }
    }
  }, [])

  // --- Fetch events ---
  useEffect(() => {
    if (!token) return
    fetch('/api/events/list', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data: Event[]) => {
        if (Array.isArray(data)) {
          setEvents(data)
          if (data.length === 1) setSelectedEventId(data[0].id)
        }
      })
      .catch(() => {})
  }, [token])

  // --- Handle QR scan ---
  const handleScan = useCallback(
    async (rawToken: string) => {
      if (cooldownRef.current || scanState === 'processing') return
      cooldownRef.current = true
      setIsCameraOn(false) // stop camera while processing
      setScanState('processing')
      setResult(null)
      setErrorMsg('')

      try {
        const res = await fetch('/api/guests/checkin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ qr_token: rawToken.trim(), event_id: selectedEventId || undefined }),
        })

        const data = (await res.json()) as CheckInResult & { error?: string }

        if (!res.ok) {
          setScanState('error')
          setErrorMsg(data.error ?? 'Unknown error')
        } else if (data.already_checked_in) {
          setScanState('duplicate')
          setResult(data)
        } else {
          setScanState('success')
          setResult(data)
        }
      } catch {
        setScanState('error')
        setErrorMsg('Network error — please try again')
      } finally {
        // Allow next scan after 4 s
        setTimeout(() => {
          cooldownRef.current = false
        }, 4000)
      }
    },
    [scanState, selectedEventId, token]
  )

  const resetScan = () => {
    setScanState('idle')
    setResult(null)
    setErrorMsg('')
    setIsCameraOn(true)
  }

  const t = (en: string, ar: string) => (isArabic ? ar : en)

  return (
    <UserAuthGuard>
      <div className={`min-h-screen bg-gray-50 ${isArabic ? 'dir-rtl' : ''}`}>
        <Header />

        <main className="mx-auto max-w-lg px-4 pb-16 pt-28">
          {/* Page title */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">{t('QR Check-In Scanner', 'ماسح رمز QR للتسجيل')}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {t('Scan a guest QR code to check them in', 'امسح رمز QR للضيف لتسجيل حضوره')}
            </p>
          </div>

          {/* Event selector */}
          {events.length > 1 && (
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('Select Event', 'اختر الحدث')}</label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">{t('All events', 'جميع الأحداث')}</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} — {ev.date}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Camera toggle */}
          {scanState === 'idle' && !isCameraOn && (
            <button
              onClick={() => setIsCameraOn(true)}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {t('Start Camera', 'تشغيل الكاميرا')}
            </button>
          )}

          {/* Camera feed */}
          {isCameraOn && scanState !== 'processing' && (
            <div className="mb-4">
              <QRCameraScanner onScan={handleScan} isActive={isCameraOn} />
              <button
                onClick={() => setIsCameraOn(false)}
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                {t('Stop Camera', 'إيقاف الكاميرا')}
              </button>
            </div>
          )}

          {/* Processing */}
          {scanState === 'processing' && (
            <div className="flex flex-col items-center gap-3 py-10">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
              <p className="text-sm text-gray-500">{t('Checking in...', 'جارٍ التسجيل...')}</p>
            </div>
          )}

          {/* Success */}
          {scanState === 'success' && result && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-green-800">{t('Checked In!', 'تم تسجيل الحضور!')}</h2>
              <p className="mt-1 text-2xl font-semibold text-green-900">{result.guest.name}</p>
              {result.guest.plus_ones > 0 && (
                <p className="mt-1 text-sm text-green-700">
                  {t(`+${result.guest.plus_ones} additional guest(s)`, `+ ${result.guest.plus_ones} ضيف إضافي`)}
                </p>
              )}
              <p className="mt-2 text-xs text-green-600">{result.event.name}</p>
              <button
                onClick={resetScan}
                className="mt-4 w-full rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
              >
                {t('Scan Next Guest', 'مسح الضيف التالي')}
              </button>
            </div>
          )}

          {/* Duplicate */}
          {scanState === 'duplicate' && result && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-amber-800">{t('Already Checked In', 'تم التسجيل مسبقاً')}</h2>
              <p className="mt-1 text-2xl font-semibold text-amber-900">{result.guest.name}</p>
              <p className="mt-1 text-xs text-amber-600">
                {t('Checked in at', 'وقت التسجيل')}{' '}
                {result.guest.checked_in_at
                  ? new Date(result.guest.checked_in_at).toLocaleString(isArabic ? 'ar-SA' : 'en-US')
                  : ''}
              </p>
              <button
                onClick={resetScan}
                className="mt-4 w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"
              >
                {t('Scan Next Guest', 'مسح الضيف التالي')}
              </button>
            </div>
          )}

          {/* Error */}
          {scanState === 'error' && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-red-800">{t('Error', 'خطأ')}</h2>
              <p className="mt-1 text-sm text-red-700">{errorMsg}</p>
              <button
                onClick={resetScan}
                className="mt-4 w-full rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
              >
                {t('Try Again', 'حاول مجدداً')}
              </button>
            </div>
          )}
        </main>
      </div>
    </UserAuthGuard>
  )
}
