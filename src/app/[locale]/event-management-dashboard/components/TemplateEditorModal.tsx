'use client'

import Icon from '@/components/ui/AppIcon'
import AppImage from '@/components/ui/AppImage'
import { defaultTemplate, templateService, type TemplateData } from '@/lib/templateService'
import { useLocale } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'

interface TemplateEditorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (template: TemplateData) => void
  eventId?: string
  eventData?: {
    name: string
    date: string
    time?: string
    venue: string
  }
}

type NotificationType = 'success' | 'error' | 'info'

interface Notification {
  type: NotificationType
  message: string
}

const TemplateEditorModal = ({ isOpen, onClose, onSave, eventId, eventData }: TemplateEditorModalProps) => {
  const locale = useLocale()
  const isArabic = locale === 'ar'

  const [isHydrated, setIsHydrated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [notification, setNotification] = useState<Notification | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const [template, setTemplate] = useState<TemplateData>(() => ({
    ...defaultTemplate,
    language: isArabic ? 'ar' : 'en',
    eventDetails: {
      date: eventData?.date || defaultTemplate.eventDetails.date,
      time: eventData?.time || defaultTemplate.eventDetails.time,
      venue: eventData?.venue || defaultTemplate.eventDetails.venue,
    },
  }))

  // Load existing template when modal opens
  const loadTemplate = useCallback(async () => {
    if (!eventId) return

    setIsLoading(true)
    try {
      const existingTemplate = await templateService.getTemplate(eventId)
      if (existingTemplate) {
        setTemplate({
          language: isArabic ? 'ar' : 'en',
          headerImage: existingTemplate.headerImage,
          title: existingTemplate.title,
          titleAr: existingTemplate.titleAr,
          message: existingTemplate.message,
          messageAr: existingTemplate.messageAr,
          eventDetails: {
            date: eventData?.date || existingTemplate.eventDetails.date,
            time: eventData?.time || existingTemplate.eventDetails.time,
            venue: eventData?.venue || existingTemplate.eventDetails.venue,
          },
          footerText: existingTemplate.footerText,
          footerTextAr: existingTemplate.footerTextAr,
        })
      } else if (eventData) {
        // No existing template, use defaults with event data
        setTemplate((prev) => ({
          ...prev,
          eventDetails: {
            date: eventData.date || prev.eventDetails.date,
            time: eventData.time || prev.eventDetails.time,
            venue: eventData.venue || prev.eventDetails.venue,
          },
        }))
      }
    } catch (error) {
      console.error('Error loading template:', error)
      showNotification('error', 'Failed to load existing template')
    } finally {
      setIsLoading(false)
    }
  }, [eventId, eventData])

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isOpen && isHydrated) {
      loadTemplate()
      setHasUnsavedChanges(false)
    }
  }, [isOpen, isHydrated, loadTemplate])

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const showNotification = (type: NotificationType, message: string) => {
    setNotification({ type, message })
  }

  if (!isHydrated) {
    return null
  }

  if (!isOpen) return null

  const handleChange = (field: string, value: string) => {
    setHasUnsavedChanges(true)

    if (field.startsWith('eventDetails.')) {
      const detailField = field.split('.')[1]
      setTemplate((prev) => ({
        ...prev,
        eventDetails: {
          ...prev.eventDetails,
          [detailField]: value,
        },
      }))
    } else {
      setTemplate((prev) => ({
        ...prev,
        [field]: value,
      }))
    }
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      // Validate required fields
      if (!template.title.trim()) {
        showNotification('error', isArabic ? 'عنوان الدعوة مطلوب' : 'Invitation title is required')
        setIsSaving(false)
        return
      }

      if (!template.message.trim()) {
        showNotification('error', isArabic ? 'رسالة الدعوة مطلوبة' : 'Invitation message is required')
        setIsSaving(false)
        return
      }

      // Save to database/localStorage
      if (eventId) {
        const result = await templateService.saveTemplate(eventId, template)

        if (!result.success) {
          showNotification('error', result.error || (isArabic ? 'فشل حفظ القالب' : 'Failed to save template'))
          setIsSaving(false)
          return
        }
      }

      // Call parent onSave
      onSave(template)

      showNotification('success', isArabic ? 'تم حفظ القالب بنجاح!' : 'Template saved successfully!')
      setHasUnsavedChanges(false)

      // Close modal after a short delay to show success message
      setTimeout(() => {
        onClose()
      }, 1000)
    } catch (error) {
      console.error('Error saving template:', error)
      showNotification('error', isArabic ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmClose = window.confirm(
        isArabic
          ? 'لديك تغييرات غير محفوظة. هل تريد الإغلاق؟'
          : 'You have unsaved changes. Are you sure you want to close?'
      )
      if (!confirmClose) return
    }
    onClose()
  }

  const handleResetToDefault = () => {
    const confirmReset = window.confirm(
      isArabic ? 'هل أنت متأكد من إعادة تعيين القالب الافتراضي؟' : 'Are you sure you want to reset to default template?'
    )
    if (confirmReset) {
      setTemplate({
        ...defaultTemplate,
        language: isArabic ? 'ar' : 'en',
        eventDetails: {
          date: eventData?.date || defaultTemplate.eventDetails.date,
          time: eventData?.time || defaultTemplate.eventDetails.time,
          venue: eventData?.venue || defaultTemplate.eventDetails.venue,
        },
      })
      setHasUnsavedChanges(true)
      showNotification('info', isArabic ? 'تمت إعادة تعيين القالب الافتراضي' : 'Template reset to default')
    }
  }

  // Preview content based on app locale
  const previewContent = isArabic
    ? {
        title: template.titleAr || 'أنت مدعو!',
        message: template.messageAr || 'يسعدنا دعوتك للاحتفال بهذه المناسبة الخاصة معنا. حضورك سيعني لنا الكثير.',
        dateLabel: 'التاريخ',
        timeLabel: 'الوقت',
        venueLabel: 'المكان',
        footerText: template.footerTextAr || 'يرجى تأكيد حضورك عن طريق مسح رمز QR أدناه.',
      }
    : {
        title: template.title,
        message: template.message,
        dateLabel: 'Date',
        timeLabel: 'Time',
        venueLabel: 'Venue',
        footerText: template.footerText,
      }

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return isArabic ? 'غير محدد' : 'Not set'
    try {
      return new Date(dateString).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  // Format time for display
  const formatTime = (timeString: string) => {
    if (!timeString) return isArabic ? 'غير محدد' : 'Not set'
    try {
      const [hours, minutes] = timeString.split(':')
      const date = new Date()
      date.setHours(parseInt(hours), parseInt(minutes))
      return date.toLocaleTimeString(isArabic ? 'ar-SA' : 'en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    } catch {
      return timeString
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="animate-fade-in fixed inset-0 z-[300] bg-black/50" onClick={handleClose} aria-hidden="true" />

      {/* Modal */}
      <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
        <div className="max-h-[90vh] w-full max-w-6xl animate-slide-up overflow-hidden rounded-xl bg-card shadow-warm-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                <Icon name="PaintBrushIcon" size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-semibold text-text-primary">
                  {isArabic ? 'محرر قالب الدعوة' : 'Invitation Template Editor'}
                </h2>
                {eventData?.name && <p className="text-sm text-text-secondary">{eventData.name}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <span className="bg-warning/10 rounded px-2 py-1 text-xs text-warning">
                  {isArabic ? 'تغييرات غير محفوظة' : 'Unsaved changes'}
                </span>
              )}
              <button
                onClick={handleClose}
                className="transition-smooth rounded-md p-2 text-text-secondary hover:bg-muted hover:text-text-primary"
                aria-label="Close modal"
              >
                <Icon name="XMarkIcon" size={24} />
              </button>
            </div>
          </div>

          {/* Notification Banner */}
          {notification && (
            <div
              className={`flex items-center gap-2 px-6 py-3 ${
                notification.type === 'success'
                  ? 'bg-success/10 text-success'
                  : notification.type === 'error'
                    ? 'bg-error/10 text-error'
                    : 'bg-info/10 text-info'
              }`}
            >
              <Icon
                name={
                  notification.type === 'success'
                    ? 'CheckCircleIcon'
                    : notification.type === 'error'
                      ? 'ExclamationCircleIcon'
                      : 'InformationCircleIcon'
                }
                size={20}
              />
              <span className="text-sm font-medium">{notification.message}</span>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex h-96 items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
                <p className="text-text-secondary">{isArabic ? 'جاري تحميل القالب...' : 'Loading template...'}</p>
              </div>
            </div>
          ) : (
            <div className="grid h-[calc(90vh-120px)] grid-cols-1 lg:grid-cols-2">
              {/* Editor Panel */}
              <div className="overflow-y-auto border-r border-border p-6" dir={isArabic ? 'rtl' : 'ltr'}>
                <div className="space-y-6">
                  {/* Header Image URL */}
                  <div>
                    <label htmlFor="headerImage" className="mb-2 block text-sm font-medium text-text-primary">
                      {isArabic ? 'رابط صورة الرأس' : 'Header Image URL'}
                    </label>
                    <input
                      type="url"
                      id="headerImage"
                      value={template.headerImage}
                      onChange={(e) => handleChange('headerImage', e.target.value)}
                      className="transition-smooth w-full rounded-md border border-input bg-background px-4 py-3 text-text-primary focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
                      placeholder="https://example.com/image.jpg"
                    />
                    <p className="mt-1 text-xs text-text-secondary">
                      {isArabic
                        ? 'يُنصح باستخدام: 1200×600 بكسل، صيغة JPG أو PNG'
                        : 'Recommended: 1200x600 pixels, JPG or PNG format'}
                    </p>
                  </div>

                  {/* Invitation Title (English) */}
                  <div>
                    <label htmlFor="title" className="mb-2 block text-sm font-medium text-text-primary">
                      {isArabic ? 'عنوان الدعوة (بالإنجليزية)' : 'Invitation Title (English)'}
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={template.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      className="transition-smooth w-full rounded-md border border-input bg-background px-4 py-3 text-text-primary focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
                      placeholder="You're Invited!"
                    />
                  </div>

                  {/* Invitation Title (Arabic) */}
                  <div>
                    <label htmlFor="titleAr" className="mb-2 block text-sm font-medium text-text-primary">
                      {isArabic ? 'عنوان الدعوة (بالعربية)' : 'Invitation Title (Arabic)'}
                    </label>
                    <input
                      type="text"
                      id="titleAr"
                      value={template.titleAr || ''}
                      onChange={(e) => handleChange('titleAr', e.target.value)}
                      dir="rtl"
                      className="transition-smooth w-full rounded-md border border-input bg-background px-4 py-3 text-text-primary focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
                      placeholder="أنت مدعو!"
                    />
                  </div>

                  {/* Invitation Message (English) */}
                  <div>
                    <label htmlFor="message" className="mb-2 block text-sm font-medium text-text-primary">
                      {isArabic ? 'رسالة الدعوة (بالإنجليزية)' : 'Invitation Message (English)'}
                    </label>
                    <textarea
                      id="message"
                      value={template.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                      rows={3}
                      className="transition-smooth w-full resize-none rounded-md border border-input bg-background px-4 py-3 text-text-primary focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
                      placeholder="Enter your invitation message..."
                    />
                  </div>

                  {/* Invitation Message (Arabic) */}
                  <div>
                    <label htmlFor="messageAr" className="mb-2 block text-sm font-medium text-text-primary">
                      {isArabic ? 'رسالة الدعوة (بالعربية)' : 'Invitation Message (Arabic)'}
                    </label>
                    <textarea
                      id="messageAr"
                      value={template.messageAr || ''}
                      onChange={(e) => handleChange('messageAr', e.target.value)}
                      dir="rtl"
                      rows={3}
                      className="transition-smooth w-full resize-none rounded-md border border-input bg-background px-4 py-3 text-text-primary focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
                      placeholder="أدخل رسالة الدعوة هنا..."
                    />
                  </div>

                  {/* Event Details */}
                  <div className="border-t border-border pt-6">
                    <h3 className="mb-4 text-sm font-semibold text-text-primary">
                      {isArabic ? 'تفاصيل الفعالية' : 'Event Details'}
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <label htmlFor="eventDate" className="mb-2 block text-sm font-medium text-text-primary">
                          {isArabic ? 'تاريخ الفعالية' : 'Event Date'}
                        </label>
                        <input
                          type="date"
                          id="eventDate"
                          value={template.eventDetails.date}
                          onChange={(e) => handleChange('eventDetails.date', e.target.value)}
                          className="transition-smooth w-full rounded-md border border-input bg-background px-4 py-3 text-text-primary focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
                        />
                      </div>
                      <div>
                        <label htmlFor="eventTime" className="mb-2 block text-sm font-medium text-text-primary">
                          {isArabic ? 'وقت الفعالية' : 'Event Time'}
                        </label>
                        <input
                          type="time"
                          id="eventTime"
                          value={template.eventDetails.time}
                          onChange={(e) => handleChange('eventDetails.time', e.target.value)}
                          className="transition-smooth w-full rounded-md border border-input bg-background px-4 py-3 text-text-primary focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
                        />
                      </div>
                      <div>
                        <label htmlFor="eventVenue" className="mb-2 block text-sm font-medium text-text-primary">
                          {isArabic ? 'المكان' : 'Venue'}
                        </label>
                        <input
                          type="text"
                          id="eventVenue"
                          value={template.eventDetails.venue}
                          onChange={(e) => handleChange('eventDetails.venue', e.target.value)}
                          className="transition-smooth w-full rounded-md border border-input bg-background px-4 py-3 text-text-primary focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
                          placeholder={isArabic ? 'اسم المكان' : 'Venue name'}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer Text (English) */}
                  <div>
                    <label htmlFor="footerText" className="mb-2 block text-sm font-medium text-text-primary">
                      {isArabic ? 'نص التذييل (بالإنجليزية)' : 'Footer Text (English)'}
                    </label>
                    <textarea
                      id="footerText"
                      value={template.footerText}
                      onChange={(e) => handleChange('footerText', e.target.value)}
                      rows={2}
                      className="transition-smooth w-full resize-none rounded-md border border-input bg-background px-4 py-3 text-text-primary focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
                      placeholder="Footer message..."
                    />
                  </div>

                  {/* Footer Text (Arabic) */}
                  <div>
                    <label htmlFor="footerTextAr" className="mb-2 block text-sm font-medium text-text-primary">
                      {isArabic ? 'نص التذييل (بالعربية)' : 'Footer Text (Arabic)'}
                    </label>
                    <textarea
                      id="footerTextAr"
                      value={template.footerTextAr || ''}
                      onChange={(e) => handleChange('footerTextAr', e.target.value)}
                      dir="rtl"
                      rows={2}
                      className="transition-smooth w-full resize-none rounded-md border border-input bg-background px-4 py-3 text-text-primary focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
                      placeholder="نص التذييل هنا..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 border-t border-border pt-4">
                    <button
                      onClick={handleResetToDefault}
                      className="transition-smooth rounded-md px-4 py-2 text-text-secondary hover:bg-muted hover:text-text-primary"
                      title="Reset to default template"
                    >
                      <Icon name="ArrowPathIcon" size={20} />
                    </button>
                    <div className="flex-1" />
                    <button
                      onClick={handleClose}
                      className="transition-smooth hover:bg-muted/80 rounded-md bg-muted px-6 py-3 font-medium text-text-primary focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
                    >
                      {isArabic ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="transition-smooth hover:bg-primary/90 active:scale-97 flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground shadow-warm-md hover:shadow-warm-lg focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary-foreground" />
                          <span>{isArabic ? 'جاري الحفظ...' : 'Saving...'}</span>
                        </>
                      ) : (
                        <>
                          <Icon name="CheckIcon" size={20} />
                          <span>{isArabic ? 'حفظ القالب' : 'Save Template'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview Panel */}
              <div className="overflow-y-auto bg-muted p-6">
                <div className="sticky top-0 mb-4 bg-muted pb-2">
                  <h3 className="mb-1 text-lg font-semibold text-text-primary">
                    {isArabic ? 'معاينة حية' : 'Live Preview'}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {isArabic ? 'تنسيق رسالة واتساب' : 'WhatsApp Message Format'}
                  </p>
                </div>

                <div
                  className="mx-auto max-w-md overflow-hidden rounded-lg bg-card shadow-warm-md"
                  dir={isArabic ? 'rtl' : 'ltr'}
                >
                  {/* Header Image */}
                  <div className="relative h-48 overflow-hidden bg-muted">
                    {template.headerImage ? (
                      <AppImage
                        src={template.headerImage}
                        alt="Invitation header image"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Icon name="PhotoIcon" size={48} className="text-text-secondary" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="space-y-4 p-6">
                    <h2 className="text-center font-heading text-2xl font-bold text-primary">{previewContent.title}</h2>

                    <p className="text-center leading-relaxed text-text-primary">{previewContent.message}</p>

                    {/* Event Info Card */}
                    <div className="bg-primary/10 space-y-3 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/20 flex h-8 w-8 items-center justify-center rounded-full">
                          <Icon name="CalendarIcon" size={16} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-text-secondary">{previewContent.dateLabel}</p>
                          <p className="text-sm font-medium text-text-primary">
                            {formatDate(template.eventDetails.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/20 flex h-8 w-8 items-center justify-center rounded-full">
                          <Icon name="ClockIcon" size={16} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-text-secondary">{previewContent.timeLabel}</p>
                          <p className="text-sm font-medium text-text-primary">
                            {formatTime(template.eventDetails.time)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/20 flex h-8 w-8 items-center justify-center rounded-full">
                          <Icon name="MapPinIcon" size={16} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-text-secondary">{previewContent.venueLabel}</p>
                          <p className="text-sm font-medium text-text-primary">
                            {template.eventDetails.venue || (isArabic ? 'غير محدد' : 'Not set')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* QR Code Placeholder */}
                    <div className="flex justify-center py-4">
                      <div className="flex h-32 w-32 flex-col items-center justify-center rounded-lg border-2 border-border bg-white">
                        <Icon name="QrCodeIcon" size={64} className="text-primary" />
                        <span className="mt-1 text-xs text-text-secondary">{isArabic ? 'رمز RSVP' : 'RSVP Code'}</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-xs text-text-secondary">{previewContent.footerText}</p>
                  </div>
                </div>

                {/* Preview Tips */}
                <div className="bg-info/10 mt-6 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Icon name="LightBulbIcon" size={20} className="text-info mt-0.5 flex-shrink-0" />
                    <div className="text-info text-sm">
                      <p className="mb-1 font-medium">{isArabic ? 'تلميحات المعاينة:' : 'Preview Tips:'}</p>
                      <ul className="list-inside list-disc space-y-1 text-xs">
                        {isArabic ? (
                          <>
                            <li>توضح هذه المعاينة كيفية ظهور دعوتك في واتساب</li>
                            <li>سيتم توليد رموز QR فريدة لكل ضيف</li>
                          </>
                        ) : (
                          <>
                            <li>This preview shows how your invitation will appear in WhatsApp</li>
                            <li>QR codes will be unique for each guest</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default TemplateEditorModal
