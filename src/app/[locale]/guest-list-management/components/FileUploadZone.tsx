'use client'

import Icon from '@/components/ui/AppIcon'
import { useLocale } from 'next-intl'
import { useRef, useState } from 'react'

interface FileUploadZoneProps {
  onFileUpload: (file: File) => void
  isLoading?: boolean
  disabled?: boolean
}

const FileUploadZone = ({ onFileUpload, isLoading = false, disabled = false }: FileUploadZoneProps) => {
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const [isDragging, setIsDragging] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadMessage, setUploadMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled || isLoading) return
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    if (disabled || isLoading) return
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      processFile(file)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const processFile = (file: File) => {
    // Only accept CSV files
    if (!file.type.includes('text') && file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setUploadStatus('error')
      setUploadMessage(
        isArabic
          ? 'يرجى رفع ملف CSV. إذا كان لديك ملف Excel فقم بتصديره كملف CSV أولاً.'
          : 'Please upload a CSV file. If you have an Excel file, export it as CSV first.'
      )
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadStatus('error')
      setUploadMessage(
        isArabic
          ? 'حجم الملف يتجاوز 10MB. يرجى رفع ملف أصغر.'
          : 'File size exceeds 10MB limit. Please upload a smaller file.'
      )
      return
    }

    setUploadStatus('uploading')
    setUploadMessage(isArabic ? 'جارٍ معالجة الملف...' : 'Processing file...')
    onFileUpload(file)
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`transition-smooth relative rounded-md border-2 border-dashed p-8 ${
          disabled
            ? 'bg-muted/30 cursor-not-allowed border-border opacity-50'
            : isDragging
              ? 'bg-primary/5 border-primary'
              : isLoading || uploadStatus === 'uploading'
                ? 'bg-primary/5 border-primary'
                : uploadStatus === 'error'
                  ? 'bg-destructive/5 border-destructive'
                  : uploadStatus === 'success'
                    ? 'bg-success/5 border-success'
                    : 'bg-muted/30 border-border'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
          aria-label={isArabic ? 'رفع ملف CSV لقائمة الضيوف' : 'Upload guest list CSV file'}
          disabled={disabled || isLoading}
        />

        <div className="flex flex-col items-center gap-4">
          {isLoading || uploadStatus === 'uploading' ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm font-medium text-text-primary">
                {isLoading ? (isArabic ? 'جارٍ الرفع...' : 'Uploading...') : uploadMessage}
              </p>
            </div>
          ) : uploadStatus === 'success' ? (
            <div className="flex flex-col items-center gap-3">
              <div className="bg-success/10 flex h-12 w-12 items-center justify-center rounded-full">
                <Icon name="CheckCircleIcon" size={32} className="text-success" />
              </div>
              <p className="text-center text-sm font-medium text-text-primary">{uploadMessage}</p>
            </div>
          ) : uploadStatus === 'error' ? (
            <div className="flex flex-col items-center gap-3">
              <div className="bg-destructive/10 flex h-12 w-12 items-center justify-center rounded-full">
                <Icon name="XCircleIcon" size={32} className="text-destructive" />
              </div>
              <p className="text-center text-sm font-medium text-destructive">{uploadMessage}</p>
            </div>
          ) : (
            <>
              <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
                <Icon name="CloudArrowUpIcon" size={32} className="text-primary" />
              </div>
              <div className="text-center">
                <p className="mb-1 text-base font-medium text-text-primary">
                  {disabled
                    ? isArabic
                      ? 'اختر فعالية لرفع الضيوف'
                      : 'Select an event to upload guests'
                    : isArabic
                      ? 'اسحب وأفلت ملف CSV هنا'
                      : 'Drag and drop your CSV file here'}
                </p>
                <p className="text-sm text-text-secondary">{isArabic ? 'أو' : 'or'}</p>
              </div>
              <button
                onClick={handleBrowseClick}
                disabled={disabled || isLoading}
                className="transition-smooth hover:bg-primary/90 active:scale-97 rounded-md bg-primary px-6 py-2.5 font-medium text-primary-foreground focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {disabled
                  ? isArabic
                    ? 'اختر الفعالية أولاً'
                    : 'Select Event First'
                  : isArabic
                    ? 'استعراض الملفات'
                    : 'Browse Files'}
              </button>
              <p className="text-center text-xs text-text-secondary">
                {isArabic
                  ? 'الصيغة المدعومة: CSV فقط • الحد الأقصى لحجم الملف: 10MB'
                  : 'Supported format: CSV only • Maximum file size: 10MB'}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default FileUploadZone
