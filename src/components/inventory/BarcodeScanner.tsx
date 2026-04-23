import { useState, useRef } from 'react'
import { Scan, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface BarcodeScannerProps {
  onScan: (code: string) => void
  isLoading?: boolean
  placeholder?: string
}

export function BarcodeScanner({ onScan, isLoading, placeholder = 'Scan or enter barcode/QR...' }: BarcodeScannerProps) {
  const [code, setCode] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || isLoading) return
    onScan(code.trim())
    setCode('')
    inputRef.current?.focus()
  }

  return (
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
    </form>
  )
}
