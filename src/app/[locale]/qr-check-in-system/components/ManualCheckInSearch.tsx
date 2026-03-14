'use client'

import Icon from '@/components/ui/AppIcon'
import { useLocale } from 'next-intl'
import { useEffect, useState } from 'react'

import type { ScanSubmissionResult } from './QRScannerViewport'

export interface QRCheckInGuest {
  id: string
  name: string
  email: string
  phone: string
  responseStatus: 'confirmed' | 'declined' | 'no-response'
  checkInTime: string | null
  qrCode: string
  plusOnes: number
}

interface ManualCheckInSearchProps {
  guests: QRCheckInGuest[]
  isLoading?: boolean
  onCheckIn: (guestId: string) => Promise<ScanSubmissionResult>
  className?: string
}

const ManualCheckInSearch = ({ guests, isLoading = false, onCheckIn, className = '' }: ManualCheckInSearchProps) => {
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const [isHydrated, setIsHydrated] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<QRCheckInGuest[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState<QRCheckInGuest | null>(null)
  const [isSubmittingId, setIsSubmittingId] = useState<string | null>(null)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated || !searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    const timer = setTimeout(() => {
      const filtered = guests.filter(
        (guest) =>
          guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          guest.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          guest.phone.includes(searchQuery) ||
          guest.qrCode.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setSearchResults(filtered)
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, isHydrated, guests])

  const handleCheckIn = async (guest: QRCheckInGuest) => {
    if (guest.checkInTime) return
    setIsSubmittingId(guest.id)
    try {
      const result = await onCheckIn(guest.id)
      if (result.status === 'success' || result.status === 'duplicate') {
        setSelectedGuest(guest)
      }
    } finally {
      setIsSubmittingId(null)
    }
  }

  const getStatusBadge = (guest: QRCheckInGuest) => {
    if (guest.checkInTime) {
      return { label: isArabic ? 'تم التسجيل' : 'Checked In', color: 'bg-primary/10 text-primary' }
    }

    if (guest.responseStatus === 'confirmed') {
      return { label: isArabic ? 'مؤكد' : 'Confirmed', color: 'bg-success/10 text-success' }
    }

    if (guest.responseStatus === 'declined') {
      return { label: isArabic ? 'معتذر' : 'Declined', color: 'bg-destructive/10 text-destructive' }
    }

    return { label: isArabic ? 'بانتظار الرد' : 'Awaiting RSVP', color: 'bg-warning/10 text-warning' }
  }

  if (!isHydrated) {
    return (
      <div className={`rounded-lg bg-card p-6 shadow-warm-md ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="h-12 rounded bg-muted" />
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-lg bg-card shadow-warm-md ${className}`}>
      <div className="border-b border-border p-6">
        <div className="flex items-center gap-3">
          <div className="bg-secondary/10 rounded-md p-2">
            <Icon name="MagnifyingGlassIcon" size={24} className="text-secondary" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-semibold text-text-primary">
              {isArabic ? 'تسجيل يدوي' : 'Manual Check-in'}
            </h2>
            <p className="text-sm text-text-secondary">
              {isArabic ? 'ابحث وسجّل حضور الضيوف يدوياً' : 'Search and check in guests manually'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="relative">
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
            <Icon name="MagnifyingGlassIcon" size={20} className="text-text-secondary" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isArabic
                ? 'البحث بالاسم أو الإيميل أو الهاتف أو رمز الدعوة...'
                : 'Search by name, email, phone, or invitation code...'
            }
            className="w-full rounded-md border border-input bg-muted py-3 pl-12 pr-4 text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-3 focus:ring-ring"
          />

          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>

        {searchQuery.trim() && searchResults.length === 0 && !isSearching && !isLoading && (
          <div className="mt-4 p-8 text-center">
            <Icon name="UserIcon" size={48} className="mx-auto mb-3 text-text-secondary" />
            <p className="text-text-secondary">
              {isArabic ? 'لا يوجد ضيوف مطابقون لبحثك' : 'No guests found matching your search'}
            </p>
          </div>
        )}

        {isLoading && (
          <div className="mt-4 p-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-3 text-text-secondary">{isArabic ? 'جارٍ تحميل الضيوف...' : 'Loading guests...'}</p>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="mt-4 max-h-[400px] space-y-2 overflow-y-auto">
            {searchResults.map((guest) => {
              const badge = getStatusBadge(guest)
              return (
                <div key={guest.id} className="hover:bg-muted/80 transition-smooth rounded-lg bg-muted p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                      {guest.name
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0]?.toUpperCase() || '')
                        .join('')}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-text-primary">{guest.name}</h3>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-xs ${badge.color} whitespace-nowrap font-medium`}>
                          {badge.label}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-4 text-xs text-text-secondary">
                        <span className="flex items-center gap-1">
                          <Icon name="EnvelopeIcon" size={14} />
                          {guest.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="PhoneIcon" size={14} />
                          {guest.phone}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-text-secondary">
                          {isArabic ? 'الرمز:' : 'Code:'} {guest.qrCode}
                        </span>
                        <span className="rounded-full bg-card px-2 py-1 text-xs text-text-primary">
                          {isArabic ? `المرافقون ${guest.plusOnes}` : `Plus ones ${guest.plusOnes}`}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => void handleCheckIn(guest)}
                      disabled={Boolean(guest.checkInTime) || isSubmittingId === guest.id}
                      className="transition-smooth hover:bg-primary/90 whitespace-nowrap rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {guest.checkInTime
                        ? isArabic
                          ? 'تم التسجيل'
                          : 'Checked In'
                        : isSubmittingId === guest.id
                          ? isArabic
                            ? 'جارٍ التحقق...'
                            : 'Checking in...'
                          : isArabic
                            ? 'تسجيل الحضور'
                            : 'Check In'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {selectedGuest && (
          <div className="bg-success/10 mt-4 animate-slide-up rounded-lg border-2 border-success p-4">
            <div className="flex items-center gap-3">
              <Icon name="CheckCircleIcon" size={24} className="text-success" />
              <div>
                <p className="font-semibold text-success">
                  {isArabic ? 'تم تسجيل الحضور بنجاح' : 'Check-in Successful'}
                </p>
                <p className="text-sm text-text-secondary">
                  {selectedGuest.name} {isArabic ? 'تم تسجيل دخوله' : 'has been checked in'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ManualCheckInSearch
