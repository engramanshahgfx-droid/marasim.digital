'use client'

import Icon from '@/components/ui/AppIcon'
import type { TemplateStyle } from '@/types/invitations'
import { INVITATION_TEMPLATES } from '@/types/invitations'
import { useLocale } from 'next-intl'
import { useEffect, useState } from 'react'

interface InvitationsManagerProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
  templateId: TemplateStyle
  eventName: string
  token: string
}

interface InvitationItem {
  id: string
  template_id: TemplateStyle
  view_count: number
  shareable_link?: string
  created_at: string
}

export default function InvitationsManager({
  isOpen,
  onClose,
  eventId,
  templateId,
  eventName,
  token,
}: InvitationsManagerProps) {
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const [invitations, setInvitations] = useState<InvitationItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  const getInvitationUrl = (shareableLink: string) => `${window.location.origin}/${locale}/invitations/${shareableLink}`

  const fetchInvitations = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(`/api/invitations/event/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error(isArabic ? 'فشل تحميل الدعوات' : 'Failed to load invitations')
      const data = await response.json()
      setInvitations(data.invitations || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : isArabic ? 'حدث خطأ' : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) fetchInvitations()
  }, [isOpen, eventId, token])

  const handleCreateInvitation = async () => {
    try {
      setIsCreating(true)
      setError(null)
      const response = await fetch('/api/invitations/create', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          template_id: templateId,
          invitation_data: {
            template_id: templateId,
            event_id: eventId,
            event_name: eventName,
            date: new Date().toISOString().split('T')[0],
            time: '7:00 PM',
            timezone: 'GMT',
            location: isArabic ? 'المكان المحدد' : 'Event Location',
            description: isArabic ? 'دعوة لحضور فعاليتنا' : 'You are invited',
            host_name: eventName,
          },
        }),
      })
      if (!response.ok) throw new Error(isArabic ? 'فشل إنشاء الدعوة' : 'Failed to create')
      const data = await response.json()
      setInvitations((prev) => [...prev, data])
    } catch (err) {
      setError(err instanceof Error ? err.message : isArabic ? 'حدث خطأ' : 'Error')
    } finally {
      setIsCreating(false)
    }
  }

  const handleGenerateShareLink = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}/share`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error(isArabic ? 'فشل إنشاء الرابط' : 'Failed to generate')
      const data = await response.json()
      setInvitations((prev) =>
        prev.map((inv) => (inv.id === invitationId ? { ...inv, shareable_link: data.shareable_link } : inv))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : isArabic ? 'حدث خطأ' : 'Error')
    }
  }

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link)
    setCopiedLink(link)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  if (!isOpen) return null
  const templateInfo = INVITATION_TEMPLATES[templateId]

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-lg bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-xl font-semibold">
              {isArabic ? 'إدارة الدعوات' : 'Manage Invitations'} - {eventName}
            </h2>
            <button onClick={onClose} className="hover:bg-secondary/10 rounded p-1">
              <Icon name="XMarkIcon" size={24} />
            </button>
          </div>
          <div className="max-h-[calc(100vh-12rem)] space-y-6 overflow-y-auto p-6">
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{isArabic ? 'قالب الدعوة' : 'Template'}</h3>
                  <p className="text-sm text-text-secondary">
                    {locale === 'ar' ? templateInfo.name_ar : templateInfo.name}
                  </p>
                </div>
                <div
                  className="h-20 w-32 rounded-lg"
                  style={{
                    background: `linear-gradient(135deg, ${templateInfo.colors.primary} 0%, ${templateInfo.colors.secondary} 100%)`,
                  }}
                />
              </div>
            </div>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
            )}
            <button
              onClick={handleCreateInvitation}
              disabled={isCreating || isLoading}
              className="hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
            >
              <Icon name="PlusIcon" size={18} />
              {isCreating ? (isArabic ? 'جارٍ...' : 'Creating...') : isArabic ? 'إنشاء دعوة' : 'Create'}
            </button>
            {isLoading && !invitations.length ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : invitations.length === 0 ? (
              <div className="bg-muted/50 rounded-lg border border-dashed border-border p-8 text-center">
                <Icon name="EnvelopeIcon" size={40} className="mx-auto mb-2" />
                <p className="text-text-secondary">{isArabic ? 'لا توجد دعوات' : 'No invitations'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex flex-col items-start justify-between gap-3 rounded-lg border border-border bg-card p-4 md:flex-row md:items-center"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-primary/10 rounded px-2 py-1 text-xs font-semibold text-primary">
                          {templateInfo.name}
                        </span>
                        <span className="text-xs text-text-secondary">
                          {new Date(inv.created_at).toLocaleDateString(locale)}
                        </span>
                      </div>
                      {inv.shareable_link && (
                        <div className="mt-2 flex items-center gap-2">
                          <code className="rounded bg-muted px-2 py-1 text-xs">{inv.shareable_link}</code>
                          <button
                            onClick={() => handleCopyLink(getInvitationUrl(inv.shareable_link!))}
                            className="text-xs text-primary hover:underline"
                          >
                            {copiedLink === getInvitationUrl(inv.shareable_link)
                              ? isArabic
                                ? '✓ تم'
                                : '✓ Copied'
                              : isArabic
                                ? 'نسخ'
                                : 'Copy'}
                          </button>
                        </div>
                      )}
                      <div className="mt-2 text-xs text-text-secondary">
                        {isArabic ? 'المشاهدات' : 'Views'}: {inv.view_count}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!inv.shareable_link ? (
                        <button
                          onClick={() => handleGenerateShareLink(inv.id)}
                          className="bg-primary/10 hover:bg-primary/20 inline-flex gap-1 rounded px-3 py-2 text-xs text-primary"
                        >
                          <Icon name="LinkIcon" size={14} />
                          {isArabic ? 'رابط' : 'Link'}
                        </button>
                      ) : (
                        <a
                          href={`/${locale}/invitations/${inv.shareable_link}`}
                          target="_blank"
                          className="bg-primary/10 hover:bg-primary/20 inline-flex gap-1 rounded px-3 py-2 text-xs text-primary"
                        >
                          <Icon name="EyeIcon" size={14} />
                          {isArabic ? 'معاينة' : 'Preview'}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
