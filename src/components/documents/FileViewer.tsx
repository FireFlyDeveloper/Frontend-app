import { useEffect, useRef, useState } from 'react'
import mammoth from 'mammoth'
import { X, Download, Loader2, FileText, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import api from '@/api/client'

interface FileViewerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: { id: string; name: string; mime_type: string } | null
}

function isPdf(mime: string) {
  return mime === 'application/pdf'
}

function isImage(mime: string) {
  return mime.startsWith('image/')
}

function isDocx(mime: string) {
  return (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mime === 'application/msword'
  )
}

export function FileViewer({ open, onOpenChange, document: doc }: FileViewerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [docxHtml, setDocxHtml] = useState<string | null>(null)
  const blobUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (!open || !doc) {
      // Cleanup on close
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
      setBlobUrl(null)
      setDocxHtml(null)
      setError(null)
      setLoading(false)
      return
    }

    let cancelled = false

    const loadFile = async () => {
      setLoading(true)
      setError(null)
      setBlobUrl(null)
      setDocxHtml(null)

      try {
        const response = await api.get(`/documents/${doc.id}/download`, {
          responseType: 'blob',
        })
        const blob = response.data as Blob

        if (cancelled) return

        if (isPdf(doc.mime_type) || isImage(doc.mime_type)) {
          const url = URL.createObjectURL(blob)
          blobUrlRef.current = url
          setBlobUrl(url)
        } else if (isDocx(doc.mime_type)) {
          const arrayBuffer = await blob.arrayBuffer()
          if (cancelled) return
          const result = await mammoth.convertToHtml({ arrayBuffer })
          if (cancelled) return
          setDocxHtml(result.value)
        } else {
          setError('Preview not available for this file type. Please download the file to view it.')
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load file. Please try again.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadFile()

    return () => {
      cancelled = true
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
    }
  }, [open, doc?.id])

  const handleDownload = async () => {
    if (!doc) return
    try {
      const response = await api.get(`/documents/${doc.id}/download`, {
        responseType: 'blob',
      })
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = doc.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Failed to download file.')
    }
  }

  if (!open || !doc) return null

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0 bg-card">
        <h2 className="text-base font-semibold truncate max-w-[70%]">
          {doc.name}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-muted/30 flex items-center justify-center">
        {loading && (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Loading preview...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-3 text-muted-foreground max-w-md px-6 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download File
            </Button>
          </div>
        )}

        {!loading && !error && blobUrl && isPdf(doc.mime_type) && (
          <iframe
            src={blobUrl}
            title={doc.name}
            className="w-full h-full border-0"
          />
        )}

        {!loading && !error && blobUrl && isImage(doc.mime_type) && (
          <img
            src={blobUrl}
            alt={doc.name}
            className="max-w-full max-h-full object-contain"
          />
        )}

        {!loading && !error && docxHtml && (
          <div
            className="w-full h-full overflow-auto bg-white p-8 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: docxHtml }}
          />
        )}

        {!loading && !error && !blobUrl && !docxHtml && (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <FileText className="h-10 w-10 opacity-50" />
            <p className="text-sm">No preview available</p>
          </div>
        )}
      </div>
    </div>
  )
}
