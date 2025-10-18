'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, FileText, Loader2, AlertCircle, User, Calendar, CheckCircle2, Clock } from 'lucide-react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { useCarePlanDetail } from '@/hooks/use-care-plan-detail'
import { useCarePlanMutations } from '@/hooks/use-care-plan-mutations'
import { CarePlanReviewStatus, CarePlanTaskStatus, Priority } from '@/lib/database.types'
import { cn } from '@/lib/utils'

export default function CarePlanDetailPage() {
  const params = useParams<{ id: string }>()
  const carePlanId = params?.id
  const { profile } = useAuth()
  const { data: carePlan, loading, error, refresh } = useCarePlanDetail(carePlanId, {
    enabled: Boolean(carePlanId),
  })
  const { createVersion, createTask, scheduleReview, updateTaskStatus, updateReviewStatus } =
    useCarePlanMutations()

  const [taskUpdating, setTaskUpdating] = useState<string | null>(null)
  const [reviewUpdating, setReviewUpdating] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [versionDialogOpen, setVersionDialogOpen] = useState(false)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [versionSaving, setVersionSaving] = useState(false)
  const [taskSaving, setTaskSaving] = useState(false)
  const [reviewSaving, setReviewSaving] = useState(false)
  const [versionTitle, setVersionTitle] = useState('')
  const [versionSummary, setVersionSummary] = useState('')
  const [versionEffectiveFrom, setVersionEffectiveFrom] = useState('')
  const [makeVersionActive, setMakeVersionActive] = useState(true)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskPriority, setTaskPriority] = useState<Priority>('medium')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskAssignedTo, setTaskAssignedTo] = useState('')
  const [reviewScheduledFor, setReviewScheduledFor] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')

  const activeVersion = carePlan?.versions?.find((version) => version.is_active) ?? null

  const handleCreateVersion = async () => {
    if (!carePlanId || !profile?.id) {
      setMutationError('You do not have permission to create a care plan version.')
      return
    }
    if (!versionTitle.trim()) {
      setMutationError('Please provide a version title.')
      return
    }
    setVersionSaving(true)
    setMutationError(null)
    try {
      await createVersion({
        carePlanId,
        title: versionTitle.trim(),
        summary: versionSummary.trim() || undefined,
        effectiveFrom: versionEffectiveFrom ? new Date(versionEffectiveFrom).toISOString() : undefined,
        createdBy: profile.id,
        makeActive: makeVersionActive,
      })
      setVersionDialogOpen(false)
      setVersionTitle('')
      setVersionSummary('')
      setVersionEffectiveFrom('')
      setMakeVersionActive(true)
      await refresh()
    } catch (err) {
      console.error(err)
      setMutationError('Failed to create care plan version. Please try again.')
    } finally {
      setVersionSaving(false)
    }
  }

  const handleCreateTask = async () => {
    if (!activeVersion || !profile?.id) {
      setMutationError('No active care plan version available for new tasks.')
      return
    }
    if (!taskTitle.trim()) {
      setMutationError('Please provide a task title.')
      return
    }
    setTaskSaving(true)
    setMutationError(null)
    try {
      await createTask({
        versionId: activeVersion.id,
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        priority: taskPriority,
        dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : null,
        assignedTo: taskAssignedTo.trim() || profile.id,
        createdBy: profile.id,
      })
      setTaskDialogOpen(false)
      setTaskTitle('')
      setTaskDescription('')
      setTaskDueDate('')
      setTaskAssignedTo('')
      setTaskPriority('medium')
      await refresh()
    } catch (err) {
      console.error(err)
      setMutationError('Failed to create care plan task. Please try again.')
    } finally {
      setTaskSaving(false)
    }
  }

  const handleScheduleReview = async () => {
    if (!carePlanId || !profile?.id) {
      setMutationError('You do not have permission to schedule reviews.')
      return
    }
    if (!reviewScheduledFor) {
      setMutationError('Please choose a review date and time.')
      return
    }
    setReviewSaving(true)
    setMutationError(null)
    try {
      await scheduleReview({
        carePlanId,
        scheduledFor: new Date(reviewScheduledFor).toISOString(),
        notes: reviewNotes.trim() || undefined,
        createdBy: profile.id,
      })
      setReviewDialogOpen(false)
      setReviewScheduledFor('')
      setReviewNotes('')
      await refresh()
    } catch (err) {
      console.error(err)
      setMutationError('Failed to schedule review. Please try again.')
    } finally {
      setReviewSaving(false)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="gap-2">
                <Link href="/care-plans">
                  <ArrowLeft className="h-4 w-4" />
                  Back to care plans
                </Link>
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs uppercase tracking-[0.2em]">
                Care Plan Detail
              </Badge>
            </div>
          </div>

          {mutationError ? (
            <Card>
              <CardContent className="flex items-center justify-between gap-3 border border-red-200 bg-red-50 py-4 dark:border-red-500/40 dark:bg-red-500/10">
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-200">
                  <AlertCircle className="h-4 w-4" />
                  {mutationError}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setMutationError(null)}>
                  Dismiss
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {loading ? (
            <Card>
              <CardContent className="flex items-center gap-3 py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading care plan…</span>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="py-10 text-center">
                <AlertCircle className="mx-auto mb-3 h-6 w-6 text-red-500" />
                <p className="text-sm text-red-500">{error}</p>
                <Button onClick={refresh} variant="outline" size="sm" className="mt-4">
                  Try again
                </Button>
              </CardContent>
            </Card>
          ) : carePlan ? (
            <>
              <Card className="border-white/40 bg-card/90 supports-[backdrop-filter]:backdrop-blur-xl dark:border-white/10">
                <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4 text-primary" />
                      Care Plan #{carePlan.id.slice(0, 8)}
                    </div>
                    <CardTitle className="text-2xl">{carePlan.title}</CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                      {carePlan.description || 'No summary provided for this care plan yet.'}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={cn(carePlan.is_active ? 'bg-emerald-500' : 'bg-slate-500')}>
                      {carePlan.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {carePlan.created_at ? (
                      <Badge variant="outline" className="text-xs">
                        Created {formatDate(carePlan.created_at)}
                      </Badge>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {(profile?.role === 'manager' || profile?.role === 'business_owner') && (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => setVersionDialogOpen(true)}>
                        Publish New Version
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (!carePlan?.versions?.some((version) => version.is_active)) {
                            setMutationError('You need an active version before adding tasks.')
                            return
                          }
                          setTaskDialogOpen(true)
                        }}
                      >
                        Add Care Plan Task
                      </Button>
                      <Button size="sm" onClick={() => setReviewDialogOpen(true)}>
                        Schedule Review
                      </Button>
                    </div>
                  )}
                  <section>
                    <h3 className="text-sm font-semibold text-muted-foreground">Resident Context</h3>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <SummaryItem
                        label="Resident"
                        icon={<User className="h-4 w-4" />}
                        value={
                          carePlan.client
                            ? `${carePlan.client.first_name} ${carePlan.client.last_name}`
                            : 'Not linked'
                        }
                      />
                      <SummaryItem
                        label="Created By"
                        value={
                          carePlan.created_by_profile
                            ? `${carePlan.created_by_profile.first_name} ${carePlan.created_by_profile.last_name}`
                            : 'Unknown'
                        }
                      />
                      <SummaryItem
                        label="Start Date"
                        icon={<Calendar className="h-4 w-4" />}
                        value={formatDate(carePlan.start_date)}
                      />
                      <SummaryItem
                        label="Review Date"
                        icon={<Calendar className="h-4 w-4" />}
                        value={formatDate(carePlan.review_date)}
                        tone={getReviewTone(carePlan.review_date)}
                      />
                    </div>
                  </section>

                  <div className="my-6 border-t border-muted" />

                  <section className="grid gap-6 lg:grid-cols-2">
                    <Card className="border-none bg-muted/40">
                      <CardHeader>
                        <CardTitle className="text-base">Plan Versions</CardTitle>
                        <CardDescription>
                          Track historical updates and compare current interventions
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {carePlan.versions.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No versions recorded yet. Publish a version to start tracking changes.
                          </p>
                        ) : (
                          carePlan.versions.map((version) => (
                            <div
                              key={version.id}
                              className={cn(
                                'rounded-2xl border p-4 transition-smooth',
                                version.is_active
                                  ? 'border-primary/40 bg-primary/5 shadow-soft'
                                  : 'border-muted bg-card/80'
                              )}
                            >
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-medium">
                                    Version {version.version_number}{' '}
                                    {version.is_active ? '(Active)' : null}
                                  </p>
                                  {version.summary ? (
                                    <p className="mt-1 text-sm text-muted-foreground">{version.summary}</p>
                                  ) : null}
                                </div>
                                <Badge variant="outline" className="text-xs uppercase">
                                  {formatSentenceCase(version.status)}
                                </Badge>
                              </div>
                              <div className="mt-3 grid gap-3 text-xs text-muted-foreground sm:grid-cols-2">
                                <div>
                                  <span className="font-medium text-foreground">
                                    Created:{' '}
                                  </span>
                                  {formatDate(version.created_at)}
                                  {version.created_by_profile ? (
                                    <span className="ml-1">
                                      by {version.created_by_profile.first_name}{' '}
                                      {version.created_by_profile.last_name}
                                    </span>
                                  ) : null}
                                </div>
                                {version.approved_at ? (
                                  <div>
                                    <span className="font-medium text-foreground">
                                      Approved:{' '}
                                    </span>
                                    {formatDate(version.approved_at)}
                                    {version.approved_by_profile ? (
                                      <span className="ml-1">
                                        by {version.approved_by_profile.first_name}{' '}
                                        {version.approved_by_profile.last_name}
                                      </span>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>

                              {version.tasks.length > 0 ? (
                                <div className="mt-4 space-y-3">
                                  {version.tasks.map((task) => (
                                    <div
                                      key={task.id}
                                      className="rounded-xl border border-muted bg-background/80 p-3 text-sm"
                                    >
                                      <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div>
                                          <p className="font-medium text-foreground">{task.title}</p>
                                          {task.description ? (
                                            <p className="mt-1 text-xs text-muted-foreground">
                                              {task.description}
                                            </p>
                                          ) : null}
                                        </div>
                                        <Select
                                          value={task.status}
                                          onValueChange={async (value) => {
                                            if (taskUpdating) return
                                            setTaskUpdating(task.id)
                                            setMutationError(null)
                                            try {
                                              await updateTaskStatus(task.id, value as CarePlanTaskStatus)
                                              await refresh()
                                            } catch (err) {
                                              console.error(err)
                                              setMutationError('Failed to update task status. Please try again.')
                                            } finally {
                                              setTaskUpdating(null)
                                            }
                                          }}
                                          disabled={taskUpdating === task.id}
                                        >
                                          <SelectTrigger className={cn(
                                            'h-8 w-32 text-xs',
                                            taskStatusTone(task.status)
                                          )}>
                                            {taskUpdating === task.id ? (
                                              <span className="inline-flex items-center gap-1 text-xs">
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                Updating…
                                              </span>
                                            ) : (
                                              <SelectValue>
                                                {formatSentenceCase(task.status)}
                                              </SelectValue>
                                            )}
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                        {task.assignee ? (
                                          <span className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {task.assignee.first_name} {task.assignee.last_name}
                                          </span>
                                        ) : null}
                                        {task.due_date ? (
                                          <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            Due {formatDate(task.due_date)}
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="mt-4 text-xs text-muted-foreground">
                                  No tasks defined for this version.
                                </p>
                              )}
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-none bg-muted/40">
                      <CardHeader>
                        <CardTitle className="text-base">Review Schedule</CardTitle>
                        <CardDescription>
                          Monitor completed and upcoming multidisciplinary reviews
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                                {carePlan.reviews.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">
                                    No reviews scheduled yet. Plan a review to keep the care plan current.
                                  </p>
                                ) : (
                                  carePlan.reviews.map((review) => (
                            <div
                              key={review.id}
                              className="rounded-2xl border border-muted bg-card/80 p-4 supports-[backdrop-filter]:backdrop-blur-xl"
                            >
                                  <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                      <p className="font-medium text-sm">
                                        Review scheduled {formatDate(review.scheduled_for)}
                                      </p>
                                  {review.notes ? (
                                    <p className="mt-1 text-xs text-muted-foreground">{review.notes}</p>
                                  ) : null}
                                </div>
                                <Badge variant="outline" className={reviewStatusTone(review.status)}>
                                  {formatSentenceCase(review.status)}
                                </Badge>
                              </div>
                              <div className="mt-2 grid gap-3 text-xs text-muted-foreground sm:grid-cols-2">
                                {review.created_by_profile ? (
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    Planned by {review.created_by_profile.first_name}{' '}
                                    {review.created_by_profile.last_name}
                                  </div>
                                ) : null}
                                {review.completed_at ? (
                                  <div className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Completed {formatDate(review.completed_at)}
                                  </div>
                                ) : null}
                              </div>
                              {review.status !== 'completed' ? (
                                <div className="mt-3">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={reviewUpdating === review.id}
                                    onClick={async () => {
                                      if (reviewUpdating) return
                                      setReviewUpdating(review.id)
                                      setMutationError(null)
                                      try {
                                        await updateReviewStatus(review.id, 'completed')
                                        await refresh()
                                      } catch (err) {
                                        console.error(err)
                                        setMutationError('Failed to update review status. Please try again.')
                                      } finally {
                                        setReviewUpdating(null)
                                      }
                                    }}
                                  >
                                    {reviewUpdating === review.id ? (
                                      <span className="inline-flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Marking…
                                      </span>
                                    ) : (
                                      'Mark as completed'
                                    )}
                                  </Button>
                                </div>
                              ) : null}
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </section>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>

        <Dialog open={versionDialogOpen} onOpenChange={(open) => !versionSaving && setVersionDialogOpen(open)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Publish new care plan version</DialogTitle>
              <DialogDescription>
                Draft a new version of this care plan. You can optionally mark it active immediately.
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                handleCreateVersion()
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="version-title">Title</Label>
                <Input
                  id="version-title"
                  value={versionTitle}
                  onChange={(event) => setVersionTitle(event.target.value)}
                  placeholder="e.g. Spring hydration and mobility update"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="version-summary">Summary</Label>
                <Textarea
                  id="version-summary"
                  value={versionSummary}
                  onChange={(event) => setVersionSummary(event.target.value)}
                  placeholder="Describe the key changes in this version."
                  rows={4}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="version-effective">Effective from</Label>
                  <Input
                    id="version-effective"
                    type="date"
                    value={versionEffectiveFrom}
                    onChange={(event) => setVersionEffectiveFrom(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Activation</Label>
                  <Select
                    value={makeVersionActive ? 'active' : 'draft'}
                    onValueChange={(value) => setMakeVersionActive(value === 'active')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activate immediately</SelectItem>
                      <SelectItem value="draft">Save as draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setVersionDialogOpen(false)}
                  disabled={versionSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={versionSaving}>
                  {versionSaving ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Publishing…
                    </span>
                  ) : (
                    'Publish version'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={taskDialogOpen} onOpenChange={(open) => !taskSaving && setTaskDialogOpen(open)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add care plan task</DialogTitle>
              <DialogDescription>
                Create a new action item on the active care plan version assigned to a team member.
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                handleCreateTask()
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="task-title">Task title</Label>
                <Input
                  id="task-title"
                  value={taskTitle}
                  onChange={(event) => setTaskTitle(event.target.value)}
                  placeholder="e.g. Hydration monitoring"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-description">Description</Label>
                <Textarea
                  id="task-description"
                  value={taskDescription}
                  onChange={(event) => setTaskDescription(event.target.value)}
                  placeholder="Provide any additional context or steps."
                  rows={4}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={taskPriority} onValueChange={(value: Priority) => setTaskPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-due">Due date</Label>
                  <Input
                    id="task-due"
                    type="datetime-local"
                    value={taskDueDate}
                    onChange={(event) => setTaskDueDate(event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-assignee">Assigned to (user ID)</Label>
                <Input
                  id="task-assignee"
                  value={taskAssignedTo}
                  onChange={(event) => setTaskAssignedTo(event.target.value)}
                  placeholder="Leave blank to assign to yourself"
                />
              </div>
              <DialogFooter className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTaskDialogOpen(false)}
                  disabled={taskSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={taskSaving}>
                  {taskSaving ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </span>
                  ) : (
                    'Add task'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={reviewDialogOpen} onOpenChange={(open) => !reviewSaving && setReviewDialogOpen(open)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule care plan review</DialogTitle>
              <DialogDescription>
                Set the date and optional notes for the next multidisciplinary review.
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                handleScheduleReview()
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="review-date">Review date</Label>
                <Input
                  id="review-date"
                  type="datetime-local"
                  value={reviewScheduledFor}
                  onChange={(event) => setReviewScheduledFor(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="review-notes">Notes</Label>
                <Textarea
                  id="review-notes"
                  value={reviewNotes}
                  onChange={(event) => setReviewNotes(event.target.value)}
                  placeholder="Add context for the upcoming review."
                  rows={4}
                />
              </div>
              <DialogFooter className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReviewDialogOpen(false)}
                  disabled={reviewSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={reviewSaving}>
                  {reviewSaving ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Scheduling…
                    </span>
                  ) : (
                    'Schedule review'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

function SummaryItem({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: string
  icon?: React.ReactNode
  tone?: 'muted' | 'warning' | 'danger'
}) {
  const toneClasses =
    tone === 'danger'
      ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-100'
      : tone === 'warning'
        ? 'border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-500/40 dark:bg-yellow-500/10 dark:text-yellow-50'
        : 'border-muted bg-card/80 text-foreground'
  return (
    <div className={cn('rounded-2xl border p-4 supports-[backdrop-filter]:backdrop-blur-xl', toneClasses)}>
      <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

function formatSentenceCase(text: string | null) {
  if (!text) return '—'
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

function formatDate(value: string | null, options: { withTime?: boolean } = {}) {
  if (!value) return '—'
  const date = new Date(value)
  return options.withTime
    ? date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : date.toLocaleDateString(undefined, { dateStyle: 'medium' })
}

function getReviewTone(reviewDate: string | null): 'muted' | 'warning' | 'danger' {
  if (!reviewDate) return 'muted'
  const now = new Date()
  const date = new Date(reviewDate)
  if (date <= now) return 'danger'
  const thirtyDays = new Date()
  thirtyDays.setDate(thirtyDays.getDate() + 30)
  if (date <= thirtyDays) return 'warning'
  return 'muted'
}

function taskStatusTone(status: CarePlanTaskStatus) {
  switch (status) {
    case 'completed':
      return 'border-emerald-400 text-emerald-700 bg-emerald-50'
    case 'in_progress':
      return 'border-blue-400 text-blue-700 bg-blue-50'
    case 'cancelled':
      return 'border-slate-300 text-slate-600 bg-slate-50'
    case 'pending':
    default:
      return 'border-yellow-300 text-yellow-700 bg-yellow-50'
  }
}

function reviewStatusTone(status: CarePlanReviewStatus) {
  switch (status) {
    case 'completed':
      return 'border-emerald-400 text-emerald-700 bg-emerald-50'
    case 'overdue':
      return 'border-red-400 text-red-700 bg-red-50'
    case 'scheduled':
      return 'border-blue-300 text-blue-600 bg-blue-50'
    case 'in_progress':
      return 'border-purple-300 text-purple-600 bg-purple-50'
    case 'cancelled':
      return 'border-slate-300 text-slate-600 bg-slate-50'
    default:
      return 'border-muted text-muted-foreground'
  }
}
