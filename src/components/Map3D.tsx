import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MLMap } from "maplibre-gl";

/** Served from `public/geo/` (see `scripts/extract_rivers.py` to regenerate). */
const RIVERS_GEOJSON_URL = "/geo/rivers_bandung.geojson";

export type PosKategori = "hulu" | "tengah" | "hilir";
export type PosTipe = "ARR" | "AWLR"; // ARR = curah hujan, AWLR = tinggi muka air

export interface PosReading {
  // ARR: curah hujan kumulatif 1 jam terakhir (mm)
  // AWLR: tinggi muka air saat ini (m)
  value: number;
  // status: normal (0) | siaga3 (1) | siaga2 (2) | siaga1 (3)
  status: "normal" | "siaga3" | "siaga2" | "siaga1";
  updatedAt: number; // epoch ms
}

export type Tren = "naik" | "turun" | "stabil";
export interface PosMonitoring {
  id: string;
  nama: string;
  kategori: PosKategori;
  tipe: PosTipe;
  lngLat: [number, number];
  keterangan?: string;
  reading?: PosReading;
  tren?: Tren;
}

interface Map3DProps {
  onMapReady?: (map: MLMap) => void;
  posList?: PosMonitoring[];
  onPosClick?: (pos: PosMonitoring) => void;
  homeLngLat?: [number, number];
  homeLabel?: string;
}

const MAJALAYA_CENTER: [number, number] = [107.7619, -7.0428];



const STATUS_COLOR: Record<PosReading["status"], string> = {
  normal: "#22c55e",
  siaga3: "#3b82f6",
  siaga2: "#f59e0b",
  siaga1: "#ef4444",
};

