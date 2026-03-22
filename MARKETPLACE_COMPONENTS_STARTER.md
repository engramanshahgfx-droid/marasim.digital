# Marketplace Components - Starter Guide

Copy these examples and adapt to your project structure. These are code templates to help you implement the marketplace UI.

---

## 1. SERVICE CARD COMPONENT

**File**: `src/components/marketplace/ServiceCard.tsx`

```tsx
import Image from 'next/image'
import Link from 'next/link'
import type { Service } from '@/types/marketplace'

interface ServiceCardProps {
  service: Service
  locale: string
}

export function ServiceCard({ service, locale }: ServiceCardProps) {
  const isArabic = locale === 'ar'

  return (
    <Link href={`/${locale}/marketplace/${service.id}`}>
      <div className="group cursor-pointer rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
        {/* Image Container */}
        <div className="relative h-48 w-full overflow-hidden bg-gray-100">
          {service.images && service.images.length > 0 ? (
            <Image
              src={service.images[0].url}
              alt={service.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-200">
              <span className="text-gray-400">No Image</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Provider Info */}
          <div className="flex items-center gap-2 mb-2">
            {service.providers?.logo_url && (
              <Image
                src={service.providers.logo_url}
                alt={service.providers.business_name}
                width={32}
                height={32}
                className="rounded-full"
              />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {service.providers?.business_name}
              </p>
              {service.providers?.is_verified && (
                <span className="text-xs text-blue-600">✓ Verified</span>
              )}
            </div>
          </div>

          {/* Service Name */}
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
            {isArabic ? service.name_ar || service.name : service.name}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {isArabic ? service.description_ar || service.description : service.description}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i < Math.round(service.rating) ? '★' : '☆'}>
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs text-gray-600">
              {service.rating.toFixed(1)} ({service.reviews_count})
            </span>
          </div>

          {/* Price */}
          <div className={`flex items-baseline gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <span className="text-lg font-bold text-blue-600">
              {service.final_price.toFixed(2)} {service.price_currency}
            </span>
            {service.discount_percentage > 0 && (
              <span className="text-sm text-gray-500 line-through">
                {service.price.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
```

---

## 2. SERVICE GRID COMPONENT

**File**: `src/components/marketplace/ServiceGrid.tsx`

```tsx
import { ServiceCard } from './ServiceCard'
import type { Service } from '@/types/marketplace'

interface ServiceGridProps {
  services: Service[]
  locale: string
  isLoading?: boolean
}

export function ServiceGrid({ services, locale, isLoading }: ServiceGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-72 rounded-lg bg-gray-200 animate-pulse" />
        ))}
      </div>
    )
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">
          {locale === 'ar' ? 'لم نجد خدمات' : 'No services found'}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {services.map((service) => (
        <ServiceCard key={service.id} service={service} locale={locale} />
      ))}
    </div>
  )
}
```

---

## 3. BOOKING FORM COMPONENT

**File**: `src/components/bookings/BookingForm.tsx`

```tsx
'use client'

import { useState } from 'react'
import type { Service } from '@/types/marketplace'

interface BookingFormProps {
  service: Service
  eventId: string
  locale: string
  onSubmit: (data: any) => Promise<void>
}

