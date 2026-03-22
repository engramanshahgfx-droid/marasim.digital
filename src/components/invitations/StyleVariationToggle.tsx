'use client'

import { StyleVariation } from '@/types/invitations'

interface StyleVariationToggleProps {
  value: StyleVariation
  onChange: (value: StyleVariation) => void
  available: StyleVariation[]
  label?: string
}

const STYLE_LABELS: Record<StyleVariation, { name: string; description: string; icon: string }> = {
  light: {
    name: 'Light',
    description: 'Bright and clean aesthetic',
    icon: '☀️',
  },
  dark: {
    name: 'Dark',
    description: 'Elegant dark theme',
    icon: '🌙',
  },
  classic: {
    name: 'Classic',
    description: 'Traditional timeless look',
    icon: '🎩',
  },
  modern: {
    name: 'Modern',
    description: 'Contemporary style',
    icon: '✨',
  },
}

export default function StyleVariationToggle({
  value,
  onChange,
  available,
  label = 'Style Variation',
}: StyleVariationToggleProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      <div className="flex flex-wrap gap-2">
        {available.map((style) => {
          const isActive = value === style
          const styleInfo = STYLE_LABELS[style]

          return (
            <button
              key={style}
              onClick={() => onChange(style)}
              className={`flex flex-col items-center gap-1 rounded-lg border-2 px-4 py-3 transition-all ${
                isActive ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <span className="text-xl">{styleInfo.icon}</span>
              <span className="text-sm font-medium text-gray-800">{styleInfo.name}</span>
              <span className="text-xs text-gray-500">{styleInfo.description}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
