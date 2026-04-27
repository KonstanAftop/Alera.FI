import { useCallback, useRef, useState } from "react";
import type { Map as MLMap } from "maplibre-gl";
import Map3D from "@/components/Map3D";
import { Button } from "@/components/ui/button";
import { Plus, Minus, RotateCcw, Mountain, Compass } from "lucide-react";

const Index = () => {
  const mapRef = useRef<MLMap | null>(null);
  const [pitch, setPitch] = useState(60);
  const [bearing, setBearing] = useState(-20);

  const handleMapReady = useCallback((map: MLMap) => {
    mapRef.current = map;
    map.on("pitch", () => setPitch(map.getPitch()));
    map.on("rotate", () => setBearing(map.getBearing()));
  }, []);

  const zoomBy = (delta: number) => mapRef.current?.zoomTo(mapRef.current.getZoom() + delta, { duration: 300 });
  const setPitchVal = (p: number) => mapRef.current?.easeTo({ pitch: p, duration: 400 });
  const rotateBy = (delta: number) =>
    mapRef.current?.easeTo({ bearing: mapRef.current.getBearing() + delta, duration: 400 });
  const resetView = () =>
    mapRef.current?.easeTo({ center: [107.7619, -7.0428], zoom: 15.2, pitch: 60, bearing: -20, duration: 800 });

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background">
      <h1 className="sr-only">Peta 3D Majalaya — Kabupaten Bandung</h1>

      <Map3D onMapReady={handleMapReady} />

      {/* Top-left brand panel */}
      <div
        className="pointer-events-auto absolute left-4 top-4 max-w-xs rounded-2xl border border-white/10 p-4 text-panel-foreground shadow-[var(--shadow-panel)] backdrop-blur-xl"
        style={{ background: "var(--gradient-panel)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground shadow-[var(--shadow-glow)]"
            style={{ background: "var(--gradient-accent)" }}
          >
            <Mountain className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold leading-tight">Majalaya 3D</h2>
            <p className="text-xs text-white/60">Kabupaten Bandung · Jawa Barat</p>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-white/70">
          Jelajahi peta tiga dimensi kawasan Majalaya. Geser untuk pan, scroll untuk zoom, klik kanan + drag (atau Ctrl
          + drag) untuk memutar dan memiringkan kamera.
        </p>
      </div>

      {/* Custom controls — bottom right */}
      <div className="pointer-events-auto absolute bottom-6 right-4 flex flex-col gap-3">
        <div
          className="flex flex-col overflow-hidden rounded-2xl border border-white/10 shadow-[var(--shadow-panel)] backdrop-blur-xl"
          style={{ background: "var(--gradient-panel)" }}
        >
          <Button variant="ghost" size="icon" onClick={() => zoomBy(1)} className="h-11 w-11 rounded-none text-white hover:bg-white/10">
            <Plus className="h-5 w-5" />
          </Button>
          <div className="h-px bg-white/10" />
          <Button variant="ghost" size="icon" onClick={() => zoomBy(-1)} className="h-11 w-11 rounded-none text-white hover:bg-white/10">
            <Minus className="h-5 w-5" />
          </Button>
        </div>

        <div
          className="flex flex-col overflow-hidden rounded-2xl border border-white/10 shadow-[var(--shadow-panel)] backdrop-blur-xl"
          style={{ background: "var(--gradient-panel)" }}
        >
          <Button variant="ghost" size="icon" onClick={() => rotateBy(-30)} className="h-11 w-11 rounded-none text-white hover:bg-white/10">
            <RotateCcw className="h-5 w-5" />
          </Button>
          <div className="h-px bg-white/10" />
          <Button variant="ghost" size="icon" onClick={() => rotateBy(30)} className="h-11 w-11 rounded-none text-white hover:bg-white/10">
            <RotateCcw className="h-5 w-5 -scale-x-100" />
          </Button>
        </div>

        <div
          className="flex flex-col overflow-hidden rounded-2xl border border-white/10 shadow-[var(--shadow-panel)] backdrop-blur-xl"
          style={{ background: "var(--gradient-panel)" }}
        >
          <Button variant="ghost" size="icon" onClick={() => setPitchVal(0)} className="h-11 w-11 rounded-none text-xs font-semibold text-white hover:bg-white/10">
            2D
          </Button>
          <div className="h-px bg-white/10" />
          <Button variant="ghost" size="icon" onClick={() => setPitchVal(75)} className="h-11 w-11 rounded-none text-xs font-semibold text-white hover:bg-white/10">
            3D
          </Button>
        </div>

        <Button
          onClick={resetView}
          className="h-11 w-11 rounded-2xl border border-white/10 p-0 text-primary-foreground shadow-[var(--shadow-glow)]"
          style={{ background: "var(--gradient-accent)" }}
          aria-label="Reset view"
        >
          <Compass className="h-5 w-5" />
        </Button>
      </div>

      {/* Telemetry — bottom right above scale */}
      <div
        className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-white/10 px-4 py-2 text-xs text-white/80 shadow-[var(--shadow-panel)] backdrop-blur-xl"
        style={{ background: "var(--gradient-panel)" }}
      >
        <span className="font-mono">Pitch {pitch.toFixed(0)}°</span>
        <span className="mx-3 text-white/30">·</span>
        <span className="font-mono">Bearing {bearing.toFixed(0)}°</span>
      </div>
    </main>
  );
};

export default Index;
