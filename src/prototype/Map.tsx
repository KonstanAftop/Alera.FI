import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Post, status, value } from "./model";
export default function MonitoringMap({
  posts,
  selected,
  at,
  onOpen,
}: {
  posts: Post[];
  selected: string[];
  at: string;
  onOpen: (id: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map>();
  useEffect(() => {
    if (!container.current) return;
    map.current = new maplibregl.Map({
      container: container.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "base",
            type: "raster",
            source: "osm",
            paint: { "raster-saturation": -0.85, "raster-opacity": 0.7 },
          },
        ],
      },
      center: [107.735, -7.08],
      zoom: 11,
    });
    map.current.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );
    return () => map.current?.remove();
  }, []);
  useEffect(() => {
    if (!map.current) return;
    const markers = posts.map((p) => {
      const button = document.createElement("button");
      button.className = `map-marker ${p.availability !== "active" ? "muted" : status(p, at) === "Normal" ? "normal" : "attention"} ${selected.includes(p.id) ? "selected" : ""}`;
      button.setAttribute("aria-label", `Buka ${p.type} ${p.name}`);
      button.textContent = `${selected.includes(p.id) ? "✓ " : ""}${p.type} · ${p.name}\n${value(p, at) === null ? "—" : value(p, at)?.toFixed(p.type === "AWLR" ? 2 : 0) + " " + p.unit} · ${status(p, at)}`;
      button.onclick = () => onOpen(p.id);
      const marker = new maplibregl.Marker({
        element: button,
        anchor: p.type === "CCTV" ? "top" : "bottom",
        offset: p.type === "CCTV" ? [0, 10] : [0, -10],
      })
        .setLngLat([p.lng, p.lat])
        .addTo(map.current!);
      button.setAttribute("aria-label", `Buka ${p.type} ${p.name}`);
      return marker;
    });
    return () => markers.forEach((m) => m.remove());
  }, [posts, selected, at, onOpen]);
  return (
    <div
      className="map-canvas"
      ref={container}
      aria-label="Peta interaktif pos pemantauan Majalaya"
    />
  );
}
