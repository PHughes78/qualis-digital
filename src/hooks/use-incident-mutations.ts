'use client'

import { useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { IncidentActionStatus } from '@/lib/database.types'

interface CreateIncidentActionInput {
  incidentId: string
  title: string
  description?: string
  assignedTo: string
  dueAt?: string | null
  createdBy: string
  status?: IncidentActionStatus
}

interface CreateIncidentFollowupInput {
  incidentId: string
  note: string
  recordedBy: string
  nextReviewAt?: string | null
}

interface UseIncidentMutations {
  createAction: (input: CreateIncidentActionInput) => Promise<string | null>
  createFollowup: (input: CreateIncidentFollowupInput) => Promise<string | null>
}

export function useIncidentMutations(): UseIncidentMutations {
  const supabase = useMemo(() => createClient(), [])

  const createAction = async ({
    incidentId,
    title,
    description,
    assignedTo,
    dueAt,
    createdBy,
    status = 'pending',
  }: CreateIncidentActionInput) => {
    if (!incidentId || !title || !assignedTo || !createdBy) {
      throw new Error('Missing required fields for incident action.')
    }

    const { data, error } = await supabase
      .from('incident_actions')
      .insert({
        incident_id: incidentId,
        title,
        description,
        status,
        assigned_to: assignedTo,
        due_at: dueAt ?? null,
        created_by: createdBy,
      })
      .select('id')
      .single()

    if (error) {
      throw error
    }

    return data?.id ?? null
  }

  const createFollowup = async ({ incidentId, note, recordedBy, nextReviewAt }: CreateIncidentFollowupInput) => {
    if (!incidentId || !note || !recordedBy) {
      throw new Error('Missing required fields for incident follow-up.')
    }

    const { data, error } = await supabase
      .from('incident_followups')
      .insert({
        incident_id: incidentId,
        note,
        recorded_by: recordedBy,
        next_review_at: nextReviewAt ?? null,
      })
      .select('id')
      .single()

    if (error) {
      throw error
    }

    return data?.id ?? null
  }

  return {
    createAction,
    createFollowup,
  }
}
