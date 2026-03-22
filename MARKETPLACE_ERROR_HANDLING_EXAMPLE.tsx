// Example: Marketplace Feature with Complete Error Handling
// Location: src/app/[locale]/marketplace/page.tsx (Example Implementation)

'use client'

import { Suspense, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { ErrorFallback } from '@/components/error/ErrorFallback'
import type { Service } from '@/types/marketplace'

/**
 * ServiceGridContent
 * Loads and displays services with error handling
 */
function ServiceGridContent() {
  const params = useParams()
  const locale = params.locale as string
  const [services, setServices] = useState<Service[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadServices() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/marketplace/services/search', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept-Language': locale,
          },
        })

        // Check if response is OK
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(
            errorData.error?.message || `HTTP Error: ${response.status}`
          )
        }

        const result = await response.json()

        // Check for API-level success flag
        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to load services')
        }

        setServices(result.data || [])
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
        console.error('Service loading error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadServices()
  }, [locale])

  // Show error fallback if error occurs
  if (error && !loading) {
    return (
      <ErrorFallback
        title={locale === 'ar' ? 'فشل تحميل الخدمات' : 'Failed to Load Services'}
        description={
          locale === 'ar'
            ? 'حدثت مشكلة في تحميل قائمة الخدمات المتاحة'
            : 'There was a problem loading available services'
        }
        error={error}
        actionLabel={locale === 'ar' ? 'العودة للرئيسية' : 'Go Home'}
        actionHref={`/${locale}`}
        showContactSupport={true}
      />
    )
  }

  // Show loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-80 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"
          />
        ))}
      </div>
    )
  }

  // Show empty state
  if (services.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {locale === 'ar' ? 'لا توجد خدمات' : 'No Services Available'}
        </h3>
        <p className="text-gray-600">
          {locale === 'ar'
            ? 'سيتم إضافة خدمات جديدة قريباً'
            : 'Check back soon for new services'}
        </p>
      </div>
    )
  }

  // Render services grid
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((service) => (
        <ServiceCard key={service.id} service={service} locale={locale} />
      ))}
    </div>
  )
}

/**
 * ServiceCard
 * Individual service card with error boundary
 */
interface ServiceCardProps {
  service: Service
  locale: string
}

