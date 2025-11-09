import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

export default function Map({ items, onSelect, selected }: any) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    if (!ref.current) return
    const map = new maplibregl.Map({
      container: ref.current,
      style: `https://api.maptiler.com/maps/streets/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`,
      center: [0, 20], zoom: 2
    })
    map.addControl(new maplibregl.NavigationControl({ showZoom: true }))
    mapRef.current = map
    return () => map.remove()
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.once('load', () => {})
    // clear old markers
    ;(map as any)._markers?.forEach((m: any) => m.remove())
    ;(map as any)._markers = []
    items.forEach((it: any) => {
      const el = document.createElement('div')
      el.className = `w-3 h-3 rounded-full bg-red-500 border-2 border-white` // simple marker
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([it.longitude, it.latitude])
        .addTo(map)
      ;(map as any)._markers.push(marker)
      marker.getElement().addEventListener('click', () => onSelect(it))
    })
  }, [items])

  return <div ref={ref} className="h-full w-full" />
}