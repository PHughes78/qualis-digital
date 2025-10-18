'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database, CarePlanTaskStatus, Priority } from '@/lib/database.types'

type CarePlanTaskRow = Database['public']['Tables']['care_plan_tasks']['Row']
type CarePlanVersionRow = Database['public']['Tables']['care_plan_versions']['Row']
type CarePlanRow = Database['public']['Tables']['care_plans']['Row']
type ClientRow = Database['public']['Tables']['clients']['Row']

export interface CarerTask extends CarePlanTaskRow {
  priority: Priority | null
  version?: Pick<CarePlanVersionRow, 'id' | 'version_number' | 'status' | 'is_active'>
  carePlan?: Pick<CarePlanRow, 'id' | 'title'>
  client?: Pick<ClientRow, 'id' | 'first_name' | 'last_name'>
}

interface UseCarerTasksOptions {
  enabled?: boolean
}

interface UseCarerTasksResult {
  tasks: CarerTask[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useCarerTasks(
  carerId: string | undefined,
  options: UseCarerTasksOptions = {}
): UseCarerTasksResult {
  const { enabled = true } = options
  const [tasks, setTasks] = useState<CarerTask[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const fetchTasks = useCallback(async () => {
    if (!carerId || !enabled) {
      setTasks([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('care_plan_tasks')
        .select(`
          *,
          care_plan_version:care_plan_versions (
            id,
            version_number,
            status,
            is_active,
            care_plan:care_plans (
              id,
              title,
              client:clients (
                id,
                first_name,
                last_name
              )
            )
          )
        `)
        .eq('assigned_to', carerId)

      if (error) throw error

      const mapped =
        (data ?? [])
          .map((task: any) => {
            const version = task.care_plan_version as CarePlanVersionRow & {
              care_plan?: CarePlanRow & { client?: ClientRow }
            }
            const carePlan = version?.care_plan
            const client = carePlan?.client
            return {
              ...(task as CarePlanTaskRow),
              version: version
                ? {
                    id: version.id,
                    version_number: version.version_number,
                    status: version.status,
                    is_active: version.is_active,
                  }
                : undefined,
              carePlan: carePlan
                ? {
                    id: carePlan.id,
                    title: carePlan.title,
                  }
                : undefined,
              client: client
                ? {
                    id: client.id,
                    first_name: client.first_name,
                    last_name: client.last_name,
                  }
                : undefined,
            } as CarerTask
          })
          .filter((task) => task.version?.is_active)
          .sort((a, b) => {
            const priorityOrder: Record<Priority | null, number> = {
              urgent: 0,
              high: 1,
              medium: 2,
              low: 3,
              null: 4,
            }
            const aPriority = priorityOrder[a.priority ?? null] ?? 4
            const bPriority = priorityOrder[b.priority ?? null] ?? 4
            if (aPriority !== bPriority) return aPriority - bPriority
            const aDue = a.due_date ? new Date(a.due_date).getTime() : Infinity
            const bDue = b.due_date ? new Date(b.due_date).getTime() : Infinity
            return aDue - bDue
          }) : []

      setTasks(mapped)
    } catch (err) {
      console.error('useCarerTasks: failed to fetch tasks', err)
      setError(err instanceof Error ? err.message : 'Unable to load tasks')
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [carerId, enabled, supabase])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  return {
    tasks,
    loading,
    error,
    refresh: fetchTasks,
  }
}
