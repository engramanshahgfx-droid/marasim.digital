'use client'

import UpgradeModal from '@/components/common/UpgradeModal'
import Icon from '@/components/ui/AppIcon'
import { getCurrentSession, getCurrentUser } from '@/lib/auth'
import { normalizeTemplateCategory, type TemplateStyle } from '@/types/invitations'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import CreateEventModal from './CreateEventModal'
import EventSummaryCards from './EventSummaryCards'
import EventTableMobileCard from './EventTableMobileCard'
import EventTableRow from './EventTableRow'
import TemplateEditorModal from './TemplateEditorModal'

interface Event {
  id: string
  name: string
  date: string
  venue: string
  description?: string
  event_type?: string
  expected_guests?: number
  bank_account_holder?: string
  bank_name?: string
  bank_account_number?: string
  bank_iban?: string
  status: 'upcoming' | 'ongoing' | 'completed' | 'draft'
  template_id?: TemplateStyle
  guestCount?: number
  invitationsSent?: number
  confirmed?: number
  declined?: number
  noResponse?: number
  checkedIn?: number
  openCount?: number
  openRate?: number
}

interface DashboardOverview {
  metrics: {
    totalEvents: number
    totalGuests: number
    confirmedGuests: number
    declinedGuests: number
    pendingGuests: number
    checkedInGuests: number
    totalInvitationOpens: number
    uniqueGuestsOpened: number
    guestOpenRate: number
  }
  eventPerformance: Array<{
    eventId: string
    eventName: string
    date: string
    venue: string
    status: string
    invitationsSent: number
    confirmed: number
    declined: number
    pending: number
    checkedIn: number
    openCount: number
    uniqueGuestOpens: number
    openRate: number
    attendanceRate: number
  }>
  recentGuestOpens: Array<{
    guestId: string
    guestName: string
    email: string | null
    phone: string | null
    eventId: string
    eventName: string
    viewedAt: string
  }>
}

interface EventFormData {
  id?: string
  name: string
  date: string
  venue: string
  description: string
  expectedGuests: number
  eventType: string
  bankAccountHolder: string
  bankName: string
  bankAccountNumber: string
  bankIban: string
}

interface TemplateData {
  language: 'en' | 'ar'
  headerImage: string
  title: string
  titleAr?: string
  message: string
  messageAr?: string
  eventDetails: {
    date: string
    time: string
    venue: string
  }
  footerText: string
  footerTextAr?: string
}

const getEventSignature = (event: Partial<Event>) => {
  const normalizedName = (event.name || '').trim().toLowerCase()
  const normalizedDate = (event.date || '').trim()
  const normalizedVenue = (event.venue || '').trim().toLowerCase()
  return `${normalizedName}|${normalizedDate}|${normalizedVenue}`
}

const getEventActivityScore = (event: Partial<Event>) => {
  return (
    (event.invitationsSent || 0) +
    (event.guestCount || 0) +
    (event.confirmed || 0) +
    (event.checkedIn || 0) +
    (event.openCount || 0)
  )
}

const dedupeEventsBySignature = (items: Event[]): Event[] => {
  const bySignature = new Map<string, Event>()

  for (const item of items) {
    const signature = getEventSignature(item)
    if (!signature || signature === '||') {
      bySignature.set(String(item.id), item)
      continue
    }

    const existing = bySignature.get(signature)
    if (!existing) {
      bySignature.set(signature, item)
      continue
    }

    // Keep the richer record when duplicate events have the same name/date/venue.
    const existingScore = getEventActivityScore(existing)
    const incomingScore = getEventActivityScore(item)
    if (incomingScore > existingScore) {
      bySignature.set(signature, item)
    }
  }

  return Array.from(bySignature.values())
}

// Helper function to determine event status based on date
const getEventStatus = (eventDate: string): 'upcoming' | 'ongoing' | 'completed' | 'draft' => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const eventDateObj = new Date(eventDate)
  eventDateObj.setHours(0, 0, 0, 0)

  if (eventDateObj.getTime() === now.getTime()) {
    return 'ongoing'
  } else if (eventDateObj < now) {
    return 'completed'
  } else {
    return 'upcoming'
  }
}

