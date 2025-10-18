import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

type SearchResult =
  | {
      type: 'client'
      id: string
      title: string
      subtitle: string | null
      href: string
      meta?: {
        careHome?: string | null
      }
    }
  | {
      type: 'care_home'
      id: string
      title: string
      subtitle: string | null
      href: string
    }
  | {
      type: 'care_plan'
      id: string
      title: string
      subtitle: string | null
      href: string
      meta?: {
        clientName?: string | null
      }
    }

function buildPattern(term: string) {
  return `%${term.replace(/[%_]/g, (match) => `\\${match}`)}%`
}

export async function GET(request: NextRequest) {
  const term = new URL(request.url).searchParams.get('q')?.trim()

  if (!term || term.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const pattern = buildPattern(term)

  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ results: [] }, { status: 401 })
    }

    const [clientsResult, careHomesResult, carePlansResult] = await Promise.all([
      supabase
        .from('clients')
        .select('id, first_name, last_name, care_homes(name)')
        .or(`first_name.ilike.${pattern},last_name.ilike.${pattern}`)
        .limit(6),
      supabase
        .from('care_homes')
        .select('id, name, city')
        .ilike('name', pattern)
        .limit(6),
      supabase
        .from('care_plans')
        .select('id, title, clients(first_name, last_name)')
        .ilike('title', pattern)
        .limit(6),
    ])

    if (clientsResult.error || careHomesResult.error || carePlansResult.error) {
      throw clientsResult.error || careHomesResult.error || carePlansResult.error
    }

    const results: SearchResult[] = []

    for (const row of clientsResult.data ?? []) {
      results.push({
        type: 'client',
        id: row.id,
        title: `${row.first_name} ${row.last_name}`,
        subtitle: row.care_homes?.name ?? null,
        href: `/clients/${row.id}`,
        meta: {
          careHome: row.care_homes?.name ?? null,
        },
      })
    }

    for (const row of careHomesResult.data ?? []) {
      results.push({
        type: 'care_home',
        id: row.id,
        title: row.name,
        subtitle: row.city ?? null,
        href: `/care-homes/${row.id}`,
      })
    }

    for (const row of carePlansResult.data ?? []) {
      results.push({
        type: 'care_plan',
        id: row.id,
        title: row.title ?? 'Untitled care plan',
        subtitle: row.clients ? `${row.clients.first_name} ${row.clients.last_name}` : null,
        href: `/care-plans/${row.id}`,
        meta: {
          clientName: row.clients ? `${row.clients.first_name} ${row.clients.last_name}` : null,
        },
      })
    }

    const uniqueResults = results.slice(0, 15)

    return NextResponse.json({ results: uniqueResults })
  } catch (error) {
    console.error('search: failed to fetch results', error)
    return NextResponse.json({ results: [], message: 'Unable to complete search.' }, { status: 500 })
  }
}
