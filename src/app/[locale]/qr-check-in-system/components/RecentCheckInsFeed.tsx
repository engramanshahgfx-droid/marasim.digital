'use client'

import Icon from '@/components/ui/AppIcon'
import { useLocale } from 'next-intl'

import type { QRCheckInGuest } from './ManualCheckInSearch'

interface RecentCheckInsFeedProps {
  guests: QRCheckInGuest[]
  className?: string
}

const RecentCheckInsFeed = ({ guests, className = '' }: RecentCheckInsFeedProps) => {
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const checkIns = [...guests]
    .filter((guest) => guest.checkInTime)
    .sort((left, right) => new Date(right.checkInTime || 0).getTime() - new Date(left.checkInTime || 0).getTime())
    .slice(0, 10)

  return (
    <div className={`rounded-lg bg-card shadow-warm-md ${className}`}>
      <div className="border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-md p-2">
              <Icon name="ClockIcon" size={24} className="text-primary" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-semibold text-text-primary">
                {isArabic ? 'آخر عمليات التسجيل' : 'Recent Check-ins'}
              </h2>
              <p className="text-sm text-text-secondary">{isArabic ? 'أحدث وصول للضيوف' : 'Latest guest arrivals'}</p>
            </div>
          </div>
          <button
            className="text-sm font-medium text-primary hover:underline"
            aria-label={isArabic ? 'عرض جميع عمليات التسجيل' : 'View all check-ins'}
          >
            {isArabic ? 'عرض الكل' : 'View All'}
          </button>
        </div>
      </div>

      <div className="max-h-[600px] divide-y divide-border overflow-y-auto">
        {checkIns.length === 0 && (
          <div className="p-6 text-sm text-text-secondary">
            {isArabic ? 'لا توجد عمليات تسجيل حضور بعد' : 'No guest check-ins yet'}
          </div>
        )}
        {checkIns.map((checkIn) => {
          const initials = checkIn.name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() || '')
            .join('')
          return (
            <div key={checkIn.id} className="hover:bg-muted/30 transition-smooth p-4">
              <div className="flex items-start gap-4">
                <div className="relative flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success text-sm font-semibold text-success-foreground">
                    {initials}
                  </div>
                  <div className="bg-success/10 absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-success">
                    <Icon name="CheckCircleIcon" size={12} />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <div>
                      <h3 className="truncate text-sm font-semibold text-text-primary">{checkIn.name}</h3>
                      <p className="text-xs text-text-secondary">{checkIn.phone}</p>
                    </div>
                    <span className="whitespace-nowrap font-mono text-xs text-text-secondary">
                      {new Date(checkIn.checkInTime || '').toLocaleTimeString(isArabic ? 'ar-SA' : 'en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-success/10 rounded-full px-2 py-1 text-xs font-medium text-success">
                      {isArabic ? 'تم التسجيل' : 'Checked In'}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-1 text-xs text-text-primary">
                      {isArabic ? `المرافقون ${checkIn.plusOnes}` : `Plus ones ${checkIn.plusOnes}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-muted/30 border-t border-border p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">{isArabic ? 'إجمالي التسجيلات اليوم' : 'Total check-ins today'}</span>
          <span className="font-mono font-semibold text-text-primary">{checkIns.length}</span>
        </div>
      </div>
    </div>
  )
}

export default RecentCheckInsFeed
