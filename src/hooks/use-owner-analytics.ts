'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface OccupancyPoint {
  date: string
  occupancyRate: number
}

interface IncidentBreakdown {
  open: number
  investigating: number
  resolved: number
  closed: number
  critical: number
}

interface ReviewPipeline {
  overdue: number
  upcoming: number
  completedLast30Days: number
}

interface StaffDistribution {
  carers: number
  managers: number
  other: number
}

export interface OwnerAnalytics {
  occupancyTrend: OccupancyPoint[]
  incidentBreakdown: IncidentBreakdown
  reviewPipeline: ReviewPipeline
  staffDistribution: StaffDistribution
}

interface UseOwnerAnalyticsOptions {
  enabled?: boolean
}

export function useOwnerAnalytics(options: UseOwnerAnalyticsOptions = {}) {
  const { enabled = true } = options
  const [data, setData] = useState<OwnerAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const fetchAnalytics = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const today = new Date()
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 3600 * 1000)

      const [
        occupancyRes,
        incidentsRes,
        reviewsRes,
        staffRes,
      ] = await Promise.all([
        supabase
          .from('occupancy_snapshots')
          .select('care_home_id, snapshot_date, occupancy, capacity')
          .gte('snapshot_date', formatDateISO(thirtyDaysAgo))
          .order('snapshot_date', { ascending: true }),
        supabase
          .from('incidents')
          .select('status, severity'),
        supabase
          .from('care_plan_reviews')
          .select('status, scheduled_for, completed_at')
          .gte('scheduled_for', formatDateISO(thirtyDaysAgo)),
        supabase
          .from('profiles')
          .select('role, is_active'),
      ])

      if (occupancyRes.error) throw occupancyRes.error
      if (incidentsRes.error) throw incidentsRes.error
      if (reviewsRes.error) throw reviewsRes.error
      if (staffRes.error) throw staffRes.error

      // Occupancy trend: average occupancy rate across homes per snapshot date
      const occupancyMap = new Map<string, { occupancy: number; capacity: number }>()
      ;(occupancyRes.data ?? []).forEach((snapshot) => {
        const key = snapshot.snapshot_date
        const current = occupancyMap.get(key) ?? { occupancy: 0, capacity: 0 }
        occupancyMap.set(key, {
          occupancy: current.occupancy + snapshot.occupancy,
          capacity: current.capacity + snapshot.capacity,
        })
      })
      const occupancyTrend: OccupancyPoint[] = Array.from(occupancyMap.entries())
        .map(([date, totals]) => ({
          date,
          occupancyRate: totals.capacity > 0 ? (totals.occupancy / totals.capacity) * 100 : 0,
        }))
        .sort((a, b) => (a.date < b.date ? -1 : 1))

      // Incident breakdown
      const incidentBreakdown: IncidentBreakdown = {
        open: 0,
        investigating: 0,
        resolved: 0,
        closed: 0,
        critical: 0,
      }
      ;(incidentsRes.data ?? []).forEach((incident) => {
        switch (incident.status) {
          case 'open':
            incidentBreakdown.open += 1
            break
          case 'investigating':
            incidentBreakdown.investigating += 1
            break
          case 'resolved':
            incidentBreakdown.resolved += 1
            break
          case 'closed':
            incidentBreakdown.closed += 1
            break
        }
        if (incident.severity === 'critical') {
          incidentBreakdown.critical += 1
        }
      })

      // Review pipeline
      const reviewPipeline: ReviewPipeline = {
        overdue: 0,
        upcoming: 0,
        completedLast30Days: 0,
      }
      ;(reviewsRes.data ?? []).forEach((review) => {
        const scheduled = review.scheduled_for ? new Date(review.scheduled_for) : null
        if (!scheduled) return
        if (review.status !== 'completed' && scheduled < today) {
          reviewPipeline.overdue += 1
        } else if (review.status !== 'completed' && scheduled >= today) {
          reviewPipeline.upcoming += 1
        }
        if (review.completed_at) {
          const completed = new Date(review.completed_at)
          if (completed >= thirtyDaysAgo) {
            reviewPipeline.completedLast30Days += 1
          }
        }
      })

      // Staff distribution
      const staffDistribution: StaffDistribution = {
        carers: 0,
        managers: 0,
        other: 0,
      }
      ;(staffRes.data ?? [])
        .filter((profile) => profile.is_active)
        .forEach((profile) => {
          switch (profile.role) {
            case 'carer':
              staffDistribution.carers += 1
              break
            case 'manager':
              staffDistribution.managers += 1
              break
            default:
              staffDistribution.other += 1
          }
        })

      setData({
        occupancyTrend,
        incidentBreakdown,
        reviewPipeline,
        staffDistribution,
      })
    } catch (err) {
      console.error('useOwnerAnalytics: failed to fetch analytics', err)
      setError(err instanceof Error ? err.message : 'Unable to load analytics')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [enabled, supabase])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return {
    analytics: data,
    loading,
    error,
    refresh: fetchAnalytics,
  }
}

function formatDateISO(date: Date) {
  return date.toISOString().slice(0, 10)
}
