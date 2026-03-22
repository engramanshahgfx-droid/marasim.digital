'use client'

import { InvitationData } from '@/types/invitations'
import { useLocale } from 'next-intl'

interface ElegantInvitationProps {
  data: InvitationData
}

export function ElegantInvitation({ data }: ElegantInvitationProps) {
  const locale = useLocale()
  const isRTL = locale === 'ar'

  const primaryColor = data.custom_colors?.primary || '#1a1a2e'
  const secondaryColor = data.custom_colors?.secondary || '#ffd700'
  const accentColor = '#c9a961'

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div
        className="aspect-[8.5/11] w-full max-w-2xl overflow-hidden rounded-lg shadow-2xl"
        style={{ backgroundColor: '#f5f5f0' }}
      >
        {/* Header Section */}
        <div
          className="relative flex h-48 flex-col items-center justify-center p-8 text-white"
          style={{ backgroundColor: primaryColor }}
        >
          {/* Ornamental top border */}
          <div className="absolute left-0 right-0 top-0 h-1" style={{ backgroundColor: secondaryColor }} />

          {/* Logo/Image */}
          {data.images?.banner && (
            <img
              src={data.images.banner}
              alt="Event"
              className="mb-4 h-20 w-20 rounded-full border-4 object-cover"
              style={{ borderColor: secondaryColor }}
            />
          )}

          <h1 className="mb-2 text-center font-serif text-4xl font-bold">{data.event_name}</h1>
          <div className="mx-auto h-1 w-16" style={{ backgroundColor: secondaryColor }} />
        </div>

        {/* Content Section */}
        <div className="space-y-6 p-8">
          {/* Main Message */}
          <div className="text-center">
            <p className="mb-4 font-serif text-lg italic text-gray-600">
              {isRTL ? 'يشرفنا دعوتكم إلى' : 'We cordially invite you to celebrate'}
            </p>
            <h2 className="font-serif text-3xl font-bold" style={{ color: primaryColor }}>
              {data.host_name}
            </h2>
            {(data.guest_name || data.special_note) && (
              <div className="mt-4 rounded-md border px-4 py-3 text-sm" style={{ borderColor: secondaryColor }}>
                {data.guest_name && (
                  <p className="font-semibold" style={{ color: primaryColor }}>
                    {isRTL ? `الضيف الكريم: ${data.guest_name}` : `Honored guest: ${data.guest_name}`}
                  </p>
                )}
                {data.special_note && <p className="mt-1 text-gray-700">{data.special_note}</p>}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-4 border-b border-t" style={{ borderColor: accentColor }}>
            <div className="space-y-3 pt-4">
              {/* Date */}
              <div className="flex items-start justify-between">
                <span className="font-serif font-semibold" style={{ color: primaryColor }}>
                  {isRTL ? 'التاريخ' : 'Date'}
                </span>
                <span className="text-gray-700">{data.date}</span>
              </div>

              {/* Time */}
              <div className="flex items-start justify-between">
                <span className="font-serif font-semibold" style={{ color: primaryColor }}>
                  {isRTL ? 'الوقت' : 'Time'}
                </span>
                <span className="text-gray-700">
                  {data.time}
                  {data.timezone && ` (${data.timezone})`}
                </span>
              </div>

              {/* Location */}
              <div className="flex items-start justify-between">
                <span className="font-serif font-semibold" style={{ color: primaryColor }}>
                  {isRTL ? 'المكان' : 'Location'}
                </span>
                <span className="text-right text-gray-700">{data.location}</span>
              </div>

              {/* Dress Code */}
              {data.dress_code && (
                <div className="flex items-start justify-between">
                  <span className="font-serif font-semibold" style={{ color: primaryColor }}>
                    {isRTL ? 'الملابس' : 'Dress Code'}
                  </span>
                  <span className="text-gray-700">{data.dress_code}</span>
                </div>
              )}

              {/* RSVP */}
              {data.rsvp_by && (
                <div className="flex items-start justify-between">
                  <span className="font-serif font-semibold" style={{ color: primaryColor }}>
                    {isRTL ? 'التأكيد بحلول' : 'RSVP by'}
                  </span>
                  <span className="text-gray-700">{data.rsvp_by}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {data.description && (
            <div className="text-center italic text-gray-600">
              <p>{data.description}</p>
            </div>
          )}

          {/* Contact Info */}
          {(data.contact_info?.email || data.contact_info?.phone || data.contact_info?.website) && (
            <div className="space-y-1 text-center text-sm text-gray-600">
              {data.contact_info?.email && <p>{data.contact_info.email}</p>}
              {data.contact_info?.phone && <p>{data.contact_info.phone}</p>}
              {data.contact_info?.website && <p>{data.contact_info.website}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 text-center" style={{ backgroundColor: primaryColor }}>
          <p className="font-serif text-sm text-white">
            {isRTL ? 'نتطلع إلى لقاؤك' : 'We look forward to your presence'}
          </p>
          <div className="mx-auto mt-2 h-1 w-12" style={{ backgroundColor: secondaryColor }} />
        </div>
      </div>
    </div>
  )
}

export default ElegantInvitation
