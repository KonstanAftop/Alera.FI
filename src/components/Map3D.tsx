import { useEffect, useRef } from "react";
import maplibregl, { Map as MLMap } from "maplibre-gl";
import citarumGeo from "@/data/citarum.geojson?url";

export type PosKategori = "hulu" | "tengah" | "hilir";
export type PosTipe = "ARR" | "AWLR"; // ARR = curah hujan, AWLR = tinggi muka air

export interface PosReading {
  // ARR: curah hujan kumulatif 1 jam terakhir (mm)
  // AWLR: tinggi muka air saat ini (m)
  value: number;
  // status: normal | siaga | awas
  status: "normal" | "siaga" | "awas";
  updatedAt: number; // epoch ms
}

export interface PosMonitoring {
  id: string;
  nama: string;
  kategori: PosKategori;
  tipe: PosTipe;
  lngLat: [number, number];
  elevasi?: number; // mdpl
  keterangan?: string;
  reading?: PosReading;
}

interface Map3DProps {
  onMapReady?: (map: MLMap) => void;
  posList?: PosMonitoring[];
  onPosClick?: (pos: PosMonitoring) => void;
}

const MAJALAYA_CENTER: [number, number] = [107.7619, -7.0428];

const KATEGORI_COLOR: Record<PosKategori, string> = {
  hulu: "#ef4444",
  tengah: "#f59e0b",
  hilir: "#0ea5e9",
};

const STATUS_COLOR: Record<PosReading["status"], string> = {
  normal: "#22c55e",
  siaga: "#f59e0b",
  awas: "#ef4444",
};

const Map3D = ({ onMapReady, posList = [], onPosClick }: Map3DProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markersRef = useRef<Map<string, { marker: maplibregl.Marker; el: HTMLButtonElement; popup: maplibregl.Popup }>>(new Map());

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
            data: citarumGeo,
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
          // Soft glow under main rivers
          {
            id: "river-glow",
            type: "line",
            source: "rivers",
            filter: ["==", ["get", "kelas"], "utama"],
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
              "line-color": "#38bdf8",
              "line-blur": 6,
              "line-opacity": 0.5,
              "line-width": [
                "interpolate", ["linear"], ["zoom"],
                10, 5, 14, 14,
              ],
            },
          },
          // Tributaries (other rivers + named streams)
          {
            id: "river-anak",
            type: "line",
            source: "rivers",
            filter: ["!=", ["get", "kelas"], "utama"],
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
              "line-color": [
                "case",
                ["==", ["get", "waterway"], "stream"], "#7dd3fc",
                "#38bdf8",
              ],
              "line-opacity": 0.85,
              "line-width": [
                "interpolate", ["linear"], ["zoom"],
                10, ["case", ["==", ["get", "waterway"], "stream"], 0.6, 1.2],
                14, ["case", ["==", ["get", "waterway"], "stream"], 1.8, 3.2],
              ],
            },
          },
          // Main rivers (Citarum + Cisangkuy)
          {
            id: "river-utama",
            type: "line",
            source: "rivers",
            filter: ["==", ["get", "kelas"], "utama"],
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
              "line-color": [
                "case",
                ["==", ["get", "is_citarum"], true], "#0369a1",
                "#0284c7",
              ],
              "line-width": [
                "interpolate", ["linear"], ["zoom"],
                10, 2.5, 14, 7,
              ],
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

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");
    map.addControl(new maplibregl.FullscreenControl(), "top-right");
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      "top-right",
    );
    map.addControl(
      new maplibregl.TerrainControl({ source: "terrainSource", exaggeration: 1.6 }),
      "top-right",
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
      onMapReady?.(map);
    });

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.marker.remove());
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, [onMapReady]);

  // Sync markers whenever posList changes (incl. realtime updates)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      const seen = new Set<string>();

      posList.forEach((pos) => {
        seen.add(pos.id);
        const status = pos.reading?.status ?? "normal";
        const ringColor = STATUS_COLOR[status];
        const kategoriColor = KATEGORI_COLOR[pos.kategori];
        const isRain = pos.tipe === "ARR";

        const valueLabel = pos.reading
          ? isRain
            ? `${pos.reading.value.toFixed(1)} mm/jam`
            : `${pos.reading.value.toFixed(2)} m`
          : "—";

        const popupHtml = `
          <div style="font-family:system-ui;min-width:200px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
              <span style="display:inline-block;width:8px;height:8px;border-radius:9999px;background:${kategoriColor}"></span>
              <strong style="font-size:13px">${pos.nama}</strong>
            </div>
            <div style="font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:.05em">
              ${pos.tipe === "ARR" ? "Pos Curah Hujan (ARR)" : "Pos Tinggi Muka Air (AWLR)"} · ${pos.kategori}
            </div>
            <div style="margin-top:6px;display:flex;align-items:baseline;gap:6px">
              <span style="font-size:18px;font-weight:700;color:#0f172a">${valueLabel}</span>
              <span style="font-size:10px;font-weight:700;text-transform:uppercase;color:${ringColor}">${status}</span>
            </div>
            ${pos.elevasi != null ? `<div style="font-size:11px;color:#475569;margin-top:2px">Elevasi: ${pos.elevasi} mdpl</div>` : ""}
            ${pos.keterangan ? `<div style="font-size:11px;color:#64748b;margin-top:4px">${pos.keterangan}</div>` : ""}
            ${pos.reading ? `<div style="font-size:10px;color:#94a3b8;margin-top:6px">Update: ${new Date(pos.reading.updatedAt).toLocaleTimeString("id-ID")}</div>` : ""}
          </div>
        `;

        const existing = markersRef.current.get(pos.id);
        if (existing) {
          // Update style + popup in place (no flicker, marker stays put)
          existing.el.style.background = kategoriColor;
          existing.el.style.boxShadow = `0 4px 14px rgba(0,0,0,.35), 0 0 0 4px ${ringColor}66, 0 0 0 8px ${ringColor}22`;
          existing.el.dataset.status = status;
          existing.popup.setHTML(popupHtml);
          return;
        }

        const el = document.createElement("button");
        el.type = "button";
        el.setAttribute("aria-label", `Pos ${pos.nama}`);
        el.dataset.status = status;
        el.style.cssText = `
          width: 30px; height: 30px; border-radius: 9999px;
          background: ${kategoriColor};
          border: 3px solid white;
          box-shadow: 0 4px 14px rgba(0,0,0,.35), 0 0 0 4px ${ringColor}66, 0 0 0 8px ${ringColor}22;
          cursor: pointer; transition: transform .15s ease;
          display:flex;align-items:center;justify-content:center;
          font-size:13px;line-height:1;color:white;
        `;
        el.textContent = isRain ? "☂" : "≈";
        el.onmouseenter = () => (el.style.transform = "scale(1.18)");
        el.onmouseleave = () => (el.style.transform = "scale(1)");
        el.onclick = () => onPosClick?.(pos);

        const popup = new maplibregl.Popup({ offset: 22, closeButton: false }).setHTML(popupHtml);
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat(pos.lngLat)
          .setPopup(popup)
          .addTo(map);

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
  }, [posList, onPosClick]);

  return <div ref={containerRef} className="absolute inset-0 h-full w-full" />;
};

export default Map3D;
