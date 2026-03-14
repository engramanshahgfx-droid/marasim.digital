'use client'

import Icon from '@/components/ui/AppIcon'
import { useLocale } from 'next-intl'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface QuickAction {
  label: string
  labelAr: string
  icon: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'success' | 'warning'
  showOnPaths?: string[]
}

interface QuickActionToolbarProps {
  className?: string
}

const QuickActionToolbar = ({ className = '' }: QuickActionToolbarProps) => {
  const pathname = usePathname()
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const [isOverflowOpen, setIsOverflowOpen] = useState(false)

  const handleExportExcel = () => {
    console.log('Exporting to Excel...')
  }

  const handleWhatsAppBulk = () => {
    console.log('Sending bulk WhatsApp messages...')
  }

  const handleGenerateReport = () => {
    console.log('Generating report...')
  }

  const handlePrintBadges = () => {
    console.log('Printing badges...')
  }

  const handleSendReminders = () => {
    console.log('Sending reminders...')
  }

  const handleExportQR = () => {
    console.log('Exporting QR codes...')
  }

  const allActions: QuickAction[] = [
    {
      label: 'Export Excel',
      labelAr: 'تصدير إكسل',
      icon: 'DocumentArrowDownIcon',
      onClick: handleExportExcel,
      variant: 'primary',
      showOnPaths: ['/event-management-dashboard', '/guest-list-management'],
    },
    {
      label: 'WhatsApp Bulk',
      labelAr: 'واتساب جماعي',
      icon: 'ChatBubbleLeftRightIcon',
      onClick: handleWhatsAppBulk,
      variant: 'success',
      showOnPaths: ['/guest-list-management'],
    },
    {
      label: 'Generate Report',
      labelAr: 'إنشاء تقرير',
      icon: 'DocumentChartBarIcon',
      onClick: handleGenerateReport,
      variant: 'secondary',
      showOnPaths: ['/event-management-dashboard', '/qr-check-in-system'],
    },
    {
      label: 'Print Badges',
      labelAr: 'طباعة الشارات',
      icon: 'PrinterIcon',
      onClick: handlePrintBadges,
      variant: 'secondary',
      showOnPaths: ['/qr-check-in-system'],
    },
    {
      label: 'Send Reminders',
      labelAr: 'إرسال تذكيرات',
      icon: 'BellAlertIcon',
      onClick: handleSendReminders,
      variant: 'warning',
      showOnPaths: ['/guest-list-management'],
    },
    {
      label: 'Export QR Codes',
      labelAr: 'تصدير رموز QR',
      icon: 'QrCodeIcon',
      onClick: handleExportQR,
      variant: 'primary',
      showOnPaths: ['/guest-list-management', '/qr-check-in-system'],
    },
  ]

  const visibleActions = allActions.filter((action) => !action.showOnPaths || action.showOnPaths.includes(pathname))

  const primaryActions = visibleActions.slice(0, 3)
  const overflowActions = visibleActions.slice(3)

  const getButtonClasses = (variant: QuickAction['variant'] = 'secondary') => {
    const baseClasses =
      'flex items-center gap-2 px-6 py-2.5 rounded-md font-medium transition-smooth focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2 active:scale-97'

    const variantClasses = {
      primary:
        'bg-primary text-primary-foreground hover:bg-primary/90 shadow-warm-sm hover:shadow-warm-md hover:-translate-y-0.5',
      secondary:
        'bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-warm-sm hover:shadow-warm-md hover:-translate-y-0.5',
      success:
        'bg-success text-success-foreground hover:bg-success/90 shadow-warm-sm hover:shadow-warm-md hover:-translate-y-0.5',
      warning:
        'bg-warning text-warning-foreground hover:bg-warning/90 shadow-warm-sm hover:shadow-warm-md hover:-translate-y-0.5',
    }

    return `${baseClasses} ${variantClasses[variant]}`
  }

  return (
    <div className={`flex items-center justify-end gap-3 ${className}`}>
      <div className="hidden items-center gap-3 md:flex">
        {primaryActions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={getButtonClasses(action.variant)}
            aria-label={isArabic ? action.labelAr : action.label}
          >
            <Icon name={action.icon as any} size={20} />
            <span className="text-sm">{isArabic ? action.labelAr : action.label}</span>
          </button>
        ))}

        {overflowActions.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setIsOverflowOpen(!isOverflowOpen)}
              className="transition-smooth hover:bg-muted/80 flex items-center gap-2 rounded-md bg-muted px-4 py-2.5 text-text-primary focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
              aria-label={isArabic ? 'المزيد من الإجراءات' : 'More actions'}
              aria-expanded={isOverflowOpen}
            >
              <Icon name="EllipsisHorizontalIcon" size={20} />
              <span className="text-sm font-medium">{isArabic ? 'المزيد' : 'More'}</span>
            </button>

            {isOverflowOpen && (
              <>
                <div className="fixed inset-0 z-50" onClick={() => setIsOverflowOpen(false)} aria-hidden="true" />
                <div className="absolute right-0 top-full z-200 mt-2 w-56 animate-slide-in overflow-hidden rounded-md bg-popover shadow-warm-lg">
                  <div className="p-2">
                    {overflowActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          action.onClick()
                          setIsOverflowOpen(false)
                        }}
                        className="transition-smooth flex w-full items-center gap-3 rounded-md px-4 py-2.5 text-text-primary hover:bg-muted"
                      >
                        <Icon name={action.icon as any} size={20} />
                        <span className="text-sm">{isArabic ? action.labelAr : action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="md:hidden">
        <button
          onClick={() => setIsOverflowOpen(!isOverflowOpen)}
          className="transition-smooth hover:bg-primary/90 flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-primary-foreground focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
          aria-label={isArabic ? 'إجراءات سريعة' : 'Quick actions'}
          aria-expanded={isOverflowOpen}
        >
          <Icon name="BoltIcon" size={20} />
          <span className="text-sm font-medium">{isArabic ? 'الإجراءات' : 'Actions'}</span>
        </button>

        {isOverflowOpen && (
          <>
            <div className="fixed inset-0 z-50" onClick={() => setIsOverflowOpen(false)} aria-hidden="true" />
            <div className="fixed bottom-0 left-0 right-0 z-200 animate-slide-up rounded-t-xl bg-popover shadow-warm-xl">
              <div className="p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-heading text-lg font-semibold text-text-primary">
                    {isArabic ? 'إجراءات سريعة' : 'Quick Actions'}
                  </h3>
                  <button
                    onClick={() => setIsOverflowOpen(false)}
                    className="transition-smooth p-2 text-text-secondary hover:text-text-primary"
                    aria-label={isArabic ? 'إغلاق' : 'Close'}
                  >
                    <Icon name="XMarkIcon" size={24} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {visibleActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        action.onClick()
                        setIsOverflowOpen(false)
                      }}
                      className="transition-smooth hover:bg-muted/80 active:scale-97 flex flex-col items-center gap-2 rounded-md bg-muted p-4"
                    >
                      <Icon name={action.icon as any} size={24} className="text-primary" />
                      <span className="text-center text-xs font-medium text-text-primary">
                        {isArabic ? action.labelAr : action.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default QuickActionToolbar
