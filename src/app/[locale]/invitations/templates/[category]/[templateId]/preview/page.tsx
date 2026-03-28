'use client'

import Header from '@/components/common/Header'
import UserAuthGuard from '@/components/UserAuthGuard'
import { getCurrentSession } from '@/lib/auth'
import { INVITATION_TEMPLATES, TemplateStyle } from '@/types/invitations'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useState } from 'react'
import { use } from 'react'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import ElegantInvitation from '@/components/invitations/ElegantInvitation'
import ModernInvitation from '@/components/invitations/ModernInvitation'
import MinimalInvitation from '@/components/invitations/MinimalInvitation'
import PlayfulInvitation from '@/components/invitations/PlayfulInvitation'
import ProfessionalInvitation from '@/components/invitations/ProfessionalInvitation'

interface TemplatePreviewPageProps {
  params: Promise<{
    category: string
    templateId: string
    locale: string
  }>
}

const TEMPLATE_COMPONENTS: Record<TemplateStyle, React.ComponentType<any>> = {
  elegant: ElegantInvitation,
  modern: ModernInvitation,
  minimal: MinimalInvitation,
  playful: PlayfulInvitation,
  professional: ProfessionalInvitation,
}

const FRAME_OPTIONS = [
  {
    id: 1,
    name: 'Together in Tradition',
    imageUrl: 'https://images.greetingsisland.com/images/invitations/wedding/together%20in%20tradition-1.png?auto=compress',
  },
  {
    id: 2,
    name: 'Sage Leaves',
    imageUrl: 'https://images.greetingsisland.com/images/invitations/wedding/sageleaves-5.gif?w=1000',
  },
  {
    id: 3,
    name: 'Union Time',
    imageUrl: 'https://images.greetingsisland.com/images/invitations/wedding/previews/union-time-53144.gif?auto=format,compress&w=932',
  },
  {
    id: 4,
    name: 'Dance of Two Souls',
    imageUrl: 'https://images.greetingsisland.com/images/invitations/wedding/previews/dance-of-two-souls-53200.jpeg?auto=format,compress&w=932',
  },
  {
    id: 5,
    name: 'Terracotta Frame',
    imageUrl: 'https://images.greetingsisland.com/images/invitations/wedding/previews/terracotta-frame-33749.jpeg?auto=format,compress&w=932',
  },
  {
    id: 6,
    name: 'Terracotta Round Frame',
    imageUrl: 'https://images.greetingsisland.com/images/invitations/wedding/previews/terracotta-round-frame-34863.gif?auto=format,compress&w=932',
  },
  {
    id: 7,
    name: 'Double Frame & Leaves',
    imageUrl: 'https://images.greetingsisland.com/images/invitations/wedding/previews/double-frame-&-leaves-22133.jpeg?auto=format,compress&w=932',
  },
]

// Sample invitation data
const SAMPLE_DATA = {
  template_id: 'elegant' as TemplateStyle,
  event_id: 'sample',
  event_name: 'Catherine & Adrian',
  host_name: 'The Susan House',
  date: '2026-07-15',
  time: '18:00',
  timezone: 'UTC',
  location: 'Atlanta, Georgia',
  description: 'Together with their families, request the honor of your presence at the marriage of Catherine and Adrian. Dinner and merriment to follow.',
}

