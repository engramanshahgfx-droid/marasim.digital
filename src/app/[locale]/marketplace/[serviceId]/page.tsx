'use client'

import Header from '@/components/common/Header'
import type { Service, ServiceReview } from '@/types/marketplace'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { use, useEffect, useState } from 'react'

interface ServiceWithRelations extends Service {
  providers?: {
    id: string
    business_name: string
    business_name_ar?: string
    business_description?: string
    business_description_ar?: string
    rating: number
    reviews_count: number
    is_verified: boolean
    logo_url?: string
    website_url?: string
  }
  service_reviews?: ServiceReview[]
}

export default function ServiceDetailPage({ params }: { params: Promise<{ serviceId: string; locale: string }> }) {
  const { serviceId } = use(params)
  const locale = useLocale()
  const isArabic = locale === 'ar'

  const [service, setService] = useState<ServiceWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)

  // Booking state
  const [showBookingModal, setShowBookingModal] = useState(false)

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const response = await fetch(`/api/marketplace/services/${serviceId}`)
        if (response.status === 404) {
          setNotFound(true)
          return
        }
        if (response.ok) {
          const data = await response.json()
          if (data.success) setService(data.data)
          else setNotFound(true)
        } else {
          setNotFound(true)
        }
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetch_()
  }, [serviceId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
        </div>
      </div>
    )
  }

  if (notFound || !service) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
          <div className="text-6xl">🔍</div>
          <h1 className="text-2xl font-bold text-gray-800">{isArabic ? 'الخدمة غير موجودة' : 'Service not found'}</h1>
          <Link
            href={`/${locale}/marketplace`}
            className="rounded-xl bg-purple-600 px-6 py-2 text-white hover:bg-purple-700"
          >
            {isArabic ? 'العودة للسوق' : 'Back to Marketplace'}
          </Link>
        </div>
      </div>
    )
  }

  const name = isArabic && service.name_ar ? service.name_ar : service.name
  const description = isArabic && service.description_ar ? service.description_ar : service.description
  const provider = service.providers
  const providerName =
    isArabic && provider?.business_name_ar ? provider.business_name_ar : provider?.business_name || ''
  const providerDesc =
    isArabic && provider?.business_description_ar
      ? provider.business_description_ar
      : provider?.business_description || ''

  const reviews = service.service_reviews || []

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className={`mb-6 flex items-center gap-2 text-sm text-gray-500 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <Link href={`/${locale}/marketplace`} className="hover:text-purple-600">
            {isArabic ? 'السوق' : 'Marketplace'}
          </Link>
          <span>/</span>
          <Link
            href={`/${locale}/marketplace/category/${service.category.toLowerCase()}`}
            className="hover:text-purple-600"
          >
            {isArabic && service.category_ar ? service.category_ar : service.category}
          </Link>
          <span>/</span>
          <span className="truncate text-gray-900">{name}</span>
        </nav>

        <div className={`grid grid-cols-1 gap-10 lg:grid-cols-3 ${isArabic ? 'lg:grid-flow-col-dense' : ''}`}>
          {/* Left: Images + Details */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="mb-6 overflow-hidden rounded-2xl bg-gray-100">
              <div className="relative h-80 sm:h-96">
                {service.images?.[selectedImage]?.url ? (
                  <img src={service.images[selectedImage].url} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-7xl opacity-20">🛍️</div>
                )}
              </div>
              {service.images && service.images.length > 1 && (
                <div className={`flex gap-2 overflow-x-auto p-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  {service.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                        i === selectedImage ? 'border-purple-500' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Service Info */}
            <div className={`mb-8 ${isArabic ? 'text-right' : ''}`}>
              <div className={`mb-2 flex items-center gap-2 ${isArabic ? 'flex-row-reverse justify-end' : ''}`}>
                {provider?.is_verified && (
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                    {isArabic ? '✓ مزود موثق' : '✓ Verified Provider'}
                  </span>
                )}
                <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                  {isArabic && service.category_ar ? service.category_ar : service.category}
                </span>
              </div>
              <h1 className="mb-3 text-3xl font-bold text-gray-900">{name}</h1>
              <div className={`mb-4 flex items-center gap-3 ${isArabic ? 'flex-row-reverse justify-end' : ''}`}>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-lg ${star <= Math.round(service.rating) ? 'text-yellow-400' : 'text-gray-200'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="font-semibold text-gray-700">{service.rating.toFixed(1)}</span>
                <span className="text-gray-400">
                  ({service.reviews_count} {isArabic ? 'تقييم' : 'reviews'})
                </span>
              </div>
              <p className="leading-relaxed text-gray-600">{description}</p>
            </div>

            {/* Features */}
            {service.features && service.features.length > 0 && (
              <div className={`mb-8 ${isArabic ? 'text-right' : ''}`}>
                <h2 className="mb-4 text-xl font-semibold text-gray-900">
                  {isArabic ? 'ما يشمله' : "What's included"}
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {service.features.map((feat, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 rounded-xl bg-green-50 p-3 ${isArabic ? 'flex-row-reverse' : ''}`}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500 text-xs text-white">
                        ✓
                      </span>
                      <div className={isArabic ? 'text-right' : ''}>
                        <span className="font-medium text-gray-800">{feat.name}: </span>
                        <span className="text-gray-600">{feat.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Provider Info */}
            {provider && (
              <div className={`mb-8 rounded-2xl border border-gray-200 bg-white p-6 ${isArabic ? 'text-right' : ''}`}>
                <h2 className="mb-4 text-xl font-semibold text-gray-900">
                  {isArabic ? 'عن مزود الخدمة' : 'About the Provider'}
                </h2>
                <div className={`flex items-start gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-100">
                    {provider.logo_url ? (
                      <img
                        src={provider.logo_url}
                        alt={providerName}
                        className="h-full w-full rounded-2xl object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-purple-700">{providerName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{providerName}</h3>
                    <div
                      className={`mt-1 flex items-center gap-2 text-sm ${isArabic ? 'flex-row-reverse justify-end' : ''}`}
                    >
                      <span className="text-yellow-400">★</span>
                      <span className="text-gray-600">{provider.rating.toFixed(1)}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-600">
                        {provider.reviews_count} {isArabic ? 'تقييم' : 'reviews'}
                      </span>
                    </div>
                    {providerDesc && <p className="mt-2 text-sm text-gray-600">{providerDesc}</p>}
                    {provider.website_url && (
                      <a
                        href={provider.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-sm text-purple-600 hover:underline"
                      >
                        {isArabic ? 'زيارة الموقع' : 'Visit website'}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className={isArabic ? 'text-right' : ''}>
                <h2 className="mb-4 text-xl font-semibold text-gray-900">
                  {isArabic ? 'آراء العملاء' : 'Customer Reviews'}
                </h2>
                <div className="space-y-4">
                  {reviews.slice(0, 5).map((review) => (
                    <div key={review.id} className="rounded-2xl bg-white p-5 shadow-sm">
                      <div className={`mb-2 flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} className={s <= review.rating ? 'text-yellow-400' : 'text-gray-200'}>
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="font-semibold text-gray-800">{review.title}</span>
                        {review.is_verified_purchase && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                            {isArabic ? 'شراء موثق' : 'Verified'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{review.review_text}</p>
                      <p className="mt-2 text-xs text-gray-400">
                        {new Date(review.created_at).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 rounded-2xl bg-white p-6 shadow-lg">
              {/* Price */}
              <div className={`mb-4 ${isArabic ? 'text-right' : ''}`}>
                <div className={`flex items-baseline gap-2 ${isArabic ? 'flex-row-reverse justify-end' : ''}`}>
                  <span className="text-3xl font-bold text-purple-700">{service.final_price.toLocaleString()}</span>
                  <span className="text-gray-500">{isArabic ? 'ر.س' : 'SAR'}</span>
                </div>
                {service.price !== service.final_price && (
                  <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse justify-end' : ''}`}>
                    <span className="text-sm text-gray-400 line-through">
                      {service.price.toLocaleString()} {isArabic ? 'ر.س' : 'SAR'}
                    </span>
                    <span className="rounded-lg bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                      -{service.discount_percentage}%
                    </span>
                  </div>
                )}
                {service.duration_value && (
                  <p className={`mt-1 text-sm text-gray-500 ${isArabic ? 'text-right' : ''}`}>
                    {service.duration_value} {service.duration_unit || (isArabic ? 'ساعة' : 'hours')}
                  </p>
                )}
              </div>

              <button
                onClick={() => setShowBookingModal(true)}
                className="mb-3 w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 font-semibold text-white transition-opacity hover:opacity-90"
              >
                {isArabic ? 'احجز الآن' : 'Book Now'}
              </button>

              <Link
                href={`/${locale}/marketplace`}
                className="block w-full rounded-xl border border-gray-300 py-3 text-center text-sm text-gray-600 hover:bg-gray-50"
              >
                {isArabic ? 'العودة للسوق' : 'Back to Marketplace'}
              </Link>

              {/* Quick Stats */}
              <div className="mt-5 space-y-2 border-t border-gray-100 pt-5 text-sm text-gray-600">
                <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <span>{isArabic ? 'التقييم' : 'Rating'}</span>
                  <span className="font-medium text-gray-800">{service.rating.toFixed(1)} ★</span>
                </div>
                <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <span>{isArabic ? 'عدد التقييمات' : 'Reviews'}</span>
                  <span className="font-medium text-gray-800">{service.reviews_count}</span>
                </div>
                {service.max_bookings_per_month && (
                  <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <span>{isArabic ? 'الحجوزات المتبقية' : 'Spots left'}</span>
                    <span className="font-medium text-gray-800">
                      {service.max_bookings_per_month - (service.current_bookings_this_month || 0)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          service={service}
          isArabic={isArabic}
          locale={locale}
          onClose={() => setShowBookingModal(false)}
        />
      )}
    </div>
  )
}

function BookingModal({
  service,
  isArabic,
  locale,
  onClose,
}: {
  service: ServiceWithRelations
  isArabic: boolean
  locale: string
  onClose: () => void
}) {
  const [eventId, setEventId] = useState('')
  const [bookingDate, setBookingDate] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [events, setEvents] = useState<Array<{ id: string; event_name: string }>>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/events')
        if (res.ok) {
          const data = await res.json()
          setEvents(data.events || data || [])
        }
      } catch {
        // ignore
      }
    }
    fetchEvents()
  }, [])

  const handleBook = async () => {
    if (!eventId || !bookingDate) {
      setError(isArabic ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/marketplace/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: service.id,
          event_id: eventId,
          booking_date: bookingDate,
          quantity,
          customer_notes: notes,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(true)
      } else {
        setError(data.message || (isArabic ? 'فشل الحجز' : 'Booking failed'))
      }
    } catch {
      setError(isArabic ? 'حدث خطأ. يرجى المحاولة مجدداً' : 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const name = isArabic && service.name_ar ? service.name_ar : service.name

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className={`w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ${isArabic ? 'text-right' : ''}`}
        onClick={(e) => e.stopPropagation()}
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        {success ? (
          <div className="py-8 text-center">
            <div className="mb-4 text-5xl">✅</div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">
              {isArabic ? 'تم الحجز بنجاح!' : 'Booking Submitted!'}
            </h3>
            <p className="mb-6 text-gray-500">
              {isArabic
                ? 'سيتواصل معك مزود الخدمة قريباً لتأكيد الحجز'
                : 'The provider will contact you soon to confirm your booking'}
            </p>
            <button
              onClick={onClose}
              className="rounded-xl bg-purple-600 px-8 py-2 font-semibold text-white hover:bg-purple-700"
            >
              {isArabic ? 'حسناً' : 'OK'}
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{isArabic ? 'تأكيد الحجز' : 'Book Service'}</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <p className="mb-4 text-sm text-gray-600">{name}</p>

            <div className="space-y-4">
              {/* Event selector */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {isArabic ? 'الفعالية *' : 'Event *'}
                </label>
                <select
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">{isArabic ? 'اختر فعالية' : 'Select event'}</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.event_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Booking date */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {isArabic ? 'تاريخ الخدمة *' : 'Service Date *'}
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {isArabic ? 'الكمية' : 'Quantity'}
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  min={1}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {isArabic ? 'ملاحظات' : 'Notes (optional)'}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Total */}
            <div className={`my-4 rounded-xl bg-purple-50 p-3 text-sm ${isArabic ? 'text-right' : ''}`}>
              <div
                className={`flex justify-between font-semibold text-purple-900 ${isArabic ? 'flex-row-reverse' : ''}`}
              >
                <span>{isArabic ? 'الإجمالي' : 'Total'}</span>
                <span>
                  {(service.final_price * quantity).toLocaleString()} {isArabic ? 'ر.س' : 'SAR'}
                </span>
              </div>
            </div>

            {error && <p className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</p>}

            <button
              onClick={handleBook}
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {loading ? (isArabic ? 'جاري الحجز...' : 'Booking...') : isArabic ? 'تأكيد الحجز' : 'Confirm Booking'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