const EventManagementInteractive = () => {
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [events, setEvents] = useState<Event[]>([])
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<keyof Event>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventFormData | null>(null)
  const [templateEventId, setTemplateEventId] = useState<string | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeFeature, setUpgradeFeature] = useState('additional events')
  const [pendingPayment, setPendingPayment] = useState(false)
  const [dashboardOverview, setDashboardOverview] = useState<DashboardOverview | null>(null)

  const handleAutoApprovePendingPayment = async () => {
    if (!token) return
    try {
      // First check if subscription was already approved by admin
      const checkResponse = await fetch('/api/auth/check-subscription', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (checkResponse.ok) {
        const checkData = await checkResponse.json()

        // If subscription was approved by admin, refresh and reload
        if (checkData.user.subscription_status === 'active' && checkData.user.event_limit > 1) {
          setError(null)
          // Page reload to get fresh session data
          setTimeout(() => window.location.reload(), 500)
          return
        }

        // If not yet approved by admin, try auto-verify for pending payments
        if (checkData.hasApprovedPayment === false) {
          const response = await fetch('/api/payments/bank-transfer/auto-verify', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })

          if (response.ok) {
            setError(null)
            setTimeout(() => window.location.reload(), 500)
            return
          }

          const err = await response.json()
          setError(
            err.error ||
              (isArabic
                ? 'يرجى الانتظار حتى يوافق الإدارة على الدفع'
                : 'Awaiting admin approval. Please check back in a moment.')
          )
          return
        }
      }

      setError(
        isArabic ? 'يرجى الانتظار حتى يوافق الإدارة على الدفع' : 'Please wait for admin approval of your payment.'
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : isArabic ? 'حدث خطأ' : 'An error occurred')
    }
  }

  // Fetch current user and events
  useEffect(() => {
    const initializeComponent = async () => {
      const timeout = setTimeout(() => {
        // Avoid dev error overlay for slow networks; show a normal recoverable warning.
        console.warn('Initialization is taking longer than expected')
        setError('Loading is taking longer than expected. Please wait a bit or refresh once.')
        setIsHydrated(true)
        setIsLoading(false)
      }, 30000)

      try {
        console.log('Starting component initialization...')

        let user
        try {
          user = await getCurrentUser()
          console.log('Current user:', user)
        } catch (err) {
          console.error('Error getting current user:', err)
          setError('Failed to get user info. Please try logging in again.')
          setIsHydrated(true)
          setIsLoading(false)
          clearTimeout(timeout)
          return
        }

        if (!user?.id) {
          console.error('No user ID found')
          setError('User not authenticated. Please log in again.')
          setIsHydrated(true)
          setIsLoading(false)
          clearTimeout(timeout)
          return
        }

        let session
        try {
          session = await getCurrentSession()
          console.log('Session:', session)
        } catch (err) {
          console.error('Error getting session:', err)
          setError('Failed to get session. Please try logging in again.')
          setIsHydrated(true)
          setIsLoading(false)
          clearTimeout(timeout)
          return
        }

        if (!session?.access_token) {
          console.error('No access token in session')
          setError('No active session. Please log in again.')
          setIsHydrated(true)
          setIsLoading(false)
          clearTimeout(timeout)
          return
        }

        console.log('User authenticated, setting state...')
        setUserId(user.id)
        setToken(session.access_token)

        console.log('Fetching events...')
        await fetchEvents(user.id, session.access_token)

        clearTimeout(timeout)
      } catch (err) {
        console.error('Error initializing component:', err)
        setError(`Failed to initialize: ${err instanceof Error ? err.message : 'Unknown error'}`)
        setIsHydrated(true)
        setIsLoading(false)
        clearTimeout(timeout)
      }
    }

    initializeComponent()
  }, [])

  const fetchEvents = async (uid: string, accessToken: string) => {
    try {
      setError(null)
      console.log('Fetching events for user:', uid)

      const response = await fetch('/api/events/list', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })
      console.log('API Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || errorData?.message || 'Failed to fetch events')
      }

      const data = await response.json()
      console.log('Fetched events:', data)

      // Transform API data to match Event interface
      const transformedEvents = (data || []).map((e: any) => ({
        ...e,
        id: typeof e.id === 'string' ? e.id : String(e.id),
        status: getEventStatus(e.date), // Recalculate status based on event date
        guestCount: e.guestCount ?? e.expected_guests ?? 0,
        invitationsSent: e.invitationsSent ?? 0,
        confirmed: e.confirmed ?? 0,
        declined: e.declined ?? 0,
        noResponse: e.noResponse ?? 0,
        checkedIn: e.checkedIn ?? 0,
        openCount: e.openCount ?? 0,
        openRate: e.openRate ?? 0,
      }))

      const dedupedEvents = dedupeEventsBySignature(transformedEvents)
      if (transformedEvents.length !== dedupedEvents.length) {
        console.warn('Collapsed duplicate events in dashboard list', {
          originalCount: transformedEvents.length,
          dedupedCount: dedupedEvents.length,
        })
      }

      console.log('Transformed events:', dedupedEvents)
      setEvents(dedupedEvents)
      await fetchDashboardOverview(accessToken)
      setError(null)
      setIsHydrated(true)
    } catch (err) {
      console.error('Error fetching events:', err)
      setError(`Failed to load events: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setEvents([])
      setIsHydrated(true)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDashboardOverview = async (accessToken: string) => {
    try {
      const response = await fetch('/api/reports/dashboard/overview', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard overview')
      }

      const data = await response.json()
      const dedupedPerformance = Array.isArray(data?.eventPerformance)
        ? dedupeEventsBySignature(
            data.eventPerformance.map((eventSummary: any) => ({
              id: String(eventSummary.eventId),
              name: eventSummary.eventName,
              date: eventSummary.date,
              venue: eventSummary.venue,
              status: eventSummary.status,
              guestCount: eventSummary.invitationsSent,
              invitationsSent: eventSummary.invitationsSent,
              confirmed: eventSummary.confirmed,
              declined: eventSummary.declined,
              noResponse: eventSummary.pending,
              checkedIn: eventSummary.checkedIn,
              openCount: eventSummary.openCount,
              openRate: eventSummary.openRate,
            }))
          ).map((event) => ({
            eventId: event.id,
            eventName: event.name,
            date: event.date,
            venue: event.venue,
            status: event.status,
            invitationsSent: event.invitationsSent || 0,
            confirmed: event.confirmed || 0,
            declined: event.declined || 0,
            pending: event.noResponse || 0,
            checkedIn: event.checkedIn || 0,
            openCount: event.openCount || 0,
            uniqueGuestOpens: 0,
            openRate: event.openRate || 0,
            attendanceRate:
              (event.confirmed || 0) > 0
                ? Math.round(((event.checkedIn || 0) / Math.max(event.confirmed || 0, 1)) * 100)
                : 0,
          }))
        : []

      setDashboardOverview({
        ...data,
        eventPerformance: dedupedPerformance,
      })
    } catch (overviewError) {
      console.error('Error fetching dashboard overview:', overviewError)
      setDashboardOverview(null)
    }
  }

  const handleEventLimitReached = async (message?: string) => {
    // First, check if admin has approved the subscription
    try {
      if (!token) return

      const checkResponse = await fetch('/api/auth/check-subscription', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (checkResponse.ok) {
        const checkData = await checkResponse.json()

        // If subscription is now active with higher limit, reload page
        if (checkData.user.subscription_status === 'active' && checkData.user.event_limit > 1) {
          console.log('Subscription approved by admin! Reloading...', checkData.user)
          setError(null)
          setShowUpgradeModal(false)
          setTimeout(() => window.location.reload(), 500)
          return
        }
      }
    } catch (err) {
      console.error('Error checking subscription:', err)
    }

    // If not approved, show upgrade modal
    setUpgradeFeature('additional events')
    setShowUpgradeModal(true)
    setIsCreateModalOpen(false)
    setEditingEvent(null)
    setError(
      message || (isArabic ? 'قم بترقية خطتك لإنشاء فعاليات إضافية.' : 'Upgrade your plan to create more events.')
    )
  }

  if (!isHydrated || (isLoading && events.length === 0)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
        <p className="text-text-secondary">{isArabic ? 'جارٍ تحميل فعالياتك...' : 'Loading your events...'}</p>
        {error && (
          <div className="mt-4 max-w-md rounded-md border border-red-400 bg-red-100 p-4 text-center text-red-700">
            {error}
          </div>
        )}
      </div>
    )
  }

  const handleSelectEvent = (eventId: string) => {
    setSelectedEvents((prev) => (prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]))
  }

  const handleSelectAll = () => {
    if (selectedEvents.length === filteredAndSortedEvents.length) {
      setSelectedEvents([])
    } else {
      setSelectedEvents(filteredAndSortedEvents.map((e) => e.id as string))
    }
  }

  const handleCreateEvent = async (eventData: EventFormData) => {
    if (!userId || !token) {
      setError('User not authenticated')
      return
    }

    try {
      setIsLoading(true)
      console.log('Creating/updating event:', eventData)

      if (eventData.id) {
        // Update existing event
        const response = await fetch(`/api/events/${eventData.id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: eventData.name,
            date: eventData.date,
            venue: eventData.venue,
            description: eventData.description,
            eventType: eventData.eventType,
            expectedGuests: eventData.expectedGuests,
            bankAccountHolder: eventData.bankAccountHolder,
            bankName: eventData.bankName,
            bankAccountNumber: eventData.bankAccountNumber,
            bankIban: eventData.bankIban,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update event')
        }

        const updatedEvent = await response.json()
        console.log('Event updated:', updatedEvent)

        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventData.id
              ? {
                  ...e,
                  name: updatedEvent.name,
                  date: updatedEvent.date,
                  venue: updatedEvent.venue,
                  description: updatedEvent.description,
                  event_type: updatedEvent.event_type,
                  template_id: updatedEvent.template_id,
                  expected_guests: updatedEvent.expected_guests,
                  bank_account_holder: updatedEvent.bank_account_holder,
                  bank_name: updatedEvent.bank_name,
                  bank_account_number: updatedEvent.bank_account_number,
                  bank_iban: updatedEvent.bank_iban,
                  status: getEventStatus(updatedEvent.date),
                  guestCount: updatedEvent.expected_guests,
                }
              : e
          )
        )
      } else {
        // Create new event
        const eventStatus = getEventStatus(eventData.date)
        const response = await fetch('/api/events/create', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            name: eventData.name,
            date: eventData.date,
            venue: eventData.venue,
            description: eventData.description,
            eventType: eventData.eventType,
            expectedGuests: eventData.expectedGuests,
            status: eventStatus,
            bankAccountHolder: eventData.bankAccountHolder,
            bankName: eventData.bankName,
            bankAccountNumber: eventData.bankAccountNumber,
            bankIban: eventData.bankIban,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()

          if (response.status === 403 && errorData.code === 'EVENT_LIMIT_REACHED') {
            await handleEventLimitReached(errorData.error)
            return
          }

          throw new Error(errorData.error || 'Failed to create event')
        }

        const newEvent = await response.json()
        console.log('Event created:', newEvent)

        const templateCategory = normalizeTemplateCategory(newEvent.event_type || eventData.eventType)

        setEvents((prev) => {
          const mappedEvent: Event = {
            ...newEvent,
            id: String(newEvent.id),
            template_id: newEvent.template_id || 'modern',
            status: getEventStatus(newEvent.date),
            guestCount: newEvent.expected_guests,
            invitationsSent: 0,
            confirmed: 0,
            declined: 0,
            noResponse: 0,
            checkedIn: 0,
          }
          const existingIndex = prev.findIndex((e) => e.id === mappedEvent.id)
          if (existingIndex >= 0) {
            return prev.map((e, idx) => (idx === existingIndex ? mappedEvent : e))
          }
          return [...prev, mappedEvent]
        })

        router.push(`/${locale}/invitations/templates/${templateCategory}?eventId=${newEvent.id}`)
        return
      }

      setEditingEvent(null)
      setError(null)
    } catch (err) {
      console.error('Error saving event:', err)
      setError(`Failed to save event: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditEvent = (event: Event) => {
    setEditingEvent({
      id: typeof event.id === 'string' ? event.id : String(event.id),
      name: event.name,
      date: event.date,
      venue: event.venue,
      description: event.description || '',
      expectedGuests: event.expected_guests || event.guestCount || 0,
      eventType: event.event_type || 'wedding',
      bankAccountHolder: (event as any).bank_account_holder || '',
      bankName: (event as any).bank_name || '',
      bankAccountNumber: (event as any).bank_account_number || '',
      bankIban: (event as any).bank_iban || '',
    })
    setIsCreateModalOpen(true)
  }

  const handleDuplicateEvent = async (event: Event) => {
    if (!userId) {
      setError('User not authenticated')
      return
    }

    try {
      setIsLoading(true)
      const eventStatus = getEventStatus(event.date)
      const response = await fetch('/api/events/create', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          name: `${event.name} (Copy)`,
          date: event.date,
          venue: event.venue,
          description: event.description,
          eventType: event.event_type || 'wedding',
          expectedGuests: event.expected_guests || event.guestCount || 100,
          status: eventStatus,
          bankAccountHolder: (event as any).bank_account_holder || '',
          bankName: (event as any).bank_name || '',
          bankAccountNumber: (event as any).bank_account_number || '',
          bankIban: (event as any).bank_iban || '',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()

        if (response.status === 403 && errorData.code === 'EVENT_LIMIT_REACHED') {
          await handleEventLimitReached(errorData.error)
          return
        }

        throw new Error(errorData.error || 'Failed to duplicate event')
      }

      const newEvent = await response.json()
      setEvents((prev) => {
        const mappedEvent: Event = {
          ...newEvent,
          id: String(newEvent.id),
          status: getEventStatus(newEvent.date),
          guestCount: newEvent.expected_guests,
          invitationsSent: 0,
          confirmed: 0,
          declined: 0,
          noResponse: 0,
          checkedIn: 0,
        }
        const existingIndex = prev.findIndex((e) => e.id === mappedEvent.id)
        if (existingIndex >= 0) {
          return prev.map((e, idx) => (idx === existingIndex ? mappedEvent : e))
        }
        return [...prev, mappedEvent]
      })

      setError(null)
    } catch (err) {
      console.error('Error duplicating event:', err)
      setError('Failed to duplicate event')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewAnalytics = (event: Event) => {
    console.log('Viewing analytics for:', event.name)
  }

  const handleArchiveEvent = async (event: Event) => {
    if (!token) {
      setError('User not authenticated')
      return
    }

    try {
      setIsLoading(true)
      console.log('Deleting event:', event.id)

      const response = await fetch(`/api/events/${event.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete event')
      }

      console.log('Event deleted successfully')
      setEvents((prev) => prev.filter((e) => e.id !== event.id))
      setError(null)
    } catch (err) {
      console.error('Error deleting event:', err)
      setError(`Failed to delete event: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveTemplate = (template: TemplateData) => {
    console.log('Template saved:', template)
    // Template is automatically saved by the TemplateEditorModal using the templateService
  }

  const handleManageInvitations = (event: Event) => {
    router.push(`/${locale}/event-management-dashboard/payments?eventId=${encodeURIComponent(event.id)}`)
  }

  const handleSelectTemplate = (event: Event) => {
    const templateCategory = normalizeTemplateCategory(event.event_type)
    router.push(`/${locale}/invitations/templates/${templateCategory}?eventId=${event.id}`)
  }

  const handleOpenTemplateEditor = (eventId?: string) => {
    // Use provided eventId, or first upcoming event, or first event
    const targetEventId = eventId || events.find((e) => e.status === 'upcoming')?.id || events[0]?.id

    if (targetEventId) {
      setTemplateEventId(String(targetEventId))
      setIsTemplateModalOpen(true)
    }
  }

  const handleSort = (field: keyof Event) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Get the event data for template editing
  const templateEvent = templateEventId ? events.find((e) => e.id === templateEventId) : null

  const filteredAndSortedEvents = events
    .filter(
      (event) =>
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      const direction = sortDirection === 'asc' ? 1 : -1

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * direction
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * direction
      }
      return 0
    })

  const totalInvitationsSent = events.reduce((sum, e) => sum + (e.invitationsSent || 0), 0)
  const totalOpenCount = events.reduce((sum, e) => sum + (e.openCount || 0), 0)
  const globalOpenRate = totalInvitationsSent > 0 ? Math.round((totalOpenCount / totalInvitationsSent) * 100) : 0

  const summaryCards = [
    {
      label: 'Total Events',
      labelAr: 'إجمالي الفعاليات',
      value: events.length,
      icon: 'CalendarDaysIcon',
      color: 'primary' as const,
    },
    {
      label: 'Upcoming Events',
      labelAr: 'الفعاليات القادمة',
      value: events.filter((e) => e.status === 'upcoming').length,
      icon: 'ClockIcon',
      color: 'success' as const,
    },
    {
      label: 'Total Guests',
      labelAr: 'إجمالي الضيوف',
      value: events.reduce((sum, e) => sum + (e.guestCount || e.expected_guests || 0), 0),
      icon: 'UserGroupIcon',
      color: 'accent' as const,
    },
    {
      label: 'Invitation Opens',
      labelAr: 'إجمالي فتح الدعوات',
      value: totalOpenCount,
      icon: 'EyeIcon',
      color: 'success' as const,
    },
    {
      label: 'Open Rate',
      labelAr: 'معدل فتح الدعوات',
      value: globalOpenRate,
      icon: 'ChartBarIcon',
      color: 'warning' as const,
    },
  ]

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-400 bg-red-100 p-4 text-red-700">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">{error}</div>
            {error.includes('Your current plan allows only') && (
              <button
                onClick={handleAutoApprovePendingPayment}
                className="whitespace-nowrap rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                {isArabic ? 'تحديث الآن' : 'Refresh Now'}
              </button>
            )}
          </div>
        </div>
      )}

      <EventSummaryCards cards={summaryCards} />

      {dashboardOverview && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6 shadow-warm-md">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-heading text-xl font-semibold text-text-primary">
                  {isArabic ? 'تحليلات فتح الدعوات' : 'Invitation Open Analytics'}
                </h2>
                <p className="text-sm text-text-secondary">
                  {isArabic
                    ? 'فتح الدعوات على مستوى الضيف مع آخر النشاطات'
                    : 'Guest-level invitation opens with latest activity'}
                </p>
              </div>
              <div className="bg-primary/10 rounded-md px-3 py-2 text-sm font-medium text-primary">
                {dashboardOverview.metrics.uniqueGuestsOpened}/{dashboardOverview.metrics.totalGuests}{' '}
                {isArabic ? 'ضيف فتح الدعوة' : 'guests opened'}
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-4">
              <div className="rounded-md bg-muted p-4">
                <p className="text-xs text-text-secondary">{isArabic ? 'إجمالي الفتح' : 'Total Opens'}</p>
                <p className="font-mono text-2xl font-bold text-text-primary">
                  {dashboardOverview.metrics.totalInvitationOpens}
                </p>
              </div>
              <div className="rounded-md bg-muted p-4">
                <p className="text-xs text-text-secondary">{isArabic ? 'معدل فتح الضيوف' : 'Guest Open Rate'}</p>
                <p className="font-mono text-2xl font-bold text-text-primary">
                  {dashboardOverview.metrics.guestOpenRate}%
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {dashboardOverview.recentGuestOpens.length === 0 ? (
                <p className="text-sm text-text-secondary">
                  {isArabic ? 'لا توجد عمليات فتح دعوات مسجلة بعد.' : 'No invitation opens recorded yet.'}
                </p>
              ) : (
                dashboardOverview.recentGuestOpens.map((open) => (
                  <div key={`${open.guestId}-${open.viewedAt}`} className="rounded-md border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-text-primary">{open.guestName}</p>
                        <p className="text-sm text-text-secondary">{open.eventName}</p>
                        <p className="text-xs text-text-secondary">{open.email || open.phone || ''}</p>
                      </div>
                      <span className="text-xs text-text-secondary">
                        {new Date(open.viewedAt).toLocaleString(isArabic ? 'ar-SA' : 'en-US')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-warm-md">
            <div className="mb-4">
              <h2 className="font-heading text-xl font-semibold text-text-primary">
                {isArabic ? 'أداء الفعاليات' : 'Event Performance'}
              </h2>
              <p className="text-sm text-text-secondary">
                {isArabic
                  ? 'مقارنة الفعاليات حسب الفتح والردود والحضور'
                  : 'Compare events by opens, responses, and attendance'}
              </p>
            </div>

            <div className="space-y-3">
              {dashboardOverview.eventPerformance.slice(0, 6).map((eventSummary) => (
                <div key={eventSummary.eventId} className="rounded-md border border-border p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-text-primary">{eventSummary.eventName}</p>
                      <p className="text-xs text-text-secondary">{eventSummary.date}</p>
                    </div>
                    <span className="text-xs text-text-secondary">{eventSummary.venue}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded bg-muted p-2">
                      <p className="text-xs text-text-secondary">{isArabic ? 'الفتح' : 'Opens'}</p>
                      <p className="font-mono text-sm font-bold text-text-primary">{eventSummary.openRate}%</p>
                    </div>
                    <div className="rounded bg-muted p-2">
                      <p className="text-xs text-text-secondary">{isArabic ? 'التأكيد' : 'RSVP'}</p>
                      <p className="font-mono text-sm font-bold text-text-primary">
                        {eventSummary.confirmed}/{eventSummary.invitationsSent}
                      </p>
                    </div>
                    <div className="rounded bg-muted p-2">
                      <p className="text-xs text-text-secondary">{isArabic ? 'الحضور' : 'Attendance'}</p>
                      <p className="font-mono text-sm font-bold text-text-primary">{eventSummary.attendanceRate}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card shadow-warm-md">
        <div className="border-b border-border p-6">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="w-full flex-1 md:w-auto">
              <div className="relative">
                <Icon
                  name="MagnifyingGlassIcon"
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isArabic ? 'ابحث عن الفعاليات بالاسم أو المكان...' : 'Search events by name or venue...'}
                  className="transition-smooth w-full rounded-md border border-input bg-background py-3 pl-12 pr-4 text-text-primary focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
                />
              </div>
            </div>

            <div className="flex w-full items-center gap-3 md:w-auto">
              <button
                onClick={() => handleOpenTemplateEditor()}
                className="transition-smooth hover:bg-secondary/90 active:scale-97 flex items-center gap-2 rounded-md bg-secondary px-6 py-3 font-medium text-secondary-foreground shadow-warm-sm hover:shadow-warm-md focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
              >
                <Icon name="PaintBrushIcon" size={20} />
                <span className="hidden sm:inline">{isArabic ? 'تعديل القالب' : 'Edit Template'}</span>
              </button>
              <button
                onClick={() => {
                  setEditingEvent(null)
                  setIsCreateModalOpen(true)
                }}
                className="transition-smooth hover:bg-primary/90 active:scale-97 flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground shadow-warm-md hover:shadow-warm-lg focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2"
              >
                <Icon name="PlusIcon" size={20} />
                <span>{isArabic ? 'إنشاء فعالية' : 'Create Event'}</span>
              </button>
            </div>
          </div>

          {selectedEvents.length > 0 && (
            <div className="bg-primary/10 mt-4 flex items-center gap-3 rounded-md p-3">
              <span className="text-sm font-medium text-primary">
                {isArabic
                  ? `تم تحديد ${selectedEvents.length} فعالية`
                  : `${selectedEvents.length} event${selectedEvents.length > 1 ? 's' : ''} selected`}
              </span>
              <button onClick={() => setSelectedEvents([])} className="ml-auto text-sm text-primary hover:underline">
                {isArabic ? 'مسح التحديد' : 'Clear selection'}
              </button>
            </div>
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedEvents.length === filteredAndSortedEvents.length && filteredAndSortedEvents.length > 0
                    }
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-3 focus:ring-ring focus:ring-offset-2"
                    aria-label={isArabic ? 'تحديد جميع الفعاليات' : 'Select all events'}
                  />
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('name')}
                    className="transition-smooth flex items-center gap-2 text-sm font-semibold text-text-primary hover:text-primary"
                  >
                    {isArabic ? 'اسم الفعالية' : 'Event Name'}
                    <Icon
                      name={sortField === 'name' && sortDirection === 'desc' ? 'ChevronDownIcon' : 'ChevronUpIcon'}
                      size={16}
                      className={sortField === 'name' ? 'text-primary' : 'text-text-secondary'}
                    />
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('date')}
                    className="transition-smooth flex items-center gap-2 text-sm font-semibold text-text-primary hover:text-primary"
                  >
                    {isArabic ? 'التاريخ' : 'Date'}
                    <Icon
                      name={sortField === 'date' && sortDirection === 'desc' ? 'ChevronDownIcon' : 'ChevronUpIcon'}
                      size={16}
                      className={sortField === 'date' ? 'text-primary' : 'text-text-secondary'}
                    />
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('status')}
                    className="transition-smooth flex items-center gap-2 text-sm font-semibold text-text-primary hover:text-primary"
                  >
                    {isArabic ? 'الحالة' : 'Status'}
                    <Icon
                      name={sortField === 'status' && sortDirection === 'desc' ? 'ChevronDownIcon' : 'ChevronUpIcon'}
                      size={16}
                      className={sortField === 'status' ? 'text-primary' : 'text-text-secondary'}
                    />
                  </button>
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                  {isArabic ? 'الضيوف' : 'Guests'}
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                  {isArabic ? 'الدعوات' : 'Invitations'}
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                  {isArabic ? 'الحضور' : 'Attendance'}
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                  {isArabic ? 'الإجراءات' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedEvents.map((event) => (
                <EventTableRow
                  key={event.id}
                  event={event}
                  isSelected={selectedEvents.includes(event.id)}
                  onSelect={() => handleSelectEvent(event.id)}
                  onEdit={() => handleEditEvent(event)}
                  onSelectTemplate={() => handleSelectTemplate(event)}
                  onDuplicate={() => handleDuplicateEvent(event)}
                  onViewAnalytics={() => handleViewAnalytics(event)}
                  onArchive={() => handleArchiveEvent(event)}
                  onManageInvitations={() => handleManageInvitations(event)}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-4 p-4 md:hidden">
          {filteredAndSortedEvents.map((event) => (
            <EventTableMobileCard
              key={event.id}
              event={event}
              isSelected={selectedEvents.includes(event.id)}
              onSelect={() => handleSelectEvent(event.id)}
              onEdit={() => handleEditEvent(event)}
              onManageInvitations={() => handleManageInvitations(event)}
              onSelectTemplate={() => handleSelectTemplate(event)}
              onDuplicate={() => handleDuplicateEvent(event)}
              onViewAnalytics={() => handleViewAnalytics(event)}
              onArchive={() => handleArchiveEvent(event)}
            />
          ))}
        </div>

        {filteredAndSortedEvents.length === 0 && (
          <div className="p-12 text-center">
            <Icon name="CalendarDaysIcon" size={48} className="mx-auto mb-4 text-text-secondary" />
            <p className="text-text-secondary">
              {isArabic ? 'لا توجد فعاليات مطابقة لبحثك.' : 'No events found matching your search.'}
            </p>
          </div>
        )}
      </div>

      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setEditingEvent(null)
        }}
        onSubmit={handleCreateEvent}
        editingEvent={editingEvent}
      />

      <TemplateEditorModal
        isOpen={isTemplateModalOpen}
        onClose={() => {
          setIsTemplateModalOpen(false)
          setTemplateEventId(null)
        }}
        onSave={handleSaveTemplate}
        eventId={templateEventId ? String(templateEventId) : undefined}
        eventData={
          templateEvent
            ? {
                name: templateEvent.name,
                date: templateEvent.date,
                venue: templateEvent.venue,
              }
            : undefined
        }
      />

      {showUpgradeModal && (
        <UpgradeModal
          feature={upgradeFeature}
          onClose={() => {
            setShowUpgradeModal(false)
          }}
        />
      )}
    </div>
  )
}

export default EventManagementInteractive
