import { useState } from 'react'
import { FolderPlus, Search, Home, ChevronRight } from 'lucide-react'
import { PageShell } from '@/components/layout/PageShell'
import { FolderTree } from '@/components/documents/FolderTree'
import { FileList } from '@/components/documents/FileList'
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
import { useDocuments, useSearchDocuments, useDeleteDocument, useRenameDocument } from '@/hooks/useDocuments'
import { DocumentFile } from '@/types/document'

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
  const [viewDocument, setViewDocument] = useState<DocumentFile | null>(null)

  const { data: folders, isLoading: foldersLoading } = useFolders()
  const { data: documents, isLoading: documentsLoading } = useDocuments(selectedFolderId)
  const { data: searchResults, isLoading: searchLoading } = useSearchDocuments(searchQuery)
  const createFolder = useCreateFolder()
  const deleteDocument = useDeleteDocument()
  const renameDocument = useRenameDocument()

  const isSearching = searchQuery.trim().length > 0
  const displayDocuments = isSearching ? (searchResults || []) : (documents || [])
  const displayLoading = isSearching ? searchLoading : documentsLoading

  const selectedFolder = folders?.find((f) => f.id === selectedFolderId)
  const selectedDocument = displayDocuments?.find((d) => d.id === selectedDocumentId)

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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewFolder(true)}
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Folder Tree */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3">Folders</h3>
            {foldersLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-8 bg-muted rounded animate-pulse" />
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
              }}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Home</span>
            </button>
            {!isSearching && selectedFolder && (
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

          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3">
              {isSearching ? 'Search Results' : (selectedFolderId ? 'Documents' : 'Select a folder to view documents')}
            </h3>
            <FileList
              documents={displayDocuments}
              isLoading={displayLoading}
              selectedDocumentId={selectedDocumentId}
              onSelectDocument={setSelectedDocumentId}
              onView={(doc) => setViewDocument(doc)}
              onRename={(doc) => {
                setRenameValue(doc.name)
                setShowRename(true)
              }}
              onDelete={() => setShowDeleteConfirm(true)}
              onManagePermissions={() => setShowPermissions(true)}
            />
          </div>

          {selectedDocumentId && selectedDocument && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="text-sm font-semibold mb-3">{selectedDocument.name}</h3>
              <p className="text-sm text-muted-foreground">Type: {selectedDocument.mime_type}</p>
              <p className="text-sm text-muted-foreground">Size: {(selectedDocument.size_bytes / 1024).toFixed(1)} KB</p>
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
    </PageShell>
  )
}
