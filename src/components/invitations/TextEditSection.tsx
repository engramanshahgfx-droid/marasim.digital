'use client'

import { InvitationData } from '@/types/invitations'
import { useLocale, useTranslations } from 'next-intl'

interface TextEditSectionProps {
  data: Partial<InvitationData>
  onChange: (field: string, value: string) => void
  isArabic?: boolean
}

export default function TextEditSection({ data, onChange, isArabic = false }: TextEditSectionProps) {
  const t = useTranslations()
  const locale = useLocale()
  const rtl = locale === 'ar'

  const textFields = [
    {
      key: 'event_name',
      label: isArabic ? 'اسم الفعالية' : 'Event Name',
      placeholder: isArabic ? 'أدخل اسم الفعالية' : 'Enter event name',
      maxLength: 100,
    },
    {
      key: 'host_name',
      label: isArabic ? 'اسم المضيف' : 'Host Name',
      placeholder: isArabic ? 'أدخل اسم المضيف' : 'Enter host name',
      maxLength: 100,
    },
    {
      key: 'location',
      label: isArabic ? 'الموقع' : 'Location',
      placeholder: isArabic ? 'أدخل موقع الفعالية' : 'Enter event location',
      maxLength: 200,
    },
    {
      key: 'description',
      label: isArabic ? 'الرسالة/الوصف' : 'Message/Description',
      placeholder: isArabic ? 'أدخل رسالة الفعالية' : 'Enter event message',
      maxLength: 500,
      isTextarea: true,
    },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">{isArabic ? 'تحرير النصوص' : 'Edit Text'}</h3>

      {textFields.map((field) => {
        const value = data[field.key as keyof InvitationData] || ''

        return (
          <div key={field.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">{field.label}</label>
              <span className="text-xs text-gray-500">
                {String(value).length}/{field.maxLength}
              </span>
            </div>

            {field.isTextarea ? (
              <textarea
                value={String(value)}
                onChange={(e) => onChange(field.key, e.target.value.slice(0, field.maxLength))}
                placeholder={field.placeholder}
                maxLength={field.maxLength}
                rows={4}
                dir={rtl ? 'rtl' : 'ltr'}
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            ) : (
              <input
                type="text"
                value={String(value)}
                onChange={(e) => onChange(field.key, e.target.value.slice(0, field.maxLength))}
                placeholder={field.placeholder}
                maxLength={field.maxLength}
                dir={rtl ? 'rtl' : 'ltr'}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            )}
          </div>
        )
      })}

      {/* Date and Time Section */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">{isArabic ? 'التاريخ' : 'Date'}</label>
          <input
            type="date"
            value={data.date || ''}
            onChange={(e) => onChange('date', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">{isArabic ? 'الوقت' : 'Time'}</label>
          <input
            type="time"
            value={data.time || ''}
            onChange={(e) => onChange('time', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* RSVP Date */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {isArabic ? 'موعد نهائي للرد' : 'RSVP By Date'}
        </label>
        <input
          type="date"
          value={data.rsvp_by || ''}
          onChange={(e) => onChange('rsvp_by', e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}
