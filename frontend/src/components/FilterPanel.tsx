// src/components/FilterPanel.tsx
import { clsx } from "clsx";

export default function FilterPanel({
  q,
  setQ,
  category,
  setCategory,
  selected,
  charities,
}: any) {
  const cats = ["Disaster", "Hunger", "Health", "Conflict", "Climate"];

  return (
    <div className="p-4 md:p-5 border-l bg-white/95 backdrop-blur overflow-y-auto space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight">Global Problems</h1>
        <p className="text-sm text-slate-600">Filter and explore active crises.</p>
      </header>

      <div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by keyword…"
          className="w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c === category ? undefined : c)}
            className={clsx(
              "px-3 py-1.5 rounded-full text-sm border transition",
              c === category
                ? "bg-black text-white border-black"
                : "bg-white hover:bg-slate-50"
            )}
          >
            {c}
          </button>
        ))}
        <button
          onClick={() => setCategory(undefined)}
          className="px-3 py-1.5 rounded-full text-sm border hover:bg-slate-50"
        >
          Clear
        </button>
      </div>

      {selected ? (
        <div className="space-y-3 rounded-2xl border shadow-sm p-4">
          <div>
            <h3 className="font-semibold text-lg">{selected.title}</h3>
            <p className="text-sm text-slate-600 mt-1">{selected.description}</p>
            <p className="text-sm mt-1">
              Category: <span className="font-medium">{selected.category}</span>{" "}
              · Severity: {selected.severity ?? "n/a"}
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="font-semibold">Charities</h4>
            <ul className="list-disc pl-5 space-y-1">
              {charities.map((ch: any) => (
                <li key={ch.id}>
                  <a className="underline hover:opacity-80" href={ch.website} target="_blank">
                    {ch.name}
                  </a>
                  {ch.verified ? " ✅" : ""}
                </li>
              ))}
            </ul>
          </div>

          <a
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
            target="_blank"
            href={`https://opencollective.com/`}
          >
            Donate via Open Collective
          </a>
        </div>
      ) : (
        <div className="text-sm text-slate-600">Select a marker to see details.</div>
      )}
    </div>
  );
}
