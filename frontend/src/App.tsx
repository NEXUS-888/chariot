// src/App.tsx
import { useEffect, useState } from 'react'
import Map from './components/Map'
import FilterPanel from './components/FilterPanel'
import { fetchCrises, fetchCharities, type Crisis, type Charity } from './lib/api'

export default function App() {
  const [q, setQ] = useState('')
  const [category, setCategory] = useState<string | undefined>()
  const [sort, setSort] = useState<'severity' | 'last_updated' | 'id'>('last_updated')
  const [limit, setLimit] = useState(10)
  const [offset, setOffset] = useState(0)

  const [crises, setCrises] = useState<Crisis[]>([])
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState<Crisis | null>(null)
  const [charities, setCharities] = useState<Charity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load crises
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchCrises({ q, category, sort, limit, offset })
      .then(({ items, total }) => {
        if (cancelled) return
        setCrises(items)
        setTotal(total)
        // if selected is no longer in the list, clear it
        if (selected && !items.some((c) => c.id === selected.id)) {
          setSelected(null)
          setCharities([])
        }
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [q, category, sort, limit, offset])

  // Load charities for selected crisis
  useEffect(() => {
    if (!selected) return
    let cancelled = false
    fetchCharities({ crisis_id: selected.id })
      .then((list) => !cancelled && setCharities(list))
      .catch(() => !cancelled && setCharities([]))
    return () => {
      cancelled = true
    }
  }, [selected])

  return (
    <div className="h-screen w-screen grid grid-cols-1 md:grid-cols-[1fr_380px]">
      <Map items={crises} onSelect={setSelected} selected={selected} />
      <FilterPanel
        q={q}
        setQ={setQ}
        category={category}
        setCategory={setCategory}
        sort={sort}
        setSort={setSort}
        limit={limit}
        setLimit={setLimit}
        total={total}
        offset={offset}
        setOffset={setOffset}
        loading={loading}
        error={error}
        selected={selected}
        charities={charities}
      />
    </div>
  )
}
