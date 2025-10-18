'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'

type AuditRow = Database['public']['Tables']['audit_events']['Row']
type AuditWithActor = AuditRow & {
  actor?: {
    id: string
    first_name: string
    last_name: string
  }
}

interface UseAuditEventsOptions {
  enabled?: boolean
  limit?: number
  page?: number
  careHomeId?: string | null
  entityType?: string | 'all'
  search?: string
}

interface UseAuditEventsResult {
  events: AuditWithActor[]
  loading: boolean
  error: string | null
  total: number
  hasMore: boolean
  refresh: () => Promise<void>
}

function escapeSearch(term: string) {
  return term.replace(/[%_]/g, '\\$&')
}

export function useAuditEvents(options: UseAuditEventsOptions = {}): UseAuditEventsResult {
  const { enabled = true, limit = 15, page = 1, careHomeId, entityType = 'all', search } = options

  const [events, setEvents] = useState<AuditWithActor[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState<number>(0)

  const supabase = useMemo(() => createClient(), [])

  const fetchEvents = useCallback(async () => {
    if (!enabled) {
      setEvents([])
      setTotal(0)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const offset = (page - 1) * limit
      const upperRange = offset + limit - 1

      let query = supabase
        .from('audit_events')
        .select(
          `
            *,
            actor:profiles!audit_events_actor_id_fkey (
              id,
              first_name,
              last_name
            )
          `,
          { count: 'exact' }
        )

      if (entityType !== 'all') {
        query = query.eq('entity_type', entityType)
      }

      if (careHomeId) {
        query = query.eq('care_home_id', careHomeId)
      }

      if (search && search.trim().length > 0) {
        const escaped = escapeSearch(search.trim())
        query = query.or(
          `action.ilike.%${escaped}%,description.ilike.%${escaped}%,metadata->>clientName.ilike.%${escaped}%`
        )
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, upperRange)

      if (error) {
        throw error
      }

      setEvents((data ?? []) as AuditWithActor[])
      setTotal(count ?? 0)
    } catch (err) {
      console.error('useAuditEvents: failed to fetch events', err)
      setError(err instanceof Error ? err.message : 'Unable to load activity feed')
      setEvents([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [enabled, limit, page, careHomeId, entityType, search, supabase])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const hasMore = events.length > 0 && events.length + (page - 1) * limit < total

  return {
    events,
    loading,
    error,
    total,
    hasMore,
    refresh: fetchEvents,
  }
}

