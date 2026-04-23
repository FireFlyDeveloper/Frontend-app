import api from './client'
import { Folder, DocumentFile, DocumentVersion, ActivityLogEntry, Permission, CreateFolderInput, UpdateFolderInput } from '@/types/document'

export const documentsApi = {
  // Folders
  getFolders: () => api.get<{ folders: Folder[] }>('/folders').then(r => ({ data: r.data.folders })),

  getFolder: (id: string) => api.get<{ folder: Folder }>(`/folders/${id}`).then(r => ({ data: r.data.folder })),

  createFolder: (data: CreateFolderInput) =>
    api.post<{ folder: Folder }>('/folders', data).then(r => ({ data: r.data.folder })),

  updateFolder: (id: string, data: UpdateFolderInput) =>
    api.patch<{ folder: Folder }>(`/folders/${id}`, data).then(r => ({ data: r.data.folder })),

  deleteFolder: (id: string) => api.delete(`/folders/${id}`),

  getFolderDocuments: (id: string) =>
    api.get<{ documents: DocumentFile[] }>(`/folders/${id}/documents`).then(r => ({ data: r.data.documents })),

  // Documents
  uploadDocument: (folderId: string, file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folderId', folderId)
    return api.post<DocumentFile>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total))
        }
      },
    })
  },

  downloadDocument: (id: string) =>
    api.get(`/documents/${id}/download`, { responseType: 'blob' }),

  getDocumentVersions: (id: string) =>
    api.get<{ versions: DocumentVersion[] }>(`/documents/${id}/versions`).then(r => ({ data: r.data.versions })),

  getDocumentActivity: (id: string) =>
    api.get<{ activity: ActivityLogEntry[] }>(`/documents/${id}/activity`).then(r => ({ data: r.data.activity })),

  // Permissions
  getDocumentPermissions: (id: string) =>
    api.get<{ permissions: Permission[] }>(`/documents/${id}/permissions`).then(r => ({ data: r.data.permissions })),

  addDocumentPermission: (id: string, data: { userId?: string; role?: string; level: 'viewer' | 'editor' | 'manager' }) =>
    api.post<Permission>(`/documents/${id}/permissions`, data),

  removeDocumentPermission: (id: string, permissionId: string) =>
    api.delete(`/documents/${id}/permissions/${permissionId}`),

  getFolderPermissions: (id: string) =>
    api.get<{ permissions: Permission[] }>(`/folders/${id}/permissions`).then(r => ({ data: r.data.permissions })),

  addFolderPermission: (id: string, data: { userId?: string; role?: string; level: 'viewer' | 'editor' | 'manager' }) =>
    api.post<Permission>(`/folders/${id}/permissions`, data),

  removeFolderPermission: (id: string, permissionId: string) =>
    api.delete(`/folders/${id}/permissions/${permissionId}`),
}
