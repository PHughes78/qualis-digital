"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, ArrowLeft, ArrowRight, Bell, CheckCircle2, RefreshCw, Search, XCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useNotifications, NotificationStatusFilter, NotificationChannelFilter } from "@/hooks/use-notifications"
import type { Database, NotificationChannel, NotificationStatus } from "@/lib/database.types"

type NotificationRow = Database["public"]["Tables"]["notification_queue"]["Row"]

const STATUS_OPTIONS: { label: string; value: NotificationStatusFilter }[] = [
  { label: "Active", value: "active" },
  { label: "Queued", value: "queued" },
  { label: "Sending", value: "sending" },
  { label: "Sent", value: "sent" },
  { label: "Failed", value: "failed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "All", value: "all" },
]

const CHANNEL_OPTIONS: { label: string; value: NotificationChannelFilter }[] = [
  { label: "All channels", value: "all" },
  { label: "In-app", value: "in_app" },
  { label: "Email", value: "email" },
  { label: "SMS", value: "sms" },
  { label: "Webhook", value: "webhook" },
]

const STATUS_BADGE_STYLES: Record<NotificationStatus | "active", string> = {
  queued: "border-primary/40 text-primary bg-primary/10",
  sending: "border-blue-400/50 text-blue-500 bg-blue-500/10",
  sent: "border-emerald-400/50 text-emerald-600 bg-emerald-500/10",
  failed: "border-destructive/40 text-destructive bg-destructive/10",
  cancelled: "border-muted text-muted-foreground bg-muted",
  active: "border-primary/40 text-primary bg-primary/10",
}

const CHANNEL_BADGE_STYLES: Record<NotificationChannel, string> = {
  in_app: "bg-purple-500/10 text-purple-600 border-purple-400/40",
  email: "bg-blue-500/10 text-blue-600 border-blue-400/40",
  sms: "bg-emerald-500/10 text-emerald-600 border-emerald-400/40",
  webhook: "bg-amber-500/10 text-amber-600 border-amber-400/40",
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "N/A"
  try {
    const date = new Date(value)
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  } catch {
    return value
  }
}

function NotificationListItem({
  item,
  isActive,
  onSelect,
}: {
  item: NotificationRow
  isActive: boolean
  onSelect: (notification: NotificationRow) => void
}) {
  const payload =
    item.payload && typeof item.payload === "object" ? (item.payload as Record<string, unknown>) : undefined

  const message =
    (typeof payload?.message === "string" && payload.message) ??
    (typeof payload?.description === "string" && payload.description) ??
    item.subject ??
    "Notification"

  const channelStyle = CHANNEL_BADGE_STYLES[item.channel] ?? "bg-muted text-muted-foreground"
  const statusKey = (item.status ?? "queued") as NotificationStatus
  const statusStyle = STATUS_BADGE_STYLES[statusKey] ?? STATUS_BADGE_STYLES.active

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={`w-full rounded-2xl border px-4 py-3 text-left transition-smooth ${
        isActive ? "border-primary/60 bg-primary/10 shadow-soft" : "border-border/60 bg-card/70 hover:bg-card"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bell className="size-4" />
          </div>
          <div>
            <p className="line-clamp-1 font-semibold text-foreground">{message}</p>
            <p className="text-xs text-muted-foreground">Created {formatDateTime(item.created_at)}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant="outline" className={statusStyle}>
            {item.status}
          </Badge>
          <Badge variant="outline" className={channelStyle}>
            {item.channel.replace("_", " ")}
          </Badge>
        </div>
      </div>
    </button>
  )
}

function NotificationDetail({
  item,
}: {
  item: NotificationRow | null
}) {
  if (!item) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
        <Bell className="size-8 text-muted-foreground/70" />
        <p>Select a notification to view details.</p>
      </div>
    )
  }

  const payload =
    item.payload && typeof item.payload === "object"
      ? (item.payload as Record<string, unknown>)
      : undefined

  const payloadEntries = payload ? Object.entries(payload) : []

  const statusKey = (item.status ?? "queued") as NotificationStatus
  const statusStyle = STATUS_BADGE_STYLES[statusKey] ?? STATUS_BADGE_STYLES.active

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{item.subject ?? "Notification details"}</h3>
          <p className="text-sm text-muted-foreground">Created {formatDateTime(item.created_at)}</p>
        </div>
        <Badge variant="outline" className={statusStyle}>
          {item.status}
        </Badge>
      </div>

      <div className="grid gap-3">
        <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
          <p className="text-sm font-medium text-foreground">Channel</p>
          <Badge variant="outline" className={CHANNEL_BADGE_STYLES[item.channel] ?? ""}>
            {item.channel.replace("_", " ")}
          </Badge>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
          <p className="text-sm font-medium text-foreground">Status timeline</p>
          <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
            <li>Queued at {formatDateTime(item.created_at)}</li>
            {item.send_after && <li>Scheduled for {formatDateTime(item.send_after)}</li>}
            {item.sent_at && <li>Sent at {formatDateTime(item.sent_at)}</li>}
            {item.error_message && <li className="text-destructive">Error: {item.error_message}</li>}
          </ul>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
          <p className="text-sm font-medium text-foreground">Payload</p>
          {payloadEntries.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No additional payload values.</p>
          ) : (
            <div className="mt-2 space-y-2 text-sm">
              {payloadEntries.map(([key, value]) => (
                <div key={key} className="flex flex-col rounded-lg border border-border/40 bg-card/60 p-2">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">{key}</span>
                  <span className="font-medium text-foreground">
                    {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const { profile, loading: authLoading } = useAuth()

  const [statusFilter, setStatusFilter] = useState<NotificationStatusFilter>("active")
  const [channelFilter, setChannelFilter] = useState<NotificationChannelFilter>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [selectedNotification, setSelectedNotification] = useState<NotificationRow | null>(null)

  const deferredSearch = useDeferredValue(searchTerm)

  const {
    notifications,
    loading,
    error,
    total,
    hasMore,
    refresh,
    updateNotificationStatus,
    updating,
  } = useNotifications(profile?.id, {
    enabled: !!profile,
    limit: 10,
    page,
    status: statusFilter,
    channel: channelFilter,
    search: deferredSearch,
  })

  useEffect(() => {
    setPage(1)
  }, [statusFilter, channelFilter, deferredSearch])

  useEffect(() => {
    if (notifications.length === 0) {
      setSelectedNotification(null)
      return
    }

    setSelectedNotification((current) => {
      if (current && notifications.some((item) => item.id === current.id)) {
        return current
      }
      return notifications[0]
    })
  }, [notifications])

  const canManageQueue = profile?.role === "business_owner"

  const activeCount = useMemo(
    () => notifications.filter((notification) => notification.status !== "sent" && notification.status !== "cancelled").length,
    [notifications]
  )

  if (authLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex min-h-[60vh] items-center justify-center rounded-3xl border border-border/60 bg-card/70">
            <RefreshCw className="size-6 animate-spin text-muted-foreground" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (!profile) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-100">
            Unable to load notifications without an authenticated profile.
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-foreground">Notification inbox</h1>
            <p className="text-sm text-muted-foreground">
              Review in-app and email notifications generated by Qualis Digital workflows. Use filters to drill into
              specific channels or statuses and explore payload details for troubleshooting.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-primary">Active notifications</CardTitle>
                <CardDescription>Queued or sending notifications for your account</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-primary">{activeCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-foreground">Current filter</CardTitle>
                <CardDescription>Use filters to narrow the queue</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-2">
                <Badge variant="outline">{statusFilter}</Badge>
                {channelFilter !== "all" && <Badge variant="outline">{channelFilter}</Badge>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-foreground">Total results</CardTitle>
                <CardDescription>Across current filters</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-foreground">{total}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as NotificationStatusFilter)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={channelFilter} onValueChange={(value) => setChannelFilter(value as NotificationChannelFilter)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNEL_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search subject or details..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="pl-9"
                  />
                </div>

                <Button variant="outline" size="icon" onClick={() => refresh()} title="Refresh notifications">
                  <RefreshCw className="size-4" />
                </Button>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-100">
                  <AlertCircle className="size-4" />
                  <span>{error}</span>
                  <Button variant="link" size="sm" onClick={() => refresh()}>
                    Retry
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                <div className="h-[520px] overflow-y-auto rounded-2xl border border-border/60 bg-muted/20 p-3">
                  <div className="space-y-2">
                    {loading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 6 }).map((_, idx) => (
                          <div key={idx} className="h-20 animate-pulse rounded-2xl border border-border/40 bg-muted/40" />
                        ))}
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="flex h-[480px] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="size-8 text-emerald-500" />
                        <p>No notifications found for the selected filters.</p>
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <NotificationListItem
                          key={item.id}
                          item={item}
                          isActive={selectedNotification?.id === item.id}
                          onSelect={setSelectedNotification}
                        />
                      ))
                    )}
                  </div>
                </div>

                <div className="flex h-[520px] flex-col rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Details</h2>
                    {selectedNotification && canManageQueue && (
                      <div className="flex gap-2">
                        {selectedNotification.status === "failed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updating}
                            onClick={() => updateNotificationStatus(selectedNotification.id, "queued")}
                          >
                            Retry
                          </Button>
                        )}
                        {selectedNotification.status !== "sent" && (
                          <Button
                            size="sm"
                            disabled={updating}
                            onClick={() => updateNotificationStatus(selectedNotification.id, "sent")}
                          >
                            Mark as sent
                          </Button>
                        )}
                        {selectedNotification.status !== "cancelled" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={updating}
                            onClick={() => updateNotificationStatus(selectedNotification.id, "cancelled")}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex-1 overflow-auto rounded-xl border border-border/60 bg-card/80 p-4">
                    <NotificationDetail item={selectedNotification} />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">
                  Showing {(page - 1) * 10 + 1}-{(page - 1) * 10 + notifications.length} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                    disabled={page === 1 || loading}
                  >
                    <ArrowLeft className="mr-1 size-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((value) => value + 1)}
                    disabled={!hasMore || loading}
                  >
                    Next
                    <ArrowRight className="ml-1 size-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {!canManageQueue && (
            <div className="flex items-start gap-2 rounded-2xl border border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground">
              <XCircle className="mt-0.5 size-4 text-muted-foreground" />
              <p>
                Notification statuses are controlled centrally. Business owners can re-queue or cancel entries from this
                screen. Managers and carers can review payloads and follow up on workflow actions.
              </p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
