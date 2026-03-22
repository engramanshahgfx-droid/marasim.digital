'use client'

import { InvitationData } from '@/types/invitations'
import { useLocale } from 'next-intl'

interface PlayfulInvitationProps {
  data: InvitationData
}

export function PlayfulInvitation({ data }: PlayfulInvitationProps) {
  const locale = useLocale()
  const isRTL = locale === 'ar'

  const primaryColor = data.custom_colors?.primary || '#ff6b6b'
  const secondaryColor = data.custom_colors?.secondary || '#4ecdc4'
  const accentColor = '#ffe66d'

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-bounce-slow { animation: bounce-slow 2s infinite; }
        .animate-float { animation: float 3s infinite; }
      `}</style>

      <div
        className="relative aspect-[8.5/11] w-full max-w-2xl overflow-hidden rounded-3xl shadow-2xl"
        style={{ background: '#fff5f7' }}
      >
        {/* Decorative elements */}
        <div className="animate-float absolute left-10 top-10 text-4xl">🎉</div>
        <div className="animate-bounce-slow absolute right-12 top-20 text-3xl">🎈</div>
        <div className="animate-float absolute bottom-20 left-8 text-3xl">🎊</div>
        <div className="animate-bounce-slow absolute bottom-10 right-10 text-4xl">🎈</div>

        {/* Content */}
        <div className="relative flex h-full flex-col space-y-6 overflow-hidden p-8">
          {/* Header */}
          <div className="z-10 space-y-4 text-center">
            {data.images?.banner && (
              <img
                src={data.images.banner}
                alt="Event"
                className="mx-auto h-28 w-28 rounded-full border-4 border-white object-cover shadow-lg"
                style={{ borderColor: accentColor }}
              />
            )}

            <div>
              <h1 className="mb-2 -rotate-2 transform text-6xl font-black" style={{ color: primaryColor }}>
                {data.event_name}
              </h1>
              <p className="text-xl font-bold" style={{ color: secondaryColor }}>
                {isRTL ? '⭐ احتفل معنا ⭐' : "⭐ Let's Celebrate ⭐"}
              </p>
            </div>

            <h2 className="text-3xl font-black" style={{ color: primaryColor }}>
              {data.host_name}
            </h2>
            {(data.guest_name || data.special_note) && (
              <div className="mx-auto mt-2 max-w-xl rounded-2xl border-2 border-white/80 bg-white/80 p-3 text-sm text-gray-800 shadow">
                {data.guest_name && (
                  <p className="font-black" style={{ color: primaryColor }}>
                    {isRTL ? `هذه الدعوة لك: ${data.guest_name}` : `This card is for you, ${data.guest_name}`}
                  </p>
                )}
                {data.special_note && <p className="mt-1 font-medium">{data.special_note}</p>}
              </div>
            )}
          </div>

          {/* Details Cards */}
          <div className="z-10 space-y-3">
            {/* Date */}
            <div
              className="transform rounded-2xl p-4 transition-transform hover:rotate-1"
              style={{ backgroundColor: primaryColor + '20' }}
            >
              <p className="text-xs font-black uppercase" style={{ color: primaryColor }}>
                📅 {isRTL ? 'التاريخ' : 'Date'}
              </p>
              <p className="mt-1 text-lg font-bold" style={{ color: primaryColor }}>
                {data.date}
              </p>
            </div>

            {/* Time */}
            <div
              className="transform rounded-2xl p-4 transition-transform hover:-rotate-1"
              style={{ backgroundColor: secondaryColor + '20' }}
            >
              <p className="text-xs font-black uppercase" style={{ color: secondaryColor }}>
                🕐 {isRTL ? 'الوقت' : 'Time'}
              </p>
              <p className="mt-1 text-lg font-bold" style={{ color: secondaryColor }}>
                {data.time}
              </p>
            </div>

            {/* Location */}
            <div
              className="transform rounded-2xl p-4 transition-transform hover:rotate-1"
              style={{ backgroundColor: accentColor + '40' }}
            >
              <p className="text-xs font-black uppercase" style={{ color: primaryColor }}>
                📍 {isRTL ? 'المكان' : 'Location'}
              </p>
              <p className="mt-1 font-bold text-gray-800">{data.location}</p>
            </div>
          </div>

          {/* Description */}
          {data.description && (
            <div className="z-10 text-center font-semibold italic text-gray-700">
              <p>{data.description}</p>
            </div>
          )}

          {/* Fun Facts */}
          {data.guest_count && (
            <div className="z-10 text-center">
              <p className="text-lg font-black" style={{ color: primaryColor }}>
                {isRTL ? `🎂 سنحتفل مع ${data.guest_count} شخص` : `🎂 Join ${data.guest_count} guests!`}
              </p>
            </div>
          )}

          {/* CTA */}
          <div className="z-10 text-center">
            <button
              className="transform rounded-full px-8 py-3 text-lg font-black text-white shadow-lg transition-transform hover:scale-110"
              style={{ backgroundColor: primaryColor }}
            >
              {isRTL ? '✨ سأأتي ✨' : "✨ I'll be there ✨"}
            </button>
          </div>

          {/* RSVP */}
          {data.rsvp_by && (
            <p className="text-center text-sm font-bold text-gray-700">
              {isRTL ? 'يرجى التأكيد بحلول' : 'Please confirm by'} <br />
              <span style={{ color: primaryColor }}>{data.rsvp_by}</span>
            </p>
          )}

          {/* Contact */}
          {data.contact_info?.email && (
            <div className="text-center text-xs text-gray-600">
              {isRTL ? 'تواصل معنا' : 'Contact us'}: {data.contact_info.email}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PlayfulInvitation
