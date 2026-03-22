'use client'

import ElegantInvitation from '@/components/invitations/ElegantInvitation'
import MinimalInvitation from '@/components/invitations/MinimalInvitation'
import ModernInvitation from '@/components/invitations/ModernInvitation'
import PlayfulInvitation from '@/components/invitations/PlayfulInvitation'
import ProfessionalInvitation from '@/components/invitations/ProfessionalInvitation'
import { getTemplatesForCategory, InvitationData, TemplateCategory, TemplateStyle } from '@/types/invitations'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import type { ComponentType } from 'react'

const TEMPLATE_COMPONENTS: Record<TemplateStyle, ComponentType<{ data: InvitationData }>> = {
  elegant: ElegantInvitation,
  modern: ModernInvitation,
  minimal: MinimalInvitation,
  playful: PlayfulInvitation,
  professional: ProfessionalInvitation,
}

/** Sample invitation data used for live miniature template previews */
const SAMPLE_DATA: InvitationData = {
  template_id: 'elegant',
  event_id: 'preview',
  event_name: 'Sarah & James Wedding',
  event_name_ar: 'حفل زفاف سارة وجيمس',
  date: '2026-06-15',
  time: '18:00',
  timezone: 'Asia/Riyadh',
  location: 'The Grand Ballroom, Riyadh',
  location_ar: 'القاعة الكبرى، الرياض',
  description: 'Join us for an evening of celebration',
  description_ar: 'انضم إلينا لأمسية احتفالية',
  host_name: 'The Johnson Family',
  host_name_ar: 'عائلة جونسون',
  dress_code: 'Formal',
  rsvp_by: '2026-06-01',
  guest_name: 'Ahmed Al-Rashid',
  special_note: 'A special seat is reserved for you',
}

interface TemplateBrowserProps {
  category: TemplateCategory
  eventId?: string | null
  eventName?: string | null
  onSelectTemplate?: (templateId: string) => void
}

export default function TemplateBrowser({
  category,
  eventId,
  eventName,
  onSelectTemplate,
}: TemplateBrowserProps) {
  const locale = useLocale()
  const isArabic = locale === 'ar'

  const templates = getTemplatesForCategory(category)
  const queryString = eventId ? `?eventId=${encodeURIComponent(eventId)}` : ''

  return (
    <div className="space-y-6">
      {eventId && (
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-amber-50 p-5 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-700">
                {isArabic ? 'تم ربط بيانات الفعالية' : 'Event Details Connected'}
              </p>
              <h3 className="mt-1 text-xl font-semibold text-gray-900">
                {eventName || (isArabic ? 'فعالية جديدة' : 'New Event')}
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                {isArabic
                  ? 'أي قالب تختاره سيتم تعبئته تلقائياً باسم الفعالية والتاريخ والموقع والوصف.'
                  : 'Whichever template you choose will be pre-filled automatically with the event name, date, venue, and description.'}
              </p>
            </div>
            <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm">
              {isArabic ? 'اختر التصميم ثم تابع التخصيص' : 'Choose a design, then continue to customize'}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">
          {isArabic ? 'اختر القالب' : 'Select Template'}
        </h2>
        <p className="text-gray-600">
          {isArabic ? `${templates.length} قوالب متاحة` : `${templates.length} templates available`}
        </p>
      </div>

      {/* Templates Grid */}
      {templates.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {templates.map((template) => (
            <div
              key={template.id}
              className="group overflow-hidden rounded-xl border-2 border-gray-200 bg-white shadow-sm transition-all hover:border-blue-400 hover:shadow-lg"
            >
              {/* Live template preview — rendered at full size then scaled down */}
              <div
                className="relative w-full overflow-hidden bg-white"
                style={{ height: '200px' }}
              >
                <div
                  className="pointer-events-none absolute left-0 top-0 origin-top-left"
                  style={{ transform: 'scale(0.42)', width: '238%' }}
                >
                  {(() => {
                    const PreviewComponent = TEMPLATE_COMPONENTS[template.id]
                    return (
                      <PreviewComponent
                        data={{ ...SAMPLE_DATA, template_id: template.id }}
                      />
                    )
                  })()}
                </div>
                {/* Gradient fade at the bottom — hides the abrupt crop */}
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent" />
              </div>

              {/* Template Info */}
              <div className="p-4 space-y-3">
                {/* Name & Description */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {isArabic ? template.name_ar : template.name}
                  </h3>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                    {isArabic ? template.style_label_ar : template.style_label}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {isArabic ? template.description_ar : template.description}
                  </p>
                </div>

                {/* Color Palette */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    {isArabic ? 'ألوان' : 'Colors'}
                  </p>
                  <div className="flex gap-2">
                    {[
                      template.colors.primary,
                      template.colors.secondary,
                      template.colors.accent,
                      template.colors.background,
                    ].map((color) => (
                      <div
                        key={color}
                        className="h-6 w-6 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    {isArabic ? 'الميزات' : 'Features'}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {template.features.slice(0, 3).map((feature) => (
                      <span
                        key={feature}
                        className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  <span>{isArabic ? 'المناسبة المثالية' : 'Best fit'}</span>
                  <span className="font-semibold text-gray-900">
                    {template.category === category
                      ? isArabic
                        ? 'موصى به لهذا النوع'
                        : 'Recommended for this event'
                      : isArabic
                        ? 'خيار مرن'
                        : 'Flexible option'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => onSelectTemplate?.(template.id)}
                    className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-center text-sm font-medium text-white transition-all hover:bg-blue-600 active:scale-95"
                  >
                    {isArabic ? 'تخصيص' : 'Customize'}
                  </button>

                  <Link
                    href={`/${locale}/invitations/templates/${category}/${template.id}/preview${queryString}`}
                    className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50"
                  >
                    {isArabic ? 'معاينة' : 'Preview'}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg bg-gray-50 p-12 text-center">
          <p className="text-gray-600">
            {isArabic ? 'لا توجد قوالب متاحة' : 'No templates available'}
          </p>
        </div>
      )}
    </div>
  )
}
