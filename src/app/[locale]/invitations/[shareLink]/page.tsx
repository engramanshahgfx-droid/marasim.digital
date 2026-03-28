'use client'

import ElegantInvitation from '@/components/invitations/ElegantInvitation'
import GuestPaymentProofCard from '@/components/invitations/GuestPaymentProofCard'
import MinimalInvitation from '@/components/invitations/MinimalInvitation'
import ModernInvitation from '@/components/invitations/ModernInvitation'
import PlayfulInvitation from '@/components/invitations/PlayfulInvitation'
import ProfessionalInvitation from '@/components/invitations/ProfessionalInvitation'
import RSVPButtons from '@/components/invitations/RSVPButtons'
import MarketplaceWidget from '@/components/marketplace/MarketplaceWidget'
import ShoppingCart from '@/components/marketplace/ShoppingCart'
import { CartProvider } from '@/contexts/CartContext'
import { InvitationData, TemplateStyle } from '@/types/invitations'
import { useLocale } from 'next-intl'
import dynamic from 'next/dynamic'
import { useParams, useSearchParams } from 'next/navigation'
import { type ComponentType, type CSSProperties, type ReactNode, useEffect, useMemo, useState } from 'react'

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
  customization?: {
    backdrop_css?: string | null
    font_family?: string | null
    header_logo?: {
      mode?: 'paperless' | 'custom' | 'remove'
      custom_url?: string
    }
    canvas_items?: SharedCanvasItem[]
  }
  qr_token?: string
  event_id?: string
  bank_details?: {
    bank_account_holder?: string | null
    bank_name?: string | null
    bank_account_number?: string | null
    bank_iban?: string | null
  }
}

type SharedCanvasItem = {
  id: string
  type: 'text' | 'sticker' | 'logo' | 'frame'
  x?: number
  y?: number
  scale?: number
  rotation?: number
  zIndex?: number
  color?: string
  text?: string
  src?: string
  stickerImageUrl?: string
  stickerGlyph?: string
  stickerName?: string
}

