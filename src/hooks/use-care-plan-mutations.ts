'use client'

import { useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  CarePlanReviewStatus,
  CarePlanTaskStatus,
  CarePlanVersionStatus,
  Priority,
} from '@/lib/database.types'

interface CreateCarePlanInput {
  clientId: string
  title: string
  startDate: string
  createdBy: string
  description?: string | null
  goals?: string | null
  interventions?: string | null
  endDate?: string | null
  reviewDate?: string | null
  isActive?: boolean
  clientName?: string
  creatorName?: string
}

interface CreateVersionInput {
  carePlanId: string
  title: string
  summary?: string
  effectiveFrom?: string
  createdBy: string
  makeActive?: boolean
}

interface CreateTaskInput {
  versionId: string
  title: string
  description?: string
  priority?: Priority
  dueDate?: string | null
  assignedTo: string
  createdBy: string
}

interface ScheduleReviewInput {
  carePlanId: string
  scheduledFor: string
  notes?: string
  createdBy: string
}

interface UseCarePlanMutations {
  createCarePlan: (input: CreateCarePlanInput) => Promise<string | null>
  createVersion: (input: CreateVersionInput) => Promise<string | null>
  createTask: (input: CreateTaskInput) => Promise<string | null>
  scheduleReview: (input: ScheduleReviewInput) => Promise<string | null>
  updateTaskStatus: (taskId: string, status: CarePlanTaskStatus) => Promise<void>
  updateReviewStatus: (reviewId: string, status: CarePlanReviewStatus) => Promise<void>
}

export function useCarePlanMutations(): UseCarePlanMutations {
  const supabase = useMemo(() => createClient(), [])

  const createCarePlan = async ({
    clientId,
    title,
    startDate,
    createdBy,
    description,
    goals,
    interventions,
    endDate,
    reviewDate,
    isActive = true,
    clientName,
    creatorName,
  }: CreateCarePlanInput) => {
    if (!clientId || !title || !startDate || !createdBy) {
      throw new Error('Missing required fields for creating a care plan.')
    }

    const payload = {
      client_id: clientId,
      title,
      description: description ?? null,
      goals: goals ?? null,
      interventions: interventions ?? null,
      start_date: startDate,
      end_date: endDate ?? null,
      review_date: reviewDate ?? null,
      is_active: isActive,
      created_by: createdBy,
    }

    const { data, error } = await supabase
      .from('care_plans')
      .insert(payload)
      .select('id')
      .single()

    if (error) {
      throw error
    }

    const carePlanId = data?.id ?? null

    if (carePlanId) {
      try {
        const response = await fetch('/api/workflows/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'care_plan.created',
            carePlanId,
            clientId,
            details: {
              title,
              clientName: clientName ?? null,
              creatorName: creatorName ?? null,
              startDate,
              reviewDate: reviewDate ?? null,
            },
          }),
        })

        if (!response.ok) {
          console.warn('useCarePlanMutations: workflow notification responded with error', response.status)
        }
      } catch (err) {
        console.warn('useCarePlanMutations: workflow notification failed', err)
      }
    }

    return carePlanId
  }

  const createVersion = async ({
    carePlanId,
    title,
    summary,
    effectiveFrom,
    createdBy,
    makeActive = false,
  }: CreateVersionInput) => {
    if (!carePlanId || !title) {
      throw new Error('Missing required fields for care plan version.')
    }

    const { data: latestVersion, error: latestError } = await supabase
      .from('care_plan_versions')
      .select('version_number')
      .eq('care_plan_id', carePlanId)
      .order('version_number', { ascending: false })
      .limit(1)

    if (latestError) {
      throw latestError
    }

    const nextVersionNumber = (latestVersion?.[0]?.version_number ?? 0) + 1

    if (makeActive) {
      await supabase
        .from('care_plan_versions')
        .update({ is_active: false })
        .eq('care_plan_id', carePlanId)
    }

    const versionStatus: CarePlanVersionStatus = makeActive ? 'active' : 'draft'

    const { data, error } = await supabase
      .from('care_plan_versions')
      .insert({
        care_plan_id: carePlanId,
        version_number: nextVersionNumber,
        status: versionStatus,
        title,
        summary,
        effective_from: effectiveFrom ?? null,
        created_by: createdBy,
        approved_by: makeActive ? createdBy : null,
        approved_at: makeActive ? new Date().toISOString() : null,
        is_active: makeActive,
      })
      .select('id')
      .single()

    if (error) {
      throw error
    }

    return data?.id ?? null
  }

  const createTask = async ({
    versionId,
    title,
    description,
    priority,
    dueDate,
    assignedTo,
    createdBy,
  }: CreateTaskInput) => {
    if (!versionId || !title || !assignedTo) {
      throw new Error('Missing required fields for care plan task.')
    }

    const { data, error } = await supabase
      .from('care_plan_tasks')
      .insert({
        care_plan_version_id: versionId,
        title,
        description,
        priority: priority ?? 'medium',
        status: 'pending',
        due_date: dueDate ?? null,
        assigned_to: assignedTo,
        created_by: createdBy,
      })
      .select('id')
      .single()

    if (error) {
      throw error
    }

    return data?.id ?? null
  }

  const scheduleReview = async ({
    carePlanId,
    scheduledFor,
    notes,
    createdBy,
  }: ScheduleReviewInput) => {
    if (!carePlanId || !scheduledFor) {
      throw new Error('Missing required fields for scheduling review.')
    }

    const { data, error } = await supabase
      .from('care_plan_reviews')
      .insert({
        care_plan_id: carePlanId,
        scheduled_for: scheduledFor,
        status: 'scheduled',
        notes,
        created_by: createdBy,
      })
      .select('id')
      .single()

    if (error) {
      throw error
    }

    return data?.id ?? null
  }

  const updateTaskStatus = async (taskId: string, status: CarePlanTaskStatus) => {
    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === 'completed') {
      updates.completed_at = new Date().toISOString()
    } else {
      updates.completed_at = null
    }

    const { error } = await supabase
      .from('care_plan_tasks')
      .update(updates)
      .eq('id', taskId)

    if (error) {
      throw error
    }
  }

  const updateReviewStatus = async (reviewId: string, status: CarePlanReviewStatus) => {
    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === 'completed') {
      updates.completed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('care_plan_reviews')
      .update(updates)
      .eq('id', reviewId)

    if (error) {
      throw error
    }
  }

  return {
    createCarePlan,
    createVersion,
    createTask,
    scheduleReview,
    updateTaskStatus,
    updateReviewStatus,
  }
}
