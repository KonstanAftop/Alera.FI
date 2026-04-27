import { useCallback, useMemo, useRef, useState } from "react";
import type { Map as MLMap } from "maplibre-gl";
import Map3D, { type PosMonitoring } from "@/components/Map3D";
import { Button } from "@/components/ui/button";
import { Plus, Minus, RotateCcw, Mountain, Compass, Droplets, TriangleAlert } from "lucide-react";

// Sample hydromet monitoring stations around the Majalaya / upper Citarum basin.
// Mountains south & east = HULU (sources of Citarum: Gunung Wayang/Malabar).
// Majalaya basin floor = TENGAH. Northwest toward Dayeuhkolot/Bandung = HILIR.
const POS_LIST: PosMonitoring[] = [
  {
    id: "hulu-wayang",
    nama: "Pos Hulu Citarum (Situ Cisanti)",
    kategori: "hulu",
    lngLat: [107.7861, -7.2069],
    elevasi: 1450,
    keterangan: "Mata air Sungai Citarum, kaki G. Wayang.",
  },
  {
    id: "hulu-kertasari",
    nama: "Pos Kertasari",
    kategori: "hulu",
    lngLat: [107.7503, -7.1492],
    elevasi: 1180,
    keterangan: "Daerah tangkapan air bagian selatan.",
  },
  {
    id: "hulu-pacet",
    nama: "Pos Pacet",
    kategori: "hulu",
    lngLat: [107.8211, -7.1100],
    elevasi: 980,
    keterangan: "Lereng timur, sub-DAS Citarum.",
  },
  {
    id: "tengah-majalaya",
    nama: "Pos Majalaya Kota",
    kategori: "tengah",
    lngLat: [107.7619, -7.0428],
    elevasi: 670,
    keterangan: "Cekungan Majalaya — rawan banjir.",
  },
  {
    id: "tengah-paseh",
    nama: "Pos Paseh",
    kategori: "tengah",
    lngLat: [107.7905, -7.0598],
    elevasi: 690,
    keterangan: "Hilir langsung dari Majalaya.",
  },
  {
    id: "hilir-baleendah",
    nama: "Pos Baleendah",
    kategori: "hilir",
    lngLat: [107.6286, -7.0036],
    elevasi: 655,
    keterangan: "Pertemuan Citarum–Cisangkuy, banjir tahunan.",
  },
  {
    id: "hilir-dayeuhkolot",
    nama: "Pos Dayeuhkolot",
    kategori: "hilir",
    lngLat: [107.6175, -6.9836],
    elevasi: 660,
    keterangan: "Hilir Citarum, dekat Bandung.",
  },
];

