// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { motion } from 'framer-motion'
import Map from './components/map/Map'
import LoginPage from './pages/LoginPage'
import GlassDropdown from './components/GlassDropdown'
import { fetchCrises, fetchCharities, type Crisis, type Charity } from './lib/api'

function MapView() {
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
  const [loadingCharities, setLoadingCharities] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load crises
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    console.log('Fetching crises with category:', category)
    fetchCrises({ q, category, sort, limit, offset })
      .then(({ items, total }) => {
        if (cancelled) return
        console.log('Received crises:', items.length, 'category filter:', category)
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
  }, [q, category, sort, limit, offset, selected])

  // Load charities for selected crisis
  useEffect(() => {
    if (!selected) {
      setCharities([])
      return
    }
    
    let cancelled = false
    setLoadingCharities(true)
    console.log('========================================')
    console.log('Fetching charities for crisis ID:', selected.id)
    console.log('Crisis details:', selected)
    
    fetchCharities({ crisis_id: selected.id })
      .then((list) => {
        if (!cancelled) {
          console.log('✅ Received charities:', list)
          console.log('✅ Number of charities:', list.length)
          if (list.length > 0) {
            console.log('✅ First charity:', list[0])
            console.log('✅ First charity donation_url:', list[0]?.donation_url)
          } else {
            console.warn('⚠️ No charities found for this crisis')
          }
          setCharities(list)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('❌ Failed to fetch charities:', err)
          console.error('❌ Error details:', err.message)
          setCharities([])
        }
      })
      .finally(() => !cancelled && setLoadingCharities(false))
    
    return () => {
      cancelled = true
    }
  }, [selected])

  // Dropdown options
  const sortOptions = [
    { value: 'last_updated', label: 'Most Recent' },
    { value: 'severity', label: 'Severity (High-Low)' },
    { value: 'id', label: 'Relevance' },
  ]

  const limitOptions = [
    { value: '10', label: '10' },
    { value: '25', label: '25' },
    { value: '50', label: '50' },
    { value: '100', label: '100' },
  ]

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-50">
      {/* Top Navigation Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-md shadow-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo/Title */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <svg 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="white" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="w-6 h-6"
                >
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2 v 7" />
                  <path d="M12 15 v 7" />
                  <path d="M22 12 h -7" />
                  <path d="M9 12 h -7" />
                  <path d="m19.07 4.93-5 5" />
                  <path d="m9.93 14.07-5 5" />
                  <path d="m4.93 4.93 5 5" />
                  <path d="m14.07 14.07 5 5" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">Global Crises</h1>
                <p className="text-xs text-slate-500">Track and Help Worldwide</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search crises..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full px-4 py-2 pl-10 bg-slate-100 rounded-full border border-slate-200 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                />
                <svg 
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Sorting & Pagination Controls */}
            <div className="flex items-center gap-2">
              <GlassDropdown
                label="Sort"
                value={sort}
                options={sortOptions}
                onChange={(value) => setSort(value as 'severity' | 'last_updated' | 'id')}
              />
              <GlassDropdown
                label="View"
                value={String(limit)}
                options={limitOptions}
                onChange={(value) => {
                  setLimit(Number(value))
                  setOffset(0)
                }}
              />
            </div>

            {/* Results Count */}
            <div className="flex-shrink-0 px-4 py-2 bg-blue-50 rounded-full border border-blue-100">
              <span className="text-sm font-medium text-blue-700">
                {loading ? '...' : total} {total === 1 ? 'crisis' : 'crises'}
              </span>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 mt-3 pb-1 overflow-x-auto">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider mr-1">
              Category:
            </span>
            <button
              onClick={() => {
                setCategory(undefined)
                setOffset(0)
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
                !category
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            {['Disaster', 'Climate', 'Health', 'Hunger', 'Conflict'].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setCategory(cat)
                  setOffset(0)
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
                  category === cat
                    ? `${cat === 'Disaster' ? 'bg-red-500' : cat === 'Climate' ? 'bg-green-500' : cat === 'Health' ? 'bg-cyan-500' : cat === 'Hunger' ? 'bg-amber-500' : 'bg-purple-500'} text-white shadow-md`
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
            {category && (
              <button
                onClick={() => {
                  setCategory(undefined)
                  setOffset(0)
                }}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-600 hover:bg-red-200 transition-all flex-shrink-0"
              >
                Clear Filter ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Full-screen Map Layer */}
      <div className="absolute inset-0 z-0 pt-32">
        <Map items={crises} onSelect={setSelected} selected={selected} />
      </div>

      {/* Bottom Sheet Drawer - Crisis Details */}
      {selected && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 z-20 h-[30vh] bg-white/95 backdrop-blur-md rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pointer-events-auto"
        >
          {/* Close Button */}
          <button
            onClick={() => {
              setSelected(null)
              setCharities([])
            }}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition-colors z-10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Content */}
          <div className="h-full overflow-y-auto p-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              {/* Left: Title and Category */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-slate-800 mb-2 truncate">
                  {selected.title}
                </h2>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selected.category === 'Disaster' ? 'bg-red-100 text-red-700' :
                    selected.category === 'Climate' ? 'bg-green-100 text-green-700' :
                    selected.category === 'Health' ? 'bg-blue-100 text-blue-700' :
                    selected.category === 'Hunger' ? 'bg-orange-100 text-orange-700' :
                    selected.category === 'Conflict' ? 'bg-purple-100 text-purple-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {selected.category}
                  </span>
                  {selected.severity && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-700">
                      Severity: {selected.severity}
                    </span>
                  )}
                </div>
              </div>

              {/* Middle: Description */}
              <div className="flex-1 min-w-0">
                <p className="text-slate-600 text-sm line-clamp-3">
                  {selected.description || 'No description available.'}
                </p>
              </div>

              {/* Right: Donate Button */}
              <div className="flex-shrink-0">
                {(() => {
                  const primaryCharity = charities[0] as any;
                  const hasDonationUrl = primaryCharity?.donation_url;
                  
                  if (loadingCharities) {
                    return (
                      <button
                        disabled
                        className="inline-flex items-center gap-2 px-8 py-4 bg-slate-200 text-slate-500 text-lg font-bold rounded-xl cursor-wait"
                      >
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading Charities...
                      </button>
                    );
                  }
                  
                  if (hasDonationUrl) {
                    return (
                      <a
                        href={primaryCharity.donation_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => console.log('Opening donation link:', primaryCharity.donation_url, 'for charity:', primaryCharity.name)}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Donate Now
                      </a>
                    );
                  }
                  
                  return (
                    <div className="text-center">
                      <button
                        disabled
                        className="inline-flex items-center gap-2 px-8 py-4 bg-slate-300 text-slate-500 text-lg font-bold rounded-xl cursor-not-allowed mb-2"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        No Charities Available
                      </button>
                      <p className="text-xs text-slate-500">Check back later for donation options</p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Debug Info */}
            {!loadingCharities && (
              <div className="mt-4 p-3 bg-slate-100 rounded-lg text-xs text-slate-600">
                <strong>Debug:</strong> Crisis ID: {selected.id} | Charities: {charities.length} | 
                Loading: {loadingCharities ? 'Yes' : 'No'} | 
                First Charity URL: {(charities[0] as any)?.donation_url || 'N/A'}
              </div>
            )}

            {/* Charities List */}
            {charities.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700">
                    {charities.length} {charities.length === 1 ? 'Charity' : 'Charities'} Available
                  </h3>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Powered by OpenCollective
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {charities.map((charity: any, idx: number) => (
                    <div
                      key={charity.id}
                      className={`p-3 rounded-lg border transition-all ${
                        idx === 0
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-slate-800 truncate">
                            {charity.name}
                            {idx === 0 && (
                              <span className="ml-2 text-xs text-blue-600 font-medium">(Primary)</span>
                            )}
                          </h4>
                          {charity.description && (
                            <p className="text-xs text-slate-500 truncate mt-0.5" title={charity.description}>
                              {charity.description}
                            </p>
                          )}
                        </div>
                        {charity.donation_url ? (
                          <a
                            href={charity.donation_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => console.log('🎯 Charity link clicked:', charity.name, charity.donation_url)}
                            className="ml-3 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors flex-shrink-0"
                          >
                            Donate
                          </a>
                        ) : (
                          <span className="ml-3 px-3 py-1 bg-slate-200 text-slate-400 text-xs font-medium rounded-lg cursor-not-allowed flex-shrink-0">
                            No Link
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)

  const handleLoginSuccess = (userData: any) => {
    setUser(userData)
    setIsAuthenticated(true)
    // Store in localStorage for persistence
    localStorage.setItem('user', JSON.stringify(userData))
    console.log('User logged in:', userData)
  }

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        setIsAuthenticated(true)
        console.log('Restored session for:', parsedUser.email)
      } catch (e) {
        localStorage.removeItem('user')
      }
    }
  }, [])

  // Get your Google Client ID from: https://console.cloud.google.com/
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

  if (!GOOGLE_CLIENT_ID) {
    console.warn('VITE_GOOGLE_CLIENT_ID not set in .env.local')
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
                <Navigate to="/" replace /> : 
                <LoginPage onLoginSuccess={handleLoginSuccess} />
            } 
          />
          <Route 
            path="/" 
            element={
              !isAuthenticated ? (
                <Navigate to="/login" replace />
              ) : (
                <MapView />
              )
            } 
          />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  )
}