function toSafeNumber(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function renderCanvasItem(item: SharedCanvasItem): ReactNode {
  const x = toSafeNumber(item?.x, 380)
  const y = toSafeNumber(item?.y, 280)
  const left = `${(x / 760) * 100}%`
  const top = `${(y / 560) * 100}%`
  const scale = toSafeNumber(item?.scale, 1)
  const rotation = toSafeNumber(item?.rotation, 0)

  const style: CSSProperties = {
    position: 'absolute',
    left,
    top,
    transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
    transformOrigin: 'center center',
    zIndex: toSafeNumber(item?.zIndex, 20),
  }

  if (item.type === 'text') {
    return (
      <div
        key={item.id}
        style={{
          ...style,
          width: 'min(90%, 736px)',
          maxWidth: '90%',
          textAlign: 'center',
          color: item.color || '#1f2937',
          fontSize: 'clamp(14px, 3vw, 26px)',
          fontWeight: 600,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          padding: 4,
        }}
      >
        {item.text || ''}
      </div>
    )
  }

  if (item.type === 'logo' && item.src) {
    return (
      <img
        key={item.id}
        src={item.src}
        alt="Logo"
        style={{
          ...style,
          width: 'min(20vw, 120px)',
          height: 'min(20vw, 120px)',
          maxWidth: 120,
          maxHeight: 120,
          objectFit: 'contain',
        }}
      />
    )
  }

  if (item.type === 'sticker') {
    if (item.stickerImageUrl) {
      return (
        <img
          key={item.id}
          src={item.stickerImageUrl}
          alt={item.stickerName || 'Sticker'}
          style={{
            ...style,
            width: 'min(16vw, 96px)',
            height: 'min(16vw, 96px)',
            maxWidth: 96,
            maxHeight: 96,
            objectFit: 'contain',
          }}
        />
      )
    }

    return (
      <div
        key={item.id}
        style={{
          ...style,
          color: item.color || '#111827',
          fontSize: 'clamp(18px, 2.8vw, 42px)',
          lineHeight: 1,
        }}
      >
        {item.stickerGlyph || '✦'}
      </div>
    )
  }

  return null
}

export default function SharedInvitationPage() {
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const params = useParams<{ shareLink: string }>()
  const searchParams = useSearchParams()
  const [data, setData] = useState<SharedInvitationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCartOpen, setIsCartOpen] = useState(false)

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
  const customization = data.customization || {}
  const canvasItems = Array.isArray(customization.canvas_items) ? customization.canvas_items : []
  const activeFrameItem =
    canvasItems.find((item) => item?.type === 'frame' && (item?.src || item?.stickerImageUrl)) || null
  const renderItems = canvasItems
    .filter((item) => item?.type !== 'frame')
    .sort((a, b) => toSafeNumber(a?.zIndex, 1) - toSafeNumber(b?.zIndex, 1))

  const baseTemplateData: InvitationData = {
    ...data.invitation_data,
    event_name: '',
    host_name: '',
    date: '',
    time: '',
    location: '',
    description: '',
  }

  return (
    <CartProvider eventId={data.event_id || ''} guestId={guestId || undefined}>
      <div className="bg-white">
        {/* Invitation Template Rendered with Saved Editor Layers */}
        <div className="px-4 py-6 md:px-6">
          <div
            className="mx-auto w-full max-w-[760px] rounded-2xl p-4"
            style={{ background: customization.backdrop_css || '#f8fafc' }}
          >
            {customization?.header_logo?.mode !== 'remove' && (
              <div className="mb-3 flex justify-center">
                {customization?.header_logo?.mode === 'custom' && customization?.header_logo?.custom_url ? (
                  <img src={customization.header_logo.custom_url} alt="Header logo" className="h-10 object-contain" />
                ) : (
                  <div className="rounded border border-dashed border-gray-400 bg-white px-4 py-1 text-xs font-semibold tracking-wide text-gray-700">
                    Marasim Logo
                  </div>
                )}
              </div>
            )}

            <div
              className="relative mx-auto w-full max-w-[760px] overflow-hidden rounded-2xl shadow-2xl"
              style={{ fontFamily: customization.font_family || 'serif', aspectRatio: '760 / 560' }}
            >
              <div className="absolute inset-0">
                {activeFrameItem && (
                  <img
                    src={activeFrameItem.src || activeFrameItem.stickerImageUrl}
                    alt={activeFrameItem.stickerName || 'Frame'}
                    className="pointer-events-none h-full w-full object-contain"
                    style={{ zIndex: 0 }}
                  />
                )}

                <div className="relative z-10 h-full w-full">
                  <InvitationComponent data={baseTemplateData} />
                </div>

                <div className="pointer-events-none absolute inset-0">
                  {renderItems.map(renderCanvasItem)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RSVP Buttons */}
        {data.event_id && guestId && (
          <div className="mx-auto max-w-4xl px-6 py-8">
            <RSVPButtons
              guestId={guestId}
              eventId={data.event_id}
              onStatusChange={() => {
                // Optionally refresh invitation data after RSVP
              }}
            />
          </div>
        )}

        {/* Direct bank transfer payment proof upload */}
        {data.event_id && guestId && (
          <div className="px-6 pb-8">
            <GuestPaymentProofCard
              eventId={data.event_id}
              guestId={guestId}
              shareLink={params.shareLink}
              bankDetails={data.bank_details || {}}
            />
          </div>
        )}

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
              {isArabic ? 'أرِ هذا الرمز عند الدخول إلى الحدث' : 'Show this code at the event entrance'}
            </p>
          </div>
        )}

        {/* Optional Services Marketplace Widget */}
        {data.event_id && (
          <div className="bg-gray-50 px-6 py-8 md:py-12">
            <div className="mx-auto max-w-4xl">
              <MarketplaceWidget eventId={data.event_id} onCartOpen={() => setIsCartOpen(true)} maxItems={4} />
            </div>
          </div>
        )}

        {/* Shopping Cart Sidebar */}
        {data.event_id && (
          <ShoppingCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} eventId={data.event_id} />
        )}
      </div>
    </CartProvider>
  )
}
