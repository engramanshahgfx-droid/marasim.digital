'use client'

import Icon from '@/components/ui/AppIcon'
import { getCurrentSession, getCurrentUser } from '@/lib/auth'
import { useLocale } from 'next-intl'
import { useEffect, useState } from 'react'
import AddGuestForm from './AddGuestForm'
import BulkActionsBar from './BulkActionsBar'
import FileUploadZone from './FileUploadZone'
import FilterPanel from './FilterPanel'
import GuestMobileCard from './GuestMobileCard'
import GuestTableRow from './GuestTableRow'

interface Event {
  id: string
  name: string
  date: string
  title_ar?: string | null
  name_ar?: string | null
  status?: string | null
}

interface Guest {
  id: string | number
  name: string
  phone: string
  email: string
  invitationStatus: 'sent' | 'pending' | 'failed'
  deliveryStatus: 'delivered' | 'failed' | 'pending' | 'read'
  responseStatus: 'confirmed' | 'declined' | 'no-response'
  checkInTime: string | null
  qrCode: string
  avatar: string
  avatarAlt: string
  plusOnes: number
}

interface FilterState {
  deliveryStatus: string
  responseStatus: string
  checkInStatus: string
  searchQuery: string
}

interface GuestListInteractiveProps {
  onEventSelected?: (eventId: string) => void
}

interface WhatsAppResultItem {
  phone: string
  status?: string
  sid?: string
  errorMessage?: string | null
}

interface WhatsAppSendReport {
  senderMode?: 'sandbox' | 'registered'
  sender?: string
  sent?: number
  delivered?: number
  pending?: number
  failed?: number
  hint?: string
  results?: WhatsAppResultItem[]
}

