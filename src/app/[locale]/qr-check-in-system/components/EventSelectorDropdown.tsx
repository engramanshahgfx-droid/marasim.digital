'use client'

import Icon from '@/components/ui/AppIcon'
import { useLocale } from 'next-intl'
import { useMemo, useState } from 'react'

export interface QRCheckInEvent {
  id: string
  date: string
  venue: string
  totalGuests: number
  checkedIn: number
  status?: string | null
  name: string
}

interface EventSelectorDropdownProps {
  events: QRCheckInEvent[]
  selectedEventId: string
  onEventChange: (eventId: string) => void
  isLoading?: boolean
  className?: string
}

const EventSelectorDropdown = ({
  events,
  selectedEventId,
  onEventChange,
  isLoading = false,
  className = '',
}: EventSelectorDropdownProps) => {
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const [isOpen, setIsOpen] = useState(false)

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) || events[0] || null,
    [events, selectedEventId]
  )

  const handleEventSelect = (event: QRCheckInEvent) => {
    setIsOpen(false)
    onEventChange(event.id)
  }

  const formatEventDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString(isArabic ? 'ar-SA' : 'en-GB')
    } catch {
      return date
    }
  }

  const getStatusBadge = (status?: string | null) => {
    const badges = {
      active: { label: isArabic ? 'نشط' : 'Active', color: 'bg-success/10 text-success' },
      ongoing: { label: isArabic ? 'جاري' : 'Active', color: 'bg-success/10 text-success' },
      upcoming: { label: isArabic ? 'قادم' : 'Upcoming', color: 'bg-warning/10 text-warning' },
      draft: { label: isArabic ? 'مسودة' : 'Draft', color: 'bg-warning/10 text-warning' },
      completed: { label: isArabic ? 'منتهي' : 'Completed', color: 'bg-muted text-text-secondary' },
    }
    return badges[(status || 'upcoming') as keyof typeof badges] || badges.upcoming
  }

  if (isLoading) {
    return (
      <div className={`rounded-lg bg-card p-4 shadow-warm-md ${className}`}>
        <div className="h-12 animate-pulse rounded bg-muted" />
      </div>
    )
  }

  if (!selectedEvent) {
    return (
      <div className={`rounded-lg bg-card p-4 shadow-warm-md ${className}`}>
        <p className="text-sm text-text-secondary">{isArabic ? 'لا توجد فعاليات متاحة' : 'No events available'}</p>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="transition-smooth flex w-full items-center justify-between rounded-lg bg-card px-6 py-4 shadow-warm-md hover:shadow-warm-lg focus:outline-none focus:ring-3 focus:ring-ring"
        aria-expanded={isOpen}
        aria-label={isArabic ? 'اختر فعالية' : 'Select event'}
      >
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 rounded-md p-2">
            <Icon name="CalendarIcon" size={24} className="text-primary" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-text-primary">{selectedEvent.name}</h3>
              <span
                className={`rounded-full px-2 py-1 text-xs ${getStatusBadge(selectedEvent.status).color} font-medium`}
              >
                {getStatusBadge(selectedEvent.status).label}
              </span>
            </div>
            <p className="text-sm text-text-secondary">{selectedEvent.venue}</p>
            <div className="mt-1 flex items-center gap-4 text-xs text-text-secondary">
              <span className="flex items-center gap-1">
                <Icon name="MapPinIcon" size={14} />
                {selectedEvent.venue}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="UserGroupIcon" size={14} />
                {selectedEvent.checkedIn} / {selectedEvent.totalGuests}
              </span>
            </div>
          </div>
        </div>
        <Icon
          name="ChevronDownIcon"
          size={20}
          className={`transition-smooth text-text-secondary ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div className="absolute left-0 right-0 top-full z-200 mt-2 animate-slide-in overflow-hidden rounded-lg bg-popover shadow-warm-xl">
            <div className="max-h-[400px] overflow-y-auto p-2">
              {events.map((event) => {
                const badge = getStatusBadge(event.status)
                const isSelected = selectedEvent.id === event.id
                return (
                  <button
                    key={event.id}
                    onClick={() => handleEventSelect(event)}
                    className={`transition-smooth w-full rounded-md p-4 text-left hover:bg-muted ${
                      isSelected ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">{event.name}</h4>
                        <p className="text-xs text-text-secondary">{event.venue}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs ${badge.color} whitespace-nowrap font-medium`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-text-secondary">
                      <span className="flex items-center gap-1">
                        <Icon name="CalendarIcon" size={14} />
                        {formatEventDate(event.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="MapPinIcon" size={14} />
                        {event.venue}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-success transition-all duration-500"
                          style={{ width: `${(event.checkedIn / event.totalGuests) * 100}%` }}
                        />
                      </div>
                      <span className="whitespace-nowrap font-mono text-xs text-text-secondary">
                        {event.checkedIn} / {event.totalGuests}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default EventSelectorDropdown
