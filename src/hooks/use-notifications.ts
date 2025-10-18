'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database, NotificationChannel, NotificationStatus } from '@/lib/database.types'

type NotificationRow = Database['public']['Tables']['notification_queue']['Row']

export type NotificationStatusFilter = NotificationStatus | 'active' | 'all'
export type NotificationChannelFilter = NotificationChannel | 'all'

interface UseNotificationsOptions {
  enabled?: boolean
  limit?: number
  page?: number
  status?: NotificationStatusFilter
  channel?: NotificationChannelFilter
  search?: string
  order?: 'asc' | 'desc'
}

interface UseNotificationsResult {
  notifications: NotificationRow[]
  loading: boolean
  error: string | null
  total: number
  hasMore: boolean
  refresh: () => Promise<void>
  updateNotificationStatus: (id: string, status: NotificationStatus) => Promise<void>
  updating: boolean
}

function escapeSearchTerm(term: string) {
  return term.replace(/[%_]/g, '\\$&')
}

export function useNotifications(
  recipientId: string | undefined,
  options: UseNotificationsOptions = {}
): UseNotificationsResult {
  const {
    enabled = true,
    limit = 10,
    page = 1,
    status = 'active',
    channel = 'all',
    search,
    order = 'desc',
  } = options

  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState<number>(0)
  const [updating, setUpdating] = useState<boolean>(false)

  const supabase = useMemo(() => createClient(), [])

  const fetchNotifications = useCallback(async () => {
    if (!recipientId || !enabled) {
      setNotifications([])
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
        .from('notification_queue')
        .select('*', { count: 'exact' })
        .eq('recipient_id', recipientId)

      if (status === 'active') {
        query = query.neq('status', 'sent').neq('status', 'cancelled')
      } else if (status !== 'all') {
        query = query.eq('status', status)
      }

      if (channel !== 'all') {
        query = query.eq('channel', channel)
      }

      if (search && search.trim().length > 0) {
        const escaped = escapeSearchTerm(search.trim())
        query = query.or(
          `subject.ilike.%${escaped}%,payload->>message.ilike.%${escaped}%,payload->>description.ilike.%${escaped}%`
        )
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: order === 'asc' })
        .range(offset, upperRange)

      if (error) {
        throw error
      }

      setNotifications(data ?? [])
      setTotal(count ?? 0)
    } catch (err) {
      console.error('useNotifications: failed to fetch notifications', err)
      setError(err instanceof Error ? err.message : 'Unable to load notifications')
      setNotifications([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [recipientId, enabled, limit, page, status, channel, search, order, supabase])

  const updateNotificationStatus = useCallback(
    async (id: string, nextStatus: NotificationStatus) => {
      if (!id) return
      setUpdating(true)

      try {
        const updates: Record<string, unknown> = {
          status: nextStatus,
        }

        if (nextStatus === 'sent') {
          updates.sent_at = new Date().toISOString()
          updates.error_message = null
        } else if (nextStatus === 'failed') {
          updates.sent_at = null
          updates.error_message = 'Marked as failed by user action'
        } else {
          updates.sent_at = null
          updates.error_message = null
        }

        const { error } = await supabase
          .from('notification_queue')
          .update(updates)
          .eq('id', id)

        if (error) {
          throw error
        }

        await fetchNotifications()
      } catch (err) {
        console.error('useNotifications: failed to update notification status', err)
        setError(err instanceof Error ? err.message : 'Unable to update notification')
      } finally {
        setUpdating(false)
      }
    },
    [fetchNotifications, supabase]
  )

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const hasMore = notifications.length > 0 && notifications.length + (page - 1) * limit < total

  return {
    notifications,
    loading,
    error,
    total,
    hasMore,
    refresh: fetchNotifications,
    updateNotificationStatus,
    updating,
  }
}
