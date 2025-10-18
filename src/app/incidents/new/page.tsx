"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/AuthContext"
import { createClient } from "@/lib/supabase/client"
import { GuidanceHelper } from "@/components/guidance-helper"
import { useIncidentMutations } from "@/hooks/use-incident-mutations"
import { IncidentSeverity } from "@/lib/database.types"

interface ClientOption {
  id: string
  first_name: string
  last_name: string
  care_home_id: string
  care_homes: {
    name: string
  } | null
}

export default function NewIncidentPage() {
  const router = useRouter()
  const { profile, loading: authLoading } = useAuth()
  const { createIncident } = useIncidentMutations()
  const supabase = useMemo(() => createClient(), [])

  const [clients, setClients] = useState<ClientOption[]>([])
  const [loadingClients, setLoadingClients] = useState(true)

  const [clientId, setClientId] = useState("")
  const [incidentDate, setIncidentDate] = useState(() => {
    const iso = new Date().toISOString()
    return iso.substring(0, 16)
  })
  const [incidentType, setIncidentType] = useState("")
  const [severity, setSeverity] = useState<IncidentSeverity>("medium")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [immediateAction, setImmediateAction] = useState("")
  const [followUpRequired, setFollowUpRequired] = useState(false)
  const [followUpNotes, setFollowUpNotes] = useState("")

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, first_name, last_name, care_home_id, care_homes(name)')
          .order('first_name', { ascending: true })

        if (error) throw error
        setClients(data ?? [])
      } catch (err) {
        console.error('Failed to load clients', err)
        setError("Unable to load client records. Please try again later.")
      } finally {
        setLoadingClients(false)
      }
    }

    fetchClients()
  }, [supabase])

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading…</p>
      </div>
    )
  }

  if (!profile || !['manager', 'business_owner', 'carer'].includes(profile.role)) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            You do not have permission to log incidents. Please contact your administrator.
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const selectedClient = clients.find((client) => client.id === clientId)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")

    if (!clientId || !incidentType.trim() || !severity || !description.trim()) {
      setError("Client, incident type, severity, and description are required.")
      return
    }

    if (!selectedClient?.care_home_id) {
      setError("Selected client is not linked to a care home.")
      return
    }

    setSubmitting(true)
    try {
      const incidentId = await createIncident({
        clientId,
        careHomeId: selectedClient.care_home_id,
        incidentType: incidentType.trim(),
        severity,
        status: 'open',
        title: incidentType.trim(),
        description: description.trim(),
        location: location.trim() || null,
        incidentDate: new Date(incidentDate).toISOString(),
        immediateActionTaken: immediateAction.trim() || null,
        followUpRequired,
        followUpNotes: followUpRequired ? followUpNotes.trim() || null : null,
        reportedBy: profile.id,
        clientName: `${selectedClient.first_name} ${selectedClient.last_name}`,
        reporterName: profile.first_name && profile.last_name ? `${profile.first_name} ${profile.last_name}` : profile.email,
      })

      if (!incidentId) {
        throw new Error('Incident created but no identifier returned.')
      }

      router.push(`/incidents/${incidentId}`)
    } catch (err) {
      console.error('Failed to create incident', err)
      setError(err instanceof Error ? err.message : 'Unable to create incident.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Log New Incident</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Record a new incident and capture immediate actions taken.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Incident details</CardTitle>
                <CardDescription>Provide as much context as possible for accurate reporting.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="client">Resident</Label>
                      <Select
                        value={clientId}
                        onValueChange={(value) => setClientId(value)}
                        disabled={loadingClients || submitting}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={loadingClients ? 'Loading residents…' : 'Select resident'} />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.first_name} {client.last_name}
                              {client.care_homes?.name ? ` • ${client.care_homes.name}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="incident-date">Incident date</Label>
                      <Input
                        id="incident-date"
                        type="datetime-local"
                        value={incidentDate}
                        onChange={(event) => setIncidentDate(event.target.value)}
                        max={new Date().toISOString().substring(0, 16)}
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="incident-type">Incident type</Label>
                      <Input
                        id="incident-type"
                        placeholder="e.g. Fall during activity session"
                        value={incidentType}
                        onChange={(event) => setIncidentType(event.target.value)}
                        disabled={submitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="severity">Severity</Label>
                      <Select value={severity} onValueChange={(value) => setSeverity(value)} disabled={submitting}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g. Lounge area"
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what happened, who was involved, and the immediate impact."
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      rows={5}
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="immediate-action">Immediate action taken</Label>
                    <Textarea
                      id="immediate-action"
                      placeholder="Outline interventions delivered immediately after the incident."
                      value={immediateAction}
                      onChange={(event) => setImmediateAction(event.target.value)}
                      rows={4}
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="follow-up-required"
                        checked={followUpRequired}
                        onCheckedChange={(checked) => setFollowUpRequired(Boolean(checked))}
                        disabled={submitting}
                      />
                      <div className="space-y-1 text-sm">
                        <Label htmlFor="follow-up-required">Follow-up required</Label>
                        <p className="text-xs text-muted-foreground">
                          Tick if additional monitoring or actions are needed after the incident.
                        </p>
                      </div>
                    </div>
                    {followUpRequired ? (
                      <Textarea
                        id="follow-up-notes"
                        placeholder="Detail the follow-up steps or monitoring required."
                        value={followUpNotes}
                        onChange={(event) => setFollowUpNotes(event.target.value)}
                        rows={4}
                        disabled={submitting}
                      />
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Saving incident…' : 'Create incident'}
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/incidents">Cancel</Link>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <GuidanceHelper
              topic="incident"
              className="lg:col-span-1"
              context={{
                severity,
                incident_type: incidentType,
                location,
                description,
                immediate_action: immediateAction,
              }}
            />
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
