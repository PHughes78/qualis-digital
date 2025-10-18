'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type GuidanceTopic = 'incident' | 'care_plan'

interface GuidanceHelperProps {
  topic: GuidanceTopic
  context: Record<string, string | undefined | null>
  className?: string
}

interface GuidanceResponse {
  message: string
  needsSetup?: boolean
}

export function GuidanceHelper({ topic, context, className }: GuidanceHelperProps) {
  const [guidance, setGuidance] = useState<string>('Fill in the form to receive best-practice tips.')
  const [needsSetup, setNeedsSetup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<NodeJS.Timeout>()
  const lastPayloadRef = useRef<string>('')

  const cleanedContext = useMemo(() => {
    const normalised: Record<string, string> = {}
    Object.entries(context ?? {}).forEach(([key, value]) => {
      if (value && String(value).trim().length > 0) {
        normalised[key] = String(value).trim()
      }
    })
    return normalised
  }, [context])

  const payloadKey = JSON.stringify(cleanedContext)

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (payloadKey === lastPayloadRef.current) return

    if (Object.keys(cleanedContext).length === 0) {
      setGuidance('Fill in the form to receive best-practice tips.')
      setError(null)
      setNeedsSetup(false)
      lastPayloadRef.current = payloadKey
      return
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      fetchGuidance()
    }, 500)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payloadKey, topic])

  const fetchGuidance = async () => {
    if (loading) return
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/guidance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          context: cleanedContext,
        }),
      })

      const data: GuidanceResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch guidance.')
      }

      setGuidance(data.message)
      setNeedsSetup(Boolean(data.needsSetup))
      setError(null)
      lastPayloadRef.current = payloadKey
    } catch (err) {
      console.error('GuidanceHelper:', err)
      setError(err instanceof Error ? err.message : 'Unable to fetch guidance.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={cn('border-dashed border-muted', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          Best Practice Guidance
        </CardTitle>
        <CardDescription>
          Powered by ChatGPT. Your notes stay on this page and are not stored or shared.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          <div className="text-sm leading-6 text-muted-foreground whitespace-pre-line">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating suggestions…
              </span>
            ) : (
              guidance
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchGuidance}
            disabled={loading || Object.keys(cleanedContext).length === 0}
          >
            Refresh tips
          </Button>
          {needsSetup ? (
            <Button asChild size="sm">
              <Link href="/settings/company">Add ChatGPT API key</Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
