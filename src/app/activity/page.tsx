"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, ArrowLeft, ArrowRight, ClipboardList, Clock, RefreshCw, Search } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useAuditEvents } from "@/hooks/use-audit-events"
import type { Database } from "@/lib/database.types"

type AuditRow = Database["public"]["Tables"]["audit_events"]["Row"]

const ENTITY_OPTIONS: { label: string; value: string | "all"; description: string }[] = [
  { label: "All activity", value: "all", description: "Every recorded action" },
  { label: "Incidents", value: "incident", description: "Incident creation and updates" },
  { label: "Care plans", value: "care_plan", description: "Care plan lifecycle events" },
  { label: "Notifications", value: "notification", description: "Notification queue actions" },
]

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

function ActivityListItem({
  item,
  isActive,
  onSelect,
}: {
  item: AuditRow & {
    actor?: { id: string; first_name: string; last_name: string }
  }
  isActive: boolean
  onSelect: (item: AuditRow & { actor?: { id: string; first_name: string; last_name: string } }) => void
}) {
  const actorName =
    item.actor?.first_name && item.actor?.last_name
      ? `${item.actor.first_name} ${item.actor.last_name}`
      : "System"

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
          <div className="flex size-9 items-center justify-center rounded-xl bg-secondary/15 text-secondary-foreground">
            <ClipboardList className="size-4" />
          </div>
          <div>
            <p className="line-clamp-1 font-semibold text-foreground">{item.action}</p>
            <p className="text-xs text-muted-foreground">
              {actorName} · {formatDateTime(item.created_at)}
            </p>
          </div>
        </div>
        <Badge variant="outline">{item.entity_type}</Badge>
      </div>
      {item.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>}
    </button>
  )
}

function ActivityDetail({
  item,
}: {
  item:
    | (AuditRow & {
        actor?: { id: string; first_name: string; last_name: string }
      })
    | null
}) {
  if (!item) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
        <ClipboardList className="size-8 text-muted-foreground/70" />
        <p>Select an activity entry to inspect metadata.</p>
      </div>
    )
  }

  const actorName =
    item.actor?.first_name && item.actor?.last_name
      ? `${item.actor.first_name} ${item.actor.last_name}`
      : "System"

  const metadata =
    item.metadata && typeof item.metadata === "object"
      ? (item.metadata as Record<string, unknown>)
      : undefined
  const metadataEntries = metadata ? Object.entries(metadata) : []

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-foreground">{item.action}</h3>
        <p className="text-sm text-muted-foreground">{item.description ?? "No description provided."}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Actor</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{actorName}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Timestamp</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{formatDateTime(item.created_at)}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Entity</p>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="outline">{item.entity_type}</Badge>
            {item.entity_id && (
              <span className="text-xs text-muted-foreground" title={item.entity_id}>
                #{item.entity_id.slice(0, 8)}…
              </span>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Care home context</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {item.care_home_id ? `Care home ${item.care_home_id.slice(0, 8)}…` : "Organisation-wide"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Metadata</p>
        {metadataEntries.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No additional metadata captured for this action.</p>
        ) : (
          <div className="mt-3 space-y-2 text-sm">
            {metadataEntries.map(([key, value]) => (
              <div key={key} className="rounded-lg border border-border/50 bg-card/70 p-2">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">{key}</span>
                <pre className="mt-1 whitespace-pre-wrap break-words text-foreground">
                  {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ActivityPage() {
  const { profile, loading: authLoading } = useAuth()

  const [entityFilter, setEntityFilter] = useState<string | "all">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [selectedEvent, setSelectedEvent] = useState<
    (AuditRow & { actor?: { id: string; first_name: string; last_name: string } }) | null
  >(null)

  const deferredSearch = useDeferredValue(searchTerm)

  const { events, loading, error, total, hasMore, refresh } = useAuditEvents({
    enabled: !!profile,
    limit: 12,
    page,
    entityType: entityFilter,
    search: deferredSearch,
  })

  useEffect(() => {
    setPage(1)
  }, [entityFilter, deferredSearch])

  useEffect(() => {
    if (events.length === 0) {
      setSelectedEvent(null)
      return
    }

    setSelectedEvent((current) => {
      if (current && events.some((event) => event.id === current.id)) {
        return current
      }
      return events[0]
    })
  }, [events])

  const entitySummary = useMemo(() => {
    const counts = events.reduce<Record<string, number>>((acc, event) => {
      const key = event.entity_type ?? "unknown"
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {})
    return counts
  }, [events])

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
            Unable to load activity feed without an authenticated profile.
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
            <h1 className="text-2xl font-semibold text-foreground">Audit timeline</h1>
            <p className="text-sm text-muted-foreground">
              Explore a comprehensive trail of workflow automations, notifications, and user actions. Filter by entity
              type or search metadata to investigate compliance questions quickly.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-secondary/30 bg-secondary/15">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-secondary-foreground">Events this page</CardTitle>
                <CardDescription>Entries retrieved with current filters</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{events.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-foreground">Entity breakdown</CardTitle>
                <CardDescription>Counts for visible events</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2 text-xs">
                {Object.entries(entitySummary).length === 0 ? (
                  <span className="text-muted-foreground">No events to summarise.</span>
                ) : (
                  Object.entries(entitySummary).map(([entity, count]) => (
                    <Badge key={entity} variant="outline">
                      {entity}: {count}
                    </Badge>
                  ))
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-foreground">Total results</CardTitle>
                <CardDescription>Across current filters</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{total}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex gap-2">
                  {ENTITY_OPTIONS.map((option) => {
                    const isActive = entityFilter === option.value
                    return (
                      <Button
                        key={option.value}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEntityFilter(option.value)}
                        className="rounded-full"
                      >
                        {option.label}
                      </Button>
                    )
                  })}
                </div>

                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search action, description, metadata..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="pl-9"
                  />
                </div>

                <Button variant="outline" size="icon" onClick={() => refresh()} title="Refresh activity">
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
                    ) : events.length === 0 ? (
                      <div className="flex h-[480px] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Clock className="size-8 text-muted-foreground/70" />
                        <p>No audit events found for the selected filters.</p>
                      </div>
                    ) : (
                      events.map((event) => (
                        <ActivityListItem
                          key={event.id}
                          item={event}
                          isActive={selectedEvent?.id === event.id}
                          onSelect={setSelectedEvent}
                        />
                      ))
                    )}
                  </div>
                </div>

                <div className="flex h-[520px] flex-col rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Details</h2>
                    <Badge variant="outline" className="uppercase">
                      {selectedEvent?.entity_type ?? "N/A"}
                    </Badge>
                  </div>

                  <div className="mt-4 flex-1 overflow-auto rounded-xl border border-border/60 bg-card/80 p-4">
                    <ActivityDetail item={selectedEvent} />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">
                  Showing {(page - 1) * 12 + 1}-{(page - 1) * 12 + events.length} of {total}
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
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
