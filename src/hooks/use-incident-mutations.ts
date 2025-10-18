'use client'

import { useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  IncidentActionStatus,
  IncidentSeverity,
  IncidentStatus,
} from '@/lib/database.types'

interface CreateIncidentInput {
  clientId: string
  careHomeId: string
  incidentType: string
  severity: IncidentSeverity
  title: string
  description: string
  incidentDate: string
  reportedBy: string
  location?: string | null
  immediateActionTaken?: string | null
  followUpRequired?: boolean
  followUpNotes?: string | null
  status?: IncidentStatus
  clientName?: string
  reporterName?: string
}

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
  createIncident: (input: CreateIncidentInput) => Promise<string | null>
  createAction: (input: CreateIncidentActionInput) => Promise<string | null>
  createFollowup: (input: CreateIncidentFollowupInput) => Promise<string | null>
}

export function useIncidentMutations(): UseIncidentMutations {
  const supabase = useMemo(() => createClient(), [])

  const createIncident = async ({
    clientId,
    careHomeId,
    incidentType,
    severity,
    title,
    description,
    incidentDate,
    reportedBy,
    location,
    immediateActionTaken,
    followUpRequired = false,
    followUpNotes,
    status = 'open',
    clientName,
    reporterName,
  }: CreateIncidentInput) => {
    if (!clientId || !careHomeId || !incidentType || !title || !description || !reportedBy) {
      throw new Error('Missing required fields for creating an incident.')
    }

    const payload = {
      client_id: clientId,
      care_home_id: careHomeId,
      incident_type: incidentType,
      severity,
      status,
      title,
      description,
      location: location ?? null,
      incident_date: incidentDate,
      immediate_action_taken: immediateActionTaken ?? null,
      follow_up_required: followUpRequired,
      follow_up_notes: followUpRequired ? followUpNotes ?? null : null,
      reported_by: reportedBy,
    }

    const { data, error } = await supabase
      .from('incidents')
      .insert(payload)
      .select('id')
      .single()

    if (error) {
      throw error
    }

    const incidentId = data?.id ?? null

    if (incidentId) {
      try {
        const response = await fetch('/api/workflows/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'incident.created',
            incidentId,
            careHomeId,
            details: {
              incidentType,
              severity,
              clientName: clientName ?? null,
              reporterName: reporterName ?? null,
              incidentDate,
            },
          }),
        })
        if (!response.ok) {
          console.warn('useIncidentMutations: workflow notification responded with error', response.status)
        }
      } catch (err) {
        console.warn('useIncidentMutations: workflow notification failed', err)
      }
    }

    return incidentId
  }

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
    createIncident,
    createAction,
    createFollowup,
  }
}
