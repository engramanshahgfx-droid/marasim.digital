'use client'

import { useState } from 'react'

interface ColorPickerProps {
  label: string
  value: string
  onChange: (value: string) => void
  presetColors?: string[]
}

export default function ColorPicker({
  label,
  value,
  onChange,
  presetColors = [
    '#1a1a2e',
    '#ffd700',
    '#667eea',
    '#764ba2',
    '#ff6b6b',
    '#4ecdc4',
    '#000000',
    '#ffffff',
    '#003366',
    '#0066cc',
  ],
}: ColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {/* Color Input Area */}
      <div className="flex items-center gap-2">
        {/* Color Preview Box */}
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="h-12 w-12 rounded-lg border-2 border-gray-300 transition-all hover:border-gray-400"
          style={{ backgroundColor: value }}
          title={value}
        />

        {/* Hex Input */}
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const val = e.target.value
            if (val.match(/^#[0-9A-Fa-f]{6}$/)) {
              onChange(val)
            }
          }}
          placeholder="#000000"
          className="flex-1 rounded border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Preset Colors */}
      {showPicker && (
        <div className="grid grid-cols-5 gap-2 rounded-lg bg-gray-50 p-3">
          {presetColors.map((color) => (
            <button
              key={color}
              onClick={() => {
                onChange(color)
                setShowPicker(false)
              }}
              className={`h-8 w-full rounded border-2 transition-all ${
                value === color ? 'border-gray-800' : 'border-gray-200 hover:border-gray-400'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      )}

      {/* Color Name Display */}
      <p className="text-xs text-gray-500">{value}</p>
    </div>
  )
}
