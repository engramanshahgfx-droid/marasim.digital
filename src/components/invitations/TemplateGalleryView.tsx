'use client'

import React, { useState, useMemo } from 'react'
import { useLocale } from 'next-intl'
import { INVITATION_TEMPLATES, InvitationData, TemplateStyle } from '@/types/invitations'
import ElegantInvitation from './ElegantInvitation'
import MinimalInvitation from './MinimalInvitation'
import ModernInvitation from './ModernInvitation'
import PlayfulInvitation from './PlayfulInvitation'
import ProfessionalInvitation from './ProfessionalInvitation'

interface TemplateGalleryViewProps {
  onSelectTemplate?: (templateId: TemplateStyle) => void
  selectedTemplate?: TemplateStyle
  viewMode?: 'templates' | 'stickers' | 'combined'
}

const PAPERLESS_POST_STICKERS = [
  { id: 1, name: 'Golden Vine Details', imageUrl: 'https://assets.ppassets.com/p-78vZww2jq7BGx2LHkjeScW/flyer/sticker_svg/static_thumb_small' },
  { id: 2, name: 'Floral Frieze', imageUrl: 'https://assets.ppassets.com/p-43svb4tChjGpGgr73sP3bD/flyer/sticker_svg/static_thumb_small' },
  { id: 3, name: 'Soft Scroll', imageUrl: 'https://assets.ppassets.com/p-2KA335JyApnsJXVtGq3muf/flyer/sticker_svg/static_thumb_small' },
  { id: 4, name: 'Teacup', imageUrl: 'https://assets.ppassets.com/p-qtcTl6TATPvSeIBw0bRG0/flyer/sticker_svg/static_thumb_small' },
  { id: 5, name: 'Floral Cartouche', imageUrl: 'https://assets.ppassets.com/p-3lgGxrBRBPS1k6ihTXzQhm/flyer/sticker_svg/static_thumb_small' },
  { id: 6, name: 'Save the Date Angled', imageUrl: 'https://assets.ppassets.com/p-4wN8ZmvlrzcxWs8ULIvrG8/flyer/sticker_svg/static_thumb_small' },
  { id: 7, name: "Trail's End Save the Date", imageUrl: 'https://assets.ppassets.com/p-6bsX0sUSukCTBPUoTVpbPS/flyer/sticker_svg/static_thumb_small' },
  { id: 8, name: 'Passport to Romance', imageUrl: 'https://assets.ppassets.com/p-545fSVCy4v9v45xuzyLh6F/flyer/sticker_svg/static_thumb_small' },
  { id: 9, name: 'Calligraphy RSVP', imageUrl: 'https://assets.ppassets.com/p-4n6SccawagsXgn3tKHTSgL/flyer/sticker_svg/static_thumb_small' },
  { id: 10, name: 'Voice of Joy', imageUrl: 'https://assets.ppassets.com/p-22IqPrLpQPKJSj9wBNRKyP/flyer/sticker_svg/static_thumb_small' },
  { id: 11, name: 'Tompion', imageUrl: 'https://assets.ppassets.com/p-1PUpMMebZ4JGkS3vucjRae/flyer/sticker_svg/static_thumb_small' },
  { id: 12, name: 'Together', imageUrl: 'https://assets.ppassets.com/p-6crQHMNWn9Rjm0UYfOVIuL/flyer/sticker_svg/static_thumb_small' },
  { id: 13, name: 'Rubell', imageUrl: 'https://assets.ppassets.com/p-3xI3tTENF2g4gJVHz2wtV4/flyer/sticker_svg/static_thumb_small' },
  { id: 14, name: 'Save the Date Typography', imageUrl: 'https://assets.ppassets.com/p-4NvKBnQpcQWtuzkVofS1PL/flyer/sticker_svg/static_thumb_small' },
  { id: 15, name: 'Sincerely', imageUrl: 'https://assets.ppassets.com/p-ywu39LUV3fBeZulOSiolV/flyer/sticker_svg/static_thumb_small' },
  { id: 16, name: 'Save the Date Banner', imageUrl: 'https://assets.ppassets.com/p-3iCojUQggmdS9IJpQvTQDz/flyer/sticker_svg/static_thumb_small' },
  { id: 17, name: 'Invite You To Celebrate', imageUrl: 'https://assets.ppassets.com/p-8q6Tco9Q2pBrDXVIoTbJt/flyer/sticker_svg/static_thumb_small' },
  { id: 18, name: 'Frame Matting', imageUrl: 'https://assets.ppassets.com/p-26Yl35wFYgjLLpXbTP3a3Y/flyer/sticker_svg/static_thumb_small' },
  { id: 19, name: 'Vintage Save the Date', imageUrl: 'https://assets.ppassets.com/p-1GQatvhIZvi3mju5bGMbKt/flyer/sticker_svg/static_thumb_small' },
  { id: 20, name: 'Daguerre', imageUrl: 'https://assets.ppassets.com/p-Gy8mKq2r8uwODKHymB9Qz/flyer/sticker_svg/static_thumb_small' },
  { id: 21, name: 'Sincerely New', imageUrl: 'https://assets.ppassets.com/p-6X55ucNmQFrKXeOU81A6Tb/flyer/sticker_svg/static_thumb_small' },
  { id: 22, name: 'Brand New Day', imageUrl: 'https://assets.ppassets.com/p-1yaMoNKHRyps5tOX3cW8C0/flyer/sticker_svg/static_thumb_small' },
  { id: 23, name: 'Virtual', imageUrl: 'https://assets.ppassets.com/p-4Hyayg3X3xLAxIFMkwhprS/flyer/sticker_svg/static_thumb_small' },
  { id: 24, name: 'Walker', imageUrl: 'https://assets.ppassets.com/p-4HPaDrx8VJvsgKsVX46eWV/flyer/sticker_svg/static_thumb_small' },
  { id: 25, name: 'Welcome', imageUrl: 'https://assets.ppassets.com/p-YSHRIFGPRxueT0PnnFZTA/flyer/sticker_svg/static_thumb_small' },
  { id: 26, name: 'Bridal Shower', imageUrl: 'https://assets.ppassets.com/p-7hy6RvuRemb7SZ5SFHGYzE/flyer/sticker_svg/static_thumb_small' },
  { id: 27, name: 'Classic Wedding Cake', imageUrl: 'https://assets.ppassets.com/p-lk2DdF6QINk6fSg6DUyK3/flyer/sticker_svg/static_thumb_small' },
  { id: 28, name: 'Bride and Groom', imageUrl: 'https://assets.ppassets.com/p-1P8z5C6BtCIAObqAZz2SPJ/flyer/sticker_svg/static_thumb_small' },
  { id: 29, name: "Trail's End And", imageUrl: 'https://assets.ppassets.com/p-3DT7LXwhSDH0KK6DWvuwwI/flyer/sticker_svg/static_thumb_small' },
  { id: 30, name: 'Wedding Bands', imageUrl: 'https://assets.ppassets.com/p-6tNKMubW6lFtEV7n9hmWNM/flyer/sticker_svg/static_thumb_small' },
  { id: 31, name: 'Garland', imageUrl: 'https://assets.ppassets.com/p-21CdAg63g3ILr950d72tfu/flyer/sticker_svg/static_thumb_small' },
  { id: 32, name: 'Bride', imageUrl: 'https://assets.ppassets.com/p-4ZGFDVZep0ihMGLhDtEA5o/flyer/sticker_svg/static_thumb_small' },
  { id: 33, name: 'Deco Dancers', imageUrl: 'https://assets.ppassets.com/p-U3FjMduXUFeuZ4MLGkWc9/flyer/sticker_svg/static_thumb_small' },
  { id: 34, name: "YOU'RE INVITED", imageUrl: 'https://assets.ppassets.com/p-osQO1XQs6rA9zkTVVakis/flyer/sticker_svg/static_thumb_small' },
  { id: 35, name: 'Polka Dot Wedding Cake', imageUrl: 'https://assets.ppassets.com/p-6IXskdGutXODIRwyIz8tvk/flyer/sticker_svg/static_thumb_small' },
  { id: 36, name: 'Topiary', imageUrl: 'https://assets.ppassets.com/p-2bOsA5eWEXvunc2IzxvDXN/flyer/sticker_svg/static_thumb_small' },
  { id: 37, name: 'Chandelier', imageUrl: 'https://assets.ppassets.com/p-3ECh0eRzUObnd3eXdsws1e/flyer/sticker_svg/static_thumb_small' },
  { id: 38, name: 'Parasol', imageUrl: 'https://assets.ppassets.com/p-483AwvY3toT7ahQuqe5CVh/flyer/sticker_svg/static_thumb_small' },
  { id: 39, name: 'Thick Frame', imageUrl: 'https://assets.ppassets.com/p-4xPs5dx3DT4J3SjOyHNrDT/flyer/sticker_svg/static_thumb_small' },
  { id: 40, name: 'Delicate Heart', imageUrl: 'https://assets.ppassets.com/p-1d9JBiDWJAwgSqgI4tT2YD/flyer/sticker_svg/static_thumb_small' },
  { id: 41, name: 'Itinerary', imageUrl: 'https://assets.ppassets.com/p-5Qal8rGZ9BaGHOAxM4iO5C/flyer/sticker_svg/static_thumb_small' },
  { id: 42, name: 'Party Tent', imageUrl: 'https://assets.ppassets.com/p-58HVJb31nCG4K0YnaQ4ozG/flyer/sticker_svg/static_thumb_small' },
  { id: 43, name: 'Timepiece', imageUrl: 'https://assets.ppassets.com/p-3S003yUfJBG88vkyGSMlG8/flyer/sticker_svg/static_thumb_small' },
  { id: 44, name: 'Flower Vase', imageUrl: 'https://assets.ppassets.com/p-2GVzsQ6vSg6EtEoVy7hSF8/flyer/sticker_svg/static_thumb_small' },
  { id: 45, name: 'Raw Edge And', imageUrl: 'https://assets.ppassets.com/p-4Id2AxbEClWdYDNv3KMRct/flyer/sticker_svg/static_thumb_small' },
  { id: 46, name: 'And Script', imageUrl: 'https://assets.ppassets.com/p-4rF12kP28Ne6vIMnbWcfxK/flyer/sticker_svg/static_thumb_small' },
  { id: 47, name: 'Peace on Earth', imageUrl: 'https://assets.ppassets.com/p-1GPRqZt1jWnFoexdL54dOP/flyer/sticker_svg/static_thumb_small' },
  { id: 48, name: 'Peony', imageUrl: 'https://assets.ppassets.com/p-2M7X9pNK15ZkzGY81ikyPG/flyer/sticker_svg/static_thumb_small' },
]

