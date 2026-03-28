'use client'

import { useCart } from '@/contexts/CartContext'
import type { Provider, Service } from '@/types/marketplace'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AiOutlineShoppingCart, AiOutlineStar } from 'react-icons/ai'
import { MdAddShoppingCart } from 'react-icons/md'

interface MarketplaceWidgetProps {
  eventId: string
  onCartOpen?: () => void
  maxItems?: number
}

export default function MarketplaceWidget({ eventId, onCartOpen, maxItems = 4 }: MarketplaceWidgetProps) {
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const { addItem, itemCount } = useCart()
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addingServiceId, setAddingServiceId] = useState<string | null>(null)

  useEffect(() => {
    const loadServices = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // Fetch featured/popular services for the event category
        const response = await fetch(
          `/api/marketplace/services/search?limit=${maxItems}&is_featured=true&sortBy=rating&sortOrder=desc`
        )
        if (!response.ok) {
          const text = await response.text()
          throw new Error(`Failed to fetch services: ${response.status} ${response.statusText} | ${text}`)
        }
        const data = await response.json()
        if (!data?.success || !Array.isArray(data.data)) {
          throw new Error('Unexpected response format from services API')
        }
        setServices(data.data.slice(0, maxItems) || [])
      } catch (err) {
        console.error('Error loading marketplace services:', err)
        setError(isArabic ? 'فشل تحميل الخدمات' : 'Failed to load services')
      } finally {
        setIsLoading(false)
      }
    }

    loadServices()
  }, [eventId, maxItems, isArabic])

  const handleAddToCart = async (service: Service) => {
    setAddingServiceId(service.id)
    try {
      await addItem({
        service_id: service.id,
        quantity: 1,
      })
      // Optionally open cart to show it was added
      if (onCartOpen) {
        setTimeout(onCartOpen, 300)
      }
    } catch (err) {
      console.error('Error adding to cart:', err)
    } finally {
      setAddingServiceId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-transparent p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{isArabic ? 'خدمات إضافية' : 'Optional Services'}</h2>
        </div>
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
        </div>
      </div>
    )
  }

  if (error || services.length === 0) {
    return null
  }

  return (
    <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-transparent p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {isArabic ? 'خدمات إضافية للحدث' : 'Optional Services for Your Event'}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {isArabic ? 'أضف خدمات إضافية لتحسين حدثك' : 'Enhance your event with optional services'}
          </p>
        </div>
        <button
          onClick={onCartOpen}
          className="relative rounded-lg p-2 text-purple-600 transition-colors hover:bg-purple-100"
        >
          <AiOutlineShoppingCart className="h-6 w-6" />
          {itemCount > 0 && (
            <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {itemCount}
            </span>
          )}
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {services.map((service) => (
          <div
            key={service.id}
            className="overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md"
          >
            {/* Service Image */}
            {service.images?.[0]?.url && (
              <div className="relative h-40 w-full overflow-hidden bg-gray-200">
                <img
                  src={service.images[0].url}
                  alt={service.name}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
                {service.discount_percentage && service.discount_percentage > 0 && (
                  <div className="absolute left-2 top-2 rounded-md bg-red-500 px-2 py-1 text-xs font-bold text-white">
                    -{service.discount_percentage}%
                  </div>
                )}
              </div>
            )}

            {/* Service Info */}
            <div className="space-y-2 p-3">
              <h3 className="line-clamp-2 font-semibold text-gray-900">
                {isArabic && service.name_ar ? service.name_ar : service.name}
              </h3>

              {/* Provider Info */}
              {service.providers && (
                <p className="text-xs text-gray-600">
                  {(() => {
                    const provider = service.providers as Provider | null
                    if (!provider) return '-'
                    return isArabic && provider.business_name_ar ? provider.business_name_ar : provider.business_name
                  })()}
                </p>
              )}

              {/* Rating */}
              <div className="flex items-center gap-1">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <AiOutlineStar
                      key={i}
                      className="h-3.5 w-3.5"
                      fill={i < Math.floor(service.rating) ? 'currentColor' : 'none'}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-600">({service.reviews_count})</span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-2 pt-2">
                <span className="text-lg font-bold text-purple-600">SAR {service.final_price.toFixed(0)}</span>
                {service.discount_percentage && service.discount_percentage > 0 && (
                  <span className="text-xs text-gray-500 line-through">SAR {service.price.toFixed(0)}</span>
                )}
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={() => handleAddToCart(service)}
                disabled={addingServiceId === service.id}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-3 py-2 font-semibold text-white transition-colors duration-200 hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <MdAddShoppingCart className="h-4 w-4" />
                <span className="text-sm">
                  {addingServiceId === service.id
                    ? isArabic
                      ? 'جاري الإضافة...'
                      : 'Adding...'
                    : isArabic
                      ? 'أضف للسلة'
                      : 'Add to Cart'}
                </span>
              </button>

              {/* View Details Link */}
              <Link
                href={`/${locale}/marketplace/${service.id}`}
                className="mt-2 block text-center text-xs font-semibold text-purple-600 hover:text-purple-700"
              >
                {isArabic ? 'عرض التفاصيل' : 'View Details'} →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* View All Link */}
      <Link
        href={`/${locale}/marketplace`}
        className="mt-6 block text-center text-sm font-semibold text-purple-600 hover:text-purple-700"
      >
        {isArabic ? 'عرض جميع الخدمات' : 'View All Services'} →
      </Link>
    </div>
  )
}
