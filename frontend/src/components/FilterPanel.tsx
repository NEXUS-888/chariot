// src/components/FilterPanel.tsx
import { clsx } from "clsx";

export default function FilterPanel({
  q,
  setQ,
  category,
  setCategory,
  sort,
  setSort,
  limit,
  setLimit,
  offset,
  setOffset,
  total,
  loading,
  error,
  selected,
  charities,
}: any) {
  const categoryColors: Record<string, { active: string; inactive: string }> = {
    disaster: {
      active: "bg-red-500 text-white border-red-500",
      inactive: "bg-slate-100 text-slate-600 border-slate-200 hover:border-red-300",
    },
    climate: {
      active: "bg-green-500 text-white border-green-500",
      inactive: "bg-slate-100 text-slate-600 border-slate-200 hover:border-green-300",
    },
    health: {
      active: "bg-blue-500 text-white border-blue-500",
      inactive: "bg-slate-100 text-slate-600 border-slate-200 hover:border-blue-300",
    },
    hunger: {
      active: "bg-orange-500 text-white border-orange-500",
      inactive: "bg-slate-100 text-slate-600 border-slate-200 hover:border-orange-300",
    },
    conflict: {
      active: "bg-purple-500 text-white border-purple-500",
      inactive: "bg-slate-100 text-slate-600 border-slate-200 hover:border-purple-300",
    },
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Search and Filters */}
      <div className="p-5 space-y-4 flex-shrink-0">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Global Problems</h2>
        <p className="text-sm text-slate-600">Filter and explore active crises.</p>

        {/* Search Input - Pill Shape */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by keyword..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full px-5 py-2.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all duration-200"
          />
          <svg
            className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Category Filter Chips */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-2 uppercase tracking-wider">Category</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategory(undefined)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                !category
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              All
            </button>
            {Object.entries(categoryColors).map(([cat, colors]) => {
              // Capitalize to match backend: "disaster" -> "Disaster"
              const displayName = cat.charAt(0).toUpperCase() + cat.slice(1);
              return (
                <button
                  key={cat}
                  onClick={() => {
                    console.log('Setting category filter to:', displayName);
                    setCategory(displayName);
                  }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                    category === displayName ? colors.active : colors.inactive
                  }`}
                >
                  {displayName}
                </button>
              );
            })}
          </div>
          {category && (
            <button
              onClick={() => setCategory(undefined)}
              className="mt-2 text-xs text-slate-500 hover:text-slate-700 underline"
            >
              Clear filter
            </button>
          )}
        </div>

        {/* Sort and Limit */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wider">Sort by</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-sm focus:bg-white focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all duration-200"
            >
              <option value="last_updated">Recent</option>
              <option value="severity">Severity</option>
              <option value="id">ID</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wider">Limit</label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-sm focus:bg-white focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all duration-200"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">
              Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 transition-colors"
              >
                Prev
              </button>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= total}
                className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-5 pb-5">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && selected && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="font-bold text-lg text-slate-800 mb-2">{selected.title}</h3>
              <p className="text-sm text-slate-600 mb-3">{selected.description}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className={clsx(
                  'px-2 py-1 rounded-full font-medium',
                  categoryColors[selected.category]?.active || 'bg-slate-200 text-slate-700'
                )}>
                  {selected.category}
                </span>
                {selected.severity && (
                  <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                    Severity: {selected.severity}
                  </span>
                )}
              </div>
            </div>

            {charities.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Related Charities</h4>
                <div className="space-y-2">
                  {charities.map((charity: any) => (
                    <div key={charity.id} className="p-3 bg-white rounded-lg border border-slate-200">
                      <div className="font-medium text-slate-800 text-sm">{charity.name}</div>
                      {charity.description && (
                        <div className="text-xs text-slate-600 mt-1 line-clamp-2">{charity.description}</div>
                      )}
                      {charity.donation_url && (
                        <a
                          href={charity.donation_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Donate Now
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