const Map3D = ({ onMapReady, posList = [], onPosClick, homeLngLat, homeLabel }: Map3DProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markersRef = useRef<Map<string, { marker: maplibregl.Marker; el: HTMLButtonElement; popup: maplibregl.Popup }>>(new Map());
  const homeMarkerRef = useRef<maplibregl.Marker | null>(null);
  const onMapReadyRef = useRef(onMapReady);
  const onPosClickRef = useRef(onPosClick);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    onMapReadyRef.current = onMapReady;
  }, [onMapReady]);

  useEffect(() => {
    onPosClickRef.current = onPosClick;
  }, [onPosClick]);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
        sources: {
          "carto-base": {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
              "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
              "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a> · Terrain &copy; <a href="https://registry.opendata.aws/terrain-tiles/">AWS Terrain Tiles</a>',
          },
          terrainSource: {
            type: "raster-dem",
            tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
            encoding: "terrarium",
            tileSize: 256,
            maxzoom: 14,
          },
          hillshadeSource: {
            type: "raster-dem",
            tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
            encoding: "terrarium",
            tileSize: 256,
            maxzoom: 14,
          },
          "osm-buildings": {
            type: "vector",
            tiles: [
              "https://a.data.osmbuildings.org/0.2/anonymous/tile/{z}/{x}/{y}.mvt",
              "https://b.data.osmbuildings.org/0.2/anonymous/tile/{z}/{x}/{y}.mvt",
              "https://c.data.osmbuildings.org/0.2/anonymous/tile/{z}/{x}/{y}.mvt",
              "https://d.data.osmbuildings.org/0.2/anonymous/tile/{z}/{x}/{y}.mvt",
            ],
            minzoom: 14,
            maxzoom: 16,
          },
          rivers: {
            type: "geojson",
            data: RIVERS_GEOJSON_URL,
          },
        },
        layers: [
          { id: "carto-raster", type: "raster", source: "carto-base" },
          {
            id: "hillshade",
            type: "hillshade",
            source: "hillshadeSource",
            paint: {
              "hillshade-shadow-color": "#1f2937",
              "hillshade-highlight-color": "#ffffff",
              "hillshade-accent-color": "#475569",
              "hillshade-exaggeration": 0.6,
            },
          },
          // Outer glow for all rivers
          {
            id: "river-glow",
            type: "line",
            source: "rivers",
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
              "line-color": "#38bdf8",
              "line-blur": 5,
              "line-opacity": 0.4,
              "line-width": [
                "interpolate", ["linear"], ["zoom"],
                10, 4, 14, 12,
              ],
            },
          },
          // Main line rendering
          {
            id: "river-main",
            type: "line",
            source: "rivers",
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
              "line-color": [
                "case",
                ["==", ["get", "waterway"], "river"], "#0284c7",
                "#38bdf8",
              ],
              "line-width": [
                "interpolate", ["linear"], ["zoom"],
                10, ["case", ["==", ["get", "waterway"], "river"], 2, 0.8],
                14, ["case", ["==", ["get", "waterway"], "river"], 6, 2.5],
              ],
              "line-opacity": 0.9,
            },
          },
          {
            id: "3d-buildings",
            type: "fill-extrusion",
            source: "osm-buildings",
            "source-layer": "building",
            minzoom: 14,
            paint: {
              "fill-extrusion-color": [
                "interpolate", ["linear"], ["coalesce", ["get", "height"], 8],
                0, "#d8e3ec", 10, "#b9c8d6", 25, "#7c98b2", 60, "#3b5b78",
              ],
              "fill-extrusion-height": ["coalesce", ["get", "height"], 8],
              "fill-extrusion-base": ["coalesce", ["get", "minHeight"], 0],
              "fill-extrusion-opacity": 0.92,
            },
          },
        ],
      },
      center: MAJALAYA_CENTER,
      zoom: 12.2,
      pitch: 70,
      bearing: -25,
      maxPitch: 85,
      attributionControl: { compact: true },
    });

    // map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");
    map.addControl(new maplibregl.FullscreenControl(), "top-left");
    if ("geolocation" in navigator) {
      map.addControl(
        new maplibregl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
        }),
        "top-left",
      );
    }
    map.addControl(
      new maplibregl.TerrainControl({ source: "terrainSource", exaggeration: 1.6 }),
      "top-left",
    );

    map.on("load", () => {
      map.setTerrain({ source: "terrainSource", exaggeration: 1.6 });
      try {
        map.setSky({
          "sky-color": "#9bc8ff",
          "horizon-color": "#e6f0ff",
          "fog-color": "#e6eef7",
          "sky-horizon-blend": 0.6,
          "horizon-fog-blend": 0.6,
          "fog-ground-blend": 0.1,
          "atmosphere-blend": 0.8,
        });
      } catch {
        /* noop */
      }
      // River hover popup
      const riverPopup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 8 });
      const riverLayers = ["river-main"];
      riverLayers.forEach((lyr) => {
        map.on("mouseenter", lyr, () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", lyr, () => {
          map.getCanvas().style.cursor = "";
          riverPopup.remove();
        });
        map.on("mousemove", lyr, (e) => {
          const f = e.features?.[0];
          if (!f) return;
          const p = f.properties as { name?: string; waterway?: string };
          const label = p.name || "Sungai";
          const sub = p.waterway ? p.waterway.charAt(0).toUpperCase() + p.waterway.slice(1) : "Waterway";
          riverPopup
            .setLngLat(e.lngLat)
            .setHTML(
              `<div style="font-family:system-ui;font-size:12px;padding:4px 8px;line-height:1.5">
                <strong style="color:#0f172a">${label}</strong>
                <div style="font-size:10px;color:#64748b;margin-top:1px">${sub}</div>
              </div>`,
            )
            .addTo(map);
        });
      });

      setMapReady(true);
      onMapReadyRef.current?.(map);
    });

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.marker.remove());
      markersRef.current.clear();
      homeMarkerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync markers whenever posList changes (incl. realtime updates)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const apply = () => {
      const seen = new Set<string>();

      posList.forEach((pos) => {
        seen.add(pos.id);
        const status = pos.reading?.status ?? "normal";
        const ringColor = STATUS_COLOR[status];
        const statusColor = STATUS_COLOR[status];
        const isRain = pos.tipe === "ARR";
        const blink = status !== "normal";

        const valueLabel = pos.reading
          ? isRain
            ? `${pos.reading.value.toFixed(1)} mm/jam`
            : `${pos.reading.value.toFixed(2)} m`
          : "—";

        const trenIcon = pos.tren === "naik" 
          ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="color:#ef4444"><path d="m7 17 10-10"/><path d="M7 7h10v10"/></svg>`
          : pos.tren === "turun"
          ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="color:#10b981"><path d="m7 7 10 10"/><path d="M17 7v10H7"/></svg>`
          : `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="color:#94a3b8"><path d="M5 12h14"/></svg>`;

        const popupHtml = `
          <div style="font-family:'Inter', sans-serif; min-width:280px; background:white; border-radius:12px; display:flex; overflow:hidden; box-shadow:0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)">
            <!-- Left Vertical Status Bar -->
            <div style="width:6px; background:${ringColor}; flex-shrink:0;"></div>
            
            <div style="padding:16px; flex-grow:1;">
              <!-- Header -->
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                <div>
                  <h3 style="margin:0; font-size:14px; font-weight:700; color:#1e293b; line-height:1.2;">${pos.nama}</h3>
                  <div style="font-size:10px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.025em; margin-top:2px;">
                    ${pos.tipe === "ARR" ? "Pos Curah Hujan" : "Pos Tinggi Muka Air"}
                  </div>
                </div>
                <span style="font-size:9px; font-weight:800; text-transform:uppercase; padding:2px 6px; border-radius:4px; background:${ringColor}20; color:${ringColor}; border:1px solid ${ringColor}40;">
                  ${status}
                </span>
              </div>

              <!-- Main Split Content -->
              <div style="display:grid; grid-template-columns: 1fr 1fr; border-top:1px solid #f1f5f9; padding-top:12px; gap:16px;">
                <!-- Column 1: Reading -->
                <div style="display:flex; flex-direction:column; gap:4px; border-right:1px solid #f1f5f9; padding-right:12px;">
                  <span style="font-size:9px; font-weight:600; color:#94a3b8; text-transform:uppercase;">Obs Terkini</span>
                  <div style="display:flex; align-items:baseline; gap:4px;">
                    <span style="font-size:20px; font-weight:800; color:#0f172a;">${valueLabel.split(' ')[0]}</span>
                    <span style="font-size:10px; font-weight:600; color:#64748b;">${valueLabel.split(' ')[1]}</span>
                  </div>
                  <div style="display:flex; align-items:center; gap:4px; font-size:10px; color:#64748b; font-weight:500;">
                    ${trenIcon} <span style="text-transform:capitalize;">${pos.tren || 'stabil'}</span>
                  </div>
                </div>

                <!-- Column 2: Info -->
                <div style="display:flex; flex-direction:column; gap:6px;">
                  ${pos.keterangan ? `<div style="font-size:10px; color:#64748b; font-style:italic; line-height:1.3;">${pos.keterangan}</div>` : ""}
                </div>
              </div>

              <!-- Footer -->
              <div style="margin-top:12px; padding-top:8px; border-top:1px solid #f8fafc; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:9px; color:#94a3b8;">Ref: ${pos.id.toUpperCase()}</span>
                <span style="font-size:9px; color:#94a3b8; display:flex; align-items:center; gap:3px;">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  ${pos.reading ? new Date(pos.reading.updatedAt).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }) : "-"}
                </span>
              </div>
            </div>
          </div>
        `;

        const existing = markersRef.current.get(pos.id);
        if (existing) {
          // Update style + popup in place (no flicker, marker stays put)
          existing.el.style.background = statusColor;
          existing.el.style.color = statusColor;
          existing.el.style.boxShadow = `0 4px 12px rgba(0,0,0,0.3)`;
          existing.el.dataset.status = status;
          existing.el.classList.toggle("pos-blink", blink);
          // Refresh click handler so it always uses the latest onPosClick + pos
          existing.el.onclick = () => {
            onPosClickRef.current?.(pos);
            if (!existing.popup.isOpen()) {
              existing.marker.togglePopup();
            }
          };
          existing.popup.setHTML(popupHtml);
          return;
        }

        const container = document.createElement("div");
        container.style.width = "30px";
        container.style.height = "30px";
        container.style.display = "flex";
        container.style.alignItems = "center";
        container.style.justifyContent = "center";

        const el = document.createElement("button");
        el.type = "button";
        el.setAttribute("aria-label", `Pos ${pos.nama}`);
        el.dataset.status = status;
        el.className = blink ? "pos-marker pos-blink" : "pos-marker";
        el.style.cssText = `
          width: 32px; height: 32px; border-radius: 9999px;
          background: ${statusColor};
          color: ${statusColor};
          border: 2.5px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          cursor: pointer; transition: transform .15s ease;
          display:flex;align-items:center;justify-content:center;
          font-size:13px;line-height:1;
        `;
        const rainIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg>`;
        const waterIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>`;
        
        el.innerHTML = isRain ? rainIcon : waterIcon;
        el.onmouseenter = () => (el.style.transform = "scale(1.18)");
        el.onmouseleave = () => (el.style.transform = "scale(1)");
        
        const popup = new maplibregl.Popup({ offset: 22, closeButton: false, maxWidth: 'none' }).setHTML(popupHtml);
        const marker = new maplibregl.Marker({ element: container })
          .setLngLat(pos.lngLat)
          .setPopup(popup)
          .addTo(map);

        el.onclick = () => {
          onPosClickRef.current?.(pos);
          if (!popup.isOpen()) {
            marker.togglePopup();
          }
        };
        container.appendChild(el);

        markersRef.current.set(pos.id, { marker, el, popup });
      });

      // Remove markers no longer in list
      markersRef.current.forEach((m, id) => {
        if (!seen.has(id)) {
          m.marker.remove();
          markersRef.current.delete(id);
        }
      });
    };

    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [posList, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    homeMarkerRef.current?.remove();
    homeMarkerRef.current = null;

    if (!homeLngLat) return;

    const el = document.createElement("button");
    el.type = "button";
    el.setAttribute("aria-label", "Lokasi rumah");
    el.style.cssText = `
      width: 22px; height: 22px; border-radius: 9999px;
      background: #2563eb; border: 3px solid white;
      box-shadow: 0 0 0 8px rgba(37,99,235,0.18), 0 6px 18px rgba(15,23,42,0.35);
      cursor: default;
    `;

    const popup = new maplibregl.Popup({ offset: 16, closeButton: false }).setHTML(`
      <div style="font-family:'Inter', sans-serif; padding:8px 10px; min-width:180px">
        <div style="font-size:12px; font-weight:700; color:#0f172a;">Lokasi Individu</div>
        <div style="font-size:10px; color:#475569; margin-top:2px;">${homeLabel || "Lokasi tersimpan"}</div>
      </div>
    `);

    homeMarkerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat(homeLngLat)
      .setPopup(popup)
      .addTo(map);
  }, [homeLngLat, homeLabel, mapReady]);

  return <div ref={containerRef} className="absolute inset-0 h-full w-full" />;
};

export default Map3D;
