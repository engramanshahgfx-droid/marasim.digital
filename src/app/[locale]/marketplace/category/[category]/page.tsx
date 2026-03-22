'use client'

import Header from '@/components/common/Header'
import type { Service } from '@/types/marketplace'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'

const CATEGORY_LABELS: Record<string, { en: string; ar: string }> = {
  all: { en: 'All Services', ar: 'جميع الخدمات' },
  invitations: { en: 'Invitations & Designs', ar: 'الدعوات والتصاميم' },
  gifts: { en: 'Gifts & Favors', ar: 'الهدايا والتذكارات' },
  flowers: { en: 'Flowers & Decorations', ar: 'الزهور والديكورات' },
  catering: { en: 'Catering & Food', ar: 'الطعام والضيافة' },
  photography: { en: 'Photography & Video', ar: 'التصوير والفيديو' },
  venues: { en: 'Venues', ar: 'الأماكن' },
  beauty: { en: 'Clothing & Beauty', ar: 'الملابس والتجميل' },
  additional: { en: 'Additional Services', ar: 'خدمات إضافية' },
}

function CategoryBrowseInner() {
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const category = (params.category as string) || 'all'
  const categoryLabel = CATEGORY_LABELS[category] ?? { en: category, ar: category }

  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [sortBy, setSortBy] = useState<string>('rating')
  const [sortOrder] = useState<string>('desc')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minRating, setMinRating] = useState('')

  const fetchServices = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (category !== 'all') qs.set('category', category)
      if (search) qs.set('search', search)
      qs.set('sortBy', sortBy)
      qs.set('sortOrder', sortOrder)
      if (minPrice) qs.set('minPrice', minPrice)
      if (maxPrice) qs.set('maxPrice', maxPrice)
      if (minRating) qs.set('rating', minRating)
      qs.set('page', String(page))
      qs.set('limit', '12')

      const response = await fetch(`/api/marketplace/services/search?${qs.toString()}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setServices(data.data)
          setTotalCount(data.pagination.total)
          setTotalPages(data.pagination.total_pages)
          setCurrentPage(page)
        }
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false)
    }
  }, [category, search, sortBy, sortOrder, minPrice, maxPrice, minRating])

  useEffect(() => {
    fetchServices(1)
  }, [fetchServices])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchServices(1)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Breadcrumb + Header */}
      <div className="border-b border-gray-200 bg-white pt-24 pb-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <nav className={`mb-3 flex items-center gap-2 text-sm text-gray-500 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Link href={`/${locale}/marketplace`} className="hover:text-purple-600">
              {isArabic ? 'السوق' : 'Marketplace'}
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">
              {isArabic ? categoryLabel.ar : categoryLabel.en}
            </span>
          </nav>
          <h1 className={`text-3xl font-bold text-text-primary ${isArabic ? 'text-right' : ''}`}>
            {isArabic ? categoryLabel.ar : categoryLabel.en}
          </h1>
          {totalCount > 0 && (
            <p className={`mt-1 text-sm text-gray-500 ${isArabic ? 'text-right' : ''}`}>
              {isArabic ? `${totalCount} خدمة متاحة` : `${totalCount} services available`}
            </p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className={`flex gap-8 ${isArabic ? 'flex-row-reverse' : ''}`}>
          {/* Sidebar Filters */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-28 rounded-2xl bg-white p-6 shadow-sm">
              <h3 className={`mb-4 font-semibold text-gray-900 ${isArabic ? 'text-right' : ''}`}>
                {isArabic ? 'تصفية النتائج' : 'Filters'}
              </h3>

              {/* Price Range */}
              <div className="mb-5">
                <label className={`mb-2 block text-sm font-medium text-gray-700 ${isArabic ? 'text-right' : ''}`}>
                  {isArabic ? 'السعر (ر.س)' : 'Price (SAR)'}
                </label>
                <div className={`flex gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <input
                    type="number"
                    placeholder={isArabic ? 'من' : 'Min'}
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="number"
                    placeholder={isArabic ? 'إلى' : 'Max'}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Min Rating */}
              <div className="mb-5">
                <label className={`mb-2 block text-sm font-medium text-gray-700 ${isArabic ? 'text-right' : ''}`}>
                  {isArabic ? 'الحد الأدنى للتقييم' : 'Minimum Rating'}
                </label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  dir={isArabic ? 'rtl' : 'ltr'}
                >
                  <option value="">{isArabic ? 'الكل' : 'Any'}</option>
                  <option value="4">4+ ★</option>
                  <option value="3">3+ ★</option>
                  <option value="2">2+ ★</option>
                </select>
              </div>

              <button
                onClick={() => fetchServices(1)}
                className="w-full rounded-xl bg-purple-600 py-2 text-sm font-semibold text-white hover:bg-purple-700"
              >
                {isArabic ? 'تطبيق الفلاتر' : 'Apply Filters'}
              </button>

              <button
                onClick={() => {
                  setMinPrice('')
                  setMaxPrice('')
                  setMinRating('')
                  setSortBy('rating')
                }}
                className="mt-2 w-full rounded-xl border border-gray-300 py-2 text-sm text-gray-500 hover:bg-gray-50"
              >
                {isArabic ? 'إزالة الفلاتر' : 'Clear Filters'}
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="min-w-0 flex-1">
            {/* Search + Sort Bar */}
            <div className={`mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${isArabic ? 'sm:flex-row-reverse' : ''}`}>
              <form onSubmit={handleSearchSubmit} className="flex max-w-sm flex-1 overflow-hidden rounded-xl border border-gray-300">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={isArabic ? 'ابحث...' : 'Search...'}
                  className={`flex-1 px-4 py-2 text-sm focus:outline-none ${isArabic ? 'text-right' : ''}`}
                  dir={isArabic ? 'rtl' : 'ltr'}
                />
                <button type="submit" className="bg-purple-600 px-4 text-white hover:bg-purple-700">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                dir={isArabic ? 'rtl' : 'ltr'}
              >
                <option value="rating">{isArabic ? 'الأعلى تقييماً' : 'Top Rated'}</option>
                <option value="price">{isArabic ? 'الأقل سعراً' : 'Lowest Price'}</option>
                <option value="created_at">{isArabic ? 'الأحدث' : 'Newest'}</option>
              </select>
            </div>

            {/* Results */}
            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-72 animate-pulse rounded-2xl bg-gray-200" />
                ))}
              </div>
            ) : services.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
                <div className="mb-3 text-5xl">🔍</div>
                <h3 className="mb-1 text-lg font-semibold text-gray-700">
                  {isArabic ? 'لا توجد نتائج' : 'No results found'}
                </h3>
                <p className="text-sm text-gray-500">
                  {isArabic ? 'جرب تغيير معايير البحث' : 'Try adjusting your search or filters'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {services.map((service) => (
                    <ServiceCard key={service.id} service={service} isArabic={isArabic} locale={locale} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className={`mt-8 flex justify-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <button
                      onClick={() => fetchServices(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-40 hover:bg-gray-50"
                    >
                      {isArabic ? 'السابق' : 'Prev'}
                    </button>
                    <span className="flex items-center px-4 text-sm text-gray-600">
                      {isArabic
                        ? `صفحة ${currentPage} من ${totalPages}`
                        : `Page ${currentPage} of ${totalPages}`}
                    </span>
                    <button
                      onClick={() => fetchServices(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-40 hover:bg-gray-50"
                    >
                      {isArabic ? 'التالي' : 'Next'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ServiceCard({
  service,
  isArabic,
  locale,
}: {
  service: Service
  isArabic: boolean
  locale: string
}) {
  const name = isArabic && service.name_ar ? service.name_ar : service.name
  const providers = (service as any).providers
  const providerName =
    isArabic && providers?.business_name_ar ? providers.business_name_ar : providers?.business_name || ''
  const image = service.images?.[0]?.url

  return (
    <Link
      href={`/${locale}/marketplace/${service.id}`}
      className="group overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-100">
        {image ? (
          <img src={image} alt={name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl opacity-25">🛍️</div>
        )}
        {providers?.is_verified && (
          <span className={`absolute top-3 ${isArabic ? 'left-3' : 'right-3'} rounded-full bg-green-500 px-2 py-0.5 text-xs font-semibold text-white`}>
            {isArabic ? 'موثق' : 'Verified'}
          </span>
        )}
      </div>
      <div className={`p-4 ${isArabic ? 'text-right' : 'text-left'}`}>
        <p className="mb-1 text-xs text-gray-400">{providerName}</p>
        <h3 className="mb-2 font-semibold text-gray-900 line-clamp-2">{name}</h3>
        <div className={`mb-3 flex items-center gap-1 ${isArabic ? 'flex-row-reverse justify-end' : ''}`}>
          <span className="text-yellow-400">★</span>
          <span className="text-sm font-medium text-gray-700">{service.rating.toFixed(1)}</span>
          <span className="text-xs text-gray-400">({service.reviews_count})</span>
        </div>
        <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
          <span className="text-lg font-bold text-purple-700">
            {service.final_price.toLocaleString()} {isArabic ? 'ر.س' : 'SAR'}
          </span>
          {service.price !== service.final_price && (
            <span className="text-sm text-gray-400 line-through">{service.price.toLocaleString()}</span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function CategoryPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </div>
    }>
      <CategoryBrowseInner />
    </Suspense>
  )
}
