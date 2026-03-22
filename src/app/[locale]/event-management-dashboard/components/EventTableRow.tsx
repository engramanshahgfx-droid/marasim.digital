import Icon from '@/components/ui/AppIcon'
import type { TemplateStyle } from '@/types/invitations'
import { useLocale } from 'next-intl'

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
  template_id?: TemplateStyle
}

interface EventTableRowProps {
  event: Event
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
  onDuplicate: () => void
  onViewAnalytics: () => void
  onArchive: () => void
  onManageInvitations?: () => void
  onSelectTemplate?: () => void
}

const EventTableRow = ({
  event,
  isSelected,
  onSelect,
  onEdit,
  onDuplicate,
  onViewAnalytics,
  onArchive,
  onManageInvitations,
  onSelectTemplate,
}: EventTableRowProps) => {
  const locale = useLocale()
  const isArabic = locale === 'ar'
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
  const confirmed = event.confirmed ?? 0
  const declined = event.declined ?? 0
  const noResponse = event.noResponse ?? 0
  const checkedIn = event.checkedIn ?? 0

  const attendanceRate = invitationsSent > 0 ? Math.round((checkedIn / invitationsSent) * 100) : 0

  return (
    <tr className={`hover:bg-muted/50 transition-smooth border-b border-border ${isSelected ? 'bg-primary/5' : ''}`}>
      <td className="px-6 py-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="h-4 w-4 rounded border-border text-primary focus:ring-3 focus:ring-ring focus:ring-offset-2"
          aria-label={isArabic ? `تحديد ${event.name}` : `Select ${event.name}`}
        />
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="font-medium text-text-primary">{event.name}</span>
          <span className="text-sm text-text-secondary">{event.venue}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-text-primary">{event.date}</td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(event.status)}`}
        >
          {getStatusLabel(event.status)}
        </span>
      </td>
      <td className="px-6 py-4 text-center font-mono text-text-primary">{guestCount}</td>
      <td className="px-6 py-4 text-center">
        <div className="flex flex-col items-center gap-1">
          <span className="font-mono text-text-primary">{invitationsSent}</span>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-success">{confirmed}</span>
            <span className="text-destructive">{declined}</span>
            <span className="text-warning">{noResponse}</span>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="flex flex-col items-center gap-1">
          <span className="font-mono text-text-primary">{checkedIn}</span>
          <span className="text-xs text-text-secondary">{attendanceRate}%</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="hover:bg-primary/10 transition-smooth rounded-md p-2 text-primary"
            aria-label={isArabic ? `تعديل ${event.name}` : `Edit ${event.name}`}
            title={isArabic ? 'تعديل الفعالية' : 'Edit Event'}
          >
            <Icon name="PencilIcon" size={18} />
          </button>
          {onSelectTemplate && (
            <button
              onClick={onSelectTemplate}
              className="hover:bg-accent/10 transition-smooth rounded-md p-2 text-accent"
              aria-label={isArabic ? `اختيار قالب ل ${event.name}` : `Select template for ${event.name}`}
              title={isArabic ? 'اختيار قالب الدعوة' : 'Select Invitation Template'}
            >
              <Icon name="SparklesIcon" size={18} />
            </button>
          )}
          {onManageInvitations && (
            <button
              onClick={onManageInvitations}
              className="hover:bg-secondary/10 transition-smooth rounded-md p-2 text-secondary"
              aria-label={isArabic ? `إدارة دعوات ${event.name}` : `Manage invitations for ${event.name}`}
              title={isArabic ? 'إدارة الدعوات' : 'Manage Invitations'}
            >
              <Icon name="EnvelopeIcon" size={18} />
            </button>
          )}
          <button
            onClick={onDuplicate}
            className="hover:bg-secondary/10 transition-smooth rounded-md p-2 text-secondary"
            aria-label={isArabic ? `نسخ ${event.name}` : `Duplicate ${event.name}`}
            title={isArabic ? 'نسخ الفعالية' : 'Duplicate Event'}
          >
            <Icon name="DocumentDuplicateIcon" size={18} />
          </button>
          <button
            onClick={onViewAnalytics}
            className="hover:bg-accent/10 transition-smooth rounded-md p-2 text-accent"
            aria-label={isArabic ? `عرض تحليلات ${event.name}` : `View analytics for ${event.name}`}
            title={isArabic ? 'عرض التحليلات' : 'View Analytics'}
          >
            <Icon name="ChartBarIcon" size={18} />
          </button>
          <button
            onClick={onArchive}
            className="hover:bg-destructive/10 transition-smooth rounded-md p-2 text-destructive"
            aria-label={isArabic ? `أرشفة ${event.name}` : `Archive ${event.name}`}
            title={isArabic ? 'أرشفة الفعالية' : 'Archive Event'}
          >
            <Icon name="ArchiveBoxIcon" size={18} />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default EventTableRow
