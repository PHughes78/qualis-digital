'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AlertCircle, FileText, Folder, Loader2, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

type DocumentListItem = {
  name: string
  type: 'file' | 'dir'
  size: number
  downloadUrl?: string
  relativePath: string
}

type DocumentFile = {
  name: string
  content?: string
  encoding: string
  mediaType: string
  downloadUrl?: string | null
  viewerUrl?: string | null
  kind: 'text' | 'image' | 'pdf' | 'office' | 'binary'
}

type DocumentResponseFile = {
  name: string
  content: string
  encoding: string
  mediaType: string
  downloadUrl?: string | null
}

type Props = {
  entityType: 'clients' | 'care-homes'
  entityId: string
}

function formatFileSize(bytes: number) {
  if (!bytes) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1)
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${sizes[i]}`
}

function toObjectUrl(base64: string, mimeType: string) {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i += 1) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  const blob = new Blob([byteArray], { type: mimeType })
  return URL.createObjectURL(blob)
}

function decodeTextContent(base64: string) {
  try {
    const binary = atob(base64)
    const buffer = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
      buffer[i] = binary.charCodeAt(i)
    }
    return new TextDecoder().decode(buffer)
  } catch {
    return atob(base64)
  }
}

export function DocumentsManager({ entityId, entityType }: Props) {
  const [items, setItems] = useState<DocumentListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPath, setCurrentPath] = useState('')
  const [viewerFile, setViewerFile] = useState<DocumentFile | null>(null)
  const [viewerLoading, setViewerLoading] = useState(false)
  const [viewerError, setViewerError] = useState<string | null>(null)
  const [pendingFolder, setPendingFolder] = useState(false)
  const [folderName, setFolderName] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  const breadcrumbParts = useMemo(() => {
    return currentPath ? currentPath.split('/').filter(Boolean) : []
  }, [currentPath])

  const refreshList = useCallback(
    async (path: string) => {
      setLoading(true)
      setError(null)
      try {
        const searchParams = path ? `?path=${encodeURIComponent(path)}` : ''
        const response = await fetch(`/api/documents/${entityType}/${entityId}${searchParams}`)
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          const message = typeof body?.message === 'string' ? body.message : 'Failed to load documents.'
          throw new Error(message)
        }
        const payload = await response.json()
        const normalisedItems = Array.isArray(payload.items)
          ? payload.items.map(
              (item: Partial<DocumentListItem> & { name: string; type: 'file' | 'dir'; size: number }) => ({
                name: item.name,
                type: item.type,
                size: item.size,
                downloadUrl: item.downloadUrl,
                relativePath: item.relativePath ?? item.name,
              })
            )
          : []
        setItems(normalisedItems)
      } catch (err) {
        console.error('documents: list fetch failed', err)
        setError('Unable to load documents for this record.')
      } finally {
        setLoading(false)
      }
    },
    [entityId, entityType]
  )

  useEffect(() => {
    refreshList(currentPath)
  }, [currentPath, refreshList])

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [objectUrl])

  const handleEnterFolder = (name: string) => {
    const updatedPath = currentPath ? `${currentPath}/${name}` : name
    setCurrentPath(updatedPath)
  }

  const handleBreadcrumbClick = (index: number) => {
    if (index < 0) {
      setCurrentPath('')
      return
    }

    const nextPath = breadcrumbParts.slice(0, index + 1).join('/')
    setCurrentPath(nextPath)
  }

  const triggerFilePicker = () => {
    fileInputRef.current?.click()
  }

  const handleFileUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return

    const uploads = Array.from(fileList)
    setError(null)
    for (const file of uploads) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('destination', currentPath)

      const response = await fetch(`/api/documents/${entityType}/${entityId}`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        const message = body?.message || `Failed to upload ${file.name}.`
        setError(message)
        break
      }
    }

    await refreshList(currentPath)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return

    setPendingFolder(true)
    setError(null)
    try {
      const response = await fetch(`/api/documents/${entityType}/${entityId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'folder',
          name: folderName.trim(),
          parentPath: currentPath,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        const message = body?.message || 'Failed to create folder.'
        throw new Error(message)
      }

      setFolderName('')
      refreshList(currentPath)
    } catch (err) {
      console.error('documents: create folder failed', err)
      setError(err instanceof Error ? err.message : 'Unable to create folder.')
    } finally {
      setPendingFolder(false)
    }
  }

  const handleOpenFile = async (item: DocumentListItem) => {
    const relativePath = currentPath ? `${currentPath}/${item.name}` : item.name

    setViewerLoading(true)
    setViewerError(null)

    try {
      const response = await fetch(
        `/api/documents/${entityType}/${entityId}?filePath=${encodeURIComponent(relativePath)}`
      )
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        const message = typeof body?.message === 'string' ? body.message : 'Failed to load document.'
        throw new Error(message)
      }

      const payload = await response.json()
      const file = payload.file as DocumentResponseFile

      const previousUrl = objectUrl
      let nextObjectUrl: string | null = null

      const baseViewer: Pick<DocumentFile, 'name' | 'encoding' | 'mediaType' | 'downloadUrl'> = {
        name: file.name,
        encoding: file.encoding,
        mediaType: file.mediaType,
        downloadUrl: file.downloadUrl ?? null,
      }

      const officeMimeTypes = new Set([
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ])

      if (file.mediaType.startsWith('text/') || file.mediaType === 'application/json') {
        setViewerFile({
          ...baseViewer,
          content: decodeTextContent(file.content),
          kind: 'text',
        })
        setObjectUrl(null)
      } else if (file.mediaType.startsWith('image/')) {
        nextObjectUrl = toObjectUrl(file.content, file.mediaType)
        setObjectUrl(nextObjectUrl)
        setViewerFile({
          ...baseViewer,
          viewerUrl: nextObjectUrl,
          kind: 'image',
        })
      } else if (file.mediaType === 'application/pdf') {
        nextObjectUrl = toObjectUrl(file.content, file.mediaType)
        setObjectUrl(nextObjectUrl)
        setViewerFile({
          ...baseViewer,
          viewerUrl: nextObjectUrl,
          kind: 'pdf',
        })
      } else if (officeMimeTypes.has(file.mediaType) && file.downloadUrl) {
        const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
          file.downloadUrl
        )}`
        setObjectUrl(null)
        setViewerFile({
          ...baseViewer,
          viewerUrl: officeViewerUrl,
          kind: 'office',
        })
      } else {
        setObjectUrl(null)
        setViewerFile({
          ...baseViewer,
          kind: 'binary',
        })
      }

      if (previousUrl && previousUrl !== nextObjectUrl) {
        URL.revokeObjectURL(previousUrl)
      }
    } catch (err) {
      console.error('documents: file fetch failed', err)
      setViewerError(err instanceof Error ? err.message : 'Unable to load document.')
    } finally {
      setViewerLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={cn(
              'text-blue-600 hover:underline',
              currentPath ? 'cursor-pointer' : 'cursor-default text-gray-500'
            )}
            onClick={() => handleBreadcrumbClick(-1)}
            disabled={!currentPath}
          >
            Root
          </button>
          {breadcrumbParts.map((part, index) => (
            <div key={part} className="flex items-center gap-2">
              <span>/</span>
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() => handleBreadcrumbClick(index)}
              >
                {part}
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={triggerFilePicker}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => handleFileUpload(event.target.files)}
          />
          <div className="flex items-center gap-2">
            <Input
              value={folderName}
              onChange={(event) => setFolderName(event.target.value)}
              placeholder="New folder name"
              className="h-8 w-40"
            />
            <Button variant="secondary" size="sm" onClick={handleCreateFolder} disabled={pendingFolder}>
              {pendingFolder ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create folder'}
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No documents yet. Create a folder or upload files to get started.
              </div>
            ) : (
              <div className="space-y-1">
                {items.map((item) => (
                  <button
                    key={item.relativePath || item.name}
                    type="button"
                    className="flex w-full items-center justify-between rounded-md border border-transparent px-3 py-2 text-left text-sm hover:border-gray-200 hover:bg-gray-50"
                    onClick={() => (item.type === 'dir' ? handleEnterFolder(item.name) : handleOpenFile(item))}
                  >
                    <div className="flex items-center gap-3">
                      {item.type === 'dir' ? (
                        <Folder className="h-4 w-4 text-amber-600" />
                      ) : (
                        <FileText className="h-4 w-4 text-blue-600" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.type === 'dir' ? 'Folder' : formatFileSize(item.size)}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">Open</div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Viewer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {viewerLoading && (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}

            {viewerError && (
              <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span>{viewerError}</span>
              </div>
            )}

            {!viewerLoading && !viewerFile && !viewerError && (
              <p className="text-sm text-muted-foreground">
                Select a file from the list to preview it here. Images and PDFs will open directly; download others from
                the list view.
              </p>
            )}

            {viewerFile && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>{viewerFile.name}</span>
                  {viewerFile.downloadUrl && (
                    <a
                      href={viewerFile.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Download
                    </a>
                  )}
                </div>
                <div className="rounded-md border bg-white p-2">
                  {viewerFile.kind === 'text' && viewerFile.content ? (
                    <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap text-xs text-gray-700">
                      {viewerFile.content}
                    </pre>
                  ) : viewerFile.kind === 'image' && viewerFile.viewerUrl ? (
                    <img
                      src={viewerFile.viewerUrl}
                      alt={viewerFile.name}
                      className="max-h-[60vh] w-full rounded object-contain"
                    />
                  ) : viewerFile.kind === 'pdf' && viewerFile.viewerUrl ? (
                    <iframe src={viewerFile.viewerUrl} title={viewerFile.name} className="h-[60vh] w-full rounded" />
                  ) : viewerFile.kind === 'office' && viewerFile.viewerUrl ? (
                    <iframe src={viewerFile.viewerUrl} title={viewerFile.name} className="h-[60vh] w-full rounded" />
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      Preview not available. Use the download link above to view this file.
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DocumentsManager
