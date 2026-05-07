import { useEffect, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { documentsApi } from '@/api/documents'

interface OnlyOfficeEditorProps {
  docId: string
  docName: string
  onClose: () => void
}

export function OnlyOfficeEditor({ docId, docName, onClose }: OnlyOfficeEditorProps) {
  const [config, setConfig] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    documentsApi.getOnlyOfficeConfig(docId)
      .then(setConfig)
      .catch((err) => setError(err?.message || 'Failed to initialize editor'))
  }, [docId])

  useEffect(() => {
    if (!config) return

    // Give the DOM time to mount the container
    const timer = setTimeout(() => {
      const container = document.getElementById('onlyoffice-editor')
      if (!container || !(window as any).DocsAPI) {
        // DocsAPI not loaded — load it dynamically
        const script = document.createElement('script')
        script.src = `${new URL(config.docService.url).origin}/web-apps/apps/api/documents/api.js`
        script.async = true
        document.body.appendChild(script)
        script.onload = () => initEditor()
        return
      }
      initEditor()
    }, 100)

    function initEditor() {
      const container = document.getElementById('onlyoffice-editor')
      if (!container || !(window as any).DocsAPI) {
        setError('ONLYOFFICE editor could not be loaded')
        return
      }
      try {
        new (window as any).DocsAPI.DocEditor('onlyoffice-editor', config)
      } catch (err: any) {
        setError(err?.message || 'Failed to initialize editor')
      }
    }

    return () => clearTimeout(timer)
  }, [config])

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card shrink-0">
        <h2 className="text-sm font-medium truncate">{docName}</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4 mr-1" />
          Close Editor
        </Button>
      </div>
      {/* Editor area */}
      <div className="flex-1 relative">
        {config ? (
          <div id="onlyoffice-editor" className="w-full h-full" />
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p className="text-lg font-medium mb-2">Editor Error</p>
            <p className="text-sm">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={onClose}>
              Go Back
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>Loading editor...</p>
          </div>
        )}
      </div>
    </div>
  )
}
