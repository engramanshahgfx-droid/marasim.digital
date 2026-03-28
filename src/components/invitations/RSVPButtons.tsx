'use client'

import { useLocale } from 'next-intl'
import { useState } from 'react'
import { AiOutlineCheckCircle, AiOutlineCloseCircle, AiOutlineLoading3Quarters } from 'react-icons/ai'

interface RSVPButtonsProps {
  guestId: string
  eventId: string
  currentStatus?: 'confirmed' | 'declined' | 'no_response'
  onStatusChange?: (status: string) => void
}

export default function RSVPButtons({
  guestId,
  eventId,
  currentStatus = 'no_response',
  onStatusChange,
}: RSVPButtonsProps) {
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const [status, setStatus] = useState(currentStatus)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleRSVP = async (newStatus: 'confirmed' | 'declined') => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/guests/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_id: guestId,
          event_id: eventId,
          status: newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update RSVP')
      }

      const data = await response.json()
      setStatus(newStatus)
      setMessage({
        type: 'success',
        text: isArabic
          ? newStatus === 'confirmed'
            ? 'شكرا! تم تأكيد حضورك'
            : 'تم تسجيل عدم حضورك'
          : newStatus === 'confirmed'
            ? 'Thank you for confirming your attendance!'
            : 'Thank you for letting us know you cannot attend.',
      })

      if (onStatusChange) {
        onStatusChange(newStatus)
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: isArabic ? 'حدث خطأ. حاول مرة أخرى' : 'An error occurred. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{isArabic ? 'هل ستحضر الحدث؟' : 'Will you attend?'}</h3>

      {/* Buttons */}
      <div className="mb-4 flex gap-3">
        {/* Accept Button */}
        <button
          onClick={() => handleRSVP('confirmed')}
          disabled={isLoading}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold transition-all duration-200 ${
            status === 'confirmed'
              ? 'bg-green-600 text-white shadow-md'
              : 'border border-green-300 bg-gray-100 text-gray-700 hover:bg-green-50'
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {isLoading && status !== 'no_response' ? (
            <AiOutlineLoading3Quarters className="h-5 w-5 animate-spin" />
          ) : status === 'confirmed' ? (
            <AiOutlineCheckCircle className="h-5 w-5" />
          ) : (
            <AiOutlineCheckCircle className="h-5 w-5 opacity-60" />
          )}
          <span>{isArabic ? 'سأحضر' : "I'll Attend"}</span>
        </button>

        {/* Decline Button */}
        <button
          onClick={() => handleRSVP('declined')}
          disabled={isLoading}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold transition-all duration-200 ${
            status === 'declined'
              ? 'bg-red-600 text-white shadow-md'
              : 'border border-red-300 bg-gray-100 text-gray-700 hover:bg-red-50'
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {isLoading && status !== 'no_response' ? (
            <AiOutlineLoading3Quarters className="h-5 w-5 animate-spin" />
          ) : status === 'declined' ? (
            <AiOutlineCloseCircle className="h-5 w-5" />
          ) : (
            <AiOutlineCloseCircle className="h-5 w-5 opacity-60" />
          )}
          <span>{isArabic ? 'لن أستطيع الحضور' : "I Can't Attend"}</span>
        </button>
      </div>

      {/* Current Status Badge */}
      {status !== 'no_response' && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-sm font-medium text-blue-700">
            {isArabic
              ? status === 'confirmed'
                ? '✓ تم تأكيد حضورك'
                : '✗ تم تسجيل عدم حضورك'
              : status === 'confirmed'
                ? '✓ Your attendance is confirmed'
                : '✗ We will see you next time!'}
          </p>
        </div>
      )}

      {/* Message */}
      {message && (
        <div
          className={`rounded-lg p-3 text-sm font-medium ${
            message.type === 'success'
              ? 'border border-green-200 bg-green-50 text-green-700'
              : 'border border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Help Text */}
      <p className="mt-4 text-xs text-gray-500">
        {isArabic ? 'يساعدنا ردك على تنظيم الحدث بشكل أفضل' : 'Your response helps us organize the event better'}
      </p>
    </div>
  )
}
