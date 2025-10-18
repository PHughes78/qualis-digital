'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Loader2, MapPin, Search } from 'lucide-react'

type AddressSuggestion = {
  id: string
  label: string
  address: string
  title: string
  city: string | null
  postcode: string | null
}

type Props = {
  id?: string
  value: string
  onChange: (value: string) => void
  onSuggestionSelect?: (suggestion: AddressSuggestion) => void
  placeholder?: string
  disabled?: boolean
  error?: string | null
  required?: boolean
}

export default function AddressAutocompleteInput({
  id,
  value,
  onChange,
  onSuggestionSelect,
  placeholder,
  disabled,
  error,
  required,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    if (!open) {
      setSuggestions([])
      return
    }

    const trimmed = query.trim()
    if (trimmed.length < 3) {
      setSuggestions([])
      setLoading(false)
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    setLoading(true)

    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/address-search?query=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          setSuggestions([])
          return
        }

        const payload = (await response.json()) as { suggestions: AddressSuggestion[] }
        setSuggestions(payload.suggestions ?? [])
      } catch (fetchError) {
        if (controller.signal.aborted) return
        console.error('address autocomplete: fetch failed', fetchError)
        setSuggestions([])
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }, 200)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [query, open])

  const helperText = useMemo(() => {
    if (!open) return null
    if (loading) return 'Searching for addresses…'
    if (query.trim().length < 3) return 'Type at least 3 characters'
    if (suggestions.length === 0) return 'No matches found'
    return null
  }, [open, loading, query, suggestions])

  const handleSelect = (suggestion: AddressSuggestion) => {
    onChange(suggestion.address)
    onSuggestionSelect?.(suggestion)
    setOpen(false)
    setSuggestions([])
    setQuery(suggestion.address)
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-xs focus-within:ring-2 focus-within:ring-primary/40">
        <Search className="h-4 w-4 text-slate-400" />
        <Input
          id={id}
          ref={inputRef}
          value={query}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150)
          }}
          onChange={(event) => {
            setQuery(event.target.value)
            onChange(event.target.value)
            setOpen(true)
          }}
          placeholder={placeholder ?? 'Start typing address'}
          className="border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
      </div>
      {(error || helperText) && (
        <p
          className={cn(
            'mt-1 text-xs',
            error ? 'text-red-600' : 'text-slate-500'
          )}
        >
          {error ?? helperText}
        </p>
      )}

      {open && (loading || suggestions.length > 0) && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
          <div className="max-h-60 overflow-auto py-2">
            {loading && (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching…
              </div>
            )}

            {!loading && suggestions.length === 0 && (
              <div className="px-3 py-2 text-sm text-slate-500">{helperText}</div>
            )}

            {!loading &&
              suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(suggestion)}
                  className="flex w-full items-start gap-3 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                >
                  <span className="mt-1">
                    <MapPin className="h-4 w-4 text-blue-600" />
                  </span>
                  <span>
                    <span className="block font-medium text-slate-900">{suggestion.address}</span>
                    <span className="block text-xs text-slate-500">
                      {[suggestion.city, suggestion.postcode].filter(Boolean).join(' • ')}
                    </span>
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
