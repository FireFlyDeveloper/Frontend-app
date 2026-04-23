import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentsApi } from '@/api/documents'
import { useUIStore } from '@/stores/uiStore'

export function useDocuments(folderId: string | null) {
  return useQuery({
    queryKey: ['documents', folderId],
    queryFn: () =>
      documentsApi.getFolderDocuments(folderId!).then((res) => res.data),
    enabled: !!folderId,
  })
}

export function useUploadDocument() {
  const queryClient = useQueryClient()
  const addToast = useUIStore((state) => state.addToast)

  return useMutation({
    mutationFn: ({
      folderId,
      file,
      onProgress,
    }: {
      folderId: string
      file: File
      onProgress?: (progress: number) => void
    }) => documentsApi.uploadDocument(folderId, file, onProgress).then((res) => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['documents', variables.folderId],
      })
      addToast({ message: 'File uploaded successfully', type: 'success' })
    },
    onError: () => {
      addToast({ message: 'Failed to upload file', type: 'error' })
    },
  })
}

export function useDownloadDocument() {
  const addToast = useUIStore((state) => state.addToast)

  return useMutation({
    mutationFn: async ({ id, filename }: { id: string; filename: string }) => {
      const response = await documentsApi.downloadDocument(id)
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    },
    onSuccess: () => {
      addToast({ message: 'Download started', type: 'info' })
    },
    onError: () => {
      addToast({ message: 'Failed to download file', type: 'error' })
    },
  })
}

export function useDocumentVersions(documentId: string | null) {
  return useQuery({
    queryKey: ['document-versions', documentId],
    queryFn: () =>
      documentsApi.getDocumentVersions(documentId!).then((res) => res.data),
    enabled: !!documentId,
  })
}

export function useDocumentActivity(documentId: string | null) {
  return useQuery({
    queryKey: ['document-activity', documentId],
    queryFn: () =>
      documentsApi.getDocumentActivity(documentId!).then((res) => res.data),
    enabled: !!documentId,
  })
}
