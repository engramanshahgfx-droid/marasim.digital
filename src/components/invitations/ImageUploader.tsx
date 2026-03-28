'use client'

import Image from 'next/image'
import { useState } from 'react'

interface ImageUploaderProps {
  label: string
  value?: string
  onChange: (url: string) => void
  type: 'banner' | 'logo' | 'gallery'
  isLoading?: boolean
  error?: string
}

export default function ImageUploader({ label, value, onChange, type, isLoading = false, error }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(value || null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelect = async (file: File) => {
    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setPreview(result)

      // TODO: Upload to Supabase Storage
      // For now, we'll just use the data URL
      onChange(result)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        className={`relative rounded-lg border-2 border-dashed transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-8">
          {preview ? (
            // Show Preview
            <div className="relative h-32 w-full">
              <Image src={preview} alt="Preview" fill className="rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => {
                  setPreview(null)
                  onChange('')
                }}
                className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>

              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">Drag and drop your image here</p>
                <p className="text-xs text-gray-500">or click to browse</p>
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0])
                  }
                }}
                disabled={isLoading}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </>
          )}
        </div>
      </div>

      {/* File Info */}
      <div className="text-xs text-gray-500">
        <p>Supported formats: JPG, PNG, GIF</p>
        <p>Max size: 5MB</p>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {isLoading && <p className="text-xs text-blue-500">Uploading...</p>}
    </div>
  )
}
