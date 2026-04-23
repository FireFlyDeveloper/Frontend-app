import { useState, useCallback } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUploadDocument } from '@/hooks/useDocuments'

interface FileUploadZoneProps {
  folderId: string | null
}

export function FileUploadZone({ folderId }: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const upload = useUploadDocument()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      if (!folderId) {
        return
      }

      const files = Array.from(e.dataTransfer.files)
      files.forEach((file) => {
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }))
        upload.mutate(
          {
            folderId,
            file,
            onProgress: (progress) => {
              setUploadProgress((prev) => ({ ...prev, [file.name]: progress }))
            },
          },
          {
            onSettled: () => {
              setUploadProgress((prev) => {
                const next = { ...prev }
                delete next[file.name]
                return next
              })
            },
          }
        )
      })
    },
    [folderId, upload]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!folderId || !e.target.files) return

      const files = Array.from(e.target.files)
      files.forEach((file) => {
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }))
        upload.mutate(
          {
            folderId,
            file,
            onProgress: (progress) => {
              setUploadProgress((prev) => ({ ...prev, [file.name]: progress }))
            },
          },
          {
            onSettled: () => {
              setUploadProgress((prev) => {
                const next = { ...prev }
                delete next[file.name]
                return next
              })
            },
          }
        )
      })
      e.target.value = ''
    },
    [folderId, upload]
  )

  const activeUploads = Object.entries(uploadProgress)

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-muted-foreground/50',
          !folderId && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          type="file"
          multiple
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileInput}
          disabled={!folderId || upload.isPending}
        />
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm font-medium">
          {folderId ? 'Drop files here or click to upload' : 'Select a folder first'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Supports any file type up to 100MB
        </p>
      </div>

      {activeUploads.length > 0 && (
        <div className="space-y-2">
          {activeUploads.map(([filename, progress]) => (
            <div key={filename} className="flex items-center gap-3 text-sm">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              <span className="flex-1 truncate">{filename}</span>
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-10 text-right">
                {progress}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
