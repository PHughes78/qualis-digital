'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Activity,
  FileText,
  Home,
  Loader2,
  Search,
  User,
  XCircle,
} from 'lucide-react'

type ResultType = 'client' | 'care_home' | 'care_plan'

type SearchResult = {
  type: ResultType
  id: string
  title: string
  subtitle?: string | null
  href: string
}

type ApiResponse = {
  results: SearchResult[]
  message?: string
}

const typeMeta: Record<
  ResultType,
  {
    label: string
    icon: React.ComponentType<{ className?: string }>
    badgeVariant: 'default' | 'secondary' | 'outline'
  }
> = {
  client: { label: 'Client', icon: User, badgeVariant: 'default' },
  care_home: { label: 'Care Home', icon: Home, badgeVariant: 'secondary' },
  care_plan: { label: 'Care Plan', icon: FileText, badgeVariant: 'outline' },
}

function ResultIcon({ type, className }: { type: ResultType; className?: string }) {
  const Icon = typeMeta[type].icon
  return <Icon className={cn('h-4 w-4 text-primary', className)} />
}

export default function GlobalSearch() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) {
      setResults([])
      setError(null)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    if (query.trim().length < 2) {
      setResults([])
      setError(null)
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as ApiResponse | null
          throw new Error(body?.message ?? 'Search failed.')
        }

        const payload = (await response.json()) as ApiResponse
        setResults(payload.results ?? [])
      } catch (err) {
        if (controller.signal.aborted) return
        console.error('global search: search request failed', err)
        setError(err instanceof Error ? err.message : 'Unable to search at the moment.')
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }, 200)

    return () => {
      controller.abort()
      clearTimeout(timeout)
    }
  }, [query, open])

  const showList = open && query.trim().length >= 2

  const emptyState = useMemo(() => {
    if (loading) return 'Searching…'
    if (error) return error
    if (query.trim().length < 2) return 'Type at least 2 characters to search'
    if (results.length === 0) return 'No matches found'
    return null
  }, [loading, error, query, results])

  const handleSelect = (result: SearchResult) => {
    router.push(result.href)
    setOpen(false)
    setQuery('')
    setResults([])
    setError(null)
    inputRef.current?.blur()
  }

  return (
    <div className="relative w-full max-w-xs">
      <div
        className={cn(
          'flex items-center gap-2 rounded-2xl border border-white/40 bg-white/40 px-4 py-2 text-sm text-muted-foreground shadow-soft transition-smooth focus-within:ring-2 focus-within:ring-primary/40 dark:bg-white/10'
        )}
      >
        <Search className="size-4 flex-shrink-0" />
        <Input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => {
              setOpen(false)
            }, 150)
          }}
          placeholder="Search everything…"
          className="w-full border-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:ring-0"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-8 w-8 rounded-full"
            onClick={() => {
              setQuery('')
              setResults([])
              setError(null)
              setOpen(false)
              inputRef.current?.focus()
            }}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showList && (
        <div className="absolute left-0 right-0 z-20 mt-2 rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <div className="max-h-80 overflow-y-auto py-2">
            {loading && (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching…
              </div>
            )}

            {!loading && emptyState && (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                {emptyState}
              </div>
            )}

            {!loading &&
              !error &&
              results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(result)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                    <ResultIcon type={result.type} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-foreground">{result.title}</p>
                      <Badge variant={typeMeta[result.type].badgeVariant} className="text-[10px]">
                        {typeMeta[result.type].label}
                      </Badge>
                    </div>
                    {result.subtitle && (
                      <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                    )}
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
