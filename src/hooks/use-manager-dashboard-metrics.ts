'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database, IncidentStatus, IncidentSeverity } from '@/lib/database.types'

type CareHomeRow = Database['public']['Tables']['care_homes']['Row']
type IncidentRow = Database['public']['Tables']['incidents']['Row']

export interface ManagerDashboardMetrics {
  careHomeCount: number
  averageOccupancy: number
  totalClients: number
  newClientsThisMonth: number
  activeStaff: number
  openIncidents: number
  attentionIncidents: number
  overdueCarePlanReviews: number
  upcomingCarePlanReviews: number
}

interface UseManagerDashboardMetricsOptions {
  enabled?: boolean
}

const DEFAULT_METRICS: ManagerDashboardMetrics = {
  careHomeCount: 0,
  averageOccupancy: 0,
  totalClients: 0,
  newClientsThisMonth: 0,
  activeStaff: 0,
  openIncidents: 0,
  attentionIncidents: 0,
  overdueCarePlanReviews: 0,
  upcomingCarePlanReviews: 0,
}

export function useManagerDashboardMetrics(
  options: UseManagerDashboardMetricsOptions = {}
) {
  const { enabled = true } = options
  const [metrics, setMetrics] = useState<ManagerDashboardMetrics>(DEFAULT_METRICS)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const fetchMetrics = useCallback(async () => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      const [
        careHomesRes,
        totalClientsRes,
        newClientsRes,
        staffAssignmentsRes,
        incidentsRes,
        overdueReviewsRes,
        upcomingReviewsRes,
      ] = await Promise.all([
        supabase
          .from('care_homes')
          .select('id, capacity, current_occupancy') as Promise<{
            data: Pick<CareHomeRow, 'id' | 'capacity' | 'current_occupancy'>[] | null
            error: Error | null
          }>,
        supabase
          .from('clients')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('clients')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', startOfMonthISOString()),
        supabase
          .from('user_care_homes')
          .select('user_id'),
        supabase
          .from('incidents')
          .select('id, severity, status') as Promise<{
            data: Pick<IncidentRow, 'id' | 'severity' | 'status'>[] | null
            error: Error | null
          }>,
        supabase
          .from('care_plan_reviews')
          .select('id', { count: 'exact', head: true })
          .lt('scheduled_for', todayISOString())
          .neq('status', 'completed')
          .neq('status', 'cancelled'),
        supabase
          .from('care_plan_reviews')
          .select('id', { count: 'exact', head: true })
          .gte('scheduled_for', todayISOString())
          .lte('scheduled_for', futureISOString(14))
          .neq('status', 'completed')
          .neq('status', 'cancelled'),
      ])

      if (careHomesRes.error) throw careHomesRes.error
      if (totalClientsRes.error) throw totalClientsRes.error
      if (newClientsRes.error) throw newClientsRes.error
      if (staffAssignmentsRes.error) throw staffAssignmentsRes.error
      if (incidentsRes.error) throw incidentsRes.error
      if (overdueReviewsRes.error) throw overdueReviewsRes.error
      if (upcomingReviewsRes.error) throw upcomingReviewsRes.error

      const careHomes = careHomesRes.data ?? []
      const careHomeCount = careHomes.length
      const averageOccupancy =
        careHomeCount > 0
          ? Math.round(
              (careHomes.reduce((acc, home) => {
                if (!home.capacity || home.capacity === 0) return acc
                return acc + home.current_occupancy / home.capacity
              }, 0) / careHomeCount) * 100
            )
          : 0

      const totalClients = totalClientsRes.count ?? 0
      const newClientsThisMonth = newClientsRes.count ?? 0

      const staffAssignments = staffAssignmentsRes.data ?? []
      const activeStaff = new Set(
        staffAssignments.map((assignment) => assignment.user_id).filter(Boolean)
      ).size

      const incidents = incidentsRes.data ?? []
      const activeIncidents = incidents.filter((incident) =>
        isActiveIncidentStatus(incident.status)
      )
      const openIncidents = activeIncidents.length
      const attentionIncidents = activeIncidents.filter((incident) =>
        isAttentionSeverity(incident.severity)
      ).length
      const overdueCarePlanReviews = overdueReviewsRes.count ?? 0
      const upcomingCarePlanReviews = upcomingReviewsRes.count ?? 0

      setMetrics({
        careHomeCount,
        averageOccupancy,
        totalClients,
        newClientsThisMonth,
        activeStaff,
        openIncidents,
        attentionIncidents,
        overdueCarePlanReviews,
        upcomingCarePlanReviews,
      })
    } catch (err) {
      console.error('useManagerDashboardMetrics: failed to fetch metrics', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setMetrics(DEFAULT_METRICS)
    } finally {
      setLoading(false)
    }
  }, [enabled, supabase])

  useEffect(() => {
    if (!enabled) return
    fetchMetrics()
  }, [enabled, fetchMetrics])

  return {
    metrics,
    loading,
    error,
    refresh: fetchMetrics,
  }
}

function startOfMonthISOString() {
  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
  return start.toISOString()
}

function todayISOString() {
  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
  return start.toISOString()
}

function futureISOString(daysAhead: number) {
  const now = new Date()
  const future = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysAhead, 0, 0, 0, 0))
  return future.toISOString()
}

function isActiveIncidentStatus(status: IncidentRow['status']): boolean {
  const activeStatuses: IncidentStatus[] = ['open', 'investigating']
  return activeStatuses.includes(status as IncidentStatus)
}

function isAttentionSeverity(severity: IncidentRow['severity']): boolean {
  const attentionSeverities: IncidentSeverity[] = ['high', 'critical']
  return attentionSeverities.includes(severity as IncidentSeverity)
}
