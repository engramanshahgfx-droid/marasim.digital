'use client'

import { useEffect, useRef, useState } from 'react'
import type { Html5Qrcode as Html5QrcodeType } from 'html5-qrcode'

interface ScannerProps {
  onScan: (token: string) => void
  isActive: boolean
}

/**
 * Camera-based QR scanner powered by html5-qrcode.
 * Loaded only on the client via dynamic import (no SSR).
 */
export default function QRCameraScanner({ onScan, isActive }: ScannerProps) {
  const scannerRef = useRef<Html5QrcodeType | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isActive) return

    let mounted = true

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        const scanner = new Html5Qrcode('qr-camera-feed')
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 260, height: 260 } },
          (decodedText) => {
            if (mounted) onScan(decodedText)
          },
          () => {
            // Quiet errors — frames without QR codes are expected
          }
        )
      } catch (err) {
        if (mounted) {
          const message = err instanceof Error ? err.message : String(err)
          setError(message.includes('permission') ? 'Camera permission denied' : 'Could not start camera')
        }
      }
    }

    startScanner()

    return () => {
      mounted = false
      scannerRef.current
        ?.stop()
        .then(() => scannerRef.current?.clear())
        .catch(() => {})
      scannerRef.current = null
    }
  }, [isActive, onScan])

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-sm text-red-600">
        {error}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-black">
      {/* html5-qrcode mounts the video feed into this div */}
      <div id="qr-camera-feed" className="w-full" />
    </div>
  )
}
