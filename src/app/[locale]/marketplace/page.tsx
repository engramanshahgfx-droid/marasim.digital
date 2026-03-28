'use client'

import Header from '@/components/common/Header'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const CATEGORIES = [
  {
    slug: 'invitations',
    icon: '✉️',
    name: { en: 'Invitations & Designs', ar: 'الدعوات والتصاميم' },
    description: { en: 'Digital and printed invitation designs', ar: 'تصاميم الدعوات الرقمية والمطبوعة' },
    color: 'from-purple-500 to-indigo-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  {
    slug: 'gifts',
    icon: '🎁',
    name: { en: 'Gifts & Favors', ar: 'الهدايا والتذكارات' },
    description: { en: 'Gift boxes and guest favors', ar: 'صناديق الهدايا والتذكارات' },
    color: 'from-pink-500 to-rose-600',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
  },
  {
    slug: 'flowers',
    icon: '💐',
    name: { en: 'Flowers & Decorations', ar: 'الزهور والديكورات' },
    description: { en: 'Floral arrangements and event decoration', ar: 'الزهور والديكورات الحدثية' },
    color: 'from-green-500 to-emerald-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
  {
    slug: 'catering',
    icon: '🍽️',
    name: { en: 'Catering & Food', ar: 'الطعام والضيافة' },
    description: { en: 'Catering and food services', ar: 'خدمات الطعام والضيافة' },
    color: 'from-orange-500 to-amber-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
  {
    slug: 'photography',
    icon: '📷',
    name: { en: 'Photography & Video', ar: 'التصوير والفيديو' },
    description: { en: 'Photography and videography services', ar: 'خدمات التصوير والفيديو' },
    color: 'from-blue-500 to-cyan-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    slug: 'venues',
    icon: '🏛️',
    name: { en: 'Venues', ar: 'الأماكن' },
    description: { en: 'Event venues and locations', ar: 'أماكن وقاعات الفعاليات' },
    color: 'from-teal-500 to-cyan-600',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
  },
  {
    slug: 'beauty',
    icon: '💄',
    name: { en: 'Clothing & Beauty', ar: 'الملابس والتجميل' },
    description: { en: 'Fashion and beauty services', ar: 'خدمات الملابس والتجميل' },
    color: 'from-fuchsia-500 to-pink-600',
    bg: 'bg-fuchsia-50',
    border: 'border-fuchsia-200',
  },
  {
    slug: 'additional',
    icon: '🎶',
    name: { en: 'Additional Services', ar: 'خدمات إضافية' },
    description: { en: 'DJ, lighting, event planning', ar: 'DJ والإضاءة وتنظيم الفعاليات' },
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
  },
]

interface ServiceCard {
  id: string
  name: string
  name_ar?: string
  description: string
  description_ar?: string
  price: number
  final_price: number
  category: string
  rating: number
  reviews_count: number
  images: Array<{ url: string }>
  providers?: {
    business_name: string
    business_name_ar?: string
    is_verified: boolean
    logo_url?: string
  }
}

export default function MarketplacePage() {
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [featuredServices, setFeaturedServices] = useState<ServiceCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await fetch('/api/marketplace/services/search?limit=6&sortBy=rating&sortOrder=desc')
        if (response.ok) {
          const data = await response.json()
          if (data.success) setFeaturedServices(data.data)
        }
      } catch {
        // silently ignore
      } finally {
        setLoading(false)
      }
    }
    fetchFeatured()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/${locale}/marketplace/category/all?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 pb-24 pt-32">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600 opacity-20 blur-3xl" />
          <div className="absolute right-1/4 top-3/4 h-64 w-64 rounded-full bg-pink-600 opacity-20 blur-3xl" />
        </div>
        <div className="container relative mx-auto px-4 text-center sm:px-6 lg:px-8">
          <h1 className="mb-4 text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
            {isArabic ? 'سوق مراسم' : 'Marasim Marketplace'}
          </h1>
          <p className="mb-10 text-lg text-purple-100 sm:text-xl">
            {isArabic ? 'اعثر على أفضل مزودي الخدمات لفعاليتك' : 'Find the best service providers for your event'}
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mx-auto max-w-2xl">
            <div
              className={`flex overflow-hidden rounded-2xl bg-white shadow-2xl ${isArabic ? 'flex-row-reverse' : ''}`}
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isArabic ? 'ابحث عن خدمة...' : 'Search for a service...'}
                className={`flex-1 px-6 py-4 text-gray-800 focus:outline-none ${isArabic ? 'text-right' : 'text-left'}`}
                dir={isArabic ? 'rtl' : 'ltr'}
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 font-semibold text-white transition-opacity hover:opacity-90"
              >
                {isArabic ? 'بحث' : 'Search'}
              </button>
            </div>
          </form>
        </div>
      </section>

      <main className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Categories Grid */}
        <section className="mb-16">
          <div className={`mb-8 flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
            <h2 className="text-2xl font-bold text-text-primary">
              {isArabic ? 'تصفح حسب الفئة' : 'Browse by Category'}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/${locale}/marketplace/category/${cat.slug}`}
                className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${cat.bg} ${cat.border}`}
              >
                <div className="mb-3 text-4xl">{cat.icon}</div>
                <h3 className="font-semibold text-gray-800">{isArabic ? cat.name.ar : cat.name.en}</h3>
                <p className="mt-1 text-xs text-gray-500">{isArabic ? cat.description.ar : cat.description.en}</p>
                <div
                  className={`absolute bottom-0 ${isArabic ? 'left-0' : 'right-0'} h-1 w-8 rounded-full bg-gradient-to-r ${cat.color} transition-all duration-200 group-hover:w-full`}
                />
              </Link>
            ))}
          </div>
        </section>

        {/* Featured / Top-rated Services */}
        <section className="mb-16">
          <div className={`mb-8 flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
            <h2 className="text-2xl font-bold text-text-primary">
              {isArabic ? 'الخدمات المميزة' : 'Featured Services'}
            </h2>
            <Link
              href={`/${locale}/marketplace/category/all`}
              className="text-sm font-medium text-purple-600 hover:text-purple-800"
            >
              {isArabic ? 'عرض الكل' : 'View all'}
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-2xl bg-gray-200" />
              ))}
            </div>
          ) : featuredServices.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredServices.map((service) => (
                <ServiceCardComponent key={service.id} service={service} isArabic={isArabic} locale={locale} />
              ))}
            </div>
          ) : (
            <EmptyState isArabic={isArabic} locale={locale} />
          )}
        </section>

        {/* Become a Provider CTA */}
        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 p-10 text-center text-white">
          <h2 className="mb-3 text-3xl font-bold">{isArabic ? 'هل أنت مزود خدمة؟' : 'Are you a service provider?'}</h2>
          <p className="mb-6 text-indigo-100">
            {isArabic
              ? 'انضم إلى سوق مراسم وابدأ بتقديم خدماتك لآلاف العملاء'
              : 'Join the Marasim marketplace and start offering your services to thousands of customers'}
          </p>
          <Link
            href={`/${locale}/marketplace/become-provider`}
            className="inline-block rounded-xl bg-white px-8 py-3 font-semibold text-indigo-700 transition-transform hover:scale-105"
          >
            {isArabic ? 'سجّل كمزود خدمة' : 'Register as Provider'}
          </Link>
        </section>
      </main>
    </div>
  )
}

