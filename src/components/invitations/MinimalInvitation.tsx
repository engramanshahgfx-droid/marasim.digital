'use client'

import { InvitationData } from '@/types/invitations'
import { useLocale } from 'next-intl'

interface MinimalInvitationProps {
  data: InvitationData
}

export function MinimalInvitation({ data }: MinimalInvitationProps) {
  const locale = useLocale()
  const isRTL = locale === 'ar'

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="aspect-[8.5/11] w-full max-w-2xl overflow-hidden rounded-sm border border-gray-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex h-32 flex-col items-center justify-center space-y-3 border-b border-gray-300">
          {data.images?.logo && <img src={data.images.logo} alt="Event" className="h-12 object-contain" />}
          <h1 className="text-2xl font-light tracking-widest text-gray-900">{data.event_name.toUpperCase()}</h1>
        </div>

        {/* Main Content */}
        <div className="space-y-10 p-16">
          {/* Invitation Text */}
          <div className="space-y-4 text-center">
            <p className="text-sm uppercase tracking-widest text-gray-700">
              {isRTL ? 'يشرفنا أن ندعوك' : 'You are invited to'}
            </p>
            <h2 className="text-lg font-light tracking-wider text-gray-900">{data.host_name}</h2>
            {(data.guest_name || data.special_note) && (
              <div className="mx-auto max-w-lg border border-gray-300 p-3 text-sm text-gray-700">
                {data.guest_name && (
                  <p className="font-semibold text-gray-900">
                    {isRTL ? `دعوة باسم: ${data.guest_name}` : `Invitation for: ${data.guest_name}`}
                  </p>
                )}
                {data.special_note && <p className="mt-1">{data.special_note}</p>}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6 border-y border-gray-300 py-8">
            {/* Date */}
            <div className="flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-widest text-gray-600">{isRTL ? 'التاريخ' : 'Date'}</span>
              <span className="text-gray-900">{data.date}</span>
            </div>

            {/* Time */}
            <div className="flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-widest text-gray-600">{isRTL ? 'الوقت' : 'Time'}</span>
              <span className="text-gray-900">{data.time}</span>
            </div>

            {/* Location */}
            <div className="flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-widest text-gray-600">{isRTL ? 'المكان' : 'Location'}</span>
              <span className="max-w-xs text-right text-gray-900">{data.location}</span>
            </div>

            {/* Dress Code */}
            {data.dress_code && (
              <div className="flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-widest text-gray-600">
                  {isRTL ? 'الملابس' : 'Dress Code'}
                </span>
                <span className="text-gray-900">{data.dress_code}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {data.description && (
            <div className="text-center text-sm leading-relaxed text-gray-700">{data.description}</div>
          )}

          {/* RSVP */}
          {data.rsvp_by && (
            <div className="border-t border-gray-300 pt-4 text-center">
              <p className="mb-2 text-xs uppercase tracking-widest text-gray-600">
                {isRTL ? 'التأكيد بحلول' : 'Please confirm by'}
              </p>
              <p className="font-light text-gray-900">{data.rsvp_by}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-300 px-16 py-8 text-center">
          <p className="text-xs uppercase tracking-widest text-gray-600">
            {isRTL ? 'شكراً لقبولك دعوتنا' : 'Thank you for celebrating with us'}
          </p>
          {(data.contact_info?.email || data.contact_info?.phone) && (
            <div className="mt-4 space-y-1 text-xs text-gray-500">
              {data.contact_info?.email && <p>{data.contact_info.email}</p>}
              {data.contact_info?.phone && <p>{data.contact_info.phone}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MinimalInvitation
