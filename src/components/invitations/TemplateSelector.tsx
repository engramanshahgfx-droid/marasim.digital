'use client'

import { INVITATION_TEMPLATES, TemplateStyle } from '@/types/invitations'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { ElegantInvitation } from './ElegantInvitation'
import { MinimalInvitation } from './MinimalInvitation'
import { ModernInvitation } from './ModernInvitation'
import { PlayfulInvitation } from './PlayfulInvitation'
import { ProfessionalInvitation } from './ProfessionalInvitation'

interface TemplateSelectorProps {
  onSelect?: (templateId: TemplateStyle) => void
  selectedTemplate?: TemplateStyle
}

const TEMPLATE_COMPONENTS: Record<TemplateStyle, React.ComponentType<{ data: any }>> = {
  elegant: ElegantInvitation,
  modern: ModernInvitation,
  minimal: MinimalInvitation,
  playful: PlayfulInvitation,
  professional: ProfessionalInvitation,
}

export function TemplateSelector({ onSelect, selectedTemplate }: TemplateSelectorProps) {
  const locale = useLocale()
  const isRTL = locale === 'ar'
  const t = useTranslations()

  const [selected, setSelected] = useState<TemplateStyle>(selectedTemplate || 'modern')
  const [view, setView] = useState<'grid' | 'preview'>('grid')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  // Mock invitation data for preview
  const mockData = {
    template_id: selected as TemplateStyle,
    event_id: 'demo',
    event_name: isRTL ? 'حفلة العشاء المميزة' : 'Evening Celebration',
    date: isRTL ? '15 ديسمبر 2024' : 'December 15, 2024',
    time: '7:00 PM',
    timezone: 'GMT',
    location: isRTL ? 'فندق النخلة' : 'Palm Hotel',
    description: isRTL ? 'نتشرف بدعوتك للاحتفال معنا في مساء رائع' : 'Join us for an evening of celebration and joy',
    host_name: isRTL ? 'أحمد وفاطمة' : 'Ahmed & Fatima',
    dress_code: isRTL ? 'ملابس رسمية' : 'Formal Attire',
    rsvp_by: isRTL ? '5 ديسمبر 2024' : 'December 5, 2024',
    contact_info: {
      email: 'event@example.com',
      phone: '+966 50 123 4567',
    },
  }

  const templates = Object.values(INVITATION_TEMPLATES).filter((t) => {
    if (filterCategory === 'all') return true
    return t.category === filterCategory
  })

  const SelectedComponent = TEMPLATE_COMPONENTS[selected]

  const categories = ['all', 'wedding', 'birthday', 'corporate', 'engagement', 'general']

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            {isRTL ? 'اختر قالب الدعوة' : 'Select Your Invitation Template'}
          </h1>
          <p className="text-gray-600">
            {isRTL ? 'اختر من بين قوالب مختلفة واجعل دعوتك فريدة' : 'Choose from our collection of beautiful templates'}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Controls */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          {/* Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`rounded-lg px-4 py-2 font-medium transition-colors ${
                  filterCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                {isRTL
                  ? {
                      all: 'الكل',
                      wedding: 'أعراس',
                      birthday: 'أعياد ميلاد',
                      corporate: 'احترافي',
                      engagement: 'خطوبة',
                      general: 'عام',
                    }[cat]
                  : {
                      all: 'All',
                      wedding: 'Wedding',
                      birthday: 'Birthday',
                      corporate: 'Corporate',
                      engagement: 'Engagement',
                      general: 'General',
                    }[cat]}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setView('grid')}
              className={`rounded-lg px-4 py-2 font-medium transition-colors ${
                view === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              {isRTL ? 'شبكة' : 'Grid'}
            </button>
            <button
              onClick={() => setView('preview')}
              className={`rounded-lg px-4 py-2 font-medium transition-colors ${
                view === 'preview'
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              {isRTL ? 'معاينة' : 'Preview'}
            </button>
          </div>
        </div>

        {/* Content */}
        {view === 'grid' ? (
          <>
            {/* Template Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => {
                    setSelected(template.id)
                    setView('preview')
                    onSelect?.(template.id)
                  }}
                  className={`cursor-pointer overflow-hidden rounded-lg border-2 bg-white shadow-md transition-all hover:shadow-lg ${
                    selected === template.id ? 'border-blue-600 ring-2 ring-blue-300' : 'border-gray-200'
                  }`}
                >
                  {/* Thumbnail Preview */}
                  <div className="flex h-48 items-center justify-center bg-gradient-to-br text-lg font-bold text-white">
                    <div
                      className="flex h-full w-full items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${template.colors.primary} 0%, ${template.colors.secondary} 100%)`,
                      }}
                    >
                      {template.name}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-4">
                    <h3 className="mb-1 text-lg font-bold text-gray-900">
                      {locale === 'ar' ? template.name_ar : template.name}
                    </h3>
                    <p className="mb-3 text-sm text-gray-600">
                      {locale === 'ar' ? template.description_ar : template.description}
                    </p>

                    {/* Features */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {template.features.slice(0, 2).map((feature, i) => (
                          <span key={i} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Select Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelected(template.id)
                        setView('preview')
                        onSelect?.(template.id)
                      }}
                      className={`w-full rounded-lg py-2 font-medium transition-colors ${
                        selected === template.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      {selected === template.id ? (isRTL ? '✓ تم اختيار' : '✓ Selected') : isRTL ? 'اختر' : 'Select'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-6">
            {/* Preview Section */}
            <div className="flex flex-col gap-8 lg:flex-row">
              {/* Live Preview */}
              <div className="flex-1">
                <div className="h-[600px] overflow-hidden rounded-lg bg-white shadow-lg">
                  <SelectedComponent data={mockData} />
                </div>
              </div>

              {/* Template Info Sidebar */}
              <div className="lg:w-80">
                <div className="sticky top-20 rounded-lg bg-white p-6 shadow-md">
                  <h2 className="mb-2 text-2xl font-bold text-gray-900">
                    {locale === 'ar' ? INVITATION_TEMPLATES[selected].name_ar : INVITATION_TEMPLATES[selected].name}
                  </h2>
                  <p className="mb-4 text-sm text-gray-600">
                    {locale === 'ar'
                      ? INVITATION_TEMPLATES[selected].description_ar
                      : INVITATION_TEMPLATES[selected].description}
                  </p>

                  {/* Color Palette */}
                  <div className="mb-6">
                    <h3 className="mb-2 font-semibold text-gray-900">{isRTL ? 'الألوان' : 'Colors'}</h3>
                    <div className="flex gap-2">
                      {[
                        INVITATION_TEMPLATES[selected].colors.primary,
                        INVITATION_TEMPLATES[selected].colors.secondary,
                        INVITATION_TEMPLATES[selected].colors.accent,
                      ].map((color, i) => (
                        <div
                          key={i}
                          className="h-10 w-10 rounded-lg border border-gray-300"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-6">
                    <h3 className="mb-2 font-semibold text-gray-900">{isRTL ? 'الميزات' : 'Features'}</h3>
                    <ul className="space-y-2">
                      {INVITATION_TEMPLATES[selected].features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="text-green-600">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Category Badge */}
                  <div className="mb-6">
                    <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                      {INVITATION_TEMPLATES[selected].category}
                    </span>
                  </div>

                  {/* CTA Buttons */}
                  <div className="space-y-2">
                    <button className="w-full rounded-lg bg-blue-600 py-2 font-medium text-white transition-colors hover:bg-blue-700">
                      {isRTL ? 'استخدم هذا القالب' : 'Use This Template'}
                    </button>
                    <button className="w-full rounded-lg border border-gray-300 py-2 font-medium text-gray-700 transition-colors hover:border-gray-400">
                      {isRTL ? 'معاينة أخرى' : 'View Other Templates'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Other Templates Quick Select */}
            <div className="mt-12">
              <h3 className="mb-4 text-xl font-bold text-gray-900">{isRTL ? 'قوالب أخرى' : 'Other Templates'}</h3>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {templates
                  .filter((t) => t.id !== selected)
                  .map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelected(template.id)}
                      className="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 text-center transition-colors hover:border-blue-300"
                    >
                      <div
                        className="mb-2 flex h-24 items-center justify-center rounded font-bold text-white"
                        style={{
                          background: `linear-gradient(135deg, ${template.colors.primary} 0%, ${template.colors.secondary} 100%)`,
                        }}
                      >
                        {template.name}
                      </div>
                      <p className="text-sm text-gray-700">{locale === 'ar' ? template.name_ar : template.name}</p>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TemplateSelector
