'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  Home,
  FileText,
  AlertTriangle,
  Calendar,
  BarChart3,
  UserPlus,
  Plus,
  User,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useManagerDashboardMetrics } from '@/hooks/use-manager-dashboard-metrics'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/hooks/use-notifications'
import type { Database } from '@/lib/database.types'

export default function ManagerDashboard() {
  const { profile, loading: authLoading } = useAuth()
  const isManager = profile?.role === 'manager'

  const {
    metrics,
    loading: metricsLoading,
    error,
    refresh,
  } = useManagerDashboardMetrics({ enabled: isManager })
  const {
    notifications,
    loading: notificationsLoading,
    error: notificationsError,
    refresh: refreshNotifications,
  } = useNotifications(profile?.id, { enabled: isManager, limit: 6 })

  const isLoading = authLoading || metricsLoading

  const metricCards = useMemo(
    () => [
      {
        title: 'Care Homes',
        icon: Home,
        value: metrics.careHomeCount,
        description:
          metrics.careHomeCount > 0
            ? `${metrics.averageOccupancy}% average occupancy`
            : 'No assigned homes yet',
      },
      {
        title: 'Total Clients',
        icon: Users,
        value: metrics.totalClients,
        description:
          metrics.newClientsThisMonth > 0
            ? `+${metrics.newClientsThisMonth} new this month`
            : 'No new admissions this month',
      },
      {
        title: 'Active Staff',
        icon: UserPlus,
        value: metrics.activeStaff,
        description: 'Across assigned homes',
      },
  {
    title: 'Open Incidents',
    icon: AlertTriangle,
    value: metrics.openIncidents,
    description:
      metrics.attentionIncidents > 0
        ? `${metrics.attentionIncidents} require attention`
        : 'All incidents on track',
    href: '/incidents',
  },
  {
    title: 'Care Plan Reviews',
    icon: Calendar,
    value: metrics.overdueCarePlanReviews,
    description:
      metrics.overdueCarePlanReviews > 0
        ? 'Overdue reviews require action'
        : metrics.upcomingCarePlanReviews > 0
          ? `${metrics.upcomingCarePlanReviews} upcoming in 14 days`
          : 'No reviews scheduled soon',
    href: '/care-plans',
  },
],
[metrics]
  )

  if (!isManager && !authLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Manager Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">
            This view is only available to manager accounts. Please contact your administrator if you
            need access.
          </p>
        </div>
      </div>
    )
}

type NotificationQueueRow = Database['public']['Tables']['notification_queue']['Row']

function NotificationRow({ notification }: { notification: NotificationQueueRow }) {
  const payload = (notification.payload && typeof notification.payload === 'object'
    ? notification.payload
    : {}) as Record<string, unknown>

  const message =
    (typeof payload.message === 'string' && payload.message) ||
    notification.subject ||
    'Notification'

  const link = resolveNotificationLink(notification)

  return (
    <div className="rounded-xl border border-muted bg-card/80 p-4 supports-[backdrop-filter]:backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">{message}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {notification.send_after
              ? `Scheduled ${formatDate(notification.send_after, { withTime: true })}`
              : 'Queued for immediate delivery'}
          </p>
        </div>
        <Badge variant="outline" className={notificationTone(notification.status)}>
          {notification.channel.toUpperCase()}
        </Badge>
      </div>
      {link ? (
        <Button asChild variant="outline" size="sm" className="mt-3">
          <Link href={link.href}>{link.label}</Link>
        </Button>
      ) : null}
    </div>
  )
}

function notificationTone(status: NotificationQueueRow['status']) {
  switch (status) {
    case 'queued':
    case 'sending':
      return 'border-blue-300 text-blue-600 bg-blue-50'
    case 'failed':
      return 'border-red-300 text-red-600 bg-red-50'
    default:
      return 'border-muted text-muted-foreground'
  }
}

function resolveNotificationLink(notification: NotificationQueueRow) {
  if (!notification.related_entity_type || !notification.related_entity_id) return null
  switch (notification.related_entity_type) {
    case 'incident':
      return { href: `/incidents/${notification.related_entity_id}`, label: 'View incident' }
    case 'care_plan':
      return { href: `/care-plans/${notification.related_entity_id}`, label: 'View care plan' }
    default:
      return null
  }
}

