import { NextRequest, NextResponse } from 'next/server'

const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN?.trim() ?? null

type MapboxFeature = {
  id: string
  place_name: string
  text: string
  context?: Array<{
    id: string
    text: string
  }>
  properties?: {
    address?: string
  }
  center?: [number, number]
}

export async function GET(request: NextRequest) {
  const searchTerm = request.nextUrl.searchParams.get('query')?.trim()

  if (!searchTerm || searchTerm.length < 2) {
    return NextResponse.json({ suggestions: [] })
  }

  if (!mapboxToken) {
    console.warn('address-search: MAPBOX_ACCESS_TOKEN is not configured')
    return NextResponse.json({ suggestions: [] }, { status: 200 })
  }

  try {
    const endpoint = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchTerm)}.json`
    )
    endpoint.searchParams.set('access_token', mapboxToken)
    endpoint.searchParams.set('autocomplete', 'true')
    endpoint.searchParams.set('country', 'gb')
    endpoint.searchParams.set('limit', '6')

    const response = await fetch(endpoint.toString(), {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const body = await response.text()
      console.error('address-search: Mapbox lookup failed', response.status, body)
      return NextResponse.json({ suggestions: [] }, { status: 200 })
    }

    const payload = (await response.json()) as { features?: MapboxFeature[] }

    const suggestions =
      payload.features?.map((feature) => {
        const context = feature.context ?? []
        const lookup = (prefix: string) =>
          context.find((item) => item.id.startsWith(prefix))?.text ?? null

        const addressLine =
          feature.properties?.address && !feature.place_name.startsWith(feature.properties.address)
            ? `${feature.properties.address} ${feature.text}`
            : feature.place_name

        return {
          id: feature.id,
          label: feature.place_name,
          address: addressLine,
          title: feature.text,
          city:
            lookup('place') ??
            lookup('locality') ??
            lookup('district') ??
            lookup('region'),
          postcode: lookup('postcode'),
        }
      }) ?? []

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('address-search: unexpected error', error)
    return NextResponse.json({ suggestions: [] }, { status: 200 })
  }
}
