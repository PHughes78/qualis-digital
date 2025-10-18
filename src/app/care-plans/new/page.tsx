"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { useAuth } from "@/contexts/AuthContext"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GuidanceHelper } from "@/components/guidance-helper"

interface ClientOption {
  id: string
  first_name: string
  last_name: string
  care_homes: {
    name: string
  } | null
}

export default function NewCarePlanPage() {
  const router = useRouter()
  const { profile, loading: authLoading } = useAuth()
  const supabase = useMemo(() => createClient(), [])

  const [clients, setClients] = useState<ClientOption[]>([])
  const [loadingClients, setLoadingClients] = useState(true)

  const [clientId, setClientId] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [goals, setGoals] = useState("")
  const [interventions, setInterventions] = useState("")
  const [startDate, setStartDate] = useState(() => new Date().toISOString().substring(0, 10))
  const [endDate, setEndDate] = useState("")
  const [reviewDate, setReviewDate] = useState("")

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, first_name, last_name, care_homes(name)')
          .order('first_name', { ascending: true })

        if (error) throw error
        setClients(data ?? [])
      } catch (err) {
        console.error('Failed to load clients', err)
        setError("Unable to load clients. Please try again later.")
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

  if (!profile || !['manager', 'business_owner'].includes(profile.role)) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            You do not have permission to create care plans. Please contact your administrator.
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")

    if (!clientId || !title.trim()) {
      setError("Client and title are required.")
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        client_id: clientId,
        title: title.trim(),
        description: description.trim() || null,
        goals: goals.trim() || null,
        interventions: interventions.trim() || null,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        review_date: reviewDate ? new Date(reviewDate).toISOString() : null,
        is_active: true,
        created_by: profile.id,
      }

      const { data, error: insertError } = await supabase
        .from('care_plans')
        .insert(payload)
        .select('id')
        .single()

      if (insertError) throw insertError

      router.push(`/care-plans/${data?.id}`)
    } catch (err) {
      console.error('Failed to create care plan', err)
      setError(err instanceof Error ? err.message : 'Unable to create care plan.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create Care Plan</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Capture a new person-centred care plan for one of your residents.
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
                <CardTitle>Care plan details</CardTitle>
                <CardDescription>Include the multidisciplinary goals and interventions agreed.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="resident">Resident</Label>
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
                      <Label htmlFor="title">Plan title</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="e.g. Mobility & hydration support"
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Summary</Label>
                    <Textarea
                      id="description"
                      rows={4}
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Provide an overview of the resident's needs and approach."
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goals">Goals</Label>
                    <Textarea
                      id="goals"
                      rows={4}
                      value={goals}
                      onChange={(event) => setGoals(event.target.value)}
                      placeholder="List measurable outcomes (one per line)."
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interventions">Interventions</Label>
                    <Textarea
                      id="interventions"
                      rows={4}
                      value={interventions}
                      onChange={(event) => setInterventions(event.target.value)}
                      placeholder="Outline interventions or support strategies."
                      disabled={submitting}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                        disabled={submitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End date (optional)</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(event) => setEndDate(event.target.value)}
                        disabled={submitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="review-date">Review date (optional)</Label>
                      <Input
                        id="review-date"
                        type="date"
                        value={reviewDate}
                        onChange={(event) => setReviewDate(event.target.value)}
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Saving care plan…' : 'Create care plan'}
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/care-plans">Cancel</Link>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <GuidanceHelper
              topic="care_plan"
              className="lg:col-span-1"
              context={{
                description,
                goals,
                interventions,
              }}
            />
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
