'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database, CarePlanVersionStatus, CarePlanTaskStatus, CarePlanReviewStatus } from '@/lib/database.types'

type CarePlanRow = Database['public']['Tables']['care_plans']['Row']
type CarePlanVersionRow = Database['public']['Tables']['care_plan_versions']['Row']
type CarePlanTaskRow = Database['public']['Tables']['care_plan_tasks']['Row']
type CarePlanReviewRow = Database['public']['Tables']['care_plan_reviews']['Row']
type ClientRow = Database['public']['Tables']['clients']['Row']
type ProfileRow = Database['public']['Tables']['profiles']['Row']

export interface CarePlanTaskDetail extends CarePlanTaskRow {
  assignee?: Pick<ProfileRow, 'id' | 'first_name' | 'last_name'>
  created_by_profile?: Pick<ProfileRow, 'id' | 'first_name' | 'last_name'>
}

export interface CarePlanVersionDetail extends CarePlanVersionRow {
  created_by_profile?: Pick<ProfileRow, 'id' | 'first_name' | 'last_name'>
  approved_by_profile?: Pick<ProfileRow, 'id' | 'first_name' | 'last_name'>
  tasks: CarePlanTaskDetail[]
}

export interface CarePlanReviewDetail extends CarePlanReviewRow {
  created_by_profile?: Pick<ProfileRow, 'id' | 'first_name' | 'last_name'>
  completed_by_profile?: Pick<ProfileRow, 'id' | 'first_name' | 'last_name'>
}

export interface CarePlanDetail extends CarePlanRow {
  client?: Pick<ClientRow, 'id' | 'first_name' | 'last_name'>
  created_by_profile?: Pick<ProfileRow, 'id' | 'first_name' | 'last_name'>
  versions: CarePlanVersionDetail[]
  reviews: CarePlanReviewDetail[]
}

export interface UseCarePlanDetailOptions {
  enabled?: boolean
}

interface UseCarePlanDetailReturn {
  data: CarePlanDetail | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useCarePlanDetail(
  carePlanId: string | undefined,
  options: UseCarePlanDetailOptions = {}
): UseCarePlanDetailReturn {
  const { enabled = true } = options
  const [data, setData] = useState<CarePlanDetail | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const fetchCarePlan = useCallback(async () => {
    if (!carePlanId || !enabled) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: carePlan, error: carePlanError } = await supabase
        .from('care_plans')
        .select(`
          *,
          client:clients ( id, first_name, last_name ),
          created_by_profile:profiles!care_plans_created_by_fkey ( id, first_name, last_name ),
          versions:care_plan_versions (
            *,
            created_by_profile:profiles!care_plan_versions_created_by_fkey ( id, first_name, last_name ),
            approved_by_profile:profiles!care_plan_versions_approved_by_fkey ( id, first_name, last_name ),
            tasks:care_plan_tasks (
              *,
              assignee:profiles!care_plan_tasks_assigned_to_fkey ( id, first_name, last_name ),
              created_by_profile:profiles!care_plan_tasks_created_by_fkey ( id, first_name, last_name )
            )
          ),
          reviews:care_plan_reviews (
            *,
            created_by_profile:profiles!care_plan_reviews_created_by_fkey ( id, first_name, last_name ),
            completed_by_profile:profiles!care_plan_reviews_completed_by_fkey ( id, first_name, last_name )
          )
        `)
        .eq('id', carePlanId)
        .maybeSingle()

      if (carePlanError) {
        throw carePlanError
      }

      if (!carePlan) {
        setData(null)
        setError('Care plan not found')
        return
      }

      const mapped: CarePlanDetail = {
        ...(carePlan as CarePlanRow),
        client: (carePlan as any).client ?? undefined,
        created_by_profile: (carePlan as any).created_by_profile ?? undefined,
        versions: ((carePlan as any).versions ?? []).map((version: any) => ({
          ...(version as CarePlanVersionRow),
          created_by_profile: version.created_by_profile ?? undefined,
          approved_by_profile: version.approved_by_profile ?? undefined,
          tasks: ((version.tasks ?? []) as any[]).map((task) => ({
            ...(task as CarePlanTaskRow),
            assignee: task.assignee ?? undefined,
            created_by_profile: task.created_by_profile ?? undefined,
          })) as CarePlanTaskDetail[],
        })) as CarePlanVersionDetail[],
        reviews: ((carePlan as any).reviews ?? []).map((review: any) => ({
          ...(review as CarePlanReviewRow),
          created_by_profile: review.created_by_profile ?? undefined,
          completed_by_profile: review.completed_by_profile ?? undefined,
        })) as CarePlanReviewDetail[],
      }

      mapped.versions.sort(sortVersions)
      mapped.reviews.sort(sortReviews)

      mapped.versions.forEach((version) => {
        version.tasks.sort(sortTasks)
      })

      setData(mapped)
    } catch (err) {
      console.error('useCarePlanDetail: failed to fetch care plan', err)
      setError(err instanceof Error ? err.message : 'Unable to load care plan')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [carePlanId, enabled, supabase])

  useEffect(() => {
    fetchCarePlan()
  }, [fetchCarePlan])

  return {
    data,
    loading,
    error,
    refresh: fetchCarePlan,
  }
}

function sortVersions(a: CarePlanVersionDetail, b: CarePlanVersionDetail) {
  if (a.is_active && !b.is_active) return -1
  if (!a.is_active && b.is_active) return 1
  return b.version_number - a.version_number
}

function sortReviews(a: CarePlanReviewDetail, b: CarePlanReviewDetail) {
  const aDate = a.scheduled_for ? new Date(a.scheduled_for).getTime() : 0
  const bDate = b.scheduled_for ? new Date(b.scheduled_for).getTime() : 0
  return bDate - aDate
}

function sortTasks(a: CarePlanTaskDetail, b: CarePlanTaskDetail) {
  const statusOrder: Record<CarePlanTaskStatus, number> = {
    pending: 0,
    in_progress: 1,
    completed: 2,
    cancelled: 3,
  }

  const aOrder = statusOrder[a.status as CarePlanTaskStatus] ?? 99
  const bOrder = statusOrder[b.status as CarePlanTaskStatus] ?? 99

  if (aOrder !== bOrder) {
    return aOrder - bOrder
  }

  const aDue = a.due_date ? new Date(a.due_date).getTime() : Infinity
  const bDue = b.due_date ? new Date(b.due_date).getTime() : Infinity
  return aDue - bDue
}
