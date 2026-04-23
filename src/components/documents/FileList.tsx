import { FileText, Download, Clock, Loader2 } from 'lucide-react'
import { DocumentFile } from '@/types/document'
import { formatFileSize, formatDate } from '@/lib/utils'
import { useDownloadDocument } from '@/hooks/useDocuments'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface FileListProps {
  documents: DocumentFile[]
  isLoading: boolean
  selectedDocumentId: string | null
  onSelectDocument: (id: string | null) => void
}

export function FileList({ documents, isLoading, selectedDocumentId, onSelectDocument }: FileListProps) {
  const download = useDownloadDocument()

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No documents yet</p>
        <p className="text-sm">Upload files to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {documents.map((doc) => (
        <div
          key={doc.id}
          onClick={() => onSelectDocument(doc.id === selectedDocumentId ? null : doc.id)}
          className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
            selectedDocumentId === doc.id
              ? 'border-primary bg-primary/5'
              : 'hover:bg-accent'
          }`}
        >
          <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{doc.name}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span>{formatFileSize(doc.size_bytes)}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(doc.created_at)}
              </span>
              <span>v{doc.version}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={(e) => {
              e.stopPropagation()
              download.mutate({ id: doc.id, filename: doc.name })
            }}
            disabled={download.isPending}
          >
            {download.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </div>
      ))}
    </div>
  )
}
