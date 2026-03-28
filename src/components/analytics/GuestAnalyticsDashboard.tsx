'use client'

import { useLocale } from 'next-intl'
import { useEffect, useState } from 'react'
import { AiOutlineCheck, AiOutlineClose, AiOutlineEye, AiOutlineUser } from 'react-icons/ai'
import { BiChart } from 'react-icons/bi'

interface GuestMetrics {
  id: string
  name: string
  email: string
  phone?: string
  status: 'confirmed' | 'declined' | 'no_response'
  invited_at: string
  responded_at?: string
  opened: boolean
  open_count: number
  first_opened_at?: string
  response_time?: number
}

interface AnalyticsData {
  total_invited: number
  confirmed: number
  declined: number
  no_response: number
  opened: number
  open_rate: number
  rsvp_rate: number
  average_response_time?: number
}

interface GuestAnalyticsDashboardProps {
  eventId: string
  onClose?: () => void
}

export default function GuestAnalyticsDashboard({ eventId, onClose }: GuestAnalyticsDashboardProps) {
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [guestMetrics, setGuestMetrics] = useState<GuestMetrics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'status' | 'opened' | 'name'>('status')
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'declined' | 'no_response'>('all')

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch analytics
        const analyticsResponse = await fetch(`/api/invitations/${eventId}/analytics`)
        if (!analyticsResponse.ok) {
          throw new Error('Failed to load analytics')
        }
        const analyticsData = await analyticsResponse.json()
        setAnalytics(analyticsData)

        // Fetch guest-level analytics
        const guestResponse = await fetch(`/api/events/${eventId}/analytics/guests`)
        if (guestResponse.ok) {
          const guestData = await guestResponse.json()
          setGuestMetrics(guestData)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [eventId])

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center text-gray-500">
        {isArabic ? 'جاري تحميل التحليلات...' : 'Loading analytics...'}
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="rouding-lg border border-red-200 bg-red-50 p-4 text-red-700">
        {error || (isArabic ? 'فشل تحميل التحليلات' : 'Failed to load analytics')}
      </div>
    )
  }

  // Filter and sort guest metrics
  const filteredGuests = filterStatus === 'all' ? guestMetrics : guestMetrics.filter((g) => g.status === filterStatus)

  const sortedGuests = [...filteredGuests].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    if (sortBy === 'opened') return (b.open_count || 0) - (a.open_count || 0)
    return b.status.localeCompare(a.status)
  })

  return (
    <div className="space-y-6">
      {/* Close Button */}
      {onClose && (
        <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">
          {isArabic ? '← إغلاق' : '← Close'}
        </button>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <MetricCard
          icon={AiOutlineUser}
          label={isArabic ? 'المدعوون' : 'Invited'}
          value={analytics.total_invited}
          color="blue"
        />
        <MetricCard
          icon={AiOutlineCheck}
          label={isArabic ? 'موافقون' : 'Confirmed'}
          value={analytics.confirmed}
          color="green"
        />
        <MetricCard
          icon={AiOutlineClose}
          label={isArabic ? 'غير موافقين' : 'Declined'}
          value={analytics.declined}
          color="red"
        />
        <MetricCard
          icon={AiOutlineEye}
          label={isArabic ? 'معدل الفتح' : 'Open Rate'}
          value={`${analytics.open_rate}%`}
          color="purple"
        />
        <MetricCard
          icon={BiChart}
          label={isArabic ? 'معدل الرد' : 'RSVP Rate'}
          value={`${analytics.rsvp_rate}%`}
          color="orange"
        />
      </div>

      {/* Guest List */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">{isArabic ? 'تفاصيل الضيوف' : 'Guest Details'}</h3>

        {/* Filter and Sort Controls */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{isArabic ? 'الحالة' : 'Status'}</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="all">{isArabic ? 'الكل' : 'All'}</option>
              <option value="confirmed">{isArabic ? 'موافقون' : 'Confirmed'}</option>
              <option value="declined">{isArabic ? 'غير موافقين' : 'Declined'}</option>
              <option value="no_response">{isArabic ? 'لم يرد' : 'No Response'}</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{isArabic ? 'ترتيب' : 'Sort By'}</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="status">{isArabic ? 'الحالة' : 'Status'}</option>
              <option value="name">{isArabic ? 'الاسم' : 'Name'}</option>
              <option value="opened">{isArabic ? 'عدد الفتحات' : 'Opens'}</option>
            </select>
          </div>
        </div>

        {/* Guest Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">{isArabic ? 'الاسم' : 'Name'}</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">
                  {isArabic ? 'البريد الإلكتروني' : 'Email'}
                </th>
                <th className="px-4 py-3 text-center font-medium text-gray-700">{isArabic ? 'الحالة' : 'Status'}</th>
                <th className="px-4 py-3 text-center font-medium text-gray-700">{isArabic ? 'الفتحات' : 'Opens'}</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">
                  {isArabic ? 'وقت الرد' : 'Response Time'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedGuests.map((guest) => (
                <tr key={guest.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{guest.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{guest.email}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={guest.status} isArabic={isArabic} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {guest.opened ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                        <AiOutlineEye className="h-3 w-3" />
                        {guest.open_count}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">
                    {guest.response_time ? `${guest.response_time}h` : guest.status !== 'no_response' ? '—' : '...'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedGuests.length === 0 && (
          <div className="py-8 text-center text-gray-500">{isArabic ? 'لا توجد بيانات' : 'No data available'}</div>
        )}
      </div>
    </div>
  )
}

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  color: 'blue' | 'green' | 'red' | 'purple' | 'orange'
}

function MetricCard({ icon: Icon, label, value, color }: MetricCardProps) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    purple: 'bg-purple-50 text-purple-700',
    orange: 'bg-orange-50 text-orange-700',
  }

  return (
    <div className={`rounded-lg p-4 ${colorMap[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium opacity-75">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <Icon className="h-8 w-8 opacity-50" />
      </div>
    </div>
  )
}

interface StatusBadgeProps {
  status: 'confirmed' | 'declined' | 'no_response'
  isArabic: boolean
}

function StatusBadge({ status, isArabic }: StatusBadgeProps) {
  const statusMap = {
    confirmed: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      label: isArabic ? 'موافق' : 'Confirmed',
    },
    declined: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      label: isArabic ? 'غير موافق' : 'Declined',
    },
    no_response: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      label: isArabic ? 'لم يرد' : 'No Response',
    },
  }

  const config = statusMap[status]
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  )
}
