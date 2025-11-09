const API = 'http://localhost:8000'
export async function fetchCrises(params: { q?: string; category?: string }) {
  const usp = new URLSearchParams()
  if (params.q) usp.set('q', params.q)
  if (params.category) usp.set('category', params.category)
  const res = await fetch(`${API}/crises/?${usp.toString()}`)
  return res.json()
}
export async function fetchCharities(params: { crisis_id?: number }) {
  const usp = new URLSearchParams()
  if (params.crisis_id) usp.set('crisis_id', String(params.crisis_id))
  const res = await fetch(`${API}/charities/?${usp.toString()}`)
  return res.json()
}