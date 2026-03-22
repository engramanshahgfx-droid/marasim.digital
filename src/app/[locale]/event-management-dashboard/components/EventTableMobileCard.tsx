'use client'

import Icon from '@/components/ui/AppIcon'
import { useLocale } from 'next-intl'
import { useState } from 'react'

interface Event {
  id: string
  name: string
  date: string
  venue: string
  guestCount?: number
  invitationsSent?: number
  confirmed?: number
  declined?: number
  noResponse?: number
  checkedIn?: number
  status: 'upcoming' | 'ongoing' | 'completed' | 'draft'
  description?: string
  event_type?: string
  expected_guests?: number
}

interface EventTableMobileCardProps {
  event: Event
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
  onSelectTemplate?: () => void
  onDuplicate: () => void
  onViewAnalytics: () => void
  onArchive: () => void
}

const EventTableMobileCard = ({
  event,
  isSelected,
  onSelect,
  onEdit,
  onSelectTemplate,
  onDuplicate,
  onViewAnalytics,
  onArchive,
}: EventTableMobileCardProps) => {
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusColor = (status: Event['status']) => {
    const statusMap = {
      upcoming: 'bg-primary/10 text-primary',
      ongoing: 'bg-success/10 text-success',
      completed: 'bg-muted text-text-secondary',
      draft: 'bg-warning/10 text-warning',
    }
    return statusMap[status]
  }

  const getStatusLabel = (status: Event['status']) => {
    const labelMap = {
      upcoming: isArabic ? 'قادم' : 'Upcoming',
      ongoing: isArabic ? 'جارٍ' : 'Ongoing',
      completed: isArabic ? 'مكتمل' : 'Completed',
      draft: isArabic ? 'مسودة' : 'Draft',
    }
    return labelMap[status]
  }

  const guestCount = event.guestCount ?? 0
  const invitationsSent = event.invitationsSent ?? 0
  const checkedIn = event.checkedIn ?? 0
  const confirmed = event.confirmed ?? 0
  const declined = event.declined ?? 0
  const noResponse = event.noResponse ?? 0

  const attendanceRate = invitationsSent > 0 ? Math.round((checkedIn / invitationsSent) * 100) : 0

  return (
    <div
      className={`rounded-lg border border-border bg-card shadow-warm-sm ${isSelected ? 'ring-2 ring-primary' : ''}`}
    >
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex flex-1 items-start gap-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-3 focus:ring-ring focus:ring-offset-2"
              aria-label={isArabic ? `تحديد ${event.name}` : `Select ${event.name}`}
            />
            <div className="flex-1">
              <h3 className="mb-1 font-semibold text-text-primary">{event.name}</h3>
              <p className="mb-2 text-sm text-text-secondary">{event.venue}</p>
              <div className="mb-2 flex items-center gap-2">
                <Icon name="CalendarIcon" size={16} className="text-text-secondary" />
                <span className="text-sm text-text-primary">{event.date}</span>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(event.status)}`}
              >
                {getStatusLabel(event.status)}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="transition-smooth p-2 text-text-secondary hover:text-text-primary"
            aria-label={
              isArabic
                ? isExpanded
                  ? 'طي التفاصيل'
                  : 'توسيع التفاصيل'
                : isExpanded
                  ? 'Collapse details'
                  : 'Expand details'
            }
          >
            <Icon name="ChevronDownIcon" size={20} className={`transition-smooth ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className="mb-3 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="mb-1 text-xs text-text-secondary">{isArabic ? 'الضيوف' : 'Guests'}</p>
            <p className="font-mono text-lg font-semibold text-text-primary">{guestCount}</p>
          </div>
          <div className="text-center">
            <p className="mb-1 text-xs text-text-secondary">{isArabic ? 'المرسلة' : 'Sent'}</p>
            <p className="font-mono text-lg font-semibold text-text-primary">{invitationsSent}</p>
          </div>
          <div className="text-center">
            <p className="mb-1 text-xs text-text-secondary">{isArabic ? 'تم تسجيل الحضور' : 'Checked In'}</p>
            <p className="font-mono text-lg font-semibold text-text-primary">{checkedIn}</p>
          </div>
        </div>

        {isExpanded && (
          <div className="animate-slide-up space-y-3 border-t border-border pt-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="mb-1 text-xs text-text-secondary">{isArabic ? 'مؤكد' : 'Confirmed'}</p>
                <p className="font-mono text-base font-semibold text-success">{confirmed}</p>
              </div>
              <div className="text-center">
                <p className="mb-1 text-xs text-text-secondary">{isArabic ? 'معتذر' : 'Declined'}</p>
                <p className="font-mono text-base font-semibold text-destructive">{declined}</p>
              </div>
              <div className="text-center">
                <p className="mb-1 text-xs text-text-secondary">{isArabic ? 'لا يوجد رد' : 'No Response'}</p>
                <p className="font-mono text-base font-semibold text-warning">{noResponse}</p>
              </div>
            </div>
            <div className="rounded-md bg-muted p-3 text-center">
              <p className="mb-1 text-xs text-text-secondary">{isArabic ? 'نسبة الحضور' : 'Attendance Rate'}</p>
              <p className="font-mono text-xl font-bold text-primary">{attendanceRate}%</p>
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          <button
            onClick={onEdit}
            className="transition-smooth hover:bg-primary/90 active:scale-97 flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground"
            aria-label={isArabic ? `تعديل ${event.name}` : `Edit ${event.name}`}
          >
            <Icon name="PencilIcon" size={18} />
            <span className="text-sm font-medium">{isArabic ? 'تعديل' : 'Edit'}</span>
          </button>
          {onSelectTemplate && (
            <button
              onClick={onSelectTemplate}
              className="transition-smooth hover:bg-accent/90 active:scale-97 flex flex-1 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-accent-foreground"
              aria-label={isArabic ? `اختيار قالب ${event.name}` : `Choose template for ${event.name}`}
            >
              <Icon name="SparklesIcon" size={18} />
              <span className="text-sm font-medium">{isArabic ? 'القوالب' : 'Templates'}</span>
            </button>
          )}
          <button
            onClick={onDuplicate}
            className="transition-smooth hover:bg-secondary/90 active:scale-97 rounded-md bg-secondary p-2 text-secondary-foreground"
            aria-label={isArabic ? `نسخ ${event.name}` : `Duplicate ${event.name}`}
            title={isArabic ? 'نسخ' : 'Duplicate'}
          >
            <Icon name="DocumentDuplicateIcon" size={18} />
          </button>
          <button
            onClick={onViewAnalytics}
            className="transition-smooth hover:bg-accent/90 active:scale-97 rounded-md bg-accent p-2 text-accent-foreground"
            aria-label={isArabic ? `تحليلات ${event.name}` : `View analytics for ${event.name}`}
            title={isArabic ? 'التحليلات' : 'Analytics'}
          >
            <Icon name="ChartBarIcon" size={18} />
          </button>
          <button
            onClick={onArchive}
            className="transition-smooth hover:bg-destructive/90 active:scale-97 rounded-md bg-destructive p-2 text-destructive-foreground"
            aria-label={isArabic ? `أرشفة ${event.name}` : `Archive ${event.name}`}
            title={isArabic ? 'أرشفة' : 'Archive'}
          >
            <Icon name="ArchiveBoxIcon" size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default EventTableMobileCard
