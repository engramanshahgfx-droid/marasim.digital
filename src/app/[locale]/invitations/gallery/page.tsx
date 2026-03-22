'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import TemplateGalleryView from '@/components/invitations/TemplateGalleryView'
import { TemplateStyle } from '@/types/invitations'

export default function TemplateGalleryPage() {
  const router = useRouter()
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateStyle>('elegant')

  const handleSelectTemplate = (templateId: TemplateStyle) => {
    setSelectedTemplate(templateId)
    // Optionally redirect to customization editor
    // router.push(`/[locale]/invitations/templates/${templateId}/customize`)
  }

  return (
    <main className="w-full">
      <TemplateGalleryView
        onSelectTemplate={handleSelectTemplate}
        selectedTemplate={selectedTemplate}
        viewMode="combined"
      />
    </main>
  )
}
