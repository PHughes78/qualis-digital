"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader2, ExternalLink } from "lucide-react"

interface BestPracticeEntry {
  id: string
  title: string
  summary: string | null
  content: string | null
  external_url: string | null
  created_at: string
}

const CQC_BEST_PRACTICE_LINKS = [
  {
    title: "Safe",
    description: "Keeping people safe from abuse and avoidable harm.",
    url: "https://www.cqc.org.uk/about-us/fundamentals-care/safe",
  },
  {
    title: "Effective",
    description: "People’s care, treatment and support achieves good outcomes.",
    url: "https://www.cqc.org.uk/about-us/fundamentals-care/effective",
  },
  {
    title: "Caring",
    description: "Staff involve and treat people with compassion, kindness, dignity and respect.",
    url: "https://www.cqc.org.uk/about-us/fundamentals-care/caring",
  },
  {
    title: "Responsive",
    description: "Services are organised so that they meet people’s needs.",
    url: "https://www.cqc.org.uk/about-us/fundamentals-care/responsive",
  },
  {
    title: "Well-led",
    description: "Leadership, management and governance make sure the service is high-quality.",
    url: "https://www.cqc.org.uk/about-us/fundamentals-care/well-led",
  },
]

export default function BestPracticePage() {
  const router = useRouter()
  const { profile, loading: authLoading } = useAuth()
  const supabase = useMemo(() => createClient(), [])

  const [entries, setEntries] = useState<BestPracticeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [summary, setSummary] = useState("")
  const [content, setContent] = useState("")
  const [externalUrl, setExternalUrl] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!authLoading && (!profile || !["manager", "business_owner"].includes(profile.role))) {
      router.push("/unauthorized")
    }
  }, [profile, authLoading, router])

  useEffect(() => {
    if (!profile) return
    const load = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("company_best_practices")
          .select("id, title, summary, content, external_url, created_at")
          .order("created_at", { ascending: false })

        if (error) throw error
        setEntries(data ?? [])
      } catch (err) {
        console.error(err)
        setError("Unable to load best practice library. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [profile, supabase])

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim()) {
      setError("Title is required.")
      return
    }

    setSaving(true)
    setError("")
    try {
      const { data, error } = await supabase
        .from("company_best_practices")
        .insert({
          title: title.trim(),
          summary: summary.trim() || null,
          content: content.trim() || null,
          external_url: externalUrl.trim() || null,
          created_by: profile?.id ?? null,
        })
        .select("id, title, summary, content, external_url, created_at")
        .single()

      if (error) throw error

      setEntries((prev) => (data ? [data, ...prev] : prev))
      setTitle("")
      setSummary("")
      setContent("")
      setExternalUrl("")
      setDialogOpen(false)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Failed to save best practice entry.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this best practice entry?")) return
    try {
      const { error } = await supabase.from("company_best_practices").delete().eq("id", id)
      if (error) throw error
      setEntries((prev) => prev.filter((entry) => entry.id !== id))
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Failed to delete entry.")
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile || !["manager", "business_owner"].includes(profile.role)) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Best Practice Library</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Add company-specific guidance that supplements CQC requirements and powers the in-app assistant.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add entry</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create best practice entry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bp-title">Title</Label>
                <Input
                  id="bp-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Responding to falls in residential care"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bp-summary">Summary (optional)</Label>
                <Input
                  id="bp-summary"
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  placeholder="One sentence overview of what this guidance covers."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bp-content">Detailed notes</Label>
                <Textarea
                  id="bp-content"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  rows={6}
                  placeholder="Add bullet points or structured guidance. Markdown supported."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bp-link">Reference URL (optional)</Label>
                <Input
                  id="bp-link"
                  value={externalUrl}
                  onChange={(event) => setExternalUrl(event.target.value)}
                  placeholder="https://..."
                />
              </div>
              <DialogFooter className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save entry"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Company guidance</CardTitle>
            <CardDescription>These notes feed into the AI assistant for your managers and carers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-20 animate-pulse rounded-lg border border-muted bg-muted/40" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No best practice entries yet. Add your internal policies, care procedures, or escalation steps.
              </p>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-muted bg-card/80 p-4 supports-[backdrop-filter]:backdrop-blur-xl">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{entry.title}</h3>
                      {entry.summary ? (
                        <p className="text-sm text-muted-foreground">{entry.summary}</p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      {entry.external_url ? (
                        <Button asChild variant="ghost" size="icon">
                          <Link href={entry.external_url} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      ) : null}
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(entry.id)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                  {entry.content ? (
                    <div className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{entry.content}</div>
                  ) : null}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Added {new Date(entry.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CQC domain references</CardTitle>
            <CardDescription>Cross-check internal guidance against the latest CQC fundamentals of care.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {CQC_BEST_PRACTICE_LINKS.map((item) => (
              <div key={item.title} className="rounded-xl border border-muted bg-card/80 p-4 supports-[backdrop-filter]:backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <Badge variant="outline">{item.title}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                <Button asChild variant="link" className="mt-2 px-0 text-sm">
                  <Link href={item.url} target="_blank" rel="noreferrer">
                    View guidance <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