const GuestListInteractive = ({ onEventSelected }: GuestListInteractiveProps) => {
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const [isHydrated, setIsHydrated] = useState(false)
  const [guests, setGuests] = useState<Guest[]>([])
  const [filteredGuests, setFilteredGuests] = useState<Guest[]>([])
  const [selectedGuests, setSelectedGuests] = useState<(string | number)[]>([])
  const [sortConfig, setSortConfig] = useState<{ key: keyof Guest; direction: 'asc' | 'desc' } | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    deliveryStatus: 'all',
    responseStatus: 'all',
    checkInStatus: 'all',
    searchQuery: '',
  })

  // New state for file upload
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [duplicates, setDuplicates] = useState<string[]>([])
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [isClearing, setIsClearing] = useState(false)
  const [showAddGuestForm, setShowAddGuestForm] = useState(false)
  const [isLoadingGuests, setIsLoadingGuests] = useState(false)
  const [guestToUpdate, setGuestToUpdate] = useState<Guest | null>(null)
  const [whatsAppReport, setWhatsAppReport] = useState<WhatsAppSendReport | null>(null)

  // Fetch guests for the selected event
  const fetchGuests = async (eventId: string) => {
    if (!eventId || !token) return

    setIsLoadingGuests(true)
    try {
      const response = await fetch(`/api/guests/list?eventId=${eventId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        const fetchedGuests = data.guests || []

        // Map to the Guest interface with default avatar
        const mappedGuests: Guest[] = fetchedGuests.map((g: any) => ({
          id: g.id,
          name: g.name,
          phone: g.phone,
          email: g.email,
          invitationStatus: g.invitationStatus,
          deliveryStatus: g.deliveryStatus,
          responseStatus: g.responseStatus,
          checkInTime: g.checkInTime,
          qrCode: g.qrCode,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(g.name)}&background=4F46E5&color=fff&size=128`,
          avatarAlt: `Avatar for ${g.name}`,
          plusOnes: g.plusOnes || 0,
        }))

        setGuests(mappedGuests)
        setFilteredGuests(mappedGuests)
      } else {
        console.error('Failed to fetch guests')
      }
    } catch (error) {
      console.error('Error fetching guests:', error)
    } finally {
      setIsLoadingGuests(false)
    }
  }

  // Fetch events on mount
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        const user = await getCurrentUser()
        if (!user?.id) {
          setUploadError('User not authenticated')
          setIsHydrated(true)
          return
        }

        setUserId(user.id)

        const session = await getCurrentSession()
        if (!session?.access_token) {
          setUploadError('No session token found')
          setIsHydrated(true)
          return
        }

        setToken(session.access_token)

        // Fetch user's events
        setIsLoadingEvents(true)
        const response = await fetch('/api/events/list', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const eventsList = await response.json()
          setEvents(eventsList || [])

          // Auto-select first event if available
          if (eventsList && eventsList.length > 0) {
            setSelectedEventId(String(eventsList[0].id))
          }
        }
      } catch (err) {
        console.error('Error initializing component:', err)
        setUploadError('Failed to load events')
      } finally {
        setIsLoadingEvents(false)
        setIsHydrated(true)
      }
    }

    initializeComponent()
  }, [])

  // Fetch guests when event is selected
  useEffect(() => {
    if (selectedEventId && token) {
      fetchGuests(selectedEventId)
      // Notify parent component of selected event change
      if (onEventSelected) {
        onEventSelected(selectedEventId)
      }
    } else {
      setGuests([])
      setFilteredGuests([])
      if (onEventSelected) {
        onEventSelected('')
      }
    }
  }, [selectedEventId, token, onEventSelected])

  useEffect(() => {
    if (!isHydrated) return

    let filtered = [...guests]

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(
        (guest) =>
          guest.name.toLowerCase().includes(query) ||
          guest.phone.toLowerCase().includes(query) ||
          guest.email.toLowerCase().includes(query)
      )
    }

    if (filters.deliveryStatus !== 'all') {
      filtered = filtered.filter((guest) => guest.deliveryStatus === filters.deliveryStatus)
    }

    if (filters.responseStatus !== 'all') {
      filtered = filtered.filter((guest) => guest.responseStatus === filters.responseStatus)
    }

    if (filters.checkInStatus !== 'all') {
      if (filters.checkInStatus === 'checked-in') {
        filtered = filtered.filter((guest) => guest.checkInTime !== null)
      } else {
        filtered = filtered.filter((guest) => guest.checkInTime === null)
      }
    }

    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]

        if (aValue === null) return 1
        if (bValue === null) return -1

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    setFilteredGuests(filtered)
  }, [filters, guests, sortConfig, isHydrated])

  const handleSort = (key: keyof Guest) => {
    setSortConfig((current) => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' }
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' }
      }
      return null
    })
  }

  const handleSelectGuest = (id: string | number) => {
    setSelectedGuests((current) =>
      current.includes(id) ? current.filter((guestId) => guestId !== id) : [...current, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedGuests.length === filteredGuests.length) {
      setSelectedGuests([])
    } else {
      setSelectedGuests(filteredGuests.map((guest) => guest.id))
    }
  }

  const handleUpdateGuest = (guest: Guest) => {
    setGuestToUpdate(guest)
  }

  const handleDeleteGuest = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this guest?')) {
      return
    }

    if (!token) {
      setUploadError('User not authenticated')
      return
    }

    try {
      const response = await fetch(`/api/guests/delete?guestId=${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete guest')
      }

      setUploadSuccess(isArabic ? 'تم حذف الضيف بنجاح' : 'Guest deleted successfully')

      // Refresh guests list
      if (selectedEventId) {
        await fetchGuests(selectedEventId)
      }
    } catch (err) {
      console.error('Error deleting guest:', err)
      setUploadError(`Failed to delete guest: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false)

  const handleBulkSendWhatsApp = async () => {
    if (!userId || !selectedEventId || selectedGuests.length === 0) {
      setUploadError(isArabic ? 'يرجى تحديد فعالية وضيوف أولاً' : 'Please select an event and guests first')
      return
    }

    setIsSendingWhatsApp(true)
    setUploadError(null)
    setUploadSuccess(null)
    setWhatsAppReport(null)

    try {
      const response = await fetch('/api/whatsapp/send-invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          eventId: selectedEventId,
          guestIds: selectedGuests,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to send WhatsApp messages')
      }

      if (!data.sent || data.sent === 0) {
        throw new Error(data.message || (isArabic ? 'فشل إرسال رسائل واتساب' : 'Failed to send WhatsApp messages'))
      }

      setWhatsAppReport({
        senderMode: data.senderMode,
        sender: data.sender,
        sent: data.sent,
        delivered: data.delivered,
        pending: data.pending,
        failed: data.failed,
        hint: data.hint,
        results: data.results,
      })

      setUploadSuccess(
        isArabic
          ? `تمت معالجة ${data.sent} رسالة${data.delivered > 0 ? `، تم التسليم ${data.delivered}` : ''}${data.pending > 0 ? `، قيد الانتظار ${data.pending}` : ''}${data.failed > 0 ? `، فشل ${data.failed}` : ''}`
          : `Processed ${data.sent} message${data.sent !== 1 ? 's' : ''}${data.delivered > 0 ? `, ${data.delivered} delivered` : ''}${data.pending > 0 ? `, ${data.pending} pending` : ''}${data.failed > 0 ? `, ${data.failed} failed` : ''}`
      )
      setSelectedGuests([])

      // Refresh guests so delivery status column reflects newest Twilio status.
      if (selectedEventId) {
        await fetchGuests(selectedEventId)
      }
    } catch (err) {
      console.error('WhatsApp send error:', err)
      setUploadError(
        isArabic
          ? `فشل إرسال رسائل واتساب: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`
          : `Failed to send WhatsApp messages: ${err instanceof Error ? err.message : 'Unknown error'}`
      )
    } finally {
      setIsSendingWhatsApp(false)
    }
  }

  const handleBulkUpdateStatus = () => {
    console.log('Updating status for selected guests:', selectedGuests)
  }

  const handleBulkExportExcel = () => {
    console.log('Exporting selected guests to Excel:', selectedGuests)
  }

  const handleBulkGenerateQRCodes = () => {
    console.log('Generating QR codes for selected guests:', selectedGuests)
  }

  const handleDeselectAll = () => {
    setSelectedGuests([])
  }

  const handleFileUpload = async (file: File, replace: boolean = false) => {
    if (!selectedEventId) {
      setUploadError('Please select an event first')
      return
    }

    if (!token) {
      setUploadError('User not authenticated')
      return
    }

    try {
      setIsUploading(true)
      setUploadError(null)
      setUploadSuccess(null)
      setDuplicates([])

      console.log('Uploading file:', file.name, 'for event:', selectedEventId)

      const formData = new FormData()
      formData.append('file', file)

      const url = replace
        ? `/api/guests/upload?eventId=${selectedEventId}&replace=true`
        : `/api/guests/upload?eventId=${selectedEventId}`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle duplicate detection
        if (response.status === 409 && data.duplicates) {
          setDuplicates(data.duplicates)
          setPendingFile(file)
          setUploadError(
            data.message ||
              (isArabic
                ? 'تم اكتشاف ضيوف مكررين. هل تريد استبدال القائمة بالكامل؟'
                : 'Duplicate guests detected. Would you like to replace the entire guest list?')
          )
          return
        }
        throw new Error(data.error || 'Failed to upload file')
      }

      console.log('Upload successful:', data)
      setUploadSuccess(
        isArabic ? `تم استيراد ${data.guestsCount} ضيف بنجاح!` : `Successfully imported ${data.guestsCount} guests!`
      )
      setPendingFile(null)
      setDuplicates([])

      // Refresh guests list
      await fetchGuests(selectedEventId)
    } catch (err) {
      console.error('Error uploading file:', err)
      setUploadError(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleReplaceGuests = async () => {
    if (pendingFile) {
      await handleFileUpload(pendingFile, true)
    }
  }

  const handleClearAllGuests = async () => {
    if (!selectedEventId) {
      setUploadError('Please select an event first')
      return
    }

    if (!token) {
      setUploadError('User not authenticated')
      return
    }

    if (
      !confirm(
        isArabic
          ? 'هل أنت متأكد من حذف جميع الضيوف من هذه الفعالية؟ لا يمكن التراجع عن ذلك.'
          : 'Are you sure you want to delete all guests from this event? This cannot be undone.'
      )
    ) {
      return
    }

    try {
      setIsClearing(true)
      setUploadError(null)
      setUploadSuccess(null)

      const response = await fetch(`/api/guests/delete-all?eventId=${selectedEventId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete guests')
      }

      setUploadSuccess(isArabic ? 'تم حذف جميع الضيوف بنجاح' : 'All guests have been deleted successfully')
      setDuplicates([])
      setPendingFile(null)

      // Refresh guests list (should be empty now)
      await fetchGuests(selectedEventId)
    } catch (err) {
      console.error('Error deleting guests:', err)
      setUploadError(`Failed to clear guests: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsClearing(false)
    }
  }

  const handleGuestAdded = async () => {
    setUploadSuccess(isArabic ? 'تمت إضافة الضيف بنجاح!' : 'Guest added successfully!')
    // Refresh guest list
    if (selectedEventId) {
      await fetchGuests(selectedEventId)
    }
  }

  const guestCounts = {
    total: guests.length,
    delivered: guests.filter((g) => g.deliveryStatus === 'delivered').length,
    failed: guests.filter((g) => g.deliveryStatus === 'failed').length,
    pending: guests.filter((g) => g.deliveryStatus === 'pending').length,
    confirmed: guests.filter((g) => g.responseStatus === 'confirmed').length,
    declined: guests.filter((g) => g.responseStatus === 'declined').length,
    noResponse: guests.filter((g) => g.responseStatus === 'no-response').length,
    checkedIn: guests.filter((g) => g.checkInTime !== null).length,
  }

  const getEventDisplayName = (event: Event) => {
    if (isArabic) {
      return event.title_ar || event.name_ar || event.name
    }
    return event.name
  }

  const getEventDisplayDate = (eventDate: string) => {
    if (!eventDate) return ''
    const parsed = new Date(eventDate)
    if (Number.isNaN(parsed.getTime())) return eventDate
    return parsed.toLocaleDateString(isArabic ? 'ar-SA' : 'en-GB')
  }

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="pb-24">
      {/* Event Selector and Upload Status */}
      <div className="mb-6 space-y-4">
        <div className="rounded-lg border border-border bg-card p-6">
          <label className="mb-3 block text-sm font-medium text-text-primary">
            {isArabic ? 'اختر الفعالية لرفع الضيوف' : 'Select Event for Guest Upload'}
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value)
              setUploadError(null)
              setUploadSuccess(null)
              setWhatsAppReport(null)
            }}
            disabled={isLoadingEvents || isUploading}
            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-text-primary focus:border-transparent focus:ring-2 focus:ring-primary disabled:opacity-50"
          >
            <option value="">{isArabic ? '-- اختر فعالية --' : '-- Select an event --'}</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {getEventDisplayName(event)} ({getEventDisplayDate(event.date)})
              </option>
            ))}
          </select>
          {isLoadingEvents && (
            <p className="mt-2 text-sm text-text-secondary">
              {isArabic ? 'جارٍ تحميل الفعاليات...' : 'Loading events...'}
            </p>
          )}
        </div>

        {/* Error Message */}
        {uploadError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            <p className="text-sm font-medium">{uploadError}</p>
            {duplicates.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold">
                  {isArabic ? 'أرقام الجوال المكررة:' : 'Duplicate phone numbers:'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {duplicates.map((phone, idx) => (
                    <span key={idx} className="rounded bg-red-100 px-2 py-1 text-xs">
                      {phone}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleReplaceGuests}
                    disabled={isUploading}
                    className="rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {isArabic ? 'استبدال جميع الضيوف' : 'Replace All Guests'}
                  </button>
                  <p className="flex items-center text-xs text-red-600">
                    {isArabic
                      ? 'سيؤدي هذا إلى حذف جميع الضيوف الحاليين واستيراد القائمة الجديدة.'
                      : 'This will delete all existing guests and import the new list.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Success Message */}
        {uploadSuccess && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
            <p className="text-sm font-medium">{uploadSuccess}</p>
          </div>
        )}

        {whatsAppReport && (
          <div
            className={`rounded-lg border px-4 py-3 ${
              whatsAppReport.senderMode === 'sandbox'
                ? 'border-amber-200 bg-amber-50 text-amber-800'
                : 'border-blue-200 bg-blue-50 text-blue-800'
            }`}
          >
            <p className="text-sm font-semibold">
              {isArabic
                ? whatsAppReport.senderMode === 'sandbox'
                  ? 'وضع واتساب: Sandbox (للتجربة)'
                  : 'وضع واتساب: مرسل مسجل'
                : whatsAppReport.senderMode === 'sandbox'
                  ? 'WhatsApp mode: Sandbox (testing)'
                  : 'WhatsApp mode: Registered sender'}
            </p>
            {whatsAppReport.sender && (
              <p className="mt-1 text-xs">
                {isArabic ? `المرسل: ${whatsAppReport.sender}` : `Sender: ${whatsAppReport.sender}`}
              </p>
            )}
            <p className="mt-2 text-xs">
              {isArabic
                ? `المعالجة: ${whatsAppReport.sent || 0} | التسليم: ${whatsAppReport.delivered || 0} | الانتظار: ${whatsAppReport.pending || 0} | الفشل: ${whatsAppReport.failed || 0}`
                : `Processed: ${whatsAppReport.sent || 0} | Delivered: ${whatsAppReport.delivered || 0} | Pending: ${whatsAppReport.pending || 0} | Failed: ${whatsAppReport.failed || 0}`}
            </p>
            {whatsAppReport.hint && <p className="mt-2 text-xs">{whatsAppReport.hint}</p>}
            {!!whatsAppReport.results?.length && (
              <div className="border-current/20 mt-3 max-h-36 overflow-y-auto rounded border bg-white/60 p-2">
                {whatsAppReport.results.slice(0, 8).map((result, idx) => (
                  <p key={`${result.sid || result.phone}-${idx}`} className="text-xs">
                    {result.phone} - {(result.status || 'pending').toUpperCase()}
                    {result.errorMessage ? ` (${result.errorMessage})` : ''}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Guest Management Options - Side by Side */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* CSV Upload Section */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4">
            <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold text-text-primary">
              <Icon name="DocumentArrowUpIcon" className="h-5 w-5 text-primary" ariaLabel="Upload" />
              {isArabic ? 'استيراد جماعي من CSV' : 'Bulk Import from CSV'}
            </h3>
            <p className="text-sm text-text-secondary">
              {isArabic
                ? 'ارفع ملف CSV لإضافة عدة ضيوف دفعة واحدة'
                : 'Upload a CSV file to add multiple guests at once'}
            </p>
          </div>
          <FileUploadZone
            onFileUpload={handleFileUpload}
            isLoading={isUploading}
            disabled={!selectedEventId || isUploading}
          />
        </div>

        {/* Manual Guest Entry Section */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4">
            <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold text-text-primary">
              <Icon name="UserPlusIcon" className="h-5 w-5 text-primary" ariaLabel="Add" />
              {isArabic ? 'إضافة ضيف يدويًا' : 'Add Guest Manually'}
            </h3>
            <p className="mb-4 text-sm text-text-secondary">
              {isArabic ? 'أدخل بيانات الضيف واحدًا تلو الآخر' : 'Enter guest details one by one'}
            </p>
          </div>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="bg-primary/10 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <Icon name="UserPlusIcon" size={32} className="text-primary" ariaLabel="Add Guest" />
            </div>
            <p className="mb-4 text-center text-sm text-text-secondary">
              {isArabic ? 'اضغط بالأسفل لإضافة ضيف واحد' : 'Click below to add a single guest'}
            </p>
            <button
              onClick={() => setShowAddGuestForm(true)}
              disabled={!selectedEventId || isUploading}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground shadow-sm transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name="UserPlusIcon" className="h-5 w-5" ariaLabel="Add" />
              {isArabic ? 'إضافة ضيف' : 'Add Guest'}
            </button>
            {!selectedEventId && (
              <p className="mt-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-600">
                {isArabic ? 'يرجى اختيار فعالية أولاً' : 'Please select an event first'}
              </p>
            )}
          </div>
        </div>
      </div>

      <FilterPanel filters={filters} onFilterChange={setFilters} guestCounts={guestCounts} />

      <div className="overflow-hidden rounded-md border border-border bg-card shadow-warm-md">
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full">
            <thead className="border-b border-border bg-muted">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedGuests.length === filteredGuests.length && filteredGuests.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-3 focus:ring-ring focus:ring-offset-2"
                    aria-label={isArabic ? 'تحديد جميع الضيوف' : 'Select all guests'}
                  />
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('name')}
                    className="transition-smooth flex items-center gap-2 text-sm font-medium text-text-primary hover:text-primary"
                  >
                    {isArabic ? 'اسم الضيف' : 'Guest Name'}
                    <Icon
                      name="ChevronUpDownIcon"
                      size={16}
                      className={sortConfig?.key === 'name' ? 'text-primary' : 'text-text-secondary'}
                    />
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('phone')}
                    className="transition-smooth flex items-center gap-2 text-sm font-medium text-text-primary hover:text-primary"
                  >
                    {isArabic ? 'رقم الجوال' : 'Phone Number'}
                    <Icon
                      name="ChevronUpDownIcon"
                      size={16}
                      className={sortConfig?.key === 'phone' ? 'text-primary' : 'text-text-secondary'}
                    />
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('deliveryStatus')}
                    className="transition-smooth flex items-center gap-2 text-sm font-medium text-text-primary hover:text-primary"
                  >
                    {isArabic ? 'حالة الإرسال' : 'Delivery Status'}
                    <Icon
                      name="ChevronUpDownIcon"
                      size={16}
                      className={sortConfig?.key === 'deliveryStatus' ? 'text-primary' : 'text-text-secondary'}
                    />
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('responseStatus')}
                    className="transition-smooth flex items-center gap-2 text-sm font-medium text-text-primary hover:text-primary"
                  >
                    {isArabic ? 'حالة الرد' : 'Response Status'}
                    <Icon
                      name="ChevronUpDownIcon"
                      size={16}
                      className={sortConfig?.key === 'responseStatus' ? 'text-primary' : 'text-text-secondary'}
                    />
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('checkInTime')}
                    className="transition-smooth flex items-center gap-2 text-sm font-medium text-text-primary hover:text-primary"
                  >
                    {isArabic ? 'وقت تسجيل الحضور' : 'Check-in Time'}
                    <Icon
                      name="ChevronUpDownIcon"
                      size={16}
                      className={sortConfig?.key === 'checkInTime' ? 'text-primary' : 'text-text-secondary'}
                    />
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <span className="text-sm font-medium text-text-primary">{isArabic ? 'المرافقون' : 'Plus Ones'}</span>
                </th>
                <th className="px-6 py-4 text-left">
                  <span className="text-sm font-medium text-text-primary">{isArabic ? 'الإجراءات' : 'Actions'}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map((guest) => (
                <GuestTableRow
                  key={guest.id}
                  guest={guest}
                  isSelected={selectedGuests.includes(guest.id)}
                  onSelect={handleSelectGuest}
                  onUpdate={handleUpdateGuest}
                  onDelete={handleDeleteGuest}
                />
              ))}
            </tbody>
          </table>

          {isLoadingGuests ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="font-medium text-text-primary">{isArabic ? 'جارٍ تحميل الضيوف...' : 'Loading guests...'}</p>
            </div>
          ) : filteredGuests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Icon name="UserGroupIcon" size={48} className="mb-4 text-text-secondary" />
              <p className="mb-1 font-medium text-text-primary">{isArabic ? 'لا يوجد ضيوف' : 'No guests found'}</p>
              <p className="text-sm text-text-secondary">
                {guests.length === 0
                  ? isArabic
                    ? 'أضف أول ضيف باستخدام رفع CSV أو الإدخال اليدوي أعلاه'
                    : 'Add your first guest using CSV upload or manual entry above'
                  : isArabic
                    ? 'جرّب تعديل الفلاتر أو عبارة البحث'
                    : 'Try adjusting your filters or search query'}
              </p>
            </div>
          ) : null}
        </div>

        <div className="space-y-3 p-4 lg:hidden">
          {isLoadingGuests ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="font-medium text-text-primary">{isArabic ? 'جارٍ تحميل الضيوف...' : 'Loading guests...'}</p>
            </div>
          ) : (
            <>
              {filteredGuests.map((guest) => (
                <GuestMobileCard
                  key={guest.id}
                  guest={guest}
                  isSelected={selectedGuests.includes(guest.id)}
                  onSelect={handleSelectGuest}
                  onUpdate={handleUpdateGuest}
                  onDelete={handleDeleteGuest}
                />
              ))}

              {filteredGuests.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                  <Icon name="UserGroupIcon" size={48} className="mb-4 text-text-secondary" />
                  <p className="mb-1 font-medium text-text-primary">{isArabic ? 'لا يوجد ضيوف' : 'No guests found'}</p>
                  <p className="text-center text-sm text-text-secondary">
                    {guests.length === 0
                      ? isArabic
                        ? 'أضف أول ضيف باستخدام رفع CSV أو الإدخال اليدوي أعلاه'
                        : 'Add your first guest using CSV upload or manual entry above'
                      : isArabic
                        ? 'جرّب تعديل الفلاتر أو عبارة البحث'
                        : 'Try adjusting your filters or search query'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <BulkActionsBar
        selectedCount={selectedGuests.length}
        onSendWhatsApp={handleBulkSendWhatsApp}
        isSendingWhatsApp={isSendingWhatsApp}
        onUpdateStatus={handleBulkUpdateStatus}
        onExportExcel={handleBulkExportExcel}
        onGenerateQRCodes={handleBulkGenerateQRCodes}
        onDeselectAll={handleDeselectAll}
      />

      {/* Add/Update Guest Form Modal */}
      {(showAddGuestForm || guestToUpdate) && token && (
        <AddGuestForm
          eventId={selectedEventId}
          token={token}
          onSuccess={handleGuestAdded}
          onClose={() => {
            setShowAddGuestForm(false)
            setGuestToUpdate(null)
          }}
          guestToUpdate={guestToUpdate}
        />
      )}
    </div>
  )
}

export default GuestListInteractive
