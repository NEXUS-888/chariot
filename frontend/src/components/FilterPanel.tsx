export default function FilterPanel({ q, setQ, category, setCategory, selected, charities }: any) {
  const cats = ['Disaster','Hunger','Health','Conflict','Climate']
  return (
    <div className="p-4 border-l space-y-4 bg-white/90 overflow-y-auto">
      <div>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search..." className="w-full border rounded p-2" />
      </div>
      <div className="flex gap-2 flex-wrap">
        {cats.map(c => (
          <button key={c} onClick={()=>setCategory(c===category?undefined:c)} className={`px-3 py-1 rounded border ${c===category? 'bg-black text-white':'bg-white'}`}>{c}</button>
        ))}
        <button onClick={()=>setCategory(undefined)} className="px-3 py-1 rounded border">Clear</button>
      </div>
      {selected && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">{selected.title}</h3>
          <p className="text-sm text-gray-600">{selected.description}</p>
          <p className="text-sm">Category: <span className="font-medium">{selected.category}</span> · Severity: {selected.severity ?? 'n/a'}</p>
          <div>
            <h4 className="font-semibold">Charities</h4>
            <ul className="list-disc pl-5">
              {charities.map((ch:any)=> (
                <li key={ch.id}><a className="underline" href={ch.website} target="_blank">{ch.name}</a>{ch.verified? ' ✅':''}</li>
              ))}
            </ul>
          </div>
          <a className="inline-block px-4 py-2 rounded bg-emerald-600 text-white" target="_blank" href={`https://opencollective.com/`}>Donate via Open Collective</a>
        </div>
      )}
    </div>
  )
}