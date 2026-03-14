'use client'

import Icon from '@/components/ui/AppIcon'
import { useLocale } from 'next-intl'
import { useState } from 'react'

interface FilterState {
  deliveryStatus: string
  responseStatus: string
  checkInStatus: string
  searchQuery: string
}

interface FilterPanelProps {
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  guestCounts: {
    total: number
    delivered: number
    failed: number
    pending: number
    confirmed: number
    declined: number
    noResponse: number
    checkedIn: number
  }
}

const FilterPanel = ({ filters, onFilterChange, guestCounts }: FilterPanelProps) => {
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    onFilterChange({ ...filters, [key]: value })
  }

  const handleClearFilters = () => {
    onFilterChange({
      deliveryStatus: 'all',
      responseStatus: 'all',
      checkInStatus: 'all',
      searchQuery: '',
    })
  }

  const FilterContent = () => (
    <>
      <div className="flex flex-col gap-2">
        <label htmlFor="search" className="text-sm font-medium text-text-primary">
          {isArabic ? 'البحث عن الضيوف' : 'Search Guests'}
        </label>
        <div className="relative">
          <Icon
            name="MagnifyingGlassIcon"
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
          />
          <input
            id="search"
            type="text"
            value={filters.searchQuery}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
            placeholder={
              isArabic ? 'ابحث بالاسم أو الهاتف أو البريد الإلكتروني...' : 'Search by name, phone, or email...'
            }
            className="w-full rounded-md border border-input bg-background py-2.5 pl-10 pr-4 text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="deliveryStatus" className="text-sm font-medium text-text-primary">
          {isArabic ? 'حالة الإرسال' : 'Delivery Status'}
        </label>
        <select
          id="deliveryStatus"
          value={filters.deliveryStatus}
          onChange={(e) => handleFilterChange('deliveryStatus', e.target.value)}
          className="w-full rounded-md border border-input bg-background px-4 py-2.5 text-text-primary focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
        >
          <option value="all">
            {isArabic ? 'الكل' : 'All'} ({guestCounts.total})
          </option>
          <option value="delivered">
            {isArabic ? 'تم التسليم' : 'Delivered'} ({guestCounts.delivered})
          </option>
          <option value="failed">
            {isArabic ? 'فشل' : 'Failed'} ({guestCounts.failed})
          </option>
          <option value="pending">
            {isArabic ? 'معلق' : 'Pending'} ({guestCounts.pending})
          </option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="responseStatus" className="text-sm font-medium text-text-primary">
          {isArabic ? 'حالة الرد' : 'Response Status'}
        </label>
        <select
          id="responseStatus"
          value={filters.responseStatus}
          onChange={(e) => handleFilterChange('responseStatus', e.target.value)}
          className="w-full rounded-md border border-input bg-background px-4 py-2.5 text-text-primary focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
        >
          <option value="all">
            {isArabic ? 'الكل' : 'All'} ({guestCounts.total})
          </option>
          <option value="confirmed">
            {isArabic ? 'مؤكد' : 'Confirmed'} ({guestCounts.confirmed})
          </option>
          <option value="declined">
            {isArabic ? 'معتذر' : 'Declined'} ({guestCounts.declined})
          </option>
          <option value="no-response">
            {isArabic ? 'لا يوجد رد' : 'No Response'} ({guestCounts.noResponse})
          </option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="checkInStatus" className="text-sm font-medium text-text-primary">
          {isArabic ? 'حالة تسجيل الحضور' : 'Check-in Status'}
        </label>
        <select
          id="checkInStatus"
          value={filters.checkInStatus}
          onChange={(e) => handleFilterChange('checkInStatus', e.target.value)}
          className="w-full rounded-md border border-input bg-background px-4 py-2.5 text-text-primary focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
        >
          <option value="all">
            {isArabic ? 'الكل' : 'All'} ({guestCounts.total})
          </option>
          <option value="checked-in">
            {isArabic ? 'تم تسجيل الحضور' : 'Checked In'} ({guestCounts.checkedIn})
          </option>
          <option value="not-checked-in">
            {isArabic ? 'لم يتم تسجيل الحضور' : 'Not Checked In'} ({guestCounts.total - guestCounts.checkedIn})
          </option>
        </select>
      </div>

      <button
        onClick={handleClearFilters}
        className="transition-smooth hover:bg-muted/80 flex items-center justify-center gap-2 rounded-md bg-muted px-4 py-2.5 text-text-primary focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
      >
        <Icon name="XMarkIcon" size={16} />
        <span className="text-sm font-medium">{isArabic ? 'مسح الفلاتر' : 'Clear Filters'}</span>
      </button>
    </>
  )

  return (
    <>
      <div className="mb-6 hidden grid-cols-4 gap-4 lg:grid">
        <FilterContent />
      </div>

      <div className="mb-4 lg:hidden">
        <button
          onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
          className="transition-smooth flex w-full items-center justify-between rounded-md border border-border bg-card px-4 py-3 hover:bg-muted"
          aria-expanded={isMobileFilterOpen}
          aria-label={isArabic ? 'تبديل الفلاتر' : 'Toggle filters'}
        >
          <div className="flex items-center gap-2">
            <Icon name="FunnelIcon" size={20} className="text-primary" />
            <span className="text-sm font-medium text-text-primary">
              {isArabic ? 'الفلاتر والبحث' : 'Filters & Search'}
            </span>
          </div>
          <Icon
            name="ChevronDownIcon"
            size={16}
            className={`transition-smooth text-text-secondary ${isMobileFilterOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isMobileFilterOpen && (
          <div className="mt-3 animate-slide-up space-y-4 rounded-md border border-border bg-card p-4">
            <FilterContent />
          </div>
        )}
      </div>
    </>
  )
}

export default FilterPanel
