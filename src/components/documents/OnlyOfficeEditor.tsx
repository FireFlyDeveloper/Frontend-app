import { useEffect, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { DocumentEditor } from '@onlyoffice/document-editor-react'
import { Button } from '@/components/ui/button'
import { documentsApi } from '@/api/documents'

interface OnlyOfficeEditorProps {
  docId: string
  docName: string
  onClose: () => void
}

export function OnlyOfficeEditor({ docId, docName, onClose }: OnlyOfficeEditorProps) {
  const [config, setConfig] = useState<any>(null)
  const [documentServerUrl, setDocumentServerUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    documentsApi.getOnlyOfficeConfig(docId)
      .then((data) => {
        setConfig(data.config)
        setDocumentServerUrl(data.documentServerUrl)
      })
      .catch((err) => setError(err?.message || 'Failed to initialize editor'))
  }, [docId])

  function handleLoadComponentError(errorCode: number, errorDescription: string) {
    switch (errorCode) {
      case -1:
        setError(`Unknown error loading ONLYOFFICE: ${errorDescription}`)
        break
      case -2:
        setError(`Failed to load DocsAPI from server: ${errorDescription}`)
        break
      case -3:
        setError(`DocsAPI is not defined: ${errorDescription}`)
        break
      default:
        setError(errorDescription)
    }
  }

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
        {config && documentServerUrl ? (
          <DocumentEditor
            id="onlyoffice-editor"
            documentServerUrl={documentServerUrl}
            config={config}
            onLoadComponentError={handleLoadComponentError}
            height="100%"
            width="100%"
          />
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
