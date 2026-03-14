'use client'

import Icon from '@/components/ui/AppIcon'
import { useLocale } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

interface QRScannerViewportProps {
  onScanSuccess: (code: string) => Promise<ScanSubmissionResult>
  isActive: boolean
  exampleCode?: string | null
}

export interface ScanSubmissionResult {
  code?: string
  status: 'success' | 'error' | 'duplicate'
  message: string
  guestName?: string
}

interface ScanResult {
  code: string
  timestamp: string
  status: 'success' | 'error' | 'duplicate'
  message: string
  guestName?: string
}

const QRScannerViewport = ({ onScanSuccess, isActive, exampleCode }: QRScannerViewportProps) => {
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const [isHydrated, setIsHydrated] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null)
  const [showManualInput, setShowManualInput] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const lastDetectedAtRef = useRef(0)
  const isMountedRef = useRef(true)

  useEffect(() => {
    setIsHydrated(true)
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!isHydrated || !isActive) return

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setIsCameraActive(true)
        }
      } catch (error) {
        console.error('Camera access denied:', error)
        setShowManualInput(true)
      }
    }

    startCamera()

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [isHydrated, isActive])

  useEffect(() => {
    if (!isHydrated || !isActive || !isCameraActive || !videoRef.current) return

    const BarcodeDetectorCtor = (window as any).BarcodeDetector
    if (!BarcodeDetectorCtor) {
      return
    }

    let rafId: number | null = null
    let cancelled = false
    const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] })

    const scanLoop = async () => {
      if (cancelled || !videoRef.current) return

      const now = Date.now()
      const video = videoRef.current

      if (video.readyState >= 2 && !isSubmitting && now - lastDetectedAtRef.current > 2500) {
        try {
          const detections = await detector.detect(video)
          const rawValue = detections?.[0]?.rawValue?.trim?.() || ''
          if (rawValue) {
            lastDetectedAtRef.current = Date.now()
            await submitCode(rawValue)
          }
        } catch (error) {
          // Ignore per-frame detection errors and continue scanning.
          void error
        }
      }

      if (!cancelled) {
        rafId = window.requestAnimationFrame(() => {
          void scanLoop()
        })
      }
    }

    rafId = window.requestAnimationFrame(() => {
      void scanLoop()
    })

    return () => {
      cancelled = true
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId)
      }
    }
  }, [isHydrated, isActive, isCameraActive, isSubmitting])

  const buildScanResult = (code: string, result: ScanSubmissionResult): ScanResult => ({
    code: result.code || code,
    timestamp: new Date().toLocaleTimeString(isArabic ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
    status: result.status,
    message: result.message,
    guestName: result.guestName,
  })

  const submitCode = async (code: string) => {
    if (!code.trim()) return

    setIsSubmitting(true)
    try {
      const result = await onScanSuccess(code.trim())
      if (isMountedRef.current) {
        setLastScanResult(buildScanResult(code.trim(), result))
      }
      setManualCode('')
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false)
      }
    }
  }

  const simulateScan = async () => {
    if (!exampleCode) {
      setLastScanResult(
        buildScanResult('N/A', {
          status: 'error',
          message: isArabic
            ? 'لا يوجد رمز متاح للاختبار في هذه الفعالية'
            : 'No available guest QR code to test for this event',
        })
      )
      return
    }

    await submitCode(exampleCode)
  }

  const getStatusColor = (status: ScanResult['status']) => {
    const colors = {
      success: 'bg-success/10 text-success border-success',
      error: 'bg-error/10 text-error border-error',
      duplicate: 'bg-warning/10 text-warning border-warning',
    }
    return colors[status]
  }

  if (!isHydrated) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-lg bg-card p-8 shadow-warm-md">
        <div className="flex animate-pulse flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg bg-card shadow-warm-md">
      <div className="border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-md p-2">
              <Icon name="QrCodeIcon" size={24} className="text-primary" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-semibold text-text-primary">
                {isArabic ? 'ماسح الرمز السريع' : 'QR Code Scanner'}
              </h2>
              <p className="text-sm text-text-secondary">
                {isArabic ? 'امسح رموز دعوات الضيوف لتسجيل الحضور' : 'Scan guest invitation codes for check-in'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="transition-smooth hover:bg-muted/80 flex items-center gap-2 rounded-md bg-muted px-4 py-2 text-text-primary"
              aria-label={isArabic ? 'تبديل الإدخال اليدوي' : 'Toggle manual input'}
            >
              <Icon name="PencilSquareIcon" size={20} />
              <span className="hidden text-sm font-medium md:inline">{isArabic ? 'إدخال يدوي' : 'Manual Entry'}</span>
            </button>
            <button
              onClick={simulateScan}
              className="transition-smooth hover:bg-primary/90 flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground"
              aria-label={isArabic ? 'محاكاة مسح' : 'Simulate scan'}
            >
              <Icon name="BoltIcon" size={20} />
              <span className="hidden text-sm font-medium md:inline">{isArabic ? 'اختبار المسح' : 'Test Scan'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="relative overflow-hidden rounded-lg bg-muted" style={{ height: '400px' }}>
          {isCameraActive ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
                aria-label={isArabic ? 'كاميرا ماسح الرمز السريع' : 'QR code scanner camera feed'}
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-64 w-64 rounded-lg border-4 border-primary shadow-warm-lg">
                  <div className="absolute left-0 top-0 h-8 w-8 rounded-tl-lg border-l-4 border-t-4 border-accent" />
                  <div className="absolute right-0 top-0 h-8 w-8 rounded-tr-lg border-r-4 border-t-4 border-accent" />
                  <div className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-lg border-b-4 border-l-4 border-accent" />
                  <div className="absolute bottom-0 right-0 h-8 w-8 rounded-br-lg border-b-4 border-r-4 border-accent" />
                </div>
              </div>
              <div className="bg-card/90 absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-4 py-2 backdrop-blur-sm">
                <p className="text-sm font-medium text-text-primary">
                  {isArabic ? 'ضع الرمز السريع داخل الإطار' : 'Position QR code within frame'}
                </p>
                <p className="mt-1 text-center text-xs text-text-secondary">
                  {isArabic ? 'سيتم التحقق تلقائياً عند قراءة الرمز' : 'Auto check-in runs when a QR code is detected'}
                </p>
              </div>
            </>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-4">
              <Icon name="CameraIcon" size={64} className="text-text-secondary" />
              <p className="text-text-secondary">{isArabic ? 'جارٍ تشغيل الكاميرا...' : 'Camera initializing...'}</p>
              <button onClick={() => setShowManualInput(true)} className="text-sm text-primary hover:underline">
                {isArabic ? 'استخدام الإدخال اليدوي بدلاً' : 'Use manual entry instead'}
              </button>
            </div>
          )}
        </div>

        {showManualInput && (
          <div className="mt-4 animate-slide-up rounded-lg bg-muted p-4">
            <label htmlFor="manualCode" className="mb-2 block text-sm font-medium text-text-primary">
              {isArabic ? 'أدخل الرمز السريع يدويًا' : 'Enter QR Code Manually'}
            </label>
            <div className="flex gap-2">
              <input
                id="manualCode"
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void submitCode(manualCode)}
                placeholder={isArabic ? 'أدخل رمز QR الفعلي' : 'Enter the real guest QR token'}
                className="flex-1 rounded-md border border-input bg-card px-4 py-2 text-text-primary focus:outline-none focus:ring-3 focus:ring-ring"
              />
              <button
                onClick={() => void submitCode(manualCode)}
                disabled={!manualCode.trim() || isSubmitting}
                className="transition-smooth hover:bg-primary/90 rounded-md bg-primary px-6 py-2 text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (isArabic ? 'جارٍ المعالجة...' : 'Processing...') : isArabic ? 'إرسال' : 'Submit'}
              </button>
            </div>
          </div>
        )}

        {lastScanResult && (
          <div className={`mt-4 animate-slide-up rounded-lg border-2 p-4 ${getStatusColor(lastScanResult.status)}`}>
            <div className="flex items-start gap-3">
              <Icon
                name={
                  lastScanResult.status === 'success'
                    ? 'CheckCircleIcon'
                    : lastScanResult.status === 'duplicate'
                      ? 'ExclamationTriangleIcon'
                      : 'XCircleIcon'
                }
                size={24}
                className="flex-shrink-0"
              />
              <div className="flex-1">
                <p className="mb-1 font-semibold">{lastScanResult.message}</p>
                {lastScanResult.guestName && (
                  <p className="text-sm opacity-90">
                    {isArabic ? 'الضيف:' : 'Guest:'} {lastScanResult.guestName}
                  </p>
                )}
                <p className="mt-1 text-xs opacity-75">
                  {isArabic ? 'الرمز:' : 'Code:'} {lastScanResult.code} • {lastScanResult.timestamp}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default QRScannerViewport
