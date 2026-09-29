import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Post, status, value, postTypes, observedAt } from "./model";
export default function MonitoringMap({
  posts,
  selected,
  at,
  onOpen,
  tourSnapshot,
}: {
  posts: Post[];
  selected: string[];
  at: string;
  onOpen: (id: string) => void;
  tourSnapshot?: string | null;
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
            id: "paper",
            type: "background",
            paint: { "background-color": "#f1f3ec" },
          },
          {
            id: "base",
            type: "raster",
            source: "osm",
            paint: {
              "raster-saturation": -0.8,
              "raster-opacity": 0.52,
              "raster-contrast": -0.18,
            },
          },
        ],
      },
      center: [107.73, -7.09],
      zoom: 10.95,
    });
    map.current.on("load", () => {
      const current = map.current;
      if (!current) return;
      current.fitBounds([[107.675, -7.17], [107.77, -7.02]], {
        padding: { top: 95, bottom: 65, left: 75, right: 80 },
        maxZoom: 11,
        duration: 0,
      });
      current.addSource("local-rivers", {
        type: "geojson",
        data: "/geo/majalaya-rivers.geojson",
        attribution: "River geometry © OpenStreetMap contributors",
      });
      current.addLayer({
        id: "river-bank",
        type: "line",
        source: "local-rivers",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#c5e6ef",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            9,
            2,
            13,
            7,
            16,
            15,
          ],
          "line-opacity": 0.85,
        },
      });
      current.addLayer({
        id: "river-water",
        type: "line",
        source: "local-rivers",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#539fc5",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            9,
            0.8,
            13,
            2.5,
            16,
            7,
          ],
          "line-opacity": 0.9,
        },
      });
    });
    const resize = new ResizeObserver(() => {
      map.current?.resize();
    });
    resize.observe(container.current);
    map.current.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );
    return () => {
      resize.disconnect();
      map.current?.remove();
    };
  }, []);
  useEffect(() => {
    if (!map.current) return;
    let activePopup: maplibregl.Popup | undefined;
    const markers = posts.map((p) => {
      const condition = status(p, at);
      const tone = p.availability !== "active" ? "muted"
        : condition === "Waspada" ? "warning"
        : condition === "Hujan lebat" ? "rain" : "normal";
      const button = document.createElement("button");
      button.type = "button";
      button.className = `station-dot ${tone} ${selected.includes(p.id) ? "selected" : ""}`;
      button.setAttribute("aria-label", `${postTypes(p).join(" + ")} ${p.name}: ${condition}. Buka ringkasan${selected.includes(p.id) ? ", dipilih" : ""}`);
      button.setAttribute("aria-expanded", "false");
      const dot = document.createElement("span");
      dot.className = "station-dot-core";
      dot.setAttribute("aria-hidden", "true");
      button.append(dot);
      if (selected.includes(p.id)) {
        const check = document.createElement("span");
        check.className = "marker-check";
        check.textContent = "✓";
        check.setAttribute("aria-hidden", "true");
        button.append(check);
      }
      const snapshot = document.createElement("section");
      snapshot.className = `station-snapshot ${tone}`;
      const heading = document.createElement("h3");
      heading.textContent = `${postTypes(p).join(" + ")} ${p.name}`;
      const reading = document.createElement("strong");
      const measurement = value(p, at);
      reading.className = "snapshot-reading";
      reading.textContent = measurement === null ? "—" : `${measurement.toFixed(p.type === "AWLR" ? 2 : 0)} ${p.unit}`;
      const label = document.createElement("p");
      label.className = "snapshot-status";
      label.textContent = condition;
      const timestamp = document.createElement("p");
      timestamp.className = "snapshot-time";
      timestamp.textContent = measurement === null ? "Belum ada pengamatan tersedia"
        : `${p.availability === "stale" ? "Pengamatan lama" : "Pengamatan"}: ${new Date(observedAt(p, at)).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })} · Simulasi`;
      const detail = document.createElement("button");
      detail.type = "button";
      detail.className = "snapshot-detail";
      detail.textContent = "Lihat detail";
      detail.onclick = () => {
        activePopup?.remove();
        onOpen(p.id);
      };
      snapshot.append(heading, reading, label, timestamp);
      if (p.cctv) {
        const camera = document.createElement("p");
        camera.className = "snapshot-time";
        camera.textContent = "CCTV: belum tersedia";
        snapshot.append(camera);
      }
      snapshot.append(detail);
      const popup = new maplibregl.Popup({ offset: 22, maxWidth: "260px", className: "station-popup" })
        .setDOMContent(snapshot);
      popup.on("close", () => button.setAttribute("aria-expanded", "false"));
      button.onclick = (event) => {
        event.stopPropagation();
        const wasOpen = popup.isOpen();
        activePopup?.remove();
        if (!wasOpen) {
          popup.setLngLat([p.lng, p.lat]).addTo(map.current!);
          activePopup = popup;
          button.setAttribute("aria-expanded", "true");
        }
      };
      if (tourSnapshot === p.id) {
        popup.setLngLat([p.lng, p.lat]).addTo(map.current!);
        activePopup = popup;
        button.setAttribute("aria-expanded", "true");
      }
      return new maplibregl.Marker({ element: button, anchor: "center" })
        .setLngLat([p.lng, p.lat])
        .addTo(map.current!);
    });
    return () => {
      activePopup?.remove();
      markers.forEach((m) => m.remove());
    };
  }, [posts, selected, at, onOpen, tourSnapshot]);
  return (
    <div
      className="map-canvas"
      ref={container}
      aria-label="Peta interaktif pos pemantauan Majalaya"
    />
  );
}