const Index = () => {
  const mapRef = useRef<MLMap | null>(null);
  const [pitch, setPitch] = useState(70);
  const [bearing, setBearing] = useState(-25);
  const [activePos, setActivePos] = useState<PosMonitoring | null>(null);

  const handleMapReady = useCallback((map: MLMap) => {
    mapRef.current = map;
    map.on("pitch", () => setPitch(map.getPitch()));
    map.on("rotate", () => setBearing(map.getBearing()));
  }, []);

  const flyToPos = useCallback((pos: PosMonitoring) => {
    setActivePos(pos);
    mapRef.current?.flyTo({
      center: pos.lngLat,
      zoom: 13.5,
      pitch: 72,
      bearing: pos.kategori === "hulu" ? 20 : pos.kategori === "hilir" ? -160 : -25,
      duration: 1600,
      essential: true,
    });
  }, []);

  const zoomBy = (delta: number) => mapRef.current?.zoomTo(mapRef.current.getZoom() + delta, { duration: 300 });
  const setPitchVal = (p: number) => mapRef.current?.easeTo({ pitch: p, duration: 400 });
  const rotateBy = (delta: number) =>
    mapRef.current?.easeTo({ bearing: mapRef.current.getBearing() + delta, duration: 400 });
  const resetView = () =>
    mapRef.current?.easeTo({ center: [107.7619, -7.0428], zoom: 12.2, pitch: 70, bearing: -25, duration: 900 });

  const grouped = useMemo(
    () => ({
      hulu: POS_LIST.filter((p) => p.kategori === "hulu"),
      tengah: POS_LIST.filter((p) => p.kategori === "tengah"),
      hilir: POS_LIST.filter((p) => p.kategori === "hilir"),
    }),
    [],
  );

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background">
      <h1 className="sr-only">Peta 3D Hidrometeorologi Majalaya — Pos Hulu, Tengah, Hilir DAS Citarum</h1>

      <Map3D onMapReady={handleMapReady} posList={POS_LIST} onPosClick={flyToPos} />

      {/* Top-left: brand + legend */}
      <div
        className="pointer-events-auto absolute left-4 top-4 w-[300px] max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 p-4 text-panel-foreground shadow-[var(--shadow-panel)] backdrop-blur-xl"
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
            <h2 className="text-base font-semibold leading-tight">Majalaya Hidromet 3D</h2>
            <p className="text-xs text-white/60">DAS Citarum Hulu · Kab. Bandung</p>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-xs">
          <p className="font-semibold text-white/80">Klasifikasi pos berdasarkan elevasi:</p>
          <LegendRow color="#ef4444" title="Hulu" desc="Pegunungan / mata air (>900 mdpl)" />
          <LegendRow color="#f59e0b" title="Tengah" desc="Cekungan Majalaya (~670 mdpl)" />
          <LegendRow color="#0ea5e9" title="Hilir" desc="Baleendah & sekitarnya" />
        </div>

        <p className="mt-3 flex items-start gap-2 rounded-lg bg-white/5 p-2 text-[11px] leading-relaxed text-white/70">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
          Aktifkan terrain (tombol gunung di kanan-atas) untuk relief penuh. Hujan di pos hulu = potensi banjir di hilir 2–6 jam kemudian.
        </p>
      </div>

      {/* Right-side pos list */}
      <aside
        className="pointer-events-auto absolute right-4 top-4 hidden w-[280px] max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl border border-white/10 text-panel-foreground shadow-[var(--shadow-panel)] backdrop-blur-xl md:flex"
        style={{ background: "var(--gradient-panel)", marginRight: "60px" }}
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <Droplets className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold">Pos Monitoring</h3>
          <span className="ml-auto text-[10px] text-white/50">{POS_LIST.length} titik</span>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-3">
          <PosGroup title="HULU" color="#ef4444" items={grouped.hulu} active={activePos} onClick={flyToPos} />
          <PosGroup title="TENGAH" color="#f59e0b" items={grouped.tengah} active={activePos} onClick={flyToPos} />
          <PosGroup title="HILIR" color="#0ea5e9" items={grouped.hilir} active={activePos} onClick={flyToPos} />
        </div>
      </aside>

      {/* Custom controls — bottom right */}
      <div className="pointer-events-auto absolute bottom-6 right-4 flex flex-col gap-3">
        <ControlStack>
          <CtrlBtn onClick={() => zoomBy(1)}><Plus className="h-5 w-5" /></CtrlBtn>
          <CtrlBtn onClick={() => zoomBy(-1)}><Minus className="h-5 w-5" /></CtrlBtn>
        </ControlStack>
        <ControlStack>
          <CtrlBtn onClick={() => rotateBy(-30)}><RotateCcw className="h-5 w-5" /></CtrlBtn>
          <CtrlBtn onClick={() => rotateBy(30)}><RotateCcw className="h-5 w-5 -scale-x-100" /></CtrlBtn>
        </ControlStack>
        <ControlStack>
          <CtrlBtn onClick={() => setPitchVal(0)}><span className="text-xs font-semibold">2D</span></CtrlBtn>
          <CtrlBtn onClick={() => setPitchVal(78)}><span className="text-xs font-semibold">3D</span></CtrlBtn>
        </ControlStack>
        <Button
          onClick={resetView}
          className="h-11 w-11 rounded-2xl border border-white/10 p-0 text-primary-foreground shadow-[var(--shadow-glow)]"
          style={{ background: "var(--gradient-accent)" }}
          aria-label="Reset view"
        >
          <Compass className="h-5 w-5" />
        </Button>
      </div>

      {/* Telemetry */}
      <div
        className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-white/10 px-4 py-2 text-xs text-white/80 shadow-[var(--shadow-panel)] backdrop-blur-xl"
        style={{ background: "var(--gradient-panel)" }}
      >
        <span className="font-mono">Pitch {pitch.toFixed(0)}°</span>
        <span className="mx-3 text-white/30">·</span>
        <span className="font-mono">Bearing {bearing.toFixed(0)}°</span>
        {activePos && (
          <>
            <span className="mx-3 text-white/30">·</span>
            <span className="font-mono">{activePos.nama}</span>
          </>
        )}
      </div>
    </main>
  );
};

const LegendRow = ({ color, title, desc }: { color: string; title: string; desc: string }) => (
  <div className="flex items-start gap-2">
    <span
      className="mt-1 inline-block h-3 w-3 shrink-0 rounded-full ring-2 ring-white/20"
      style={{ background: color }}
    />
    <div>
      <span className="font-semibold">{title}</span>
      <span className="text-white/60"> — {desc}</span>
    </div>
  </div>
);

const PosGroup = ({
  title, color, items, active, onClick,
}: {
  title: string; color: string; items: PosMonitoring[];
  active: PosMonitoring | null; onClick: (p: PosMonitoring) => void;
}) => (
  <div>
    <div className="mb-1.5 flex items-center gap-2 px-1 text-[10px] font-bold tracking-wider text-white/50">
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
      {title}
    </div>
    <div className="space-y-1">
      {items.map((p) => (
        <button
          key={p.id}
          onClick={() => onClick(p)}
          className={`w-full rounded-lg border px-2.5 py-2 text-left text-xs transition ${
            active?.id === p.id
              ? "border-white/30 bg-white/15"
              : "border-white/5 bg-white/[.03] hover:bg-white/10"
          }`}
        >
          <div className="font-medium">{p.nama}</div>
          {p.elevasi != null && (
            <div className="mt-0.5 font-mono text-[10px] text-white/50">{p.elevasi} mdpl</div>
          )}
        </button>
      ))}
    </div>
  </div>
);

const ControlStack = ({ children }: { children: React.ReactNode }) => (
  <div
    className="flex flex-col overflow-hidden rounded-2xl border border-white/10 shadow-[var(--shadow-panel)] backdrop-blur-xl"
    style={{ background: "var(--gradient-panel)" }}
  >
    {children}
  </div>
);

const CtrlBtn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <Button
    variant="ghost"
    size="icon"
    onClick={onClick}
    className="h-11 w-11 rounded-none text-white hover:bg-white/10 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-white/10"
  >
    {children}
  </Button>
);

export default Index;