function ServiceCardComponent({
  service,
  isArabic,
  locale,
}: {
  service: ServiceCard
  isArabic: boolean
  locale: string
}) {
  const name = isArabic && service.name_ar ? service.name_ar : service.name
  const providerName =
    isArabic && service.providers?.business_name_ar
      ? service.providers.business_name_ar
      : service.providers?.business_name || ''
  const image = service.images?.[0]?.url

  return (
    <Link
      href={`/${locale}/marketplace/${service.id}`}
      className="group overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-purple-100 to-indigo-100">
        {image ? (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl opacity-30">🛍️</div>
        )}
        {service.providers?.is_verified && (
          <span
            className={`absolute top-3 ${isArabic ? 'left-3' : 'right-3'} rounded-full bg-green-500 px-2 py-0.5 text-xs font-semibold text-white`}
          >
            {isArabic ? 'موثق' : 'Verified'}
          </span>
        )}
      </div>

      {/* Content */}
      <div className={`p-4 ${isArabic ? 'text-right' : 'text-left'}`}>
        <p className="mb-1 text-xs text-gray-400">{providerName}</p>
        <h3 className="mb-2 line-clamp-2 font-semibold text-gray-900">{name}</h3>

        {/* Rating */}
        <div className={`mb-3 flex items-center gap-1 ${isArabic ? 'flex-row-reverse justify-end' : ''}`}>
          <span className="text-yellow-400">★</span>
          <span className="text-sm font-medium text-gray-700">{service.rating.toFixed(1)}</span>
          <span className="text-xs text-gray-400">({service.reviews_count})</span>
        </div>

        {/* Price */}
        <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
          <div>
            <span className="text-lg font-bold text-purple-700">
              {service.final_price.toLocaleString()} {isArabic ? 'ر.س' : 'SAR'}
            </span>
            {service.price !== service.final_price && (
              <span className={`${isArabic ? 'mr-2' : 'ml-2'} text-sm text-gray-400 line-through`}>
                {service.price.toLocaleString()}
              </span>
            )}
          </div>
          <span className="rounded-lg bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
            {isArabic ? 'عرض' : 'View'}
          </span>
        </div>
      </div>
    </Link>
  )
}

function EmptyState({ isArabic, locale }: { isArabic: boolean; locale: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
      <div className="mb-4 text-6xl">🛍️</div>
      <h3 className="mb-2 text-lg font-semibold text-gray-700">{isArabic ? 'لا توجد خدمات بعد' : 'No services yet'}</h3>
      <p className="mb-6 text-sm text-gray-500">
        {isArabic ? 'كن أول مزود خدمة في السوق' : 'Be the first provider in the marketplace'}
      </p>
      <Link
        href={`/${locale}/marketplace/become-provider`}
        className="rounded-xl bg-purple-600 px-6 py-2 text-sm font-semibold text-white hover:bg-purple-700"
      >
        {isArabic ? 'سجّل كمزود خدمة' : 'Register as Provider'}
      </Link>
    </div>
  )
}