const TEMPLATE_COMPONENTS: Record<TemplateStyle, React.ComponentType<{ data: InvitationData }>> = {
  elegant: ElegantInvitation,
  modern: ModernInvitation,
  minimal: MinimalInvitation,
  playful: PlayfulInvitation,
  professional: ProfessionalInvitation,
}

const PREVIEW_DATA = {
  template_id: 'elegant' as TemplateStyle,
  event_id: 'preview',
  event_name: 'Catherine & Adrian',
  host_name: 'Catherine and Adrian',
  date: 'Saturday, July 15, 2025',
  time: '6:00 PM',
  location: 'The Swan House, Atlanta, Georgia',
  description: 'invite you to celebrate their marriage',
  timezone: 'EST',
}

export default function TemplateGalleryView({
  onSelectTemplate,
  selectedTemplate = 'elegant',
  viewMode = 'templates',
}: TemplateGalleryViewProps) {
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const [activeTab, setActiveTab] = useState<'templates' | 'stickers' | 'combined'>(viewMode)
  const [stickerSearch, setStickerSearch] = useState('')

  const filteredStickers = useMemo(() => {
    const q = stickerSearch.trim().toLowerCase()
    if (!q) return PAPERLESS_POST_STICKERS
    return PAPERLESS_POST_STICKERS.filter((s) => s.name.toLowerCase().includes(q))
  }, [stickerSearch])

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 py-8" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">
            {isArabic ? 'معرض دعوات' : 'Invitation Gallery'}
          </h1>
          <p className="text-lg text-gray-600">
            {isArabic
              ? 'اختر من 5 قوالب احترافية و 48 ملصق جميل'
              : 'Choose from 5 professional templates & 48 beautiful stickers'}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex justify-center gap-4">
          <button
            onClick={() => setActiveTab('templates')}
            className={`rounded-lg px-6 py-3 font-semibold transition ${
              activeTab === 'templates'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {isArabic ? 'القوالب' : 'Templates'} (5)
          </button>
          <button
            onClick={() => setActiveTab('stickers')}
            className={`rounded-lg px-6 py-3 font-semibold transition ${
              activeTab === 'stickers'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {isArabic ? 'الملصقات' : 'Stickers'} (48)
          </button>
          <button
            onClick={() => setActiveTab('combined')}
            className={`rounded-lg px-6 py-3 font-semibold transition ${
              activeTab === 'combined'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {isArabic ? 'مرحلة' : 'Showcase'}
          </button>
        </div>

        {/* Templates View */}
        {activeTab === 'templates' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {(Object.keys(INVITATION_TEMPLATES) as TemplateStyle[]).map((templateId) => {
                const template = INVITATION_TEMPLATES[templateId]
                const TemplateComponent = TEMPLATE_COMPONENTS[templateId]
                const isSelected = selectedTemplate === templateId

                return (
                  <button
                    key={templateId}
                    onClick={() => onSelectTemplate?.(templateId)}
                    className={`transform overflow-hidden rounded-2xl shadow-lg transition duration-300 ${
                      isSelected ? 'scale-105 ring-4 ring-blue-500' : 'hover:shadow-2xl hover:scale-102'
                    }`}
                  >
                    <div className="h-80 overflow-hidden bg-white">
                      <TemplateComponent data={PREVIEW_DATA} />
                    </div>

                    <div className="bg-white p-6">
                      <h3 className="mb-2 flex items-center justify-between text-xl font-bold text-gray-900">
                        {template.name}
                        {isSelected && <span className="text-blue-600">✓</span>}
                      </h3>
                      <p className="mb-4 text-sm text-gray-600">{template.description}</p>

                      <div className="mb-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-500">COLOR SCHEME:</span>
                          <div className="flex gap-2">
                            <div
                              className="h-6 w-6 rounded"
                              style={{ backgroundColor: template.colors.primary }}
                              title={template.colors.primary}
                            />
                            <div
                              className="h-6 w-6 rounded"
                              style={{ backgroundColor: template.colors.secondary }}
                              title={template.colors.secondary}
                            />
                            <div
                              className="h-6 w-6 rounded"
                              style={{ backgroundColor: template.colors.accent }}
                              title={template.colors.accent}
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {template.features.slice(0, 3).map((feature, idx) => (
                            <span key={idx} className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-800">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => onSelectTemplate?.(templateId)}
                        className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700"
                      >
                        {isSelected ? 'Selected' : 'Select Template'}
                      </button>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Stickers View */}
        {activeTab === 'stickers' && (
          <div className="space-y-6">
            <div className="mx-auto max-w-2xl">
              <input
                type="text"
                value={stickerSearch}
                onChange={(e) => setStickerSearch(e.target.value)}
                placeholder={isArabic ? 'ابحث عن ملصق...' : 'Search stickers...'}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {filteredStickers.map((sticker) => (
                <div
                  key={sticker.id}
                  className="group overflow-hidden rounded-xl bg-white p-3 shadow-md transition hover:shadow-xl"
                >
                  <div className="mb-2 h-24 overflow-hidden rounded-lg bg-gray-100">
                    <img
                      src={sticker.imageUrl}
                      alt={sticker.name}
                      className="h-full w-full object-contain p-2 transition group-hover:scale-110"
                    />
                  </div>
                  <h4 className="line-clamp-2 text-center text-xs font-semibold text-gray-700">{sticker.name}</h4>
                </div>
              ))}
            </div>

            {filteredStickers.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-gray-500">
                  {isArabic ? 'لم يتم العثور على ملصقات' : 'No stickers found'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Combined/Showcase View */}
        {activeTab === 'combined' && (
          <div className="space-y-12">
            <div>
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                {isArabic ? 'معرض مختلط' : 'Template Showcase'}
              </h2>
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
                {(Object.keys(INVITATION_TEMPLATES) as TemplateStyle[]).map((templateId) => {
                  const template = INVITATION_TEMPLATES[templateId]
                  const TemplateComponent = TEMPLATE_COMPONENTS[templateId]

                  return (
                    <div key={templateId} className="space-y-4">
                      <div className="overflow-hidden rounded-2xl shadow-xl">
                        <div className="h-96 bg-white">
                          <TemplateComponent data={PREVIEW_DATA} />
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{template.name}</h3>
                        <p className="mt-1 text-sm text-gray-600">{template.description}</p>

                        <div className="mt-4 grid gap-3">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Features</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {template.features.map((feature, idx) => (
                                <span key={idx} className="inline-block rounded-full bg-gradient-to-r from-blue-50 to-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Color Palette</p>
                            <div className="mt-2 flex gap-3">
                              <div
                                className="h-10 w-full rounded-lg shadow"
                                style={{ backgroundColor: template.colors.primary }}
                                title={`Primary: ${template.colors.primary}`}
                              />
                              <div
                                className="h-10 w-full rounded-lg shadow"
                                style={{ backgroundColor: template.colors.secondary }}
                                title={`Secondary: ${template.colors.secondary}`}
                              />
                              <div
                                className="h-10 w-full rounded-lg shadow"
                                style={{ backgroundColor: template.colors.accent }}
                                title={`Accent: ${template.colors.accent}`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="border-t border-gray-300 pt-12">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                {isArabic ? 'مكتبة الملصقات' : 'Sticker Library'}
              </h2>
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                {PAPERLESS_POST_STICKERS.map((sticker) => (
                  <div
                    key={sticker.id}
                    className="group overflow-hidden rounded-lg bg-white p-2 shadow-md transition hover:shadow-lg"
                  >
                    <div className="h-16 overflow-hidden rounded bg-gray-50">
                      <img
                        src={sticker.imageUrl}
                        alt={sticker.name}
                        className="h-full w-full object-contain p-1 transition group-hover:scale-110"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-center text-sm text-gray-600">
                {isArabic
                  ? 'اختر من 48 ملصق احترافي من Paperless Post'
                  : 'Browse 48 professional stickers from Paperless Post'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
