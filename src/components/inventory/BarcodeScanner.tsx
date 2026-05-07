import { useState, useRef, useEffect, useCallback } from 'react'
import { Scan, Camera, CameraOff, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Html5Qrcode } from 'html5-qrcode'

interface BarcodeScannerProps {
  onScan: (code: string) => void
  isLoading?: boolean
  placeholder?: string
}

const SCANNER_ID = 'hermes-qr-scanner'

export function BarcodeScanner({ onScan, isLoading, placeholder = 'Scan or enter barcode/QR...' }: BarcodeScannerProps) {
  const [code, setCode] = useState('')
  const [showCamera, setShowCamera] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  const stopCamera = useCallback(async () => {
    setScanning(false)
    setShowCamera(false)
    setCameraError(null)
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
      } catch {
        // already stopped
      }
      scannerRef.current.clear()
      scannerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        try { scannerRef.current.stop() } catch { /* ignore */ }
        scannerRef.current.clear()
        scannerRef.current = null
      }
    }
  }, [])

  const startCamera = async () => {
    setCameraError(null)
    setScanning(false)

    // Ensure the scanner div exists
    const existingEl = document.getElementById(SCANNER_ID)
    if (!existingEl) {
      const div = document.createElement('div')
      div.id = SCANNER_ID
      div.style.display = 'none'
      document.body.appendChild(div)
    }

    const scanner = new Html5Qrcode(SCANNER_ID)
    scannerRef.current = scanner

    try {
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // On success — auto-stop and fire callback
          stopCamera()
          onScan(decodedText.trim())
        },
        () => {
          // On failure to decode a frame — keep trying
        }
      )
      setScanning(true)
      setShowCamera(true)
    } catch (err: any) {
      console.error('Camera error:', err)
      setCameraError(err?.message || 'Could not access camera')
      scannerRef.current = null
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || isLoading) return
    onScan(code.trim())
    setCode('')
    inputRef.current?.focus()
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Scan className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={placeholder}
            className="pl-9"
            disabled={isLoading}
          />
        </div>
        <Button type="submit" disabled={isLoading || !code.trim()} size="sm">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Scan'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={showCamera ? stopCamera : startCamera}
          disabled={isLoading}
        >
          {showCamera ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
        </Button>
      </form>

      {/* Camera viewfinder */}
      {showCamera && (
        <div className="relative mt-2 rounded-lg overflow-hidden border border-border bg-black" style={{ minHeight: 240 }}>
          <div id={SCANNER_ID} className="w-full" style={{ minHeight: 240 }} />
          {/* Scanning overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-40 h-40 sm:w-48 sm:h-48 border-2 border-primary/60 rounded-lg">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-0.5 bg-primary/40 animate-pulse" />
            </div>
          </div>
          {/* Status bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white">
                {scanning ? 'Scanning...' : cameraError ? 'Camera error' : 'Starting camera...'}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="text-xs h-6"
                onClick={stopCamera}
              >
                Close
              </Button>
            </div>
            {cameraError && (
              <p className="text-xs text-red-300 mt-1">{cameraError}</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
