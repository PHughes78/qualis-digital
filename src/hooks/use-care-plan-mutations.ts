'use client'

import { useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  CarePlanReviewStatus,
  CarePlanTaskStatus,
  CarePlanVersionStatus,
  Priority,
} from '@/lib/database.types'

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
  createVersion: (input: CreateVersionInput) => Promise<string | null>
  createTask: (input: CreateTaskInput) => Promise<string | null>
  scheduleReview: (input: ScheduleReviewInput) => Promise<string | null>
  updateTaskStatus: (taskId: string, status: CarePlanTaskStatus) => Promise<void>
  updateReviewStatus: (reviewId: string, status: CarePlanReviewStatus) => Promise<void>
}

export function useCarePlanMutations(): UseCarePlanMutations {
  const supabase = useMemo(() => createClient(), [])

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
    createVersion,
    createTask,
    scheduleReview,
    updateTaskStatus,
    updateReviewStatus,
  }
}