export default function TemplatePreviewPage({
  params,
}: TemplatePreviewPageProps) {
  const { category, templateId, locale } = use(params)
  const currentLocale = useLocale()
  const isArabic = currentLocale === 'ar'
  const searchParams = useSearchParams()
  const eventId = searchParams.get('eventId')
  const invitationId = searchParams.get('invitationId')
  const shareLink = searchParams.get('shareLink')

  const template = INVITATION_TEMPLATES[templateId as TemplateStyle]
  const [activeFrameUrl, setActiveFrameUrl] = useState(FRAME_OPTIONS[0]?.imageUrl || '')

  if (!template) {
    return (
      <UserAuthGuard>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="container mx-auto px-4 py-12 text-center">
            <p className="text-xl text-gray-600">
              {isArabic ? 'قالب غير محجود' : 'Template not found'}
            </p>
          </main>
        </div>
      </UserAuthGuard>
    )
  }

  const TemplateComponent = TEMPLATE_COMPONENTS[templateId as TemplateStyle]
  const [zoom, setZoom] = useState(100)
  const [viewType, setViewType] = useState<'card' | 'fullPage'>('card')
  const [previewData, setPreviewData] = useState({
    ...SAMPLE_DATA,
    template_id: templateId as TemplateStyle,
  })

  useEffect(() => {
    if (!eventId) {
      setPreviewData({
        ...SAMPLE_DATA,
        template_id: templateId as TemplateStyle,
      })
      setActiveFrameUrl(FRAME_OPTIONS[0]?.imageUrl || '')
      return
    }

    const loadEventPreview = async () => {
      try {
        const session = await getCurrentSession()
        if (!session?.access_token) {
          return
        }

        const response = await fetch(`/api/events/${eventId}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          return
        }

        const event = await response.json()
        setPreviewData({
          template_id: templateId as TemplateStyle,
          event_id: event.id || eventId,
          event_name: event.name || SAMPLE_DATA.event_name,
          host_name: event.name || SAMPLE_DATA.host_name,
          date: event.date || SAMPLE_DATA.date,
          time: event.time || SAMPLE_DATA.time,
          timezone: 'UTC',
          location: event.venue || SAMPLE_DATA.location,
          description: event.description || SAMPLE_DATA.description,
        })
      } catch (error) {
        console.error('Failed to load preview event data:', error)
      }
    }

    loadEventPreview()
  }, [eventId, templateId])

  const customizeQuery = new URLSearchParams()
  if (eventId) customizeQuery.set('eventId', eventId)
  if (invitationId) customizeQuery.set('invitationId', invitationId)
  if (shareLink) customizeQuery.set('shareLink', shareLink)
  const customizeHref = `/${currentLocale}/invitations/templates/${category}/${templateId}/customize${
    customizeQuery.toString() ? `?${customizeQuery.toString()}` : ''
  }`

  return (
    <UserAuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />

        <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-8 flex items-center gap-2 text-sm text-gray-600">
            <Link
              href={`/${currentLocale}/invitations/templates`}
              className="hover:text-blue-600"
            >
              {isArabic ? 'القوالب' : 'Templates'}
            </Link>
            <span>/</span>
            <Link
              href={`/${currentLocale}/invitations/templates/${category}`}
              className="hover:text-blue-600"
            >
              {category}
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">
              {isArabic ? template.name_ar : template.name}
            </span>
          </div>

          <div className="grid gap-8 lg:grid-cols-4 lg:gap-6">
            {/* Left Sidebar - Info */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-xl bg-white p-6 shadow-sm space-y-6">
                {/* Template Info */}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {isArabic ? template.name_ar : template.name}
                  </h1>
                  <p className="mt-2 text-sm text-gray-600">
                    {isArabic ? template.description_ar : template.description}
                  </p>
                </div>

                {/* Colors */}
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-2">
                    {isArabic ? 'الألوان' : 'Colors'}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: 'Primary', value: template.colors.primary },
                      { name: 'Secondary', value: template.colors.secondary },
                      { name: 'Accent', value: template.colors.accent },
                      { name: 'Background', value: template.colors.background },
                    ].map((color) => (
                      <div key={color.name} className="space-y-1">
                        <div
                          className="h-12 w-full rounded-lg border border-gray-300"
                          style={{ backgroundColor: color.value }}
                        />
                        <p className="text-xs text-gray-600">{color.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-2">
                    {isArabic ? 'الميزات' : 'Features'}
                  </p>
                  <div className="space-y-2">
                    {template.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">✓</span>
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <Link
                  href={customizeHref}
                  className="block w-full rounded-lg bg-blue-600 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  {isArabic ? 'تخصيص هذا القالب' : 'Customize This Template'}
                </Link>
              </div>
            </div>

            {/* Right Side - Preview */}
            <div className="lg:col-span-3">
              <div className="rounded-xl bg-white p-8 shadow-sm">
                {/* Controls */}
                <div className="mb-6 flex flex-wrap items-center gap-4">
                  {/* View Type */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewType('card')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        viewType === 'card'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      📄 Card
                    </button>
                    <button
                      onClick={() => setViewType('fullPage')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        viewType === 'fullPage'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      📖 Full Page
                    </button>
                  </div>

                  {/* Zoom Controls */}
                  <input
                    type="range"
                    min="50"
                    max="150"
                    step="10"
                    value={zoom}
                    onChange={(e) => setZoom(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 font-medium w-12">
                    {zoom}%
                  </span>
                </div>

                        {/* Preview */}
                <div className="flex justify-center bg-gray-50 rounded-lg p-6">
                  <div className="relative">
                    {activeFrameUrl && (
                      <img
                        src={activeFrameUrl}
                        alt="Invitation frame"
                        className="absolute inset-0 h-full w-full rounded-lg"
                        style={{ zIndex: 0, objectFit: 'contain', filter: 'brightness(0.95)' }}
                      />
                    )}
                    <div
                      className="relative"
                      style={{
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: 'center top',
                        zIndex: 10,
                      }}
                    >
                      <TemplateComponent
                        data={previewData}
                        customization={{
                          template_id: templateId,
                          primary_color: template.colors.primary,
                          secondary_color: template.colors.secondary,
                          accent_color: template.colors.accent,
                          font_family: 'serif',
                          style_variation: 'light',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
                  <p className="font-medium">
                    {isArabic
                      ? 'هذه معاينة توضيحية. يمكنك تخصيص جميع النصوص والألوان والصور.'
                      : 'This is a preview. You can customize all text, colors, and images.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </UserAuthGuard>
  )
}
