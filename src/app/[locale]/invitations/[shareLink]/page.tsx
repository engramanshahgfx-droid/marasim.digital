'use client'

import ElegantInvitation from '@/components/invitations/ElegantInvitation'
import MinimalInvitation from '@/components/invitations/MinimalInvitation'
import ModernInvitation from '@/components/invitations/ModernInvitation'
import PlayfulInvitation from '@/components/invitations/PlayfulInvitation'
import ProfessionalInvitation from '@/components/invitations/ProfessionalInvitation'
import { InvitationData, TemplateStyle } from '@/types/invitations'
import { useLocale } from 'next-intl'
import dynamic from 'next/dynamic'
import { useParams, useSearchParams } from 'next/navigation'
import { type ComponentType, useEffect, useMemo, useState } from 'react'

// QR code is SVG-based — rendered client-side only
const QRCodeSVG = dynamic(() => import('qrcode.react').then((mod) => mod.QRCodeSVG), { ssr: false })

const TEMPLATE_COMPONENTS: Record<TemplateStyle, ComponentType<{ data: InvitationData }>> = {
  elegant: ElegantInvitation,
  modern: ModernInvitation,
  minimal: MinimalInvitation,
  playful: PlayfulInvitation,
  professional: ProfessionalInvitation,
}

interface SharedInvitationResponse {
  template_id: TemplateStyle
  invitation_data: InvitationData
  qr_token?: string
}

export default function SharedInvitationPage() {
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const params = useParams<{ shareLink: string }>()
  const searchParams = useSearchParams()
  const [data, setData] = useState<SharedInvitationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const guestId = useMemo(() => searchParams.get('guestId') || searchParams.get('guest_id'), [searchParams])

  useEffect(() => {
    const shareLink = params?.shareLink
    if (!shareLink) {
      setError(isArabic ? 'رابط الدعوة غير صالح' : 'Invalid invitation link')
      setIsLoading(false)
      return
    }

    const fetchInvitation = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const query = guestId ? `?guestId=${encodeURIComponent(guestId)}` : ''
        const response = await fetch(`/api/invitations/shared/${shareLink}${query}`, { cache: 'no-store' })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load invitation')
        }

        setData(payload as SharedInvitationResponse)
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load invitation')
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvitation()
  }, [guestId, params?.shareLink, isArabic])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6 text-center text-gray-600">
        {isArabic ? 'جاري تحميل الدعوة...' : 'Loading invitation...'}
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
        <div className="max-w-md rounded-xl border border-red-200 bg-white p-6 text-center text-red-700 shadow-sm">
          {error || (isArabic ? 'تعذر تحميل الدعوة' : 'Unable to load invitation')}
        </div>
      </div>
    )
  }

  const InvitationComponent = TEMPLATE_COMPONENTS[data.template_id]
  return (
    <div>
      <InvitationComponent data={data.invitation_data} />

      {/* Personal QR code for event check-in */}
      {data.qr_token && (
        <div className="flex flex-col items-center gap-3 bg-white px-6 py-8 text-center">
          <p className="text-sm font-medium text-gray-600">
            {isArabic ? 'رمز QR الخاص بك للتسجيل في الحدث' : 'Your personal QR code for event check-in'}
          </p>
          <div className="rounded-xl border border-gray-200 p-3 shadow-sm">
            <QRCodeSVG value={data.qr_token} size={180} level="M" includeMargin />
          </div>
          <p className="text-xs text-gray-400">
            {isArabic
              ? 'أرِ هذا الرمز عند الدخول إلى الحدث'
              : 'Show this code at the event entrance'}
          </p>
        </div>
      )}
    </div>
  )
}
