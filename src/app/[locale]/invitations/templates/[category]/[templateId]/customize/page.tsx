'use client'

import Header from '@/components/common/Header'
import UserAuthGuard from '@/components/UserAuthGuard'
import { getCurrentSession } from '@/lib/auth'
import { TemplateStyle } from '@/types/invitations'
import { useLocale } from 'next-intl'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import TemplateCustomizationEditor from '../../../../../../../components/invitations/TemplateCustomizationEditor'

type RouteParams = {
  locale?: string
  category?: string
  templateId?: string
}

export default function TemplateCustomizePage() {
  const params = useParams<RouteParams>()
  const templateId = params?.templateId || 'professional'
  const category = params?.category || 'other'
  const currentLocale = useLocale()
  const isArabic = currentLocale === 'ar'
  const router = useRouter()
  const searchParams = useSearchParams()

  const eventId = searchParams.get('eventId')
  const invitationId = searchParams.get('invitationId')
  const shareLink = searchParams.get('shareLink')
  const [eventData, setEventData] = useState<any>(null)
  const [eventRecord, setEventRecord] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(!!eventId)
  const cancelHref = `/${currentLocale}/invitations/templates/${category}${
    eventId ? `?eventId=${encodeURIComponent(eventId)}` : ''
  }`

  // Fetch event data if eventId is provided
  useEffect(() => {
    if (!eventId) {
      setEventData({
        event_name: '',
        host_name: '',
        date: '',
        time: '18:00',
        location: '',
        description: '',
        guest_count: undefined,
      })
      setEventRecord(null)
      setIsLoading(false)
      return
    }

    const fetchEventData = async () => {
      try {
        const session = await getCurrentSession()
        if (!session?.access_token) {
          throw new Error('Missing active session')
        }

        const response = await fetch(`/api/events/${eventId}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to fetch event data')
        }

        const data = await response.json()
        setEventRecord(data)
        setEventData({
          event_name: data.name || '',
          host_name: data.name || '',
          date: data.date || '',
          time: data.time || '18:00',
          location: data.venue || '',
          description: data.description || '',
          guest_count: data.expected_guests,
        })
      } catch (error) {
        console.error('Failed to fetch event data:', error)
        setEventRecord(null)
        setEventData({
          event_name: '',
          host_name: '',
          date: '',
          time: '18:00',
          location: '',
          description: '',
          guest_count: undefined,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchEventData()
  }, [eventId])

  const handleSave = async (data: any) => {
    try {
      const session = await getCurrentSession()
      if (!session?.access_token) {
        throw new Error('Missing active session')
      }

      const savedEventId = eventId && eventId !== 'new-event' ? eventId : eventRecord?.id || data?.event_id || ''

      if (!savedEventId) {
        console.warn(
          'No event ID available while saving. Skipping event update and saving invitation only if possible.'
        )
      }

      if (!eventRecord && savedEventId) {
        console.warn('Event details not loaded, but event ID present. Continuing with invitation save.')
      }

      if (savedEventId) {
        const eventUpdateBody = {
          name: eventRecord?.name ?? data?.invitation_data?.event_name ?? '',
          date: eventRecord?.date ?? data?.invitation_data?.date ?? '',
          time: eventRecord?.time ?? data?.invitation_data?.time ?? '18:00',
          venue: eventRecord?.venue ?? data?.invitation_data?.location ?? '',
          description: eventRecord?.description ?? data?.invitation_data?.description ?? '',
          eventType: eventRecord?.event_type ?? data?.invitation_data?.event_type ?? '',
          expectedGuests: eventRecord?.expected_guests ?? data?.invitation_data?.guest_count ?? 0,
          status: eventRecord?.status ?? 'active',
          templateId,
        }

        const response = await fetch(`/api/events/${savedEventId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventUpdateBody),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to attach template to event')
        }
      }

      const invitationResponse = await fetch('/api/invitations/create', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        // Persist full editor payload in customization so export/WhatsApp can render designed cards.
        body: JSON.stringify({
          event_id: savedEventId || undefined,
          invitation_id: invitationId || undefined,
          share_link: shareLink || undefined,
          template_id: templateId,
          invitation_data: {
            ...data.invitation_data,
            event_id: savedEventId || undefined,
            template_id: templateId,
          },
          customization: {
            ...(data.customization || {}),
            canvas_items: data.canvas_items || [],
            backdrop_id: data.backdrop_id || null,
            backdrop_css: data.backdrop_css || null,
            header_logo: data.header_logo || null,
          },
        }),
      })

      if (!invitationResponse.ok) {
        const error = await invitationResponse.json()
        throw new Error(error.error || 'Failed to save customized invitation')
      }

      console.log('Invitation saved:', data)

      // Redirect to success page or dashboard
      router.push(`/${currentLocale}/event-management-dashboard`)
    } catch (error) {
      console.error('Failed to save invitation:', error)
      throw error
    }
  }

  if (isLoading) {
    return (
      <UserAuthGuard>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
              <p className="mt-4 text-gray-600">{isArabic ? 'جاري التحميل...' : 'Loading...'}</p>
            </div>
          </main>
        </div>
      </UserAuthGuard>
    )
  }

  return (
    <UserAuthGuard>
      <div className="bg-gray-50">
        <Header />

        <TemplateCustomizationEditor
          templateId={templateId as TemplateStyle}
          eventId={eventId || 'new-event'}
          eventData={eventData}
          onSave={handleSave}
          onCancel={() => router.push(cancelHref)}
        />
      </div>
    </UserAuthGuard>
  )
}
