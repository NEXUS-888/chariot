import { useEffect, useState } from 'react'
import Map from './components/Map'
import FilterPanel from './components/FilterPanel'
import { fetchCrises, fetchCharities } from './lib/api'

export default function App() {
  const [q, setQ] = useState('')
  const [category, setCategory] = useState<string|undefined>()
  const [crises, setCrises] = useState<any[]>([])
  const [selected, setSelected] = useState<any|null>(null)
  const [charities, setCharities] = useState<any[]>([])

  useEffect(() => {
    fetchCrises({ q, category }).then(setCrises)
  }, [q, category])

  useEffect(() => {
    if (selected) fetchCharities({ crisis_id: selected.id }).then(setCharities)
  }, [selected])

  return (
    <div className="h-screen w-screen grid grid-cols-1 md:grid-cols-[1fr_360px]">
      <Map items={crises} onSelect={setSelected} selected={selected} />
      <FilterPanel q={q} setQ={setQ} category={category} setCategory={setCategory} selected={selected} charities={charities} />
    </div>
  )
}