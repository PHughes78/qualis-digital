'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, FileText, AlertTriangle, Calendar, Clock, User, Loader2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useCarerTasks } from '@/hooks/use-carer-tasks'
import { cn } from '@/lib/utils'

export default function CarerDashboard() {
  const { profile, loading: authLoading } = useAuth()
  const isCarer = profile?.role === 'carer'

  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    refresh,
  } = useCarerTasks(profile?.id, { enabled: isCarer })

  const stats = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const endOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59))

    const uniqueClients = new Set(tasks.map((task) => task.client?.id).filter(Boolean))

    const pendingTasks = tasks.filter((task) => task.status !== 'completed' && task.status !== 'cancelled')
    const dueToday = pendingTasks.filter((task) => {
      if (!task.due_date) return false
      const due = new Date(task.due_date)
      return due >= startOfToday && due <= endOfToday
    })
    const overdue = pendingTasks.filter((task) => {
      if (!task.due_date) return false
      const due = new Date(task.due_date)
      return due < startOfToday
    })

    return {
      uniqueClients: uniqueClients.size,
      pendingTasks: pendingTasks.length,
      dueToday: dueToday.length,
      overdue: overdue.length,
    }
  }, [tasks])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {profile ? `Welcome back, ${profile.first_name}` : 'Welcome back!'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Stay on top of your assigned residents and care tasks today.
          </p>
          {tasksError ? (
            <p className="mt-2 text-sm text-red-500">
              Unable to load your care plan tasks. Please refresh or try again later.
            </p>
          ) : null}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={tasksLoading || authLoading}
          className="inline-flex items-center gap-2"
        >
          {tasksLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh tasks
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="My Residents"
          icon={Users}
          value={stats.uniqueClients}
          loading={tasksLoading || authLoading}
          description={stats.uniqueClients === 0 ? 'No residents assigned yet' : 'Active care plan coverage'}
        />
        <StatCard
          title="Pending Tasks"
          icon={FileText}
          value={stats.pendingTasks}
          loading={tasksLoading || authLoading}
          description={stats.pendingTasks === 0 ? 'All tasks complete' : 'Care plan tasks in progress'}
        />
        <StatCard
          title="Due Today"
          icon={Clock}
          value={stats.dueToday}
          loading={tasksLoading || authLoading}
          description={stats.dueToday === 0 ? 'No tasks due today' : 'Scheduled for completion today'}
        />
        <StatCard
          title="Overdue Tasks"
          icon={AlertTriangle}
          value={stats.overdue}
          loading={tasksLoading || authLoading}
          description={stats.overdue === 0 ? 'All up to date' : 'Needs immediate attention'}
        />
      </div>

      {/* Task List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Care Plan Tasks</CardTitle>
            <CardDescription>
              Prioritised tasks from active care plan versions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tasksLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="h-14 animate-pulse rounded-xl border border-muted bg-muted/40" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active care plan tasks assigned to you right now.
              </p>
            ) : (
              tasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    'flex items-start gap-4 rounded-xl border p-4',
                    taskStatusBadgeVariant(task.status)
                  )}
                >
                  <Badge variant="secondary" className={priorityTone(task.priority)}>
                    {task.priority ? task.priority.toUpperCase() : 'MEDIUM'}
                  </Badge>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-foreground">{task.title}</p>
                    {task.client ? (
                      <p className="text-xs text-muted-foreground">
                        {task.client.first_name} {task.client.last_name}
                        {task.carePlan ? ` · ${task.carePlan.title}` : ''}
                      </p>
                    ) : null}
                    {task.due_date ? (
                      <p className="text-xs text-muted-foreground">
                        Due {formatDate(task.due_date)}
                      </p>
                    ) : null}
                  </div>
                  <Badge variant="outline" className="text-xs uppercase">
                    {formatSentenceCase(task.status)}
                  </Badge>
                </div>
              ))
            )}
            {tasks.length > 5 ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/care-plans">View all tasks</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Handovers</CardTitle>
            <CardDescription>
              Handover summaries will appear here soon
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We’re working on syncing live handover notes. In the meantime, ensure your updates are
              captured in the handover workflow.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/handovers">Open handovers</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to help you work efficiently
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button asChild variant="outline" className="h-20 flex-col space-y-2">
              <Link href="/profile">
                <User className="h-6 w-6" />
                <span>Profile</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col space-y-2">
              <Link href="/clients">
                <Users className="h-6 w-6" />
                <span>View Clients</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col space-y-2">
              <Link href="/care-plans">
                <FileText className="h-6 w-6" />
                <span>Care Plans</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col space-y-2">
              <Link href="/handovers">
                <Calendar className="h-6 w-6" />
                <span>Handovers</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col space-y-2">
              <Link href="/incidents/new">
                <AlertTriangle className="h-6 w-6" />
                <span>Report Incident</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  title,
  icon: Icon,
  value,
  loading,
  description,
}: {
  title: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  value: number
  loading: boolean
  description: string
}) {
  return (
    <Card className="border-white/40 bg-card/90 shadow-soft supports-[backdrop-filter]:backdrop-blur-xl transition-smooth hover:shadow-argon dark:border-white/10 dark:bg-card/80">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? (
            <span className="inline-flex h-6 w-12 animate-pulse rounded-lg bg-muted/60" />
          ) : (
            value.toLocaleString()
          )}
        </div>
        <p className="text-xs text-muted-foreground">{loading ? 'Loading…' : description}</p>
      </CardContent>
    </Card>
  )
}

function formatSentenceCase(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

function formatDate(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return date.toLocaleDateString(undefined, { dateStyle: 'medium' })
}

function taskStatusBadgeVariant(status: string) {
  switch (status) {
    case 'completed':
      return 'border-emerald-200 bg-emerald-50'
    case 'in_progress':
      return 'border-blue-200 bg-blue-50'
    case 'pending':
      return 'border-yellow-200 bg-yellow-50'
    case 'cancelled':
      return 'border-slate-200 bg-slate-50'
    default:
      return 'border-muted bg-card/80'
  }
}

function priorityTone(priority: string | null) {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-700'
    case 'high':
      return 'bg-orange-100 text-orange-700'
    case 'medium':
      return 'bg-yellow-100 text-yellow-700'
    case 'low':
    default:
      return 'bg-slate-100 text-slate-700'
  }
}
