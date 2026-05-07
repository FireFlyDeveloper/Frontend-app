import { useState, useRef, useEffect, useCallback } from 'react'
import { Scan, Camera, CameraOff, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface BarcodeScannerProps {
  onScan: (code: string) => void
  isLoading?: boolean
  placeholder?: string
}

export function BarcodeScanner({ onScan, isLoading, placeholder = 'Scan or enter barcode/QR...' }: BarcodeScannerProps) {
  const [code, setCode] = useState('')
  const [showCamera, setShowCamera] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [detecting, setDetecting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectionTimerRef = useRef<number | null>(null)

  const stopCamera = useCallback(() => {
    if (detectionTimerRef.current) {
      clearInterval(detectionTimerRef.current)
      detectionTimerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setShowCamera(false)
    setDetecting(false)
  }, [])

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (detectionTimerRef.current) clearInterval(detectionTimerRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const startCamera = async () => {
    setCameraError(null)
    setDetecting(false)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      setShowCamera(true)

      // Wait for next render so videoRef is attached
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().then(() => startDetection()).catch(() => setCameraError('Failed to play video'))
        }
      }, 100)
    } catch (err: any) {
      console.error('Camera access error:', err)
      setCameraError(err?.message || 'Could not access camera')
    }
  }

  const startDetection = () => {
    // Check if BarcodeDetector API is available
    const BarcodeDetectorApi = (window as any).BarcodeDetector
    if (!BarcodeDetectorApi) {
      // Fallback: BarcodeDetector not available in this browser.
      // The user can type the code manually in the text input.
      setDetecting(false)
      return
    }

    setDetecting(true)

    // Try to create detector with supported formats
    const barcodeDetector = new BarcodeDetectorApi({
      formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'data_matrix', 'pdf417', 'aztec', 'codabar', 'itf', 'code_93'],
    })

    detectionTimerRef.current = window.setInterval(async () => {
      if (!videoRef.current || !streamRef.current) return
      if (videoRef.current.readyState < 2) return // not enough data

      try {
        const barcodes = await barcodeDetector.detect(videoRef.current)
        if (barcodes.length > 0) {
          const detectedCode = barcodes[0].rawValue
          if (detectedCode && detectedCode.trim()) {
            stopCamera()
            onScan(detectedCode.trim())
          }
        }
      } catch (err) {
        // Detection error — often temporary, keep trying
        console.debug('Detection error:', err)
      }
    }, 500)
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

      {/* Camera overlay */}
      {showCamera && (
        <div className="relative mt-2 rounded-lg overflow-hidden border border-border bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-48 sm:h-64 object-cover"
          />
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
                {detecting ? 'Detecting...' : cameraError ? 'Camera error' : (window as any).BarcodeDetector ? 'Camera ready' : 'Auto-scan unavailable — type code below'}
              </span>
              <div className="flex gap-2">
                {(window as any).BarcodeDetector && !detecting && !cameraError && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="text-xs h-6"
                    onClick={startDetection}
                  >
                    Start Detection
                  </Button>
                )}
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
