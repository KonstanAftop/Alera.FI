import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl, { Map as MLMap } from "maplibre-gl";
import { formatTimeWIB } from "@/lib/wibDatetime";

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
  /** Raw `last_updated_at` from API (WIB naive or legacy ISO). */
  updatedAtRaw?: string;
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
  prevValue?: number;
}

interface Map3DProps {
  onMapReady?: (map: MLMap) => void;
  /** Fired once map + sensor data are ready and markers are synced. */
  onMarkersReady?: () => void;
  /** When false, marker-ready callback waits (avoids hiding loading before /api/sensors returns). */
  sensorDataReady?: boolean;
  posList?: PosMonitoring[];
  onPosClick?: (pos: PosMonitoring) => void;
  homeLngLat?: [number, number];
  homeLabel?: string;
}

function isValidLngLat([lng, lat]: [number, number]): boolean {
  return Number.isFinite(lng) && Number.isFinite(lat) && !(lng === 0 && lat === 0);
}

/** Hillshade, rivers, terrain, and 3D buildings — deferred so pos markers appear sooner. */
function enhanceMap3D(map: MLMap) {
  if (map.getLayer("hillshade")) return;

  if (!map.getSource("rivers")) {
    map.addSource("rivers", { type: "geojson", data: RIVERS_GEOJSON_URL });
  }

  map.addLayer({
    id: "hillshade",
    type: "hillshade",
    source: "hillshadeSource",
    paint: {
      "hillshade-shadow-color": "#1f2937",
      "hillshade-highlight-color": "#ffffff",
      "hillshade-accent-color": "#475569",
      "hillshade-exaggeration": 0.6,
    },
  });

  map.addLayer({
    id: "river-glow",
    type: "line",
    source: "rivers",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "#38bdf8",
      "line-blur": 5,
      "line-opacity": 0.4,
      "line-width": ["interpolate", ["linear"], ["zoom"], 10, 4, 14, 12],
    },
  });

  map.addLayer({
    id: "river-main",
    type: "line",
    source: "rivers",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": [
        "case",
        ["==", ["get", "waterway"], "river"],
        "#0284c7",
        "#38bdf8",
      ],
      "line-width": [
        "interpolate",
        ["linear"],
        ["zoom"],
        10,
        ["case", ["==", ["get", "waterway"], "river"], 2, 0.8],
        14,
        ["case", ["==", ["get", "waterway"], "river"], 6, 2.5],
      ],
      "line-opacity": 0.9,
    },
  });

  map.addLayer({
    id: "3d-buildings",
    type: "fill-extrusion",
    source: "osm-buildings",
    "source-layer": "building",
    minzoom: 14,
    paint: {
      "fill-extrusion-color": [
        "interpolate",
        ["linear"],
        ["coalesce", ["get", "height"], 8],
        0,
        "#d8e3ec",
        10,
        "#b9c8d6",
        25,
        "#7c98b2",
        60,
        "#3b5b78",
      ],
      "fill-extrusion-height": ["coalesce", ["get", "height"], 8],
      "fill-extrusion-base": ["coalesce", ["get", "minHeight"], 0],
      "fill-extrusion-opacity": 0.92,
    },
  });

  try {
    map.setTerrain({ source: "terrainSource", exaggeration: 1.6 });
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

  const riverPopup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 8 });
  const riverLayers = ["river-main"];
  riverLayers.forEach((lyr) => {
    map.on("mouseenter", lyr, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", lyr, () => {
      map.getCanvas().style.cursor = "";
      riverPopup.remove();
    });
    map.on("mousemove", lyr, (e) => {
      const f = e.features?.[0];
      if (!f) return;
      const p = f.properties as { name?: string; waterway?: string };
      const label = p.name || "Sungai";
      const sub = p.waterway
        ? p.waterway.charAt(0).toUpperCase() + p.waterway.slice(1)
        : "Waterway";
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
}

const MAJALAYA_CENTER: [number, number] = [107.7619, -7.0428];



const STATUS_COLOR: Record<PosReading["status"], string> = {
  normal: "#22c55e",
  siaga3: "#3b82f6",
  siaga2: "#f59e0b",
  siaga1: "#ef4444",
};

const POS_POPUP_OPTIONS: maplibregl.PopupOptions = {
  offset: 18,
  closeButton: true,
  closeOnClick: false,
  maxWidth: "220px",
};

const STATUS_LABEL: Record<PosReading["status"], string> = {
  normal: "Normal",
  siaga3: "Siaga 3",
  siaga2: "Siaga 2",
  siaga1: "Siaga 1",
};

const KATEGORI_LABEL: Record<PosKategori, string> = {
  hulu: "Hulu",
  tengah: "Tengah",
  hilir: "Hilir",
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatPopupUpdatedAt(pos: PosMonitoring): string {
  if (!pos.reading) return "—";
  if (pos.reading.updatedAtRaw) return formatTimeWIB(pos.reading.updatedAtRaw);
  return formatTimeWIB(new Date(pos.reading.updatedAt).toISOString());
}

function formatPopupValue(pos: PosMonitoring): string {
  if (!pos.reading) return "—";
  if (pos.tipe === "ARR") {
    return `${pos.reading.value.toFixed(1)}<span style="font-size:9px;font-weight:600;color:#64748b;margin-left:2px">mm/j</span>`;
  }
  return `${pos.reading.value.toFixed(2)}<span style="font-size:9px;font-weight:600;color:#64748b;margin-left:2px">m</span>`;
}

function buildPosPopupHtml(pos: PosMonitoring): string {
  const status = pos.reading?.status ?? "normal";
  const accent = STATUS_COLOR[status];
  const tren = pos.tren ?? "stabil";
  const trenColor = tren === "naik" ? "#ef4444" : tren === "turun" ? "#16a34a" : "#64748b";
  const trenLabel = tren === "naik" ? "Naik" : tren === "turun" ? "Turun" : "Stabil";
  const trenArrow = tren === "naik" ? "↑" : tren === "turun" ? "↓" : "→";
  const tipeLabel = pos.tipe === "ARR" ? "Curah hujan" : "Tinggi air";

  let deltaHtml = "";
  if (pos.reading && pos.prevValue != null && !Number.isNaN(pos.prevValue)) {
    const diff = pos.reading.value - pos.prevValue;
    if (Math.abs(diff) > 0.001) {
      const sign = diff > 0 ? "+" : "";
      const unit = pos.tipe === "ARR" ? " mm/j" : " m";
      const deltaColor = diff > 0 ? "#ef4444" : "#16a34a";
      deltaHtml = `<div style="font-size:9px;color:${deltaColor};margin-top:2px;font-weight:600">${sign}${diff.toFixed(pos.tipe === "ARR" ? 1 : 2)}${unit}</div>`;
    }
  }

  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;width:200px;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 14px rgba(15,23,42,0.14)">
      <div style="height:3px;background:${accent}"></div>
      <div style="padding:10px 11px 9px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px;margin-bottom:8px">
          <div style="min-width:0;flex:1">
            <div style="font-size:12px;font-weight:700;color:#0f172a;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escapeHtml(pos.nama)}">${escapeHtml(pos.nama)}</div>
            <div style="font-size:9px;color:#64748b;margin-top:2px">${tipeLabel} · ${KATEGORI_LABEL[pos.kategori]}</div>
          </div>
          <span style="flex-shrink:0;font-size:8px;font-weight:700;text-transform:uppercase;padding:2px 5px;border-radius:4px;background:${accent}1a;color:${accent};white-space:nowrap">${STATUS_LABEL[status]}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:7px 8px;background:#f8fafc;border-radius:7px">
          <div>
            <div style="font-size:8px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.03em">Nilai</div>
            <div style="font-size:15px;font-weight:800;color:#0f172a;line-height:1.25;margin-top:2px">${formatPopupValue(pos)}</div>
            ${deltaHtml}
          </div>
          <div>
            <div style="font-size:8px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.03em">Tren 3 jam</div>
            <div style="font-size:13px;font-weight:700;color:${trenColor};margin-top:2px;display:flex;align-items:center;gap:2px">
              <span style="font-size:12px;line-height:1">${trenArrow}</span>${trenLabel}
            </div>
          </div>
        </div>
        <div style="margin-top:7px;font-size:9px;color:#94a3b8;display:flex;justify-content:space-between;gap:4px">
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(pos.id)}</span>
          <span style="flex-shrink:0;font-variant-numeric:tabular-nums">${formatPopupUpdatedAt(pos)} WIB</span>
        </div>
      </div>
    </div>
  `;
}

const Map3D = ({
  onMapReady,
  onMarkersReady,
  sensorDataReady = true,
  posList = [],
  onPosClick,
  homeLngLat,
  homeLabel,
}: Map3DProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markersRef = useRef<Map<string, { marker: maplibregl.Marker; el: HTMLButtonElement; popup: maplibregl.Popup }>>(new Map());
  const homeMarkerRef = useRef<maplibregl.Marker | null>(null);
  const onMapReadyRef = useRef(onMapReady);
  const onMarkersReadyRef = useRef(onMarkersReady);
  const onPosClickRef = useRef(onPosClick);
  const posListRef = useRef(posList);
  const sensorDataReadyRef = useRef(sensorDataReady);
  const markersReadyFiredRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);

  posListRef.current = posList;
  sensorDataReadyRef.current = sensorDataReady;

  useEffect(() => {
    onMapReadyRef.current = onMapReady;
  }, [onMapReady]);

  useEffect(() => {
    onMarkersReadyRef.current = onMarkersReady;
  }, [onMarkersReady]);

  useEffect(() => {
    onPosClickRef.current = onPosClick;
  }, [onPosClick]);

  const notifyMarkersReady = useCallback(() => {
    if (!sensorDataReadyRef.current || !mapRef.current) return;
    if (markersReadyFiredRef.current) return;
    markersReadyFiredRef.current = true;
    onMarkersReadyRef.current?.();
  }, []);

  const syncPosMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const list = posListRef.current.filter((pos) => isValidLngLat(pos.lngLat));
    const seen = new Set<string>();

    list.forEach((pos) => {
      seen.add(pos.id);
      const status = pos.reading?.status ?? "normal";
      const statusColor = STATUS_COLOR[status];
      const isRain = pos.tipe === "ARR";
      const blink = status !== "normal";
      const popupHtml = buildPosPopupHtml(pos);

      const existing = markersRef.current.get(pos.id);
      if (existing) {
        existing.el.style.background = statusColor;
        existing.el.style.color = statusColor;
        existing.el.style.boxShadow = `0 4px 12px rgba(0,0,0,0.3)`;
        existing.el.dataset.status = status;
        existing.el.classList.toggle("pos-blink", blink);
        existing.el.onclick = () => onPosClickRef.current?.(pos);
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
      el.onmouseenter = () => {
        el.style.transform = "scale(1.18)";
      };
      el.onmouseleave = () => {
        el.style.transform = "scale(1)";
      };

      const popup = new maplibregl.Popup(POS_POPUP_OPTIONS).setHTML(popupHtml);
      container.appendChild(el);
      const marker = new maplibregl.Marker({ element: container })
        .setLngLat(pos.lngLat)
        .setPopup(popup)
        .addTo(map);

      el.onclick = () => onPosClickRef.current?.(pos);
      markersRef.current.set(pos.id, { marker, el, popup });
    });

    markersRef.current.forEach((m, id) => {
      if (!seen.has(id)) {
        m.marker.remove();
        markersRef.current.delete(id);
      }
    });

    notifyMarkersReady();
  }, [notifyMarkersReady]);

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
        },
        layers: [{ id: "carto-raster", type: "raster", source: "carto-base" }],
      },
      center: MAJALAYA_CENTER,
      zoom: 12.2,
      pitch: 70,
      bearing: -25,
      maxPitch: 85,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");
    map.addControl(new maplibregl.FullscreenControl(), "top-left");
    map.addControl(
      new maplibregl.TerrainControl({ source: "terrainSource", exaggeration: 1.6 }),
      "top-left",
    );

    map.on("load", () => {
      setMapReady(true);
      syncPosMarkers();
      onMapReadyRef.current?.(map);

      const runEnhance = () => {
        if (!mapRef.current || mapRef.current !== map) return;
        enhanceMap3D(map);
      };
      if (typeof requestIdleCallback !== "undefined") {
        requestIdleCallback(runEnhance, { timeout: 2000 });
      } else {
        window.setTimeout(runEnhance, 50);
      }
    });

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.marker.remove());
      markersRef.current.clear();
      homeMarkerRef.current?.remove();
      homeMarkerRef.current = null;
      markersReadyFiredRef.current = false;
      setMapReady(false);
      map.remove();
      mapRef.current = null;
    };
  }, [syncPosMarkers]);

  // Sync markers when sensor data arrives or updates (poll / navigation)
  useEffect(() => {
    if (!mapReady || !sensorDataReady) return;
    syncPosMarkers();
  }, [posList, mapReady, sensorDataReady, syncPosMarkers]);

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

    const popup = new maplibregl.Popup({ ...POS_POPUP_OPTIONS, offset: 16 }).setHTML(`
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
