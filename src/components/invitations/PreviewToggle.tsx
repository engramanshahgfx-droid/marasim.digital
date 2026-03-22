'use client'

import { PreviewType, DeviceType } from '@/types/invitations'

interface PreviewToggleProps {
  viewType: PreviewType
  deviceType: DeviceType
  onViewTypeChange: (type: PreviewType) => void
  onDeviceTypeChange: (type: DeviceType) => void
  zoom: number
  onZoomChange: (zoom: number) => void
}

export default function PreviewToggle({
  viewType,
  deviceType,
  onViewTypeChange,
  onDeviceTypeChange,
  zoom,
  onZoomChange,
}: PreviewToggleProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow-sm">
      {/* View Type Toggle */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase text-gray-600">View</p>
        <div className="flex gap-2">
          <button
            onClick={() => onViewTypeChange('card')}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              viewType === 'card'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📄 Card
          </button>
          <button
            onClick={() => onViewTypeChange('fullPage')}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              viewType === 'fullPage'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📖 Page
          </button>
        </div>
      </div>

      {/* Device Type Toggle */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase text-gray-600">Device</p>
        <div className="flex gap-2">
          <button
            onClick={() => onDeviceTypeChange('mobile')}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              deviceType === 'mobile'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📱 Mobile
          </button>
          <button
            onClick={() => onDeviceTypeChange('desktop')}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              deviceType === 'desktop'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🖥️ Desktop
          </button>
        </div>
      </div>

      {/* Zoom Control */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase text-gray-600">Zoom: {zoom}%</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onZoomChange(Math.max(50, zoom - 10))}
            className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-700 hover:bg-gray-200"
          >
            −
          </button>

          <input
            type="range"
            min="50"
            max="200"
            step="10"
            value={zoom}
            onChange={(e) => onZoomChange(parseInt(e.target.value))}
            className="flex-1"
          />

          <button
            onClick={() => onZoomChange(Math.min(200, zoom + 10))}
            className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-700 hover:bg-gray-200"
          >
            +
          </button>
        </div>

        {/* Preset Zoom Buttons */}
        <div className="grid grid-cols-4 gap-1">
          {[50, 75, 100, 125].map((preset) => (
            <button
              key={preset}
              onClick={() => onZoomChange(preset)}
              className={`rounded px-2 py-1 text-xs font-medium transition-all ${
                zoom === preset
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {preset}%
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
