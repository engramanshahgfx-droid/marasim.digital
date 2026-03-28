'use client'

import { InvitationData } from '@/types/invitations'
import { useLocale } from 'next-intl'

interface ModernInvitationProps {
  data: InvitationData
}

export function ModernInvitation({ data }: ModernInvitationProps) {
  const locale = useLocale()
  const isRTL = locale === 'ar'

  const primaryColor = data.custom_colors?.primary || '#667eea'
  const secondaryColor = data.custom_colors?.secondary || '#764ba2'
  const accentColor = '#f093fb'

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-transparent p-0" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="aspect-[8.5/11] w-full max-w-full overflow-hidden rounded-xl shadow-2xl">
        {/* Gradient Background */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
          }}
        />

        {/* Content */}
        <div className="relative flex h-full flex-col space-y-6 bg-transparent p-8">
          {/* Header with Gradient Accent */}
          <div className="space-y-4 text-center">
            {data.images?.banner && (
              <img
                src={data.images.banner}
                alt="Event"
                className="mx-auto h-24 w-24 rounded-full border-4 object-cover"
                style={{ borderColor: primaryColor }}
              />
            )}

            <div>
              <h1
                className="mb-2 text-5xl font-bold"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {data.event_name}
              </h1>
              <div
                className="mx-auto h-1 w-24 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                }}
              />
            </div>

            <p className="text-lg font-light text-gray-600">{isRTL ? 'يسعدك' : 'You are invited to'}</p>
            <h2 className="text-2xl font-semibold" style={{ color: primaryColor }}>
              {data.host_name}
            </h2>
            {(data.guest_name || data.special_note) && (
              <div className="mx-auto mt-3 max-w-xl rounded-lg border bg-white/70 p-3 text-left text-sm shadow-sm" style={{ borderColor: `${primaryColor}55` }}>
                {data.guest_name && (
                  <p className="font-semibold" style={{ color: primaryColor }}>
                    {isRTL ? `دعوة خاصة إلى ${data.guest_name}` : `Special invitation for ${data.guest_name}`}
                  </p>
                )}
                {data.special_note && <p className="mt-1 text-gray-700">{data.special_note}</p>}
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div
              className="rounded-lg p-4"
              style={{
                backgroundColor: `${primaryColor}10`,
                borderLeft: `4px solid ${primaryColor}`,
              }}
            >
              <p className="text-xs font-semibold uppercase text-gray-600">{isRTL ? 'التاريخ' : 'Date'}</p>
              <p className="mt-1 text-lg font-semibold" style={{ color: primaryColor }}>
                {data.date}
              </p>
            </div>

            {/* Time */}
            <div
              className="rounded-lg p-4"
              style={{
                backgroundColor: `${secondaryColor}10`,
                borderLeft: `4px solid ${secondaryColor}`,
              }}
            >
              <p className="text-xs font-semibold uppercase text-gray-600">{isRTL ? 'الوقت' : 'Time'}</p>
              <p className="mt-1 text-lg font-semibold" style={{ color: secondaryColor }}>
                {data.time}
              </p>
            </div>
          </div>

          {/* Location */}
          <div
            className="rounded-lg p-4"
            style={{
              backgroundColor: `${accentColor}15`,
              borderLeft: `4px solid ${accentColor}`,
            }}
          >
            <p className="text-xs font-semibold uppercase text-gray-600">{isRTL ? 'المكان' : 'Location'}</p>
            <p className="mt-2 text-gray-800">{data.location}</p>
          </div>

          {/* Description */}
          {data.description && (
            <div className="text-center text-gray-600">
              <p className="leading-relaxed">{data.description}</p>
            </div>
          )}

          {/* Dress Code & Special Info */}
          {(data.dress_code || data.special_instructions) && (
            <div className="space-y-2 text-sm text-gray-700">
              {data.dress_code && (
                <p>
                  <span className="font-semibold" style={{ color: primaryColor }}>
                    {isRTL ? 'الملابس: ' : 'Dress Code: '}
                  </span>
                  {data.dress_code}
                </p>
              )}
              {data.special_instructions && (
                <p>
                  <span className="font-semibold" style={{ color: primaryColor }}>
                    {isRTL ? 'ملاحظات: ' : 'Note: '}
                  </span>
                  {data.special_instructions}
                </p>
              )}
            </div>
          )}

          {/* Divider */}
          <div
            className="h-1 rounded-full"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${primaryColor} 50%, transparent 100%)`,
            }}
          />

          {/* Footer CTA */}
          <div className="text-center">
            {data.rsvp_by && (
              <p className="mb-2 text-sm text-gray-600">
                {isRTL ? 'يرجى التأكيد بحلول' : 'Please confirm by'} {data.rsvp_by}
              </p>
            )}
            <button
              className="rounded-lg px-8 py-3 font-semibold text-white transition-transform hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
              }}
            >
              {isRTL ? 'قبول الدعوة' : 'Accept Invitation'}
            </button>
          </div>

          {/* Contact Info */}
          {(data.contact_info?.email || data.contact_info?.phone) && (
            <div className="space-y-1 text-center text-xs text-gray-500">
              {data.contact_info?.email && <p>{data.contact_info.email}</p>}
              {data.contact_info?.phone && <p>{data.contact_info.phone}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ModernInvitation
