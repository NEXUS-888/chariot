// src/lib/api.ts
const base = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
const API = base || '/api' // uses proxy if VITE_API_URL is empty

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${text}`)
  }
  return res.json() as Promise<T>
}

export type Crisis = {
  id: number
  title: string
  category: string
  description?: string
  severity?: number
  latitude: number
  longitude: number
  source_api?: string
  last_updated?: string
}

export type Paginated<T> = { total: number; items: T[] }

export async function fetchCrises(params: {
  q?: string
  category?: string
  sort?: 'severity' | 'last_updated' | 'id'
  limit?: number
  offset?: number
}): Promise<Paginated<Crisis>> {
  const usp = new URLSearchParams()
  if (params.q) usp.set('q', params.q)
  if (params.category) usp.set('category', params.category)
  if (params.sort) usp.set('sort', params.sort)
  if (params.limit != null) usp.set('limit', String(params.limit))
  if (params.offset != null) usp.set('offset', String(params.offset))
  const res = await fetch(`${API}/crises/?${usp.toString()}`)
  return json<Paginated<Crisis>>(res)
}

export type Charity = {
  id: number
  name: string
  description?: string
  website?: string
  logo_url?: string
  related_crisis_id?: number
  verified: boolean
}

export async function fetchCharities(params: { crisis_id?: number }): Promise<Charity[]> {
  const usp = new URLSearchParams()
  if (params.crisis_id != null) usp.set('crisis_id', String(params.crisis_id))
  const res = await fetch(`${API}/charities/?${usp.toString()}`)
  console.log('📡 Response status:', res.status, res.statusText)

  if (!res.ok) {
    const errorText = await res.text()
    console.error('❌ API Error response:', errorText)
    throw new Error(`Failed to fetch charities: ${res.status} ${errorText}`)
  }

  const data = await res.json()
  console.log('📦 Raw charities data received:', data)
  console.log('📦 Type of data:', Array.isArray(data) ? 'Array' : typeof data)
  console.log('📦 Number of items:', Array.isArray(data) ? data.length : 'N/A')

  return data
}
