import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MLMap } from "maplibre-gl";
import { Search, Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import { API_BASE_URL } from "@/lib/api";

interface RegisterMapProps {
  onLocationChange?: (lngLat: [number, number], address?: string) => void;
  selectedPosIds?: string[];
  onPosToggle?: (id: string) => void;
  recommendedPosIds?: string[];
  initialCenter?: [number, number];
  locationLngLat?: [number, number];
  selectable?: boolean;
  instruments?: any[];
}

const MAJALAYA_CENTER: [number, number] = [107.7619, -7.0428];

const RegisterMap = ({
  onLocationChange,
  selectedPosIds = [],
  onPosToggle,
  recommendedPosIds = [],
  initialCenter,
  locationLngLat,
  selectable = true,
  instruments = [],
}: RegisterMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const staticLocationMarkerRef = useRef<maplibregl.Marker | null>(null);
  const onPosToggleRef = useRef(onPosToggle);
  
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const markersRef = useRef<Map<string, { marker: maplibregl.Marker; el: HTMLButtonElement }>>(new Map());

  useEffect(() => {
    onPosToggleRef.current = onPosToggle;
  }, [onPosToggle]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          "carto-base": {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
              "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
              "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap &copy; CARTO",
          },
        },
        layers: [
          { id: "base", type: "raster", source: "carto-base" },
        ],
      },
      center: initialCenter || MAJALAYA_CENTER,
      zoom: initialCenter ? 12.5 : 11,
    });

    map.on("load", () => {
      if (onLocationChange) {
        const el = document.createElement("div");
        el.className = "flex items-center justify-center";
        el.style.pointerEvents = "auto";
        el.style.transition = "none";
        el.style.zIndex = "999";
        el.innerHTML = `<div class="p-2 bg-blue-600 rounded-full shadow-lg border-2 border-white cursor-move">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>`;
        
        const marker = new maplibregl.Marker({ 
          element: el, 
          draggable: true,
          anchor: "bottom"
        })
          .setLngLat(initialCenter || MAJALAYA_CENTER)
          .addTo(map);

        marker.on("dragend", () => {
          const lngLat = marker.getLngLat();
          onLocationChange([lngLat.lng, lngLat.lat]);
        });

        // Add Click-to-Place functionality
        map.on("click", (e) => {
          const { lng, lat } = e.lngLat;
          marker.setLngLat([lng, lat]);
          onLocationChange([lng, lat]);
        });

        markerRef.current = marker;
      }
    });

    mapRef.current = map;

    return () => {
      markersRef.current.forEach(m => m.marker.remove());
      markersRef.current.clear();
      staticLocationMarkerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (markerRef.current && locationLngLat) {
      markerRef.current.setLngLat(locationLngLat);
      map.flyTo({ center: locationLngLat, zoom: Math.max(map.getZoom(), 12.5), duration: 500 });
      return;
    }

    staticLocationMarkerRef.current?.remove();
    staticLocationMarkerRef.current = null;

    if (!locationLngLat || onLocationChange) return;

    const el = document.createElement("div");
    el.innerHTML = `<div style="width:20px;height:20px;border-radius:9999px;background:#2563eb;border:3px solid white;box-shadow:0 0 0 6px rgba(37,99,235,0.18),0 8px 16px rgba(15,23,42,0.25)"></div>`;
    staticLocationMarkerRef.current = new maplibregl.Marker({ element: el, anchor: "center" })
      .setLngLat(locationLngLat)
      .addTo(map);
  }, [locationLngLat, onLocationChange]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const applyMarkers = () => {
      const seen = new Set<string>();

      instruments.forEach((pos) => {
        seen.add(pos.id);
        const existing = markersRef.current.get(pos.id);

        if (existing) {
          updatePosMarkerElement(existing.el, pos.id, selectedPosIds, recommendedPosIds, pos);
          existing.el.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (selectable && onPosToggleRef.current) {
              onPosToggleRef.current(pos.id);
            }
          };
          return;
        }

        const container = document.createElement("div");
        container.style.width = "40px";
        container.style.height = "40px";
        container.style.display = "flex";
        container.style.alignItems = "center";
        container.style.justifyContent = "center";
        container.style.pointerEvents = "none";

        const el = document.createElement("button");
        el.type = "button";
        el.className = "group relative pointer-events-auto";
        el.style.cursor = "pointer";
        el.style.border = "none";
        el.style.padding = "0";
        el.style.background = "none";
        el.style.transition = "none";

        updatePosMarkerElement(el, pos.id, selectedPosIds, recommendedPosIds, pos);

        const marker = new maplibregl.Marker({ element: container, anchor: "center" })
          .setLngLat(pos.lngLat)
          .addTo(map);

        el.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (selectable && onPosToggleRef.current) {
            onPosToggleRef.current(pos.id);
          }
        };

        container.appendChild(el);
        markersRef.current.set(pos.id, { marker, el });
      });

      markersRef.current.forEach((m, id) => {
        if (!seen.has(id)) {
          m.marker.remove();
          markersRef.current.delete(id);
        }
      });
    };

    if (map.isStyleLoaded()) applyMarkers();
    else map.once("load", applyMarkers);
  }, [instruments, selectedPosIds, recommendedPosIds, selectable]);

  const updatePosMarkerElement = (el: HTMLElement, id: string, selected: string[], recommended: string[], posData?: any) => {
    const isSelected = selected.includes(id);
    const isRecommended = recommended.includes(id);
    const pos = posData || instruments.find(p => p.id === id);

    const icon = pos?.tipe === "ARR" 
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M2 6c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>`;

    el.innerHTML = `
      <div class="flex items-center justify-center w-9 h-9 rounded-full shadow-lg transition-colors" style="background: ${isSelected ? '#2563eb' : isRecommended ? '#1e293b' : '#475569'}; border: ${isSelected ? '3px solid #2563eb' : '2.5px solid white'}">
        ${icon}
        ${isRecommended ? `<div class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center shadow-md">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="white"><path d="M12 1L9 9l-8 3 8 3 3 8 3-8 8-3-8-3-3-8z"/></svg>
        </div>` : ""}
      </div>
      <div class="absolute top-full mt-2 left-0 right-0 text-center pointer-events-none">
        <span class="inline-block bg-slate-900 text-[10px] font-bold text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 shadow-lg whitespace-nowrap">
          ${pos?.nama} ${isSelected ? ' (Terpilih)' : ''}
        </span>
      </div>
    `;
  };

  const handleSearch = async () => {
    if (!search.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/geocoding/search?q=${encodeURIComponent(search + " Bandung")}`,
      );
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error("Geocoding failed", err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (res: any) => {
    const lngLat: [number, number] = [parseFloat(res.lon), parseFloat(res.lat)];
    if (mapRef.current) mapRef.current.flyTo({ center: lngLat, zoom: 15 });
    if (markerRef.current) markerRef.current.setLngLat(lngLat);
    if (onLocationChange) onLocationChange(lngLat, res.display_name);
    setSearchResults([]);
    setSearch("");
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const lngLat: [number, number] = [pos.coords.longitude, pos.coords.latitude];
      if (mapRef.current) mapRef.current.flyTo({ center: lngLat, zoom: 15 });
      if (markerRef.current) markerRef.current.setLngLat(lngLat);
      if (onLocationChange) onLocationChange(lngLat);
    });
  };

  return (
    <div className="w-full h-full relative group/map overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Search Bar Overlay - Fixed width to not block clicks */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 w-[260px]">
        <div className="relative group">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${isSearching ? 'text-blue-500 animate-pulse' : 'text-slate-400'}`} />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Cari lokasi..."
            className="pl-9 bg-white/90 backdrop-blur-md border-slate-200 shadow-lg focus:bg-white transition-all rounded-xl h-10 text-sm text-slate-900 placeholder:text-slate-400"
          />
        </div>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="max-h-[240px] overflow-y-auto">
              {searchResults.map((res: any) => (
                <button
                  key={res.place_id}
                  onClick={() => selectSearchResult(res)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-slate-100 last:border-0 flex flex-col gap-0.5 transition-colors"
                >
                  <span className="font-bold text-slate-800 text-xs line-clamp-1">{res.display_name.split(',')[0]}</span>
                  <span className="text-slate-500 text-[10px] line-clamp-1">{res.display_name}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setSearchResults([])} className="w-full py-2 text-[10px] font-bold text-slate-400 hover:text-slate-600 bg-slate-50/50 uppercase tracking-wider">Tutup</button>
          </div>
        )}
      </div>

      {/* Locate Me Button - Moved to Top Right */}
      <button
        onClick={handleLocateMe}
        className="absolute top-4 right-4 z-20 flex items-center justify-center w-10 h-10 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg hover:bg-white text-slate-700 transition-all hover:scale-110 active:scale-95"
        title="Gunakan lokasi saya"
      >
        <Target className="h-5 w-5" />
      </button>
    </div>
  );
};

export default RegisterMap;
