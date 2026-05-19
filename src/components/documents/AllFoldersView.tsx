import { useState } from 'react'
import { Folder, FolderOpen, ChevronRight, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Folder as FolderType, DocumentFile } from '@/types/document'
import { formatFileSize, formatDate } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface AllFoldersViewProps {
  folders: FolderType[]
  documents: DocumentFile[]
  isLoading: boolean
  onSelectFolder: (id: string) => void
  onSelectDocument: (id: string) => void
  selectedFolderId: string | null
  selectedDocumentId: string | null
}

export function AllFoldersView({ 
  folders, 
  documents, 
  isLoading, 
  onSelectFolder, 
  onSelectDocument,
  selectedFolderId,
  selectedDocumentId
}: AllFoldersViewProps) {
  const rootFolders = folders.filter((f) => !f.parent_id)
  const rootDocuments = documents.filter((d) => !d.folder_id)

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Folders Section */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Folder className="h-5 w-5 text-primary" />
          All Folders
        </h3>
        {rootFolders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Folder className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No folders yet</p>
            <p className="text-xs">Create your first folder to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rootFolders.map((folder) => {
              const isSelected = selectedFolderId === folder.id
              const childFolders = folders.filter((f) => f.parent_id === folder.id).length
              const childDocuments = documents.filter((d) => d.folder_id === folder.id).length
              
              return (
                <div
                  key={folder.id}
                  onClick={() => onSelectFolder(folder.id)}
                  className={cn(
                    'rounded-lg border p-4 cursor-pointer transition-colors hover:bg-accent',
                    isSelected && 'border-primary bg-primary/5'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {isSelected ? (
                      <FolderOpen className="h-8 w-8 text-primary shrink-0 mt-0.5" />
                    ) : (
                      <Folder className="h-8 w-8 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{folder.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {childFolders} subfolders, {childDocuments} files
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created {formatDate(folder.created_at)}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Documents Section */}
      {rootDocuments.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Documents in Root
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rootDocuments.map((doc) => {
              const isSelected = selectedDocumentId === doc.id
              
              return (
                <div
                  key={doc.id}
                  onClick={() => onSelectDocument(doc.id)}
                  className={cn(
                    'rounded-lg border p-4 cursor-pointer transition-colors hover:bg-accent',
                    isSelected && 'border-primary bg-primary/5'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <FileText className="h-8 w-8 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatFileSize(doc.size_bytes)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Version {doc.version} • {formatDate(doc.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}