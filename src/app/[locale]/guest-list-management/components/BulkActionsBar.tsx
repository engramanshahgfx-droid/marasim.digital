'use client'

import Icon from '@/components/ui/AppIcon'
import { useLocale } from 'next-intl'

interface BulkActionsBarProps {
  selectedCount: number
  onSendWhatsApp: () => void
  isSendingWhatsApp?: boolean
  onUpdateStatus: () => void
  onExportExcel: () => void
  onGenerateQRCodes: () => void
  onDeselectAll: () => void
}

const BulkActionsBar = ({
  selectedCount,
  onSendWhatsApp,
  isSendingWhatsApp = false,
  onUpdateStatus,
  onExportExcel,
  onGenerateQRCodes,
  onDeselectAll,
}: BulkActionsBarProps) => {
  const locale = useLocale()
  const isArabic = locale === 'ar'
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-100 animate-slide-up bg-primary text-primary-foreground shadow-warm-xl">
      <div className="px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Icon name="CheckCircleIcon" size={24} />
            <span className="text-sm font-medium">
              {isArabic
                ? `تم تحديد ${selectedCount} ضيف`
                : `${selectedCount} guest${selectedCount > 1 ? 's' : ''} selected`}
            </span>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <button
              onClick={onSendWhatsApp}
              disabled={isSendingWhatsApp}
              className="transition-smooth hover:bg-success/90 active:scale-97 flex items-center gap-2 rounded-md bg-success px-4 py-2 text-success-foreground focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSendingWhatsApp ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-success-foreground border-t-transparent" />
              ) : (
                <Icon name="ChatBubbleLeftRightIcon" size={16} />
              )}
              <span className="text-sm font-medium">
                {isSendingWhatsApp
                  ? isArabic
                    ? 'جاري الإرسال...'
                    : 'Sending...'
                  : isArabic
                    ? 'إرسال واتساب'
                    : 'Send WhatsApp'}
              </span>
            </button>
            <button
              onClick={onUpdateStatus}
              className="transition-smooth hover:bg-secondary/90 active:scale-97 flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-secondary-foreground focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
            >
              <Icon name="PencilSquareIcon" size={16} />
              <span className="text-sm font-medium">{isArabic ? 'تحديث الحالة' : 'Update Status'}</span>
            </button>
            <button
              onClick={onExportExcel}
              className="transition-smooth hover:bg-accent/90 active:scale-97 flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-accent-foreground focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
            >
              <Icon name="DocumentArrowDownIcon" size={16} />
              <span className="text-sm font-medium">{isArabic ? 'تصدير إكسل' : 'Export Excel'}</span>
            </button>
            <button
              onClick={onGenerateQRCodes}
              className="transition-smooth hover:bg-primary-foreground/90 active:scale-97 flex items-center gap-2 rounded-md bg-primary-foreground px-4 py-2 text-primary focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
            >
              <Icon name="QrCodeIcon" size={16} />
              <span className="text-sm font-medium">{isArabic ? 'إنشاء رموز QR' : 'Generate QR Codes'}</span>
            </button>
            <button
              onClick={onDeselectAll}
              className="transition-smooth hover:bg-destructive/90 active:scale-97 flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-destructive-foreground focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
            >
              <Icon name="XMarkIcon" size={16} />
              <span className="text-sm font-medium">{isArabic ? 'إلغاء تحديد الكل' : 'Deselect All'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onSendWhatsApp}
              className="transition-smooth hover:bg-success/90 active:scale-97 rounded-md bg-success p-2 text-success-foreground"
              aria-label={isArabic ? 'إرسال واتساب' : 'Send WhatsApp'}
            >
              <Icon name="ChatBubbleLeftRightIcon" size={20} />
            </button>
            <button
              onClick={onExportExcel}
              className="transition-smooth hover:bg-accent/90 active:scale-97 rounded-md bg-accent p-2 text-accent-foreground"
              aria-label={isArabic ? 'تصدير إكسل' : 'Export Excel'}
            >
              <Icon name="DocumentArrowDownIcon" size={20} />
            </button>
            <button
              onClick={onDeselectAll}
              className="transition-smooth hover:bg-destructive/90 active:scale-97 rounded-md bg-destructive p-2 text-destructive-foreground"
              aria-label={isArabic ? 'إلغاء تحديد الكل' : 'Deselect All'}
            >
              <Icon name="XMarkIcon" size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BulkActionsBar
