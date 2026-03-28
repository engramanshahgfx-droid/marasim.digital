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
    <div className="flex h-full w-full items-center justify-center bg-transparent p-0" dir={isRTL ? 'rtl' : 'ltr'}>
      <div
        className="aspect-[760/560] w-full max-w-[760px] overflow-hidden rounded-lg shadow-2xl"
        style={{ backgroundColor: 'transparent', maxHeight: '80vh' }}
      >
        {/* Header Section */}
        <div
          className="relative flex h-48 flex-col items-center justify-center p-8 text-white"
          style={{ backgroundColor: 'transparent' }}
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
            {data.description && <p className="mb-4 font-serif text-lg italic text-gray-600">{data.description}</p>}
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
          {(data.date || data.time || data.location || data.dress_code || data.rsvp_by) && (
            <div className="space-y-4 border-b border-t" style={{ borderColor: accentColor }}>
              <div className="mx-auto max-w-[88%] space-y-3 pt-4 text-center">
                <div className="grid grid-cols-1 gap-2 text-center">
                  {data.date && (
                    <div>
                      <span className="font-serif font-semibold" style={{ color: primaryColor }}>
                        {isRTL ? 'التاريخ' : 'Date'}
                      </span>
                      <div className="text-gray-700">{data.date}</div>
                    </div>
                  )}

                  {data.time && (
                    <div>
                      <span className="font-serif font-semibold" style={{ color: primaryColor }}>
                        {isRTL ? 'الوقت' : 'Time'}
                      </span>
                      <div className="text-gray-700">
                        {data.time}
                        {data.timezone && ` (${data.timezone})`}
                      </div>
                    </div>
                  )}

                  {data.location && (
                    <div>
                      <span className="font-serif font-semibold" style={{ color: primaryColor }}>
                        {isRTL ? 'المكان' : 'Location'}
                      </span>
                      <div className="text-gray-700">{data.location}</div>
                    </div>
                  )}

                  {data.dress_code && (
                    <div>
                      <span className="font-serif font-semibold" style={{ color: primaryColor }}>
                        {isRTL ? 'الملابس' : 'Dress Code'}
                      </span>
                      <div className="text-gray-700">{data.dress_code}</div>
                    </div>
                  )}

                  {data.rsvp_by && (
                    <div>
                      <span className="font-serif font-semibold" style={{ color: primaryColor }}>
                        {isRTL ? 'التأكيد بحلول' : 'RSVP by'}
                      </span>
                      <div className="text-gray-700">{data.rsvp_by}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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
        {data.special_instructions && (
          <div className="px-8 py-6 text-center" style={{ backgroundColor: 'transparent' }}>
            <p className="font-serif text-sm text-white">{data.special_instructions}</p>
            <div className="mx-auto mt-2 h-1 w-12" style={{ backgroundColor: secondaryColor }} />
          </div>
        )}
      </div>
    </div>
  )
}

export default ElegantInvitation
