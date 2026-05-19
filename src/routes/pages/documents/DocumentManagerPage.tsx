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
    if (!selectedDocumentId || !renameValue.trim()) return
    renameDocument.mutate(
      { id: selectedDocumentId, name: renameValue.trim() },
      {
        onSuccess: () => {
          setShowRename(false)
          setRenameValue('')
        },
      }
    )
  }

  const handleDelete = () => {
    if (!selectedDocumentId) return
    deleteDocument.mutate(selectedDocumentId, {
      onSuccess: () => {
        setShowDeleteConfirm(false)
        setSelectedDocumentId(null)
      },
    })
  }

  return (
      <PageShell
        title="Documents"
        description="Manage your files and folders"
        actions={
          <div className="flex gap-2">
            {viewMode === 'folder-browser' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedFolderId(null)
                  setSelectedDocumentId(null)
                  setViewMode('all-folders')
                  setSearchQuery('')
                }}
                className="w-full sm:w-auto justify-center"
              >
                <FolderOpen className="h-4 w-4 mr-2 shrink-0" />
                <span>All Folders Directory</span>
              </Button>
            )}
            {viewMode === 'all-folders' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setViewMode('folder-browser')
                }}
                disabled={!selectedFolder}
                className="w-full sm:w-auto justify-center"
              >
                <FileText className="h-4 w-4 mr-2 shrink-0" />
                <span>Browse Selected Folder</span>
              </Button>
            )}
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
                onSelectFolder={(id) => {
                  setSelectedFolderId(id)
                  setSelectedDocumentId(null)
                  setSearchQuery('')
                  setViewMode('folder-browser')
                }}
              />
            )}
          </div>
        </div>

        {/* File List */}
        <div className="lg:col-span-3 space-y-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            <button
              onClick={() => {
                setSelectedFolderId(null)
                setSelectedDocumentId(null)
                setSearchQuery('')
                setViewMode('all-folders')
              }}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Home</span>
            </button>
            {viewMode === 'folder-browser' && !isSearching && (
              <>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-foreground font-medium">{selectedFolder?.name || 'All Documents'}</span>
              </>
            )}
            {!isSearching && viewMode === 'all-folders' && selectedFolder && (
              <>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-foreground font-medium">{selectedFolder.name}</span>
              </>
            )}
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
               viewMode === 'all-folders' && !selectedFolder ? 'All Folders Directory' : 
               viewMode === 'folder-browser' || selectedFolder ? 'Documents' : 'All Folders Directory'}
          </h3>
          
          {/* Show AllFoldersView when no folder is selected and not searching */}
          {!isSearching && viewMode === 'all-folders' && !selectedFolder && folders && allDocuments && (
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
                  <Hash className="h-3.5 w-3.5 shrink-0" />
                  <span>Version {selectedDocument.version}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                  <span>{selectedFolder?.name || 'Root'}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span>Created {formatDate(selectedDocument.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>Updated {formatDate(selectedDocument.updated_at)}</span>
                </div>
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
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Folder Name</label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder()
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolder(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim() || createFolder.isPending}
            >
              {createFolder.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={showPermissions} onOpenChange={setShowPermissions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Document Permissions</DialogTitle>
          </DialogHeader>
          {selectedDocumentId && (
            <PermissionEditor
              type="document"
              id={selectedDocumentId}
              onClose={() => setShowPermissions(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={showRename} onOpenChange={setShowRename}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">New Name</label>
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="Enter new name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename()
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRename(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={!renameValue.trim() || renameDocument.isPending}
            >
              {renameDocument.isPending ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{selectedDocument?.name}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteDocument.isPending}
            >
              {deleteDocument.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {editingDocument && (
        <Portal>
          <OnlyOfficeEditor
            docId={editingDocument.id}
            docName={editingDocument.name}
            onClose={() => setEditingDocument(null)}
          />
        </Portal>
      )}
      {previewDocument && (
        <Portal>
          <FileViewer
            open={!!previewDocument}
            onOpenChange={(open) => { if (!open) setPreviewDocument(null) }}
            document={previewDocument}
          />
        </Portal>
      )}
    </PageShell>
  )
}