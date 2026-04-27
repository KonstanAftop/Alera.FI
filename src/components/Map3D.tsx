import { useEffect, useRef } from "react";
import maplibregl, { Map as MLMap } from "maplibre-gl";
import { RIVERS } from "@/data/rivers";

export type PosKategori = "hulu" | "tengah" | "hilir";

export interface PosMonitoring {
  id: string;
  nama: string;
  kategori: PosKategori;
  lngLat: [number, number];
  elevasi?: number; // mdpl
  keterangan?: string;
}

interface Map3DProps {
  onMapReady?: (map: MLMap) => void;
  posList?: PosMonitoring[];
  onPosClick?: (pos: PosMonitoring) => void;
}

// Majalaya, Kabupaten Bandung, West Java
const MAJALAYA_CENTER: [number, number] = [107.7619, -7.0428];

const KATEGORI_COLOR: Record<PosKategori, string> = {
  hulu: "#ef4444",   // red — mountains / source
  tengah: "#f59e0b", // amber — mid
  hilir: "#0ea5e9",  // sky blue — downstream
};

const Map3D = ({ onMapReady, posList = [], onPosClick }: Map3DProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);

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
          // AWS Terrain Tiles — Terrarium encoding (free, no key)
          terrainSource: {
            type: "raster-dem",
            tiles: [
              "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
            ],
            encoding: "terrarium",
            tileSize: 256,
            maxzoom: 14,
            attribution: "Terrain: AWS Terrain Tiles",
          },
          hillshadeSource: {
            type: "raster-dem",
            tiles: [
              "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
            ],
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
          {
            id: "sky",
            type: "background",
            paint: { "background-color": "#cfe6ff" },
            layout: { visibility: "none" }, // sky added via setSky below
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
      new maplibregl.TerrainControl({
        source: "terrainSource",
        exaggeration: 1.6,
      }),
      "top-right",
    );

    map.on("load", () => {
      // Enable real 3D terrain
      map.setTerrain({ source: "terrainSource", exaggeration: 1.6 });

      // Atmospheric sky (MapLibre v3+)
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
        // older versions: ignore
      }

      // Render monitoring pos markers
      posList.forEach((pos) => {
        const el = document.createElement("button");
        el.type = "button";
        el.setAttribute("aria-label", `Pos ${pos.nama} — ${pos.kategori}`);
        el.style.cssText = `
          width: 28px; height: 28px; border-radius: 9999px;
          background: ${KATEGORI_COLOR[pos.kategori]};
          border: 3px solid white;
          box-shadow: 0 4px 14px rgba(0,0,0,.35), 0 0 0 4px ${KATEGORI_COLOR[pos.kategori]}33;
          cursor: pointer; transition: transform .15s ease;
        `;
        el.onmouseenter = () => (el.style.transform = "scale(1.2)");
        el.onmouseleave = () => (el.style.transform = "scale(1)");
        el.onclick = () => onPosClick?.(pos);

        const popup = new maplibregl.Popup({ offset: 22, closeButton: false }).setHTML(`
          <div style="font-family:system-ui;min-width:180px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
              <span style="display:inline-block;width:8px;height:8px;border-radius:9999px;background:${KATEGORI_COLOR[pos.kategori]}"></span>
              <strong style="font-size:13px">${pos.nama}</strong>
            </div>
            <div style="font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:.05em">${pos.kategori}</div>
            ${pos.elevasi != null ? `<div style="font-size:12px;color:#0f172a;margin-top:4px">Elevasi: <strong>${pos.elevasi} mdpl</strong></div>` : ""}
            ${pos.keterangan ? `<div style="font-size:11px;color:#64748b;margin-top:4px">${pos.keterangan}</div>` : ""}
          </div>
        `);

        new maplibregl.Marker({ element: el })
          .setLngLat(pos.lngLat)
          .setPopup(popup)
          .addTo(map);
      });

      onMapReady?.(map);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [onMapReady, posList, onPosClick]);

  return <div ref={containerRef} className="absolute inset-0 h-full w-full" />;
};

export default Map3D;
