'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database, IncidentSeverity, IncidentStatus } from '@/lib/database.types'

type IncidentRow = Database['public']['Tables']['incidents']['Row']
type IncidentActionRow = Database['public']['Tables']['incident_actions']['Row']
type IncidentFollowupRow = Database['public']['Tables']['incident_followups']['Row']
type CareHomeRow = Database['public']['Tables']['care_homes']['Row']
type ClientRow = Database['public']['Tables']['clients']['Row']
type ProfileRow = Database['public']['Tables']['profiles']['Row']

export interface IncidentActionDetail extends IncidentActionRow {
  assignee?: Pick<ProfileRow, 'id' | 'first_name' | 'last_name'>
  created_by_profile?: Pick<ProfileRow, 'id' | 'first_name' | 'last_name'>
}

export interface IncidentFollowupDetail extends IncidentFollowupRow {
  recorded_by_profile?: Pick<ProfileRow, 'id' | 'first_name' | 'last_name'>
}

export interface IncidentDetail extends IncidentRow {
  care_home?: Pick<CareHomeRow, 'id' | 'name' | 'address' | 'postcode'>
  client?: Pick<ClientRow, 'id' | 'first_name' | 'last_name'>
  reporter?: Pick<ProfileRow, 'id' | 'first_name' | 'last_name'>
  actions: IncidentActionDetail[]
  followups: IncidentFollowupDetail[]
}

export interface UseIncidentDetailOptions {
  enabled?: boolean
}

interface UseIncidentDetailReturn {
  data: IncidentDetail | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useIncidentDetail(
  incidentId: string | undefined,
  options: UseIncidentDetailOptions = {}
): UseIncidentDetailReturn {
  const { enabled = true } = options
  const [data, setData] = useState<IncidentDetail | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const fetchIncident = useCallback(async () => {
    if (!incidentId || !enabled) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: incident, error: incidentError } = await supabase
        .from('incidents')
        .select(`
          *,
          care_home:care_homes ( id, name, address, postcode ),
          client:clients ( id, first_name, last_name ),
          reporter:profiles!incidents_reported_by_fkey ( id, first_name, last_name ),
          actions:incident_actions (
            *,
            assignee:profiles!incident_actions_assigned_to_fkey ( id, first_name, last_name ),
            created_by_profile:profiles!incident_actions_created_by_fkey ( id, first_name, last_name )
          ),
          followups:incident_followups (
            *,
            recorded_by_profile:profiles!incident_followups_recorded_by_fkey ( id, first_name, last_name )
          )
        `)
        .eq('id', incidentId)
        .maybeSingle()

      if (incidentError) {
        throw incidentError
      }

      if (!incident) {
        setData(null)
        setError('Incident not found')
        return
      }

      const mapped: IncidentDetail = {
        ...(incident as IncidentRow),
        care_home: (incident as any).care_home ?? undefined,
        client: (incident as any).client ?? undefined,
        reporter: (incident as any).reporter ?? undefined,
        actions: ((incident as any).actions ?? []).map((action: any) => ({
          ...(action as IncidentActionRow),
          assignee: action.assignee ?? undefined,
          created_by_profile: action.created_by_profile ?? undefined,
        })) as IncidentActionDetail[],
        followups: ((incident as any).followups ?? []).map((followup: any) => ({
          ...(followup as IncidentFollowupRow),
          recorded_by_profile: followup.recorded_by_profile ?? undefined,
        })) as IncidentFollowupDetail[],
      }

      mapped.actions.sort(sortActions)
      mapped.followups.sort(sortFollowups)

      setData(mapped)
    } catch (err) {
      console.error('useIncidentDetail: failed to fetch incident', err)
      setError(err instanceof Error ? err.message : 'Unable to load incident')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [incidentId, enabled, supabase])

  useEffect(() => {
    fetchIncident()
  }, [fetchIncident])

  return {
    data,
    loading,
    error,
    refresh: fetchIncident,
  }
}

function sortActions(a: IncidentActionDetail, b: IncidentActionDetail) {
  const getComparableStatus = (status: IncidentStatus) => {
    const ordering: Record<IncidentStatus, number> = {
      open: 0,
      investigating: 1,
      resolved: 2,
      closed: 3,
    }
    return ordering[status as IncidentStatus] ?? 99
  }

  const aStatusOrder = getComparableStatus(a.status as IncidentStatus)
  const bStatusOrder = getComparableStatus(b.status as IncidentStatus)

  if (aStatusOrder !== bStatusOrder) {
    return aStatusOrder - bStatusOrder
  }

  const aDue = a.due_at ? new Date(a.due_at).getTime() : Infinity
  const bDue = b.due_at ? new Date(b.due_at).getTime() : Infinity
  return aDue - bDue
}

function sortFollowups(a: IncidentFollowupDetail, b: IncidentFollowupDetail) {
  const aRecorded = a.recorded_at ? new Date(a.recorded_at).getTime() : 0
  const bRecorded = b.recorded_at ? new Date(b.recorded_at).getTime() : 0
  return bRecorded - aRecorded
}
