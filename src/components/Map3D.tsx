import { useEffect, useRef } from "react";
import maplibregl, { Map as MLMap } from "maplibre-gl";

interface Map3DProps {
  onMapReady?: (map: MLMap) => void;
}

// Majalaya, Kabupaten Bandung, West Java
const MAJALAYA_CENTER: [number, number] = [107.7619, -7.0428];

const Map3D = ({ onMapReady }: Map3DProps) => {
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
          "carto-light": {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
              "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
              "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
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
          {
            id: "carto-base",
            type: "raster",
            source: "carto-light",
          },
          {
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
                0, "#d8e3ec",
                10, "#b9c8d6",
                25, "#7c98b2",
                60, "#3b5b78",
              ],
              "fill-extrusion-height": ["coalesce", ["get", "height"], 8],
              "fill-extrusion-base": ["coalesce", ["get", "minHeight"], 0],
              "fill-extrusion-opacity": 0.92,
            },
          },
        ],
      },
      center: MAJALAYA_CENTER,
      zoom: 15.2,
      pitch: 60,
      bearing: -20,
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

    new maplibregl.Marker({ color: "#10b981" })
      .setLngLat(MAJALAYA_CENTER)
      .setPopup(
        new maplibregl.Popup({ offset: 24 }).setHTML(
          '<strong>Majalaya</strong><br/><span style="color:#64748b">Kabupaten Bandung, Jawa Barat</span>',
        ),
      )
      .addTo(map);

    mapRef.current = map;
    map.on("load", () => onMapReady?.(map));

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [onMapReady]);

  return <div ref={containerRef} className="absolute inset-0 h-full w-full" />;
};

export default Map3D;
