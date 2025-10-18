'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import DocumentsManager from './DocumentsManager'

type Props = {
  open: boolean
  onClose: () => void
  entityType: 'clients' | 'care-homes'
  entityId: string
  title?: string
}

export default function DocumentsOverlay({ open, onClose, entityType, entityId, title }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !open) return undefined

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [mounted, open])

  if (!mounted || !open) {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-white">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
            {title && <p className="text-sm text-gray-500">{title}</p>}
          </div>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto px-6 py-6">
            <DocumentsManager entityType={entityType} entityId={entityId} />
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
