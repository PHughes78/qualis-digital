import { Buffer } from 'node:buffer'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

type EntityType = 'clients' | 'care-homes'

const VALID_ENTITY_TYPES: EntityType[] = ['clients', 'care-homes']

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
const documentsBucket = process.env.SUPABASE_DOCS_BUCKET?.trim() || 'documents'

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Supabase URL and service role key must be set')
}

const supabaseAdmin = createServiceClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
})

function inferMediaType(filename: string, fallback?: string) {
  if (fallback && fallback !== '') return fallback
  const extension = filename.split('.').pop()?.toLowerCase() ?? ''

  switch (extension) {
    case 'pdf':
      return 'application/pdf'
    case 'png':
      return 'image/png'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'gif':
      return 'image/gif'
    case 'webp':
      return 'image/webp'
    case 'svg':
      return 'image/svg+xml'
    case 'txt':
    case 'log':
    case 'csv':
      return 'text/plain'
    case 'md':
      return 'text/markdown'
    case 'json':
      return 'application/json'
    case 'doc':
      return 'application/msword'
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    case 'ppt':
      return 'application/vnd.ms-powerpoint'
    case 'pptx':
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    case 'xls':
      return 'application/vnd.ms-excel'
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    case 'csvx':
      return 'application/vnd.ms-excel'
    default:
      return 'application/octet-stream'
  }
}

async function assertAuthenticated() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

function normaliseEntityType(rawType: string): EntityType | null {
  if (VALID_ENTITY_TYPES.includes(rawType as EntityType)) {
    return rawType as EntityType
  }

  return null
}

function buildBasePath(entityType: EntityType, entityId: string) {
  return `${entityType}/${entityId}`
}

function buildPath(...parts: Array<string | null | undefined>) {
  return parts
    .filter((part) => part && part.trim().length > 0)
    .map((part) => part!.replace(/^\/+|\/+$/g, ''))
    .join('/')
}

export async function GET(request: NextRequest, context: { params: { entityType: string; entityId: string } }) {
  const user = await assertAuthenticated()

  if (!user) {
    return NextResponse.json({ message: 'Not authenticated.' }, { status: 401 })
  }

  const entityType = normaliseEntityType(context.params.entityType)
  if (!entityType) {
    return NextResponse.json({ message: 'Unsupported entity type.' }, { status: 400 })
  }

  const url = new URL(request.url)
  const filePath = url.searchParams.get('filePath')
  const path = url.searchParams.get('path') ?? ''
  const basePath = buildBasePath(entityType, context.params.entityId)

  try {
    if (filePath) {
      const targetPath = buildPath(basePath, filePath)
      const { data, error } = await supabaseAdmin.storage.from(documentsBucket).download(targetPath)

      if (error || !data) {
        throw error ?? new Error('File download failed.')
      }

      const arrayBuffer = await data.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      const mediaType = inferMediaType(filePath, data.type)

      const { data: signed } = await supabaseAdmin.storage
        .from(documentsBucket)
        .createSignedUrl(targetPath, 60 * 60)

      return NextResponse.json({
        file: {
          name: filePath.split('/').pop() ?? filePath,
          mediaType,
          encoding: 'base64',
          content: base64,
          downloadUrl: signed?.signedUrl ?? null,
          relativePath: filePath,
          size: arrayBuffer.byteLength,
        },
      })
    }

    const directoryPath = buildPath(basePath, path)
    const {
      data: items,
      error,
    } = await supabaseAdmin.storage.from(documentsBucket).list(directoryPath, {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' },
    })

    if (error) {
      const statusCodeRaw =
        typeof error === 'object' && error !== null && 'statusCode' in error ? (error as { statusCode: unknown }).statusCode : null
      const statusCode =
        typeof statusCodeRaw === 'number'
          ? statusCodeRaw
          : typeof statusCodeRaw === 'string'
          ? Number(statusCodeRaw)
          : null

      if (statusCode === 404 || statusCode === 400) {
        return NextResponse.json({ items: [], basePath, currentPath: path ?? '' })
      }

      throw error
    }

    return NextResponse.json({
      items: (items ?? []).map((item) => ({
        name: item.name,
        type: item.metadata ? ('file' as const) : ('dir' as const),
        size: item.metadata?.size ?? 0,
        downloadUrl: null,
        relativePath: buildPath(path, item.name),
      })),
      basePath,
      currentPath: path ?? '',
    })
  } catch (error) {
    console.error('documents: failed to load storage contents', error)
    const message = error instanceof Error ? error.message : 'Unable to load documents.'
    return NextResponse.json({ message }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: { params: { entityType: string; entityId: string } }) {
  const user = await assertAuthenticated()

  if (!user) {
    return NextResponse.json({ message: 'Not authenticated.' }, { status: 401 })
  }

  const entityType = normaliseEntityType(context.params.entityType)
  if (!entityType) {
    return NextResponse.json({ message: 'Unsupported entity type.' }, { status: 400 })
  }

  const basePath = buildBasePath(entityType, context.params.entityId)
  const contentType = request.headers.get('content-type') ?? ''

  try {
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file')
      const destination = (formData.get('destination') as string | null) ?? ''

      if (!(file instanceof File)) {
        return NextResponse.json({ message: 'File data missing.' }, { status: 400 })
      }

      const targetPath = buildPath(basePath, destination, file.name)
      const { error } = await supabaseAdmin.storage.from(documentsBucket).upload(targetPath, file, {
        upsert: true,
        cacheControl: '3600',
      })

      if (error) {
        throw error
      }

      return NextResponse.json(
        {
          item: {
            name: file.name,
            type: 'file',
            size: file.size,
            downloadUrl: null,
            relativePath: buildPath(destination, file.name),
          },
        },
        { status: 201 }
      )
    }

    const body = await request.json()

    if (body?.type === 'folder') {
      if (!body.name || typeof body.name !== 'string') {
        return NextResponse.json({ message: 'Folder name required.' }, { status: 400 })
      }

      const folderPath = buildPath(basePath, body.parentPath ?? '', body.name)
      const placeholderPath = buildPath(folderPath, '.keep')
      const placeholder = new Blob([''], { type: 'text/plain' })
      const { error } = await supabaseAdmin.storage.from(documentsBucket).upload(placeholderPath, placeholder, {
        upsert: false,
      })

      if (error && !/The resource already exists/i.test(error.message ?? '')) {
        throw error
      }

      return NextResponse.json({ message: 'Folder created.' }, { status: 201 })
    }

    return NextResponse.json({ message: 'Unsupported payload.' }, { status: 400 })
  } catch (error) {
    console.error('documents: failed to update storage contents', error)
    const message = error instanceof Error ? error.message : 'Unable to update documents.'
    return NextResponse.json({ message }, { status: 500 })
  }
}
