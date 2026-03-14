'use client'

import Icon from '@/components/ui/AppIcon'
import { getCurrentUser } from '@/lib/auth'
import { useLocale } from 'next-intl'
import { useEffect, useState } from 'react'

interface StatusMetric {
  label: string
  labelAr: string
  value: number
  icon: string
  color: 'primary' | 'success' | 'warning' | 'accent'
}

interface StatusIndicatorBarProps {
  className?: string
  eventId?: string
}

const StatusIndicatorBar = ({ className = '', eventId }: StatusIndicatorBarProps) => {
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const [metrics, setMetrics] = useState<StatusMetric[]>([
    {
      label: 'Invitations Sent',
      labelAr: 'الدعوات المرسلة',
      value: 0,
      icon: 'PaperAirplaneIcon',
      color: 'primary',
    },
    {
      label: 'Confirmed Guests',
      labelAr: 'الضيوف المؤكدون',
      value: 0,
      icon: 'CheckCircleIcon',
      color: 'success',
    },
    {
      label: 'Awaiting RSVP',
      labelAr: 'بانتظار الرد',
      value: 0,
      icon: 'ClockIcon',
      color: 'warning',
    },
    {
      label: 'Checked In',
      labelAr: 'تم تسجيل الحضور',
      value: 0,
      icon: 'UserGroupIcon',
      color: 'accent',
    },
  ])

  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch event statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        const user = await getCurrentUser()
        if (!user?.id) {
          setIsLoading(false)
          return
        }

        const params = new URLSearchParams({
          userId: user.id,
        })

        if (eventId) {
          params.append('eventId', eventId)
        }

        const response = await fetch(`/api/events/statistics?${params.toString()}`)
        if (response.ok) {
          const stats = await response.json()

          setMetrics((prev) => [
            { ...prev[0], value: stats.invitationsSent || 0 },
            { ...prev[1], value: stats.confirmedGuests || 0 },
            { ...prev[2], value: stats.pendingResponses || 0 },
            { ...prev[3], value: stats.checkedIn || 0 },
          ])
        }
      } catch (error) {
        console.error('Error fetching statistics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()

    // Refresh stats every 10 seconds
    const interval = setInterval(fetchStats, 10000)

    return () => clearInterval(interval)
  }, [eventId])

  const getColorClasses = (color: StatusMetric['color']) => {
    const colorMap = {
      primary: 'bg-primary/10 text-primary',
      success: 'bg-success/10 text-success',
      warning: 'bg-warning/10 text-warning',
      accent: 'bg-accent/10 text-accent',
    }
    return colorMap[color]
  }

  return (
    <div className={`border-b border-border bg-card ${className}`}>
      <div className="px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="hidden items-center gap-8 md:flex">
            {metrics.map((metric, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`rounded-md p-2 ${getColorClasses(metric.color)}`}>
                  <Icon name={metric.icon as any} size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-caption text-xs text-text-secondary">
                    {isArabic ? metric.labelAr : metric.label}
                  </span>
                  <span className="font-mono text-lg font-semibold text-text-primary">{metric.value}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="w-full md:hidden">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="transition-smooth hover:bg-muted/80 flex w-full items-center justify-between rounded-md bg-muted px-4 py-2"
              aria-expanded={isExpanded}
              aria-label={isArabic ? 'تبديل مؤشرات الحالة' : 'Toggle status metrics'}
            >
              <div className="flex items-center gap-3">
                <Icon name="ChartBarIcon" size={20} className="text-primary" />
                <span className="text-sm font-medium text-text-primary">
                  {isArabic ? 'حالة الفعالية' : 'Event Status'}
                </span>
              </div>
              <Icon
                name="ChevronDownIcon"
                size={16}
                className={`transition-smooth text-text-secondary ${isExpanded ? 'rotate-180' : ''}`}
              />
            </button>

            {isExpanded && (
              <div className="mt-3 grid animate-slide-up grid-cols-2 gap-3">
                {metrics.map((metric, index) => (
                  <div key={index} className="flex items-center gap-2 rounded-md bg-muted p-3">
                    <div className={`rounded-md p-2 ${getColorClasses(metric.color)}`}>
                      <Icon name={metric.icon as any} size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-caption text-xs text-text-secondary">
                        {isArabic ? metric.labelAr : metric.label}
                      </span>
                      <span className="font-mono text-base font-semibold text-text-primary">{metric.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 animate-pulse-subtle rounded-full bg-success" />
              <span className="font-caption text-xs text-text-secondary">
                {isArabic ? 'تحديثات مباشرة' : 'Live Updates'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatusIndicatorBar
