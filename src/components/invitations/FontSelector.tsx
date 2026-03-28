'use client'

import { FontFamily } from '@/types/invitations'
import { useTranslations } from 'next-intl'

interface FontSelectorProps {
  value: FontFamily
  onChange: (value: FontFamily) => void
  label?: string
}

const FONT_OPTIONS: Array<{
  id: FontFamily
  name: string
  name_ar: string
  example: string
  description: string
  description_ar: string
}> = [
  {
    id: 'serif',
    name: 'Serif',
    name_ar: 'خطوط عريضة',
    example: 'Georgia, Garamond',
    description: 'Formal and elegant, perfect for weddings',
    description_ar: 'رسمي وأنيق، مثالي للأعراس',
  },
  {
    id: 'sans-serif',
    name: 'Sans-Serif',
    name_ar: 'خطوط بسيطة',
    example: 'Inter, Helvetica',
    description: 'Modern and clean, for contemporary events',
    description_ar: 'حديث ونظيف، للفعاليات المعاصرة',
  },
  {
    id: 'script',
    name: 'Script',
    name_ar: 'خطوط مزخرفة',
    example: 'Playfair Display',
    description: 'Decorative and playful, for celebrations',
    description_ar: 'مزخرف ومرح، للاحتفالات',
  },
]

export default function FontSelector({ value, onChange, label = 'Font Style' }: FontSelectorProps) {
  const t = useTranslations()

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      <div className="space-y-2">
        {FONT_OPTIONS.map((font) => (
          <label
            key={font.id}
            className="flex cursor-pointer items-start gap-3 rounded-lg border-2 border-gray-200 p-3 transition-all hover:border-blue-400"
          >
            <input
              type="radio"
              name="font-family"
              value={font.id}
              checked={value === font.id}
              onChange={(e) => onChange(e.target.value as FontFamily)}
              className="mt-1 h-4 w-4 cursor-pointer"
            />

            <div className="flex-1">
              <div className="font-semibold text-gray-800">{font.name}</div>
              <div className="text-xs text-gray-500">{font.example}</div>
              <div className="mt-1 text-sm text-gray-600">{font.description}</div>
            </div>

            {value === font.id && (
              <div className="mt-1 inline-block rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-600">
                Selected
              </div>
            )}
          </label>
        ))}
      </div>
    </div>
  )
}
