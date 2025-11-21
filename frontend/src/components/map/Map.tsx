// src/components/Map.tsx
import { useEffect, useRef } from "react";
import maplibregl, { Map as MLMap, LngLatLike, MapGeoJSONFeature } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type Item = {
  id: number;
  title: string;
  category: string;
  description?: string;
  severity?: number;
  latitude: number;
  longitude: number;
  source_api?: string;
};

const categoryColors: Record<string, string> = {
  disaster: "#ef4444",
  climate: "#22c55e",
  health: "#06b6d4",
  hunger: "#f59e0b",
  conflict: "#a855f7",
};

export default function Map({
  items,
  onSelect,
  selected,
}: {
  items: Item[];
  onSelect: (item: Item) => void;
  selected: Item | null;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const itemsRef = useRef(items);

  // Category → color (case-insensitive)
  const catColor = (c?: string) => {
    const normalized = c?.toLowerCase() || "";
    return categoryColors[normalized] || "#64748b"; // default gray
  };

  // Convert items → GeoJSON
  const toGeoJSON = () => ({
    type: "FeatureCollection" as const,
    features: items.map((it) => ({
      type: "Feature" as const,
      properties: {
        id: it.id,
        title: it.title,
        category: it.category,
        description: it.description ?? "",
        severity: it.severity ?? null,
        source_api: it.source_api ?? "",
        color: catColor(it.category),
      },
      geometry: {
        type: "Point" as const,
        coordinates: [it.longitude, it.latitude],
      },
    })),
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      // Options: 'streets-v2', 'satellite', 'hybrid', 'topo-v2', 'voyager', 'toner', 'basic-v2'
      style: `https://api.maptiler.com/maps/voyager/style.json?key=${
        import.meta.env.VITE_MAPTILER_KEY
      }`,
      center: [10, 20] as LngLatLike,
      zoom: 2,
    });

    map.addControl(new maplibregl.NavigationControl({ showZoom: true }), "top-right");
    mapRef.current = map;

    map.on("load", () => {
      // Source with clustering on
      map.addSource("crises", {
        type: "geojson",
        data: toGeoJSON(),
        cluster: true,
        clusterRadius: 60,
        clusterMaxZoom: 10,
      });

      // Cluster circles
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "crises",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#93c5fd", // light blue small clusters
            20,
            "#60a5fa",
            50,
            "#3b82f6",
          ],
          "circle-radius": ["step", ["get", "point_count"], 16, 20, 22, 50, 28],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Cluster count labels
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "crises",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 12,
          "text-font": ["Noto Sans Regular"],
        },
        paint: { "text-color": "#0f172a" },
      });

      // Unclustered points colored by category
      map.addLayer({
        id: "points",
        type: "circle",
        source: "crises",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": 7,
          "circle-color": ["get", "color"],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Cursor feedback
      ["clusters", "points"].forEach((id) => {
        map.on("mouseenter", id, () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", id, () => (map.getCanvas().style.cursor = ""));
      });

      // Click cluster → zoom in
      map.on("click", "clusters", (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        if (!features.length) return;
        const clusterId = features[0].properties?.cluster_id;
        const source = map.getSource("crises") as maplibregl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) {
            console.error("Failed to get cluster expansion zoom:", err);
            return;
          }
          map.easeTo({
            center: (features[0].geometry as any).coordinates as LngLatLike,
            zoom,
          });
        });
      });

      // Click point → select without auto-zoom (to prevent conflicts)
      map.on("click", "points", (e) => {
        const f = e.features?.[0] as MapGeoJSONFeature | undefined;
        if (!f) return;
        const props = f.properties as any;
        const coords = (f.geometry as any).coordinates as [number, number];
        
        // Only center the map gently without aggressive zooming
        const currentZoom = map.getZoom();
        if (currentZoom < 4) {
          map.easeTo({ center: coords, zoom: 4, duration: 500 });
        } else {
          map.panTo(coords, { duration: 500 });
        }

        // Reconstruct your Item shape for the side panel
        onSelect({
          id: Number(props.id),
          title: props.title,
          category: props.category,
          description: props.description || "",
          severity: props.severity ? Number(props.severity) : undefined,
          latitude: coords[1],
          longitude: coords[0],
          source_api: props.source_api || undefined,
        });
      });
    });

    return () => map.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update the source data whenever items change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    
    // Wait for map to be fully loaded
    if (!map.isStyleLoaded()) {
      const handler = () => {
        const src = map.getSource("crises") as maplibregl.GeoJSONSource | undefined;
        if (src) {
          const geoData = toGeoJSON();
          console.log("Updating map data (on load):", geoData.features.length, "items");
          src.setData(geoData as any);
        }
      };
      map.once("load", handler);
      return () => {
        map.off("load", handler);
      };
    }
    
    const src = map.getSource("crises") as maplibregl.GeoJSONSource | undefined;
    if (src) {
      const geoData = toGeoJSON();
      console.log("Updating map data:", geoData.features.length, "items", items.length > 0 ? `(first: ${items[0].category})` : "");
      src.setData(geoData as any);
      itemsRef.current = items;
      
      // Only auto-zoom when filtering changes, not on every update
      const previousItems = itemsRef.current;
      const itemsChanged = items.length !== previousItems.length;
      
      if (itemsChanged && items.length > 0 && items.length < 20) {
        const bounds = new maplibregl.LngLatBounds();
        items.forEach(item => {
          bounds.extend([item.longitude, item.latitude]);
        });
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 100, maxZoom: 6, duration: 800 });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <Legend />
    </div>
  );
}

function Legend() {
  const items = [
    { name: "Disaster", color: "#ef4444" },
    { name: "Climate", color: "#22c55e" },
    { name: "Health", color: "#06b6d4" },
    { name: "Hunger", color: "#f59e0b" },
    { name: "Conflict", color: "#a855f7" },
  ];
  return (
    <div className="absolute bottom-3 left-3 rounded-xl bg-white/90 backdrop-blur shadow p-2">
      <div className="text-xs font-semibold mb-1">Categories</div>
      <div className="flex flex-wrap gap-2">
        {items.map((i) => (
          <div key={i.name} className="flex items-center gap-1 text-xs">
            <span
              className="inline-block h-3 w-3 rounded-full ring-1 ring-black/10"
              style={{ background: i.color }}
            />
            {i.name}
          </div>
        ))}
      </div>
    </div>
  );
}