export function BookingForm({
  service,
  eventId,
  locale,
  onSubmit,
}: BookingFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    booking_date: '',
    quantity: 1,
    notes: '',
    customer_notes: '',
  })

  const isArabic = locale === 'ar'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const bookingData = {
        event_id: eventId,
        service_id: service.id,
        ...formData,
      }

      await onSubmit(bookingData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking')
    } finally {
      setLoading(false)
    }
  }

  const subtotal = service.price * formData.quantity
  const platformFee = (subtotal * 10) / 100 // 10% commission
  const total = subtotal + platformFee

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          {isArabic ? 'تاريخ الحجز' : 'Booking Date'}
        </label>
        <input
          type="date"
          name="booking_date"
          value={formData.booking_date}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Quantity Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          {isArabic ? 'الكمية' : 'Quantity'}
        </label>
        <input
          type="number"
          name="quantity"
          value={formData.quantity}
          onChange={handleChange}
          min="1"
          max="100"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Special Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          {isArabic ? 'ملاحظات خاصة' : 'Special Notes'}
        </label>
        <textarea
          name="customer_notes"
          value={formData.customer_notes}
          onChange={handleChange}
          placeholder={isArabic ? 'أضف أي متطلبات خاصة...' : 'Add any special requirements...'}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Price Breakdown */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">
            {isArabic ? 'السعر الأساسي' : 'Base Price'}
          </span>
          <span className="text-gray-900 font-medium">
            {service.price.toFixed(2)} {service.price_currency}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">
            {isArabic ? 'الكمية' : 'Quantity'} × {formData.quantity}
          </span>
          <span className="text-gray-900 font-medium">
            {subtotal.toFixed(2)} {service.price_currency}
          </span>
        </div>
        <div className="border-t border-gray-200 pt-2 flex justify-between">
          <span className="text-gray-600">
            {isArabic ? 'رسوم المنصة (10%)' : 'Platform Fee (10%)'}
          </span>
          <span className="text-gray-900 font-medium">
            {platformFee.toFixed(2)} {service.price_currency}
          </span>
        </div>
        <div className="border-t border-gray-200 pt-2 flex justify-between bg-white -mx-4 -mb-4 px-4 py-2 rounded-b-lg">
          <span className="font-semibold text-gray-900">
            {isArabic ? 'الإجمالي' : 'Total'}
          </span>
          <span className="text-lg font-bold text-blue-600">
            {total.toFixed(2)} {service.price_currency}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition duration-200"
      >
        {loading ? (isArabic ? 'جاري...' : 'Processing...') : isArabic ? 'احجز الآن' : 'Book Now'}
      </button>
    </form>
  )
}
```

---

## 4. SERVICE FILTERS COMPONENT

**File**: `src/components/marketplace/ServiceFilters.tsx`

```tsx
'use client'

import { useState } from 'react'
import type { ServiceCategory } from '@/types/marketplace'

interface ServiceFiltersProps {
  categories: ServiceCategory[]
  locale: string
  onFilter: (filters: any) => void
}

export function ServiceFilters({
  categories,
  locale,
  onFilter,
}: ServiceFiltersProps) {
  const [filters, setFilters] = useState({
    category: '',
    minPrice: 0,
    maxPrice: 10000,
    rating: 0,
  })

  const isArabic = locale === 'ar'

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilter(newFilters)
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">
          {isArabic ? 'الفئات' : 'Categories'}
        </h3>
        <div className="space-y-2">
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                value={cat.name}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="rounded"
              />
              <span className="text-gray-700">
                {isArabic ? cat.name_ar : cat.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">
          {isArabic ? 'نطاق السعر' : 'Price Range'}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">
              {isArabic ? 'الحد الأدنى' : 'Min Price'}
            </label>
            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">
              {isArabic ? 'الحد الأقصى' : 'Max Price'}
            </label>
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* Rating Filter */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">
          {isArabic ? 'التقييم' : 'Rating'}
        </h3>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => (
            <label key={rating} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="rating"
                value={rating}
                onChange={(e) => handleFilterChange('rating', Number(e.target.value))}
                className="rounded-full"
              />
              <span className="text-gray-700">
                {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
```

---

## USAGE EXAMPLE IN PAGE

**File**: `src/app/[locale]/marketplace/page.tsx`

```tsx
import { ServiceGrid } from '@/components/marketplace/ServiceGrid'
import { ServiceFilters } from '@/components/marketplace/ServiceFilters'
import { MarketplaceService } from '@/lib/marketplaceService'

export default async function MarketplacePage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string }
  searchParams: Record<string, string>
}) {
  try {
    // Fetch services based on filters
    const result = await MarketplaceService.searchServices({
      category: searchParams.category,
      min_price: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
      max_price: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
      page: searchParams.page ? Number(searchParams.page) : 1,
      limit: 20,
      search: searchParams.search,
    })

    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">
          {locale === 'ar' ? 'سوق الخدمات' : 'Services Marketplace'}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <ServiceFilters
              categories={[]} // Fetch categories
              locale={locale}
              onFilter={({}) => {
                // Update URL with filters
              }}
            />
          </div>

          {/* Services Grid */}
          <div className="lg:col-span-3">
            <ServiceGrid
              services={result.data}
              locale={locale}
              isLoading={false}
            />

            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-8">
              {/* Add pagination buttons */}
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-600">
          {locale === 'ar' ? 'حدث خطأ في تحميل الخدمات' : 'Error loading services'}
        </p>
      </div>
    )
  }
}
```

---

## Notes

- Copy these component examples into your actual component files
- Adapt the imports and styling to match your project structure
- These are templates - customize them to your design system
- All components support bilingual (Arabic/English) and RTL layouts
- Use TypeScript types from `src/types/marketplace.ts`

**Next Steps**:
1. Copy individual components to `src/components/`
2. Update imports as needed
3. Test with actual data from your API
4. Customize styling to match your brand
