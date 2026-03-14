'use client'

import Icon from '@/components/ui/AppIcon'
import { useLocale } from 'next-intl'
import { useEffect, useState } from 'react'

interface Guest {
  id: string | number
  name: string
  phone: string
  email: string
  plusOnes: number
  notes?: string
}

interface AddGuestFormProps {
  eventId: string
  token: string
  onSuccess: () => void
  onClose: () => void
  guestToUpdate?: Guest | null
}

const AddGuestForm = ({ eventId, token, onSuccess, onClose, guestToUpdate }: AddGuestFormProps) => {
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const isUpdateMode = !!guestToUpdate

  const [formData, setFormData] = useState({
    name: guestToUpdate?.name || '',
    phone: guestToUpdate?.phone || '',
    email: guestToUpdate?.email || '',
    plusOnes: String(guestToUpdate?.plusOnes || 0),
    notes: guestToUpdate?.notes || '',
  })

  // Update form data when guestToUpdate changes
  useEffect(() => {
    if (guestToUpdate) {
      setFormData({
        name: guestToUpdate.name,
        phone: guestToUpdate.phone,
        email: guestToUpdate.email,
        plusOnes: String(guestToUpdate.plusOnes || 0),
        notes: guestToUpdate.notes || '',
      })
    }
  }, [guestToUpdate])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({})

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {}

    // Name validation
    if (!formData.name.trim()) {
      errors.name = isArabic ? 'الاسم مطلوب' : 'Name is required'
    }

    // Phone validation
    if (!formData.phone.trim()) {
      errors.phone = isArabic ? 'رقم الجوال مطلوب' : 'Phone number is required'
    } else if (!/^\+?\d{10,15}$/.test(formData.phone.replace(/[\s().-]/g, ''))) {
      errors.phone = isArabic
        ? 'صيغة رقم الجوال غير صحيحة. أضف رمز الدولة مثل +966'
        : 'Invalid phone format. Include country code (e.g., +966)'
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = isArabic ? 'البريد الإلكتروني مطلوب' : 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = isArabic ? 'صيغة البريد الإلكتروني غير صحيحة' : 'Invalid email format'
    }

    // Plus ones validation
    const plusOnesNum = parseInt(formData.plusOnes)
    if (isNaN(plusOnesNum) || plusOnesNum < 0) {
      errors.plusOnes = isArabic ? 'يجب أن يكون 0 أو أكثر' : 'Must be 0 or greater'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) {
      return
    }

    if (!eventId && !isUpdateMode) {
      setError(isArabic ? 'يرجى اختيار فعالية أولاً' : 'Please select an event first')
      return
    }

    setIsSubmitting(true)

    try {
      const url = isUpdateMode ? '/api/guests/update' : '/api/guests/create'
      const method = isUpdateMode ? 'PUT' : 'POST'

      const requestBody = isUpdateMode
        ? {
            guestId: guestToUpdate?.id,
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim(),
            plusOnes: parseInt(formData.plusOnes) || 0,
            notes: formData.notes.trim() || null,
          }
        : {
            eventId,
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim(),
            plusOnes: parseInt(formData.plusOnes) || 0,
            notes: formData.notes.trim() || null,
          }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(
          data.error ||
            (isArabic
              ? `فشل ${isUpdateMode ? 'تحديث' : 'إضافة'} الضيف`
              : `Failed to ${isUpdateMode ? 'update' : 'add'} guest`)
        )
        return
      }

      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        plusOnes: '0',
        notes: '',
      })

      // Notify parent component
      onSuccess()
      onClose()
    } catch (err) {
      console.error(`Error ${isUpdateMode ? 'updating' : 'adding'} guest:`, err)
      setError(isArabic ? 'خطأ في الشبكة. حاول مرة أخرى.' : 'Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black bg-opacity-50 p-4 pt-40">
      <div className="my-4 w-full max-w-2xl rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div>
            <h2 className="font-heading text-2xl font-semibold text-text-primary">
              {isUpdateMode
                ? isArabic
                  ? 'تحديث الضيف'
                  : 'Update Guest'
                : isArabic
                  ? 'إضافة ضيف جديد'
                  : 'Add New Guest'}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {isUpdateMode
                ? isArabic
                  ? 'تحديث معلومات الضيف'
                  : 'Update guest information'
                : isArabic
                  ? 'أضف ضيفًا واحدًا إلى فعاليتك يدويًا'
                  : 'Manually add a single guest to your event'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            disabled={isSubmitting}
          >
            <Icon name="XMarkIcon" className="h-6 w-6 text-gray-500" ariaLabel="Close" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              <Icon name="ExclamationCircleIcon" className="mt-0.5 h-5 w-5 flex-shrink-0" ariaLabel="Error" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Name Field */}
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-text-primary">
              {isArabic ? 'اسم الضيف' : 'Guest Name'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`focus:ring-primary-500 w-full rounded-lg border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                validationErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder={isArabic ? 'مثال: أحمد الراشد' : 'e.g., Ahmed Al-Rashid'}
              disabled={isSubmitting}
            />
            {validationErrors.name && <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>}
          </div>

          {/* Phone Field */}
          <div>
            <label htmlFor="phone" className="mb-2 block text-sm font-medium text-text-primary">
              {isArabic ? 'رقم الجوال' : 'Phone Number'} <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className={`focus:ring-primary-500 w-full rounded-lg border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                validationErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder={isArabic ? 'مثال: +966 50 123 4567' : 'e.g., +966 50 123 4567'}
              disabled={isSubmitting}
            />
            {validationErrors.phone && <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>}
            <p className="mt-1 text-xs text-text-secondary">
              {isArabic ? 'أدخل رمز الدولة مثل +966 للسعودية' : 'Include country code (e.g., +966 for Saudi Arabia)'}
            </p>
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-text-primary">
              {isArabic ? 'البريد الإلكتروني' : 'Email Address'} <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`focus:ring-primary-500 w-full rounded-lg border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                validationErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder={isArabic ? 'مثال: ahmed.rashid@email.com' : 'e.g., ahmed.rashid@email.com'}
              disabled={isSubmitting}
            />
            {validationErrors.email && <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>}
          </div>

          {/* Plus Ones Field */}
          <div>
            <label htmlFor="plusOnes" className="mb-2 block text-sm font-medium text-text-primary">
              {isArabic ? 'المرافقون' : 'Plus Ones (Companions)'}
            </label>
            <input
              type="number"
              id="plusOnes"
              value={formData.plusOnes}
              onChange={(e) => handleChange('plusOnes', e.target.value)}
              className={`focus:ring-primary-500 w-full rounded-lg border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                validationErrors.plusOnes ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              min="0"
              max="10"
              disabled={isSubmitting}
            />
            {validationErrors.plusOnes && <p className="mt-1 text-sm text-red-600">{validationErrors.plusOnes}</p>}
            <p className="mt-1 text-xs text-text-secondary">
              {isArabic ? 'عدد الضيوف المرافقين لهذا الشخص' : 'Number of additional guests accompanying this person'}
            </p>
          </div>

          {/* Notes Field */}
          <div>
            <label htmlFor="notes" className="mb-2 block text-sm font-medium text-text-primary">
              {isArabic ? 'ملاحظات خاصة' : 'Special Notes'}
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="focus:ring-primary-500 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2"
              rows={3}
              placeholder={
                isArabic
                  ? 'مثال: قيود غذائية أو تفضيلات الجلوس وغيرها'
                  : 'e.g., Dietary restrictions, seating preferences, etc.'
              }
              disabled={isSubmitting}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-6 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-50"
              disabled={isSubmitting}
            >
              {isArabic ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Icon name="ArrowPathIcon" className="h-4 w-4 animate-spin" ariaLabel="Loading" />
                  {isUpdateMode
                    ? isArabic
                      ? 'جارٍ التحديث...'
                      : 'Updating...'
                    : isArabic
                      ? 'جارٍ الإضافة...'
                      : 'Adding...'}
                </>
              ) : (
                <>
                  <Icon
                    name={isUpdateMode ? 'PencilSquareIcon' : 'UserPlusIcon'}
                    className="h-4 w-4"
                    ariaLabel={isUpdateMode ? (isArabic ? 'تحديث' : 'Update') : isArabic ? 'إضافة' : 'Add'}
                  />
                  {isUpdateMode ? (isArabic ? 'تحديث الضيف' : 'Update Guest') : isArabic ? 'إضافة ضيف' : 'Add Guest'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddGuestForm
