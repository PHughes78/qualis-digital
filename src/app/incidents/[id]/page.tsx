'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import {
  ArrowLeft,
  AlertTriangle,
  Loader2,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  User,
  Home,
  AlertCircle,
} from 'lucide-react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useIncidentDetail } from '@/hooks/use-incident-detail'
import { useIncidentMutations } from '@/hooks/use-incident-mutations'
import { useAuth } from '@/contexts/AuthContext'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { IncidentSeverity, IncidentStatus } from '@/lib/database.types'

export default function IncidentDetailPage() {
  const params = useParams<{ id: string }>()
  const incidentId = params?.id
  const { profile } = useAuth()
  const { data: incident, loading, error, refresh } = useIncidentDetail(incidentId, { enabled: Boolean(incidentId) })
  const { createAction, createFollowup } = useIncidentMutations()
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [followupDialogOpen, setFollowupDialogOpen] = useState(false)
  const [actionSaving, setActionSaving] = useState(false)
  const [followupSaving, setFollowupSaving] = useState(false)
  const [actionTitle, setActionTitle] = useState('')
  const [actionDescription, setActionDescription] = useState('')
  const [actionAssignedTo, setActionAssignedTo] = useState('')
  const [actionDueAt, setActionDueAt] = useState('')
  const [followupNote, setFollowupNote] = useState('')
  const [followupNextReview, setFollowupNextReview] = useState('')

  const handleCreateAction = async () => {
    if (!incidentId || !profile?.id) {
      setMutationError('You do not have permission to log actions for this incident.')
      return
    }
    if (!actionTitle.trim()) {
      setMutationError('Please provide an action title.')
      return
    }
    setActionSaving(true)
    setMutationError(null)
    try {
      await createAction({
        incidentId,
        title: actionTitle.trim(),
        description: actionDescription.trim() || undefined,
        assignedTo: actionAssignedTo.trim() || profile.id,
        dueAt: actionDueAt ? new Date(actionDueAt).toISOString() : null,
        createdBy: profile.id,
      })
      setActionDialogOpen(false)
      setActionTitle('')
      setActionDescription('')
      setActionAssignedTo('')
      setActionDueAt('')
      await refresh()
    } catch (err) {
      console.error(err)
      setMutationError('Failed to create incident action. Please try again.')
    } finally {
      setActionSaving(false)
    }
  }

  const handleCreateFollowup = async () => {
    if (!incidentId || !profile?.id) {
      setMutationError('You do not have permission to log follow-ups for this incident.')
      return
    }
    if (!followupNote.trim()) {
      setMutationError('Please provide a follow-up note.')
      return
    }
    setFollowupSaving(true)
    setMutationError(null)
    try {
      await createFollowup({
        incidentId,
        note: followupNote.trim(),
        recordedBy: profile.id,
        nextReviewAt: followupNextReview ? new Date(followupNextReview).toISOString() : null,
      })
      setFollowupDialogOpen(false)
      setFollowupNote('')
      setFollowupNextReview('')
      await refresh()
    } catch (err) {
      console.error(err)
      setMutationError('Failed to record follow-up note. Please try again.')
    } finally {
      setFollowupSaving(false)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="gap-2">
                <Link href="/incidents">
                  <ArrowLeft className="h-4 w-4" />
                  Back to incidents
                </Link>
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs uppercase tracking-[0.2em]">
                Incident Detail
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
                <span className="text-sm text-muted-foreground">Loading incident information…</span>
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
          ) : incident ? (
            <>
              <Card className="border-white/40 bg-card/90 supports-[backdrop-filter]:backdrop-blur-xl dark:border-white/10">
                <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      Incident #{incident.id.slice(0, 8)}
                    </div>
                    <CardTitle className="mt-2 text-2xl">{incident.title}</CardTitle>
                    <CardDescription className="mt-3 space-y-1 text-base text-muted-foreground">
                      <p>{incident.description}</p>
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={severityBadgeClass(incident.severity)}>{incident.severity.toUpperCase()}</Badge>
                    <Badge className={statusBadgeClass(incident.status)}>
                      <span className="flex items-center gap-1">
                        {statusIcon(incident.status)}
                        {formatSentenceCase(incident.status)}
                      </span>
                    </Badge>
                    {incident.follow_up_required ? (
                      <Badge variant="outline" className="border-yellow-600 text-yellow-700">
                        Follow-up required
                      </Badge>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <section>
                    <h3 className="text-sm font-semibold text-muted-foreground">Summary</h3>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <SummaryItem
                        label="Incident Type"
                        value={formatSentenceCase(incident.incident_type)}
                      />
                      <SummaryItem
                        label="Incident Date"
                        icon={<Calendar className="h-4 w-4" />}
                        value={formatDate(incident.incident_date)}
                      />
                      <SummaryItem
                        label="Reported By"
                        icon={<User className="h-4 w-4" />}
                        value={
                          incident.reporter
                            ? `${incident.reporter.first_name} ${incident.reporter.last_name}`
                            : 'Unknown'
                        }
                      />
                      <SummaryItem
                        label="Care Home"
                        icon={<Home className="h-4 w-4" />}
                        value={incident.care_home?.name ?? 'Not recorded'}
                      />
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {incident.client ? (
                        <SummaryItem
                          label="Resident"
                          value={`${incident.client.first_name} ${incident.client.last_name}`}
                        />
                      ) : null}
                      {incident.location ? (
                        <SummaryItem
                          label="Location"
                          icon={<MapPin className="h-4 w-4" />}
                          value={incident.location}
                        />
                      ) : null}
                      {incident.immediate_action_taken ? (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-500/40 dark:bg-emerald-500/10">
                          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-200">
                            Immediate Action Taken
                          </p>
                          <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-100">
                            {incident.immediate_action_taken}
                          </p>
                        </div>
                      ) : null}
                      {incident.resolved_date ? (
                        <SummaryItem
                          label="Resolved Date"
                          icon={<CheckCircle2 className="h-4 w-4" />}
                          value={formatDate(incident.resolved_date)}
                        />
                      ) : null}
                    </div>
                  </section>

                  <div className="my-4 border-t border-muted" />

                  <section className="grid gap-6 lg:grid-cols-2">
                    <Card className="border-none bg-muted/40">
                      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <CardTitle className="text-base">Follow-up Actions</CardTitle>
                          <CardDescription>
                            Track tasks assigned to resolve the incident
                          </CardDescription>
                        </div>
                        {(profile?.role === 'manager' || profile?.role === 'business_owner') && (
                          <Button size="sm" variant="outline" onClick={() => setActionDialogOpen(true)}>
                            Add action
                          </Button>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {incident.actions.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No follow-up actions have been logged yet.
                          </p>
                        ) : (
                          incident.actions.map((action) => (
                            <div
                              key={action.id}
                              className={cn(
                                'rounded-2xl border p-4 transition-smooth',
                                action.status === 'completed'
                                  ? 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-500/40 dark:bg-emerald-500/10'
                                  : 'border-muted bg-card/80'
                              )}
                            >
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <p className="font-medium">{action.title}</p>
                                  {action.description ? (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {action.description}
                                    </p>
                                  ) : null}
                                </div>
                                <Badge variant="outline" className="text-xs uppercase">
                                  {formatSentenceCase(action.status)}
                                </Badge>
                              </div>
                              <div className="mt-3 grid gap-3 text-xs text-muted-foreground sm:grid-cols-2">
                                {action.assignee ? (
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    Assigned to {action.assignee.first_name} {action.assignee.last_name}
                                  </div>
                                ) : null}
                                {action.due_at ? (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Due {formatDate(action.due_at, { withTime: true })}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-none bg-muted/40">
                      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <CardTitle className="text-base">Follow-up Timeline</CardTitle>
                          <CardDescription>
                            Notes recorded while monitoring the resident
                          </CardDescription>
                        </div>
                        {profile && (
                          <Button size="sm" variant="outline" onClick={() => setFollowupDialogOpen(true)}>
                            Add follow-up
                          </Button>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {incident.followups.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No follow-up notes have been recorded yet.
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {incident.followups.map((entry) => (
                              <div key={entry.id} className="relative pl-6">
                                <span className="absolute left-1 top-2 h-3 w-3 rounded-full border-2 border-primary bg-card" />
                                <div className="rounded-2xl border border-muted bg-card/80 p-4">
                                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatDate(entry.recorded_at, { withTime: true })}
                                    </div>
                                    {entry.recorded_by_profile ? (
                                      <div className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {entry.recorded_by_profile.first_name}{' '}
                                        {entry.recorded_by_profile.last_name}
                                      </div>
                                    ) : null}
                                  </div>
                                  <p className="mt-2 text-sm text-foreground">{entry.note}</p>
                                  {entry.next_review_at ? (
                                    <div className="mt-3 inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/5 px-2 py-1 text-xs text-primary">
                                      <AlertCircle className="h-3 w-3" />
                                      Next review {formatDate(entry.next_review_at, { withTime: true })}
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </section>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>

        <Dialog open={actionDialogOpen} onOpenChange={(open) => !actionSaving && setActionDialogOpen(open)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add incident action</DialogTitle>
              <DialogDescription>
                Assign a follow-up action to progress this incident toward resolution.
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                handleCreateAction()
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="action-title">Title</Label>
                <Input
                  id="action-title"
                  value={actionTitle}
                  onChange={(event) => setActionTitle(event.target.value)}
                  placeholder="e.g. Arrange physiotherapy review"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="action-description">Description</Label>
                <Textarea
                  id="action-description"
                  value={actionDescription}
                  onChange={(event) => setActionDescription(event.target.value)}
                  placeholder="Provide additional context or steps for the assignee."
                  rows={4}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="action-assignee">Assigned to (user ID)</Label>
                  <Input
                    id="action-assignee"
                    value={actionAssignedTo}
                    onChange={(event) => setActionAssignedTo(event.target.value)}
                    placeholder="Leave blank to assign to yourself"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="action-due">Due at</Label>
                  <Input
                    id="action-due"
                    type="datetime-local"
                    value={actionDueAt}
                    onChange={(event) => setActionDueAt(event.target.value)}
                  />
                </div>
              </div>
              <DialogFooter className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActionDialogOpen(false)}
                  disabled={actionSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={actionSaving}>
                  {actionSaving ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </span>
                  ) : (
                    'Add action'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog
          open={followupDialogOpen}
          onOpenChange={(open) => !followupSaving && setFollowupDialogOpen(open)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add follow-up note</DialogTitle>
              <DialogDescription>
                Record observations or updates gathered while monitoring this incident.
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                handleCreateFollowup()
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="followup-note">Follow-up note</Label>
                <Textarea
                  id="followup-note"
                  value={followupNote}
                  onChange={(event) => setFollowupNote(event.target.value)}
                  placeholder="Document observations, resident wellbeing, or next steps."
                  rows={4}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="followup-next-review">Next review (optional)</Label>
                <Input
                  id="followup-next-review"
                  type="datetime-local"
                  value={followupNextReview}
                  onChange={(event) => setFollowupNextReview(event.target.value)}
                />
              </div>
              <DialogFooter className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFollowupDialogOpen(false)}
                  disabled={followupSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={followupSaving}>
                  {followupSaving ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Recording…
                    </span>
                  ) : (
                    'Add follow-up'
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
}: {
  label: string
  value: string
  icon?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-muted bg-card/80 p-4 supports-[backdrop-filter]:backdrop-blur-xl">
      <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

function formatSentenceCase(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

function formatDate(
  value: string | null,
  options: { withTime?: boolean } = {}
) {
  if (!value) return '—'
  const date = new Date(value)
  return options.withTime
    ? date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : date.toLocaleDateString(undefined, { dateStyle: 'medium' })
}

function severityBadgeClass(severity: IncidentSeverity) {
  switch (severity) {
    case 'critical':
      return 'bg-red-500 text-white hover:bg-red-500'
    case 'high':
      return 'bg-orange-500 text-white hover:bg-orange-500'
    case 'medium':
      return 'bg-yellow-400 text-black hover:bg-yellow-400'
    case 'low':
    default:
      return 'bg-emerald-500 text-white hover:bg-emerald-500'
  }
}

function statusBadgeClass(status: IncidentStatus) {
  switch (status) {
    case 'open':
      return 'bg-blue-500 text-white hover:bg-blue-500'
    case 'investigating':
      return 'bg-purple-500 text-white hover:bg-purple-500'
    case 'resolved':
      return 'bg-emerald-500 text-white hover:bg-emerald-500'
    case 'closed':
    default:
      return 'bg-slate-500 text-white hover:bg-slate-500'
  }
}

function statusIcon(status: IncidentStatus) {
  switch (status) {
    case 'resolved':
      return <CheckCircle2 className="h-4 w-4" />
    case 'investigating':
      return <AlertCircle className="h-4 w-4" />
    case 'closed':
      return <CheckCircle2 className="h-4 w-4" />
    case 'open':
    default:
      return <AlertTriangle className="h-4 w-4" />
  }
}