function formatDate(value: string | null, options: { withTime?: boolean } = {}) {
  if (!value) return '—'
  const date = new Date(value)
  return options.withTime
    ? date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : date.toLocaleDateString(undefined, { dateStyle: 'medium' })
}

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Manager Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Overview of your care homes and team performance.
          </p>
          {error ? (
            <p className="mt-2 text-sm text-red-500">
              Unable to load live metrics. Please refresh or try again later.
            </p>
          ) : null}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isLoading}
          className="inline-flex items-center gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh data
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map(({ title, icon: Icon, value, description, href }) => {
          const card = (
            <Card
              className={cn(
                'border-white/40 bg-card/90 shadow-soft supports-[backdrop-filter]:backdrop-blur-xl transition-smooth hover:shadow-argon dark:border-white/10 dark:bg-card/80',
                href ? 'cursor-pointer' : ''
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <span className="inline-flex h-6 w-12 animate-pulse rounded-lg bg-muted/60" />
                  ) : (
                    value.toLocaleString()
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isLoading ? 'Calculating metrics…' : description}
                </p>
              </CardContent>
            </Card>
          )

          return href ? (
            <Link
              key={title}
              href={href}
              className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {card}
            </Link>
          ) : (
            <div key={title}>{card}</div>
          )
        })}
      </div>

      {/* Care Homes Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Care Homes Overview</CardTitle>
          <CardDescription>
            Current status of all care homes under your management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div>
                  <h3 className="font-medium">Sunrise Manor</h3>
                  <p className="text-sm text-muted-foreground">45 residents • CQC: Good</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">92% Occupancy</Badge>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/care-homes/1">View Details</Link>
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div>
                  <h3 className="font-medium">Meadowbrook Care</h3>
                  <p className="text-sm text-muted-foreground">38 residents • CQC: Outstanding</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">86% Occupancy</Badge>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/care-homes/2">View Details</Link>
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div>
                  <h3 className="font-medium">Oakwood Residence</h3>
                  <p className="text-sm text-muted-foreground">35 residents • CQC: Good</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">83% Occupancy</Badge>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/care-homes/3">View Details</Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Priority Alerts</CardTitle>
            <CardDescription>
              Notifications that require your attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {notificationsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-14 animate-pulse rounded-xl border border-muted bg-muted/40"
                  />
                ))}
              </div>
            ) : notificationsError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-100">
                Unable to load notifications.{' '}
                <button
                  className="font-medium underline underline-offset-2"
                  onClick={() => refreshNotifications()}
                >
                  Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You’re all caught up. No pending notifications right now.
              </p>
            ) : (
              notifications.map((notification) => (
                <NotificationRow key={notification.id} notification={notification} />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Staff Performance</CardTitle>
            <CardDescription>
              Recent team activities and achievements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 border rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium">Sarah Wilson</span>
                <Badge variant="outline">Carer</Badge>
              </div>
              <p className="text-sm text-gray-600">Completed 15 care plan updates this week</p>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium">Mike Davis</span>
                <Badge variant="outline">Senior Carer</Badge>
              </div>
              <p className="text-sm text-gray-600">Excellent handover documentation - 100% completion rate</p>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium">Emma Thompson</span>
                <Badge variant="outline">Carer</Badge>
              </div>
              <p className="text-sm text-gray-600">Completed mandatory training ahead of schedule</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Management Actions</CardTitle>
          <CardDescription>
            Quick access to common management tasks
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
              <Link href="/care-homes">
                <Home className="h-6 w-6" />
                <span>Manage Homes</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col space-y-2">
              <Link href="/clients/new">
                <Plus className="h-6 w-6" />
                <span>Add Client</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col space-y-2">
              <Link href="/reports">
                <BarChart3 className="h-6 w-6" />
                <span>View Reports</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col space-y-2">
              <Link href="/staff">
                <UserPlus className="h-6 w-6" />
                <span>Manage Staff</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
