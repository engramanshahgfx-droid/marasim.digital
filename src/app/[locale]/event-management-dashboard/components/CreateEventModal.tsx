'use client'

import Icon from '@/components/ui/AppIcon'
import { useLocale } from 'next-intl'
import { useEffect, useState } from 'react'

interface CreateEventModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (eventData: EventFormData) => Promise<void> | void
  editingEvent?: EventFormData | null
}

interface EventFormData {
  id?: string
  name: string
  date: string
  venue: string
  description: string
  expectedGuests: number
  eventType: string
  bankAccountHolder: string
  bankName: string
  bankAccountNumber: string
  bankIban: string
}

const CreateEventModal = ({ isOpen, onClose, onSubmit, editingEvent }: CreateEventModalProps) => {
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const [isHydrated, setIsHydrated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    date: '',
    venue: '',
    description: '',
    expectedGuests: 0,
    eventType: 'wedding',
    bankAccountHolder: '',
    bankName: '',
    bankAccountNumber: '',
    bankIban: '',
  })

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (editingEvent) {
      setFormData(editingEvent)
    } else {
      setFormData({
        name: '',
        date: '',
        venue: '',
        description: '',
        expectedGuests: 0,
        eventType: 'wedding',
        bankAccountHolder: '',
        bankName: '',
        bankAccountNumber: '',
        bankIban: '',
      })
    }
    setError(null)
  }, [editingEvent, isOpen])

  if (!isHydrated) {
    return null
  }

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      setError(null)
      await onSubmit(formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : isArabic ? 'فشل حفظ الفعالية' : 'Failed to save event')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'expectedGuests' ? parseInt(value) || 0 : value,
    }))
  }

  return (
    <>
      <div className="animate-fade-in fixed inset-0 z-[999] bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="pointer-events-none fixed inset-0 z-[9999] overflow-y-auto">
        <div className="pointer-events-none flex min-h-full items-center justify-center p-4">
          <div className="pointer-events-auto my-8 flex w-full max-w-2xl animate-slide-up flex-col rounded-xl bg-card shadow-warm-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-6 py-4">
              <h2 className="font-heading text-2xl font-semibold text-text-primary">
                {editingEvent
                  ? isArabic
                    ? 'تعديل الفعالية'
                    : 'Edit Event'
                  : isArabic
                    ? 'إنشاء فعالية جديدة'
                    : 'Create New Event'}
              </h2>
              <button
                onClick={onClose}
                className="transition-smooth rounded-md p-2 text-text-secondary hover:bg-muted hover:text-text-primary"
                aria-label={isArabic ? 'إغلاق النافذة' : 'Close modal'}
              >
                <Icon name="XMarkIcon" size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              {error && <div className="rounded-md border border-red-400 bg-red-100 p-4 text-red-700">{error}</div>}

              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-text-primary">
                  {isArabic ? 'اسم الفعالية' : 'Event Name'} *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  autoFocus
                  className="transition-smooth w-full rounded-md border border-input bg-background px-4 py-3 text-text-primary focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
                  placeholder={isArabic ? 'مثال: حفل زفاف - سارة وأحمد' : 'e.g., Wedding - Sarah & Ahmed'}
                />
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="date" className="mb-2 block text-sm font-medium text-text-primary">
                    {isArabic ? 'تاريخ الفعالية' : 'Event Date'} *
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="transition-smooth w-full rounded-md border border-input bg-background px-4 py-3 text-text-primary focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
                  />
                </div>

                <div>
                  <label htmlFor="eventType" className="mb-2 block text-sm font-medium text-text-primary">
                    {isArabic ? 'نوع الفعالية' : 'Event Type'} *
                  </label>
                  <select
                    id="eventType"
                    name="eventType"
                    value={formData.eventType}
                    onChange={handleChange}
                    required
                    className="transition-smooth w-full rounded-md border border-input bg-background px-4 py-3 text-text-primary focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="wedding">{isArabic ? 'زفاف' : 'Wedding'}</option>
                    <option value="corporate">{isArabic ? 'فعالية مؤسسية' : 'Corporate Event'}</option>
                    <option value="birthday">{isArabic ? 'حفلة عيد ميلاد' : 'Birthday Party'}</option>
                    <option value="conference">{isArabic ? 'مؤتمر' : 'Conference'}</option>
                    <option value="other">{isArabic ? 'أخرى' : 'Other'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="venue" className="mb-2 block text-sm font-medium text-text-primary">
                  {isArabic ? 'المكان' : 'Venue'} *
                </label>
                <input
                  type="text"
                  id="venue"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  required
                  className="transition-smooth w-full rounded-md border border-input bg-background px-4 py-3 text-text-primary focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
                  placeholder={isArabic ? 'مثال: القاعة الكبرى، الرياض' : 'e.g., Grand Ballroom, Riyadh'}
                />
              </div>

              <div>
                <label htmlFor="expectedGuests" className="mb-2 block text-sm font-medium text-text-primary">
                  {isArabic ? 'العدد المتوقع للضيوف' : 'Expected Number of Guests'} *
                </label>
                <input
                  type="number"
                  id="expectedGuests"
                  name="expectedGuests"
                  value={formData.expectedGuests}
                  onChange={handleChange}
                  required
                  min="1"
                  className="transition-smooth w-full rounded-md border border-input bg-background px-4 py-3 text-text-primary focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
                  placeholder={isArabic ? 'مثال: 250' : 'e.g., 250'}
                />
              </div>

              <div>
                <label htmlFor="description" className="mb-2 block text-sm font-medium text-text-primary">
                  {isArabic ? 'وصف الفعالية' : 'Event Description'}
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="transition-smooth w-full resize-none rounded-md border border-input bg-background px-4 py-3 text-text-primary focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
                  placeholder={
                    isArabic ? 'أضف أي تفاصيل إضافية عن فعاليتك...' : 'Add any additional details about your event...'
                  }
                />
              </div>

              <div className="border-primary/20 bg-primary/5 rounded-lg border p-4">
                <h3 className="mb-3 text-sm font-semibold text-text-primary">
                  {isArabic ? 'بيانات الحساب البنكي لاستلام دفعات الضيوف' : 'Bank account for guest direct transfers'}
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="bankAccountHolder" className="mb-2 block text-sm font-medium text-text-primary">
                      {isArabic ? 'اسم صاحب الحساب' : 'Account Holder Name'} *
                    </label>
                    <input
                      type="text"
                      id="bankAccountHolder"
                      name="bankAccountHolder"
                      value={formData.bankAccountHolder}
                      onChange={handleChange}
                      required
                      className="transition-smooth w-full rounded-md border border-input bg-background px-4 py-3 text-text-primary focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="bankName" className="mb-2 block text-sm font-medium text-text-primary">
                      {isArabic ? 'اسم البنك' : 'Bank Name'} *
                    </label>
                    <input
                      type="text"
                      id="bankName"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                      required
                      className="transition-smooth w-full rounded-md border border-input bg-background px-4 py-3 text-text-primary focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="bankAccountNumber" className="mb-2 block text-sm font-medium text-text-primary">
                      {isArabic ? 'رقم الحساب' : 'Account Number'} *
                    </label>
                    <input
                      type="text"
                      id="bankAccountNumber"
                      name="bankAccountNumber"
                      value={formData.bankAccountNumber}
                      onChange={handleChange}
                      required
                      className="transition-smooth w-full rounded-md border border-input bg-background px-4 py-3 text-text-primary focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="bankIban" className="mb-2 block text-sm font-medium text-text-primary">
                      {isArabic ? 'رقم الآيبان' : 'IBAN'}
                    </label>
                    <input
                      type="text"
                      id="bankIban"
                      name="bankIban"
                      value={formData.bankIban}
                      onChange={handleChange}
                      className="transition-smooth w-full rounded-md border border-input bg-background px-4 py-3 text-text-primary focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
                    />
                  </div>
                </div>
              </div>

              {!editingEvent && (
                <div className="border-primary/15 bg-primary/5 rounded-lg border px-4 py-3 text-sm text-text-secondary">
                  {isArabic
                    ? 'أكمل تفاصيل الفعالية أولاً، ثم سنعرض لك القوالب المناسبة تلقائياً حسب نوع الفعالية.'
                    : 'Enter the event details first, then we will take you directly to the most relevant invitation templates.'}
                </div>
              )}

              <div className="flex items-center gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="transition-smooth hover:bg-muted/80 flex-1 rounded-md bg-muted px-6 py-3 font-medium text-text-primary focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="transition-smooth hover:bg-primary/90 active:scale-97 flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground shadow-warm-md hover:shadow-warm-lg focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      {isArabic ? 'جارٍ الإنشاء...' : 'Creating...'}
                    </>
                  ) : editingEvent ? (
                    isArabic ? (
                      'تحديث الفعالية'
                    ) : (
                      'Update Event'
                    )
                  ) : isArabic ? (
                    'متابعة إلى القوالب'
                  ) : (
                    'Continue to Templates'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default CreateEventModal
