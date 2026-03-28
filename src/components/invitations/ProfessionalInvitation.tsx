'use client'

import { InvitationData } from '@/types/invitations'
import { useLocale } from 'next-intl'

interface ProfessionalInvitationProps {
  data: InvitationData
}

export function ProfessionalInvitation({ data }: ProfessionalInvitationProps) {
  const locale = useLocale()
  const isRTL = locale === 'ar'

  const primaryColor = data.custom_colors?.primary || '#003366'
  const secondaryColor = data.custom_colors?.secondary || '#0066cc'

  return (
    <div className="flex h-full w-full items-center justify-center bg-transparent p-0" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="aspect-[760/560] w-full max-w-[760px] overflow-hidden rounded bg-transparent shadow-2xl" style={{ maxHeight: '80vh' }}>
        {/* Top Bar */}
        <div
          className="h-2"
          style={{
            background: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
          }}
        />

        {/* Header */}
        <div className="border-b-2 border-gray-200 px-12 pb-8 pt-12">
          {data.images?.logo && <img src={data.images.logo} alt="Company Logo" className="mb-6 h-10 object-contain" />}
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: primaryColor }}>
            {isRTL ? 'دعوة رسمية' : 'Formal Invitation'}
          </h1>
          <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-gray-600">
            {isRTL ? 'فعالية احترافية' : 'Business Event'}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8 p-12">
          {/* Main Message */}
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-gray-700">
              {isRTL ? 'يسعدنا دعوتك إلى' : 'You are cordially invited to'}
            </p>
            <h2 className="mb-4 text-2xl font-bold" style={{ color: primaryColor }}>
              {data.event_name}
            </h2>
            {data.host_name && (
              <p className="text-gray-700">
                <span className="font-semibold">{isRTL ? 'من قبل' : 'Hosted by'}: </span>
                {data.host_name}
              </p>
            )}
            {(data.guest_name || data.special_note) && (
              <div className="mt-4 rounded border p-3" style={{ borderColor: `${primaryColor}55` }}>
                {data.guest_name && (
                  <p className="font-semibold" style={{ color: primaryColor }}>
                    {isRTL ? `موجهة إلى: ${data.guest_name}` : `Addressed to: ${data.guest_name}`}
                  </p>
                )}
                {data.special_note && <p className="mt-1 text-sm text-gray-700">{data.special_note}</p>}
              </div>
            )}
          </div>

          {/* Details Table */}
          <table className="w-full text-sm">
            <tbody className="space-y-4">
              {/* Date */}
              <tr className="border-b border-gray-200">
                <td className="w-1/3 py-3 font-semibold uppercase text-gray-600">{isRTL ? 'التاريخ' : 'Date'}</td>
                <td className="py-3 text-gray-900">{data.date}</td>
              </tr>

              {/* Time */}
              <tr className="border-b border-gray-200">
                <td className="py-3 font-semibold uppercase text-gray-600">{isRTL ? 'الوقت' : 'Time'}</td>
                <td className="py-3 text-gray-900">
                  {data.time}
                  {data.timezone && ` ${data.timezone}`}
                </td>
              </tr>

              {/* Location */}
              <tr className="border-b border-gray-200">
                <td className="py-3 font-semibold uppercase text-gray-600">{isRTL ? 'المكان' : 'Location'}</td>
                <td className="py-3 text-gray-900">{data.location}</td>
              </tr>

              {/* Dress Code */}
              {data.dress_code && (
                <tr className="border-b border-gray-200">
                  <td className="py-3 font-semibold uppercase text-gray-600">{isRTL ? 'الملابس' : 'Dress Code'}</td>
                  <td className="py-3 text-gray-900">{data.dress_code}</td>
                </tr>
              )}

              {/* RSVP */}
              {data.rsvp_by && (
                <tr>
                  <td className="py-3 font-semibold uppercase text-gray-600">{isRTL ? 'التأكيد' : 'RSVP'}</td>
                  <td className="py-3 text-gray-900">{data.rsvp_by}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Description */}
          {data.description && (
            <div>
              <p className="text-sm leading-relaxed text-gray-700">{data.description}</p>
            </div>
          )}

          {/* Special Instructions */}
          {data.special_instructions && (
            <div
              className="rounded border-l-4 p-4"
              style={{
                backgroundColor: primaryColor + '10',
                borderColor: primaryColor,
              }}
            >
              <p className="mb-1 text-sm font-semibold" style={{ color: primaryColor }}>
                {isRTL ? 'ملاحظات مهمة' : 'Important Notes'}
              </p>
              <p className="text-sm text-gray-700">{data.special_instructions}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-200 px-12 py-8" style={{ backgroundColor: primaryColor + '05' }}>
          {/* Contact Info */}
          <div className="mb-4 space-y-1 text-sm text-gray-700">
            {data.contact_info?.email && (
              <p>
                <span className="font-semibold">Email: </span>
                {data.contact_info.email}
              </p>
            )}
            {data.contact_info?.phone && (
              <p>
                <span className="font-semibold">{isRTL ? 'هاتف' : 'Phone'}: </span>
                {data.contact_info.phone}
              </p>
            )}
            {data.contact_info?.website && (
              <p>
                <span className="font-semibold">Website: </span>
                {data.contact_info.website}
              </p>
            )}
          </div>

          {/* Closing */}
          <p className="text-xs uppercase tracking-widest text-gray-600">
            {isRTL ? 'نتطلع إلى حضورك' : 'We look forward to your attendance'}
          </p>

          {/* Bottom Bar */}
          <div
            className="mt-4 h-1"
            style={{
              background: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default ProfessionalInvitation
