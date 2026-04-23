import { useState } from 'react'
import { Shield, Plus, Trash2 } from 'lucide-react'
import { useDocumentPermissions, useAddDocumentPermission, useRemoveDocumentPermission } from '@/hooks/usePermissions'
import { useFolderPermissions, useAddFolderPermission, useRemoveFolderPermission } from '@/hooks/usePermissions'
import { useUsers } from '@/hooks/useUsers'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface PermissionEditorProps {
  type: 'document' | 'folder'
  id: string
  onClose?: () => void
}

export function PermissionEditor({ type, id }: PermissionEditorProps) {
  const [newUserId, setNewUserId] = useState('')
  const [newRole, setNewRole] = useState('')
  const [newLevel, setNewLevel] = useState<'viewer' | 'editor' | 'manager'>('viewer')
  const [grantType, setGrantType] = useState<'user' | 'role'>('user')

  const docPerms = useDocumentPermissions(type === 'document' ? id : null)
  const folderPerms = useFolderPermissions(type === 'folder' ? id : null)
  const usersQuery = useUsers()

  const permissions = type === 'document' ? docPerms.data : folderPerms.data
  const isLoading = type === 'document' ? docPerms.isLoading : folderPerms.isLoading

  const addDocPerm = useAddDocumentPermission()
  const addFolderPerm = useAddFolderPermission()
  const removeDocPerm = useRemoveDocumentPermission()
  const removeFolderPerm = useRemoveFolderPermission()

  const handleAdd = () => {
    const data = grantType === 'user'
      ? { userId: newUserId, level: newLevel }
      : { role: newRole, level: newLevel }

    if (type === 'document') {
      addDocPerm.mutate({ documentId: id, data })
    } else {
      addFolderPerm.mutate({ folderId: id, data })
    }

    setNewUserId('')
    setNewRole('')
  }

  const handleRemove = (permissionId: string) => {
    if (type === 'document') {
      removeDocPerm.mutate({ documentId: id, permissionId })
    } else {
      removeFolderPerm.mutate({ folderId: id, permissionId })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select
          value={grantType}
          onChange={(e) => setGrantType(e.target.value as 'user' | 'role')}
          className="w-28"
        >
          <option value="user">User</option>
          <option value="role">Role</option>
        </Select>

        {grantType === 'user' ? (
          <Select
            value={newUserId}
            onChange={(e) => setNewUserId(e.target.value)}
            className="flex-1"
          >
            <option value="">Select user...</option>
            {usersQuery.data?.map((user) => (
              <option key={user.id} value={user.id}>
                {user.display_name} ({user.email})
              </option>
            ))}
          </Select>
        ) : (
          <Select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="flex-1"
          >
            <option value="">Select role...</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="student">Student</option>
          </Select>
        )}

        <Select
          value={newLevel}
          onChange={(e) => setNewLevel(e.target.value as 'viewer' | 'editor' | 'manager')}
          className="w-28"
        >
          <option value="viewer">Viewer</option>
          <option value="editor">Editor</option>
          <option value="manager">Manager</option>
        </Select>

        <Button
          size="icon"
          onClick={handleAdd}
          disabled={grantType === 'user' ? !newUserId : !newRole}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {permissions && permissions.length > 0 ? (
          permissions.map((perm) => (
            <div
              key={perm.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {perm.user ? perm.user.display_name : perm.role_id}
                </span>
                <Badge variant="secondary" className="capitalize text-xs">
                  {perm.permission}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleRemove(perm.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No permissions set. Add permissions to control access.
          </p>
        )}
      </div>
    </div>
  )
}
