'use client'

import Icon from '@/components/ui/AppIcon'
import { useLocale } from 'next-intl'

interface LiveAttendancePanelProps {
  totalGuests: number
  checkedInGuests: number
  confirmedGuests: number
  eventName?: string | null
  className?: string
}

const LiveAttendancePanel = ({
  totalGuests,
  checkedInGuests,
  confirmedGuests,
  eventName,
  className = '',
}: LiveAttendancePanelProps) => {
  const locale = useLocale()
  const isArabic = locale === 'ar'

  const metrics = [
    {
      labelEn: 'Checked In',
      labelAr: 'تم تسجيل الحضور',
      value: checkedInGuests,
      total: totalGuests,
      icon: 'UserGroupIcon',
      color: 'bg-success/10 text-success',
      bar: 'bg-success',
    },
    {
      labelEn: 'Pending Arrivals',
      labelAr: 'قيد الوصول',
      value: Math.max(totalGuests - checkedInGuests, 0),
      total: totalGuests,
      icon: 'ClockIcon',
      color: 'bg-warning/10 text-warning',
      bar: 'bg-warning',
    },
    {
      labelEn: 'Confirmed RSVP',
      labelAr: 'تأكيد الحضور',
      value: confirmedGuests,
      total: totalGuests,
      icon: 'CheckCircleIcon',
      color: 'bg-primary/10 text-primary',
      bar: 'bg-primary',
    },
  ]

  const calculatePercentage = (value: number, total: number) => Math.round((value / Math.max(total, 1)) * 100)

  return (
    <div className={`rounded-lg bg-card shadow-warm-md ${className}`}>
      <div className="border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-success/10 rounded-md p-2">
              <Icon name="ChartBarIcon" size={24} className="text-success" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-semibold text-text-primary">
                {isArabic ? 'الحضور المباشر' : 'Live Attendance'}
              </h2>
              <p className="text-sm text-text-secondary">
                {eventName || (isArabic ? 'مقاييس تسجيل الحضور فوريًا' : 'Real-time check-in metrics')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse-subtle rounded-full bg-success" />
            <span className="font-caption text-xs text-text-secondary">{isArabic ? 'مباشر' : 'Live'}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-6">
        {metrics.map((metric, index) => {
          const percentage = calculatePercentage(metric.value, metric.total)
          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`rounded-md p-2 ${metric.color}`}>
                    <Icon name={metric.icon as any} size={20} />
                  </div>
                  <span className="text-sm font-medium text-text-primary">
                    {isArabic ? metric.labelAr : metric.labelEn}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-semibold text-text-primary">{metric.value}</span>
                  <span className="text-sm text-text-secondary">/ {metric.total}</span>
                </div>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`absolute left-0 top-0 h-full ${metric.bar} transition-all duration-500 ease-out`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">
                  {percentage}% {isArabic ? 'مكتمل' : 'Complete'}
                </span>
                {metric.value === metric.total && (
                  <span className="text-xs font-medium text-success">
                    {isArabic ? '✓ اكتملت الطاقة' : '✓ Full Capacity'}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-muted/30 border-t border-border p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="font-mono text-2xl font-semibold text-text-primary">
              {calculatePercentage(checkedInGuests, Math.max(totalGuests, 1))}%
            </p>
            <p className="mt-1 text-xs text-text-secondary">{isArabic ? 'نسبة الحضور الكلية' : 'Overall Attendance'}</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-2xl font-semibold text-text-primary">{checkedInGuests}</p>
            <p className="mt-1 text-xs text-text-secondary">{isArabic ? 'إجمالي المسجلين' : 'Total Check-ins'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LiveAttendancePanel