function ServiceCard({ service, locale }: ServiceCardProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="h-80 bg-red-50 rounded-lg border border-red-200 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 font-semibold">
              {locale === 'ar' ? 'خطأ في التحميل' : 'Load Error'}
            </p>
            <p className="text-red-500 text-sm mt-1">
              {locale === 'ar' ? 'لم نتمكن من عرض هذه الخدمة' : 'Could not display service'}
            </p>
          </div>
        </div>
      }
      onError={(error, info) => {
        console.error('ServiceCard error:', error, info)
      }}
    >
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
        {/* Image */}
        <div className="h-48 bg-gray-200">
          {service.images && service.images.length > 0 ? (
            <img
              src={service.images[0].url}
              alt={service.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-300 flex items-center justify-center">
              <span className="text-gray-500">
                {locale === 'ar' ? 'لا توجد صورة' : 'No Image'}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-bold text-gray-900 truncate">{service.name}</h3>
          <p className="text-gray-600 text-sm line-clamp-2 mt-1">
            {service.description}
          </p>

          {/* Price */}
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {service.price.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                {locale === 'ar' ? 'لكل حدث' : 'per event'}
              </p>
            </div>

            {/* Rating */}
            {service.rating && (
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400">★</span>
                  <span className="font-semibold text-gray-900">
                    {service.rating.toFixed(1)}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {locale === 'ar' ? 'تقييم' : 'rating'}
                </p>
              </div>
            )}
          </div>

          {/* Action Button */}
          <a
            href={`/${locale}/marketplace/${service.id}`}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition text-center"
          >
            {locale === 'ar' ? 'عرض التفاصيل' : 'View Details'}
          </a>
        </div>
      </div>
    </ErrorBoundary>
  )
}

/**
 * ServiceFiltersSection
 * Filters with error handling
 */
interface ServiceFiltersProps {
  locale: string
  onFiltersChange?: (filters: any) => void
}

function ServiceFiltersSection({
  locale,
  onFiltersChange,
}: ServiceFiltersProps) {
  const [category, setCategory] = useState('')
  const [priceRange, setPriceRange] = useState([0, 1000])

  const handleFilterChange = () => {
    onFiltersChange?.({
      category: category || undefined,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
    })
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 bg-yellow-50 rounded border border-yellow-200">
          <p className="text-yellow-700 text-sm">
            {locale === 'ar' ? 'لم تتمكن من تحميل المرشحات' : 'Filters are temporarily unavailable'}
          </p>
        </div>
      }
    >
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        {/* Category Filter */}
        <div className="mb-6">
          <label className="block font-semibold text-gray-900 mb-3">
            {locale === 'ar' ? 'الفئة' : 'Category'}
          </label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
              handleFilterChange()
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">
              {locale === 'ar' ? 'الكل' : 'All Categories'}
            </option>
            <option value="photography">
              {locale === 'ar' ? 'التصوير الفوتوغرافي' : 'Photography'}
            </option>
            <option value="catering">
              {locale === 'ar' ? 'الطعام والشراب' : 'Catering'}
            </option>
            <option value="decoration">
              {locale === 'ar' ? 'الديكور' : 'Decoration'}
            </option>
          </select>
        </div>

        {/* Price Range Filter */}
        <div>
          <label className="block font-semibold text-gray-900 mb-3">
            {locale === 'ar' ? 'نطاق السعر' : 'Price Range'}
          </label>
          <div className="flex gap-4">
            <input
              type="number"
              min="0"
              value={priceRange[0]}
              onChange={(e) => {
                setPriceRange([parseInt(e.target.value), priceRange[1]])
                handleFilterChange()
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={locale === 'ar' ? 'الحد الأدنى' : 'Min'}
            />
            <input
              type="number"
              max="10000"
              value={priceRange[1]}
              onChange={(e) => {
                setPriceRange([priceRange[0], parseInt(e.target.value)])
                handleFilterChange()
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={locale === 'ar' ? 'الحد الأقصى' : 'Max'}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}

/**
 * MarketplacePage
 * Main marketplace page with complete error handling setup
 */
export default function MarketplacePage() {
  const params = useParams()
  const locale = params.locale as string

  return (
    <div className={`min-h-screen bg-gray-50 ${locale === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {locale === 'ar' ? 'سوق الخدمات' : 'Services Marketplace'}
          </h1>
          <p className="text-gray-600">
            {locale === 'ar'
              ? 'اكتشف وحجز أفضل الخدمات لحدثك'
              : 'Discover and book the best services for your event'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar with Filters */}
          <div className="lg:col-span-1">
            <ErrorBoundary
              fallback={
                <div className="p-4 bg-yellow-50 rounded border border-yellow-200">
                  <p className="text-yellow-700">
                    {locale === 'ar'
                      ? 'المرشحات غير متاحة الآن'
                      : 'Filters are currently unavailable'}
                  </p>
                </div>
              }
            >
              <ServiceFiltersSection locale={locale} />
            </ErrorBoundary>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <ErrorBoundary
              fallback={
                <ErrorFallback
                  title={locale === 'ar' ? 'خطأ في السوق' : 'Marketplace Error'}
                  description={
                    locale === 'ar'
                      ? 'حدث خطأ في تحميل السوق'
                      : 'An error occurred while loading the marketplace'
                  }
                />
              }
            >
              <Suspense
                fallback={
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="h-96 bg-gray-200 rounded-lg animate-pulse"
                      />
                    ))}
                  </div>
                }
              >
                <ServiceGridContent />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  )
}
