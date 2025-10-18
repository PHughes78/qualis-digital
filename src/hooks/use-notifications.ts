'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'

type NotificationRow = Database['public']['Tables']['notification_queue']['Row']

interface UseNotificationsOptions {
  enabled?: boolean
  limit?: number
}

interface UseNotificationsResult {
  notifications: NotificationRow[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useNotifications(
  recipientId: string | undefined,
  options: UseNotificationsOptions = {}
): UseNotificationsResult {
  const { enabled = true, limit = 5 } = options
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const fetchNotifications = useCallback(async () => {
    if (!recipientId || !enabled) {
      setNotifications([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('notification_queue')
        .select('*')
        .eq('recipient_id', recipientId)
        .neq('status', 'sent')
        .order('send_after', { ascending: true, nullsFirst: false })
        .limit(limit)

      if (error) throw error

      setNotifications(data ?? [])
    } catch (err) {
      console.error('useNotifications: failed to fetch notifications', err)
      setError(err instanceof Error ? err.message : 'Unable to load notifications')
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [recipientId, enabled, limit, supabase])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return {
    notifications,
    loading,
    error,
    refresh: fetchNotifications,
  }
}
