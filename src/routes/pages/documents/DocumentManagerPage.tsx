import { useState } from 'react'
import { FolderPlus, Search, Home, ChevronRight, FileText, Calendar, Clock, HardDrive, Hash, FolderOpen } from 'lucide-react'
import { PageShell } from '@/components/layout/PageShell'
import { FolderTree } from '@/components/documents/FolderTree'
import { AllFoldersView } from '@/components/documents/AllFoldersView'
import { FileList } from '@/components/documents/FileList'
import { FileViewer } from '@/components/documents/FileViewer'
import { OnlyOfficeEditor } from '@/components/documents/OnlyOfficeEditor'
import { Portal } from '@/components/ui/portal'
import { FileUploadZone } from '@/components/documents/FileUploadZone'
import { PermissionEditor } from '@/components/documents/PermissionEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useFolders, useCreateFolder } from '@/hooks/useFolders'
import { useDocuments, useAllDocuments, useSearchDocuments, useDeleteDocument, useRenameDocument } from '@/hooks/useDocuments'
import { DocumentFile } from '@/types/document'
import { formatFileSize, formatDate } from '@/lib/utils'

export function DocumentManagerPage() {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showPermissions, setShowPermissions] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showRename, setShowRename] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editingDocument, setEditingDocument] = useState<DocumentFile | null>(null)
  const [previewDocument, setPreviewDocument] = useState<DocumentFile | null>(null)

  // New state for all folders view
  const [viewMode, setViewMode] = useState<'all-folders' | 'folder-browser'>('all-folders')
  
  const { data: folders, isLoading: foldersLoading } = useFolders()
  const { data: folderDocuments } = useDocuments(selectedFolderId)
  const { data: allDocuments } = useAllDocuments()
  const { data: searchResults, isLoading: searchLoading } = useSearchDocuments(searchQuery)
  const createFolder = useCreateFolder()
  const deleteDocument = useDeleteDocument()
  const renameDocument = useRenameDocument()

  // Show all documents by default (when no folder selected and not searching)
  const isSearching = searchQuery.trim().length > 0
  const displayDocuments = isSearching 
    ? (searchResults || []) 
    : selectedFolderId 
      ? (folderDocuments || [])
      : (allDocuments || [])
  const displayLoading = isSearching ? searchLoading : (selectedFolderId ? false : false)

  const selectedFolder = folders?.find((f) => f.id === selectedFolderId)

  // Check if we're in home directory (All Folders Directory)
  const isHomeDirectory = !selectedFolderId && !isSearching && viewMode === 'all-folders'

  // Get selected document for preview/details
  const selectedDocument = displayDocuments?.find((d) => d.id === selectedDocumentId)

  function mimeLabel(mime: string): string {
    const map: Record<string, string> = {
      'application/pdf': 'PDF Document',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
      'application/msword': 'Word (Legacy)',
      'application/vnd.ms-excel': 'Excel (Legacy)',
      'application/vnd.ms-powerpoint': 'PowerPoint (Legacy)',
      'image/png': 'PNG Image',
      'image/jpeg': 'JPEG Image',
      'image/gif': 'GIF Image',
      'image/webp': 'WebP Image',
      'image/svg+xml': 'SVG Image',
      'text/plain': 'Text File',
      'text/csv': 'CSV File',
      'application/zip': 'ZIP Archive',
      'application/json': 'JSON File',
    }
    return map[mime] || mime
  }

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return
    createFolder.mutate(
      {
        name: newFolderName.trim(),
        parentId: selectedFolderId || undefined,
      },
      {
        onSuccess: () => {
          setNewFolderName('')
          setShowNewFolder(false)
        },
      }
    )
  }

  const handleRename = () => {
    if (!renameValue.trim() || !selectedDocumentId) return
    renameDocument.mutate(
      {
        id: selectedDocumentId,
        name: renameValue.trim(),
      },
      {
        onSuccess: () => {
          setRenameValue('')
          setShowRename(false)
        },
      }
    )
  }

  const handleDelete = () => {
    if (!selectedDocumentId) return
    deleteDocument.mutate(selectedDocumentId, {
      onSuccess: () => {
        setSelectedDocumentId(null)
        setShowDeleteConfirm(false)
      },
    })
  }

  // Enhanced folder selection that maintains appropriate view mode
  const handleSelectFolder = (folderId: string | null) => {
    if (folderId === null) {
      // Going back to home directory (All Folders Directory)
      setSelectedFolderId(null)
      setSelectedDocumentId(null)
      setViewMode('all-folders')
    } else {
      // Selecting a specific folder
      setSelectedFolderId(folderId)
      setSelectedDocumentId(null)
      setViewMode('folder-browser')
    }
    setSearchQuery('')
  }

  // Enhanced home navigation
  const navigateToHomeDirectory = () => {
    setSelectedFolderId(null)
    setSelectedDocumentId(null)
    setSearchQuery('')
    setViewMode('all-folders')
  }

  // Check if we should show AllFoldersView
  const shouldShowAllFoldersView = isHomeDirectory && folders && allDocuments

  return (
    <PageShell
      title="Documents"
      description="Manage your files and folders"
      actions={
        <div className="flex gap-2">
          {/* Show "All Folders Directory" button when in folder browser mode */}
          {viewMode === 'folder-browser' && (
            <Button
              variant="outline"
              size="sm"
              onClick={navigateToHomeDirectory}
              className="w-full sm:w-auto justify-center"
            >
              <FolderOpen className="h-4 w-4 mr-2 shrink-0" />
              <span>All Folders Directory</span>
            </Button>
          )}
          
          {/* Show "New Folder" button - always available */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewFolder(true)}
            className="w-full sm:w-auto justify-center"
          >
            <FolderPlus className="h-4 w-4 mr-2 shrink-0" />
            <span>New Folder</span>
          </Button>
        </div>
      }
    >
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
      {/* Folder Tree */}
      <div className="lg:col-span-1">
        <div className="rounded-lg border bg-card p-3 lg:p-4">
          <h3 className="text-sm font-semibold mb-3">Folders</h3>
          {foldersLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-7 lg:h-8 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <FolderTree
              folders={folders || []}
              selectedFolderId={selectedFolderId}
              onSelectFolder={handleSelectFolder}
            />
          )}
        </div>
      </div>

      {/* File List */}
      <div className="lg:col-span-3 space-y-4">
        {/* Enhanced Breadcrumbs */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <button
            onClick={navigateToHomeDirectory}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Home</span>
          </button>
          
          {/* Show "All Folders Directory" when in home directory */}
          {isHomeDirectory && !isSearching && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground font-medium">All Folders Directory</span>
            </>
          )}
          
          {/* Show selected folder when in folder browser mode */}
          {viewMode === 'folder-browser' && !isSearching && selectedFolder && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground font-medium">{selectedFolder.name}</span>
            </>
          )}
          
          {/* Show search results when searching */}
          {isSearching && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground font-medium">Search Results</span>
            </>
          )}
        </nav>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {!isSearching && <FileUploadZone folderId={selectedFolderId} />}

        <div className="rounded-lg border bg-card p-3 lg:p-4">
          <h3 className="text-sm font-semibold mb-3">
            {isSearching ? 'Search Results' : 
               isHomeDirectory ? 'All Folders Directory' : 
               selectedFolder ? `${selectedFolder.name} Documents` : 'Documents'}
          </h3>
          
          {/* Enhanced: Show AllFoldersView in home directory (All Folders Directory) */}
          {shouldShowAllFoldersView && (
            <AllFoldersView
              folders={folders}
              documents={allDocuments}
              isLoading={foldersLoading}
              onSelectFolder={(id) => {
                setSelectedFolderId(id)
                setViewMode('folder-browser')
              }}
              onSelectDocument={setSelectedDocumentId}
              selectedFolderId={selectedFolderId}
              selectedDocumentId={selectedDocumentId}
            />
          )}
            
            {/* Show FileList when inside a folder or when searching */}
            {(isSearching || viewMode === 'folder-browser' || selectedFolder) && (
              <FileList
                documents={displayDocuments}
                isLoading={displayLoading}
                selectedDocumentId={selectedDocumentId}
                onSelectDocument={setSelectedDocumentId}
                onEdit={(doc) => setEditingDocument(doc)}
                onPreview={(doc) => setPreviewDocument(doc)}
                onRename={(doc) => {
                  setRenameValue(doc.name)
                  setShowRename(true)
                }}
                onDelete={() => setShowDeleteConfirm(true)}
                onManagePermissions={() => setShowPermissions(true)}
              />
            )}
          </div>

          {selectedDocumentId && selectedDocument && (
            <div className="rounded-lg border bg-card p-3 lg:p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{selectedDocument.name}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span>{mimeLabel(selectedDocument.mime_type)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <HardDrive className="h-3.5 w-3.5 shrink-0" />
                  <span>{formatFileSize(selectedDocument.size_bytes)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span>{formatDate(selectedDocument.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>{formatDate(selectedDocument.updated_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Hash className="h-3.5 w-3.5 shrink-0" />
                  <span>Version {selectedDocument.version}</span>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewDocument(selectedDocument)}
                >
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingDocument(selectedDocument)}
                  disabled={selectedDocument.user_permission !== 'editor' && selectedDocument.user_permission !== 'manager'}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRenameValue(selectedDocument.name)
                    setShowRename(true)
                  }}
                  disabled={selectedDocument.user_permission !== 'editor' && selectedDocument.user_permission !== 'manager'}
                >
                  Rename
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={selectedDocument.user_permission !== 'manager'}
                >
                  Delete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPermissions(true)}
                  disabled={selectedDocument.user_permission !== 'manager'}
                >
                  Permissions
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="folderName" className="block text-sm font-medium mb-1">
                Folder Name
              </label>
              <Input
                id="folderName"
                placeholder="Enter folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                {selectedFolder
                  ? `This folder will be created inside "${selectedFolder.name}"`
                  : 'This folder will be created at the root level'}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewFolder(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                Create Folder
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={showRename} onOpenChange={setShowRename}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="renameInput" className="block text-sm font-medium mb-1">
                New Name
              </label>
              <Input
                id="renameInput"
                placeholder="Enter new name"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRename(false)}>
                Cancel
              </Button>
              <Button onClick={handleRename} disabled={!renameValue.trim()}>
                Rename
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to delete <strong>{selectedDocument?.name}</strong>? This action
              cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={showPermissions} onOpenChange={setShowPermissions}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Permissions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Control who can access <strong>{selectedDocument?.name}</strong>
            </p>
            {selectedDocument && (
              <PermissionEditor
                type="document"
                id={selectedDocument.id}
                onClose={() => setShowPermissions(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Editor */}
      {editingDocument && (
        <Portal>
          <OnlyOfficeEditor
            docId={editingDocument.id}
            docName={editingDocument.name}
            onClose={() => setEditingDocument(null)}
          />
        </Portal>
      )}

      {/* Document Preview */}
      {previewDocument && (
        <Portal>
          <FileViewer
            open={!!previewDocument}
            onOpenChange={() => setPreviewDocument(null)}
            document={previewDocument}
          />
        </Portal>
      )}
    </PageShell>
  )
}