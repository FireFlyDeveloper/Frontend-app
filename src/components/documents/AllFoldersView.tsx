import { useState, useMemo } from 'react'
import { Folder, FolderOpen, ChevronRight, ChevronDown, FileText } from 'lucide-react'
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
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  
  // Memoized computations for performance
  const { rootFolders, rootDocuments, folderDocumentsMap, childFoldersMap } = useMemo(() => {
    const folderDocumentsMap = new Map<string, DocumentFile[]>()
    const childFoldersMap = new Map<string, FolderType[]>()
    
    // Build mappings
    documents.forEach(doc => {
      const folderId = doc.folder_id
      if (!folderDocumentsMap.has(folderId)) {
        folderDocumentsMap.set(folderId, [])
      }
      folderDocumentsMap.get(folderId)!.push(doc)
    })
    
    folders.forEach(folder => {
      const parentId = folder.parent_id
      if (parentId) {
        if (!childFoldersMap.has(parentId)) {
          childFoldersMap.set(parentId, [])
        }
        childFoldersMap.get(parentId)!.push(folder)
      }
    })
    
    const rootFolders = folders.filter((f) => !f.parent_id)
    const rootDocuments = documents.filter((d) => !d.folder_id)
    
    return { rootFolders, rootDocuments, folderDocumentsMap, childFoldersMap }
  }, [folders, documents])

  /**
   * Toggle expanded state for a folder
   * @param folderId - ID of folder to toggle
   */
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  /**
   * Get documents for a specific folder (from memoized map)
   * @param folderId - ID of folder to get documents for
   * @returns Array of documents in the folder
   */
  const getFolderDocuments = (folderId: string): DocumentFile[] => {
    return folderDocumentsMap.get(folderId) || []
  }

  /**
   * Get child folders for a specific folder (from memoized map)
   * @param folderId - ID of folder to get children for
   * @returns Array of child folders
   */
  const getChildFolders = (folderId: string): FolderType[] => {
    return childFoldersMap.get(folderId) || []
  }

  /**
   * Recursively render a folder and its contents
   * @param folder - Folder to render
   * @param level - Nesting level (0 for root)
   * @param visited - Set of visited folder IDs to prevent circular references
   * @returns JSX element for the folder
   */
  const renderFolder = (folder: FolderType, level: number = 0, visited: Set<string> = new Set()) => {
    // Prevent circular references
    if (visited.has(folder.id)) {
      console.warn(`Circular folder reference detected for folder ${folder.id} (${folder.name})`)
      return null
    }
    
    const nextVisited = new Set(visited)
    nextVisited.add(folder.id)
    
    const isExpanded = expandedFolders.has(folder.id)
    const isSelected = selectedFolderId === folder.id
    const folderDocuments = getFolderDocuments(folder.id)
    const childFolders = getChildFolders(folder.id)
    const hasContent = folderDocuments.length > 0 || childFolders.length > 0
    
    // Safety limit: don't render beyond 10 levels deep
    if (level > 10) {
      console.warn(`Folder hierarchy too deep for folder ${folder.id} (${folder.name}) at level ${level}`)
      return (
        <div className={`text-xs text-muted-foreground italic p-2 ml-${level * 4}`}>
          Hierarchy too deep to display
        </div>
      )
    }
    
    return (
      <div key={folder.id} className="space-y-2">
        {/* Folder header */}
        <div
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          aria-label={`${folder.name} folder, ${childFolders.length} subfolders, ${folderDocuments.length} files`}
          onClick={() => hasContent ? toggleFolder(folder.id) : onSelectFolder(folder.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              hasContent ? toggleFolder(folder.id) : onSelectFolder(folder.id)
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              // Basic keyboard navigation: prevent default but don't implement full navigation yet
              // Full arrow key navigation would require managing focus between multiple folder elements
              e.preventDefault()
            }
          }}
          className={cn(
            'flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            isSelected && 'bg-primary/5 border border-primary',
            level > 0 && `ml-${level * 4}`
          )}
        >
          {hasContent ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )
          ) : (
            <div className="w-4 h-4" /> // Spacer for alignment
          )}
          
          {isSelected ? (
            <FolderOpen className="h-5 w-5 text-primary shrink-0" />
          ) : (
            <Folder className="h-5 w-5 text-muted-foreground shrink-0" />
          )}
          
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{folder.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {childFolders.length} subfolder{childFolders.length !== 1 ? 's' : ''}, {folderDocuments.length} file{folderDocuments.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          {hasContent && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSelectFolder(folder.id)
              }}
              className="text-xs text-primary hover:underline px-2 py-1 rounded hover:bg-primary/10 transition-colors"
            >
              Open folder
            </button>
          )}
        </div>

        {/* Expanded content - automatically shows folder contents */}
        {isExpanded && hasContent && (
          <div className={`space-y-3 ml-${(level + 1) * 4}`}>
            {/* Subfolders */}
            {childFolders.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pl-2">
                  Subfolders
                </h5>
                {childFolders.map(childFolder => renderFolder(childFolder, level + 1, nextVisited))}
              </div>
            )}
            
            {/* Folder documents - automatically displayed */}
            {folderDocuments.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pl-2">
                  Files in this folder
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {folderDocuments.map(doc => {
                    const isDocSelected = selectedDocumentId === doc.id
                    return (
                      <div
                        key={doc.id}
                        onClick={() => onSelectDocument(doc.id)}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent',
                          isDocSelected && 'border-primary bg-primary/5'
                        )}
                      >
                        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>{formatFileSize(doc.size_bytes)}</span>
                            <span>•</span>
                            <span>Version {doc.version}</span>
                            <span>•</span>
                            <span>{formatDate(doc.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            
            {folderDocuments.length === 0 && childFolders.length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No files or subfolders in this folder</p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-2">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" />
          All Folders Directory
        </h3>
        <p className="text-sm text-muted-foreground">
          All accessible folders are automatically displayed. Click any folder to expand and view its contents.
        </p>
      </div>

      {/* Root documents section */}
      {rootDocuments.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-primary" />
            <h4 className="text-md font-semibold">Documents in Root</h4>
          </div>
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

      {/* Folders section - All folders automatically displayed with contents */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Folder className="h-4 w-4 text-primary" />
          <h4 className="text-md font-semibold">All Folders</h4>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {rootFolders.length} folder{rootFolders.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        {rootFolders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground rounded-lg border border-dashed">
            <Folder className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No folders yet</p>
            <p className="text-xs mt-1">Create your first folder to get started</p>
          </div>
        ) : (
          <div className="space-y-3 rounded-lg border bg-card p-4">
            {rootFolders.map(folder => renderFolder(folder))}
          </div>
        )}
      </div>
    </div>
  )
}