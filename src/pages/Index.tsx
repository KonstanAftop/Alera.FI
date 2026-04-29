import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Map as MLMap } from "maplibre-gl";
import Map3D, { type PosMonitoring, type PosReading } from "@/components/Map3D";
import { Button } from "@/components/ui/button";
import { Plus, Minus, RotateCcw, Mountain, Compass, Droplets, TriangleAlert, CloudRain, Activity, Radio } from "lucide-react";

// Base station definitions (without live readings).
type PosBase = Omit<PosMonitoring, "reading">;

const POS_BASE: PosBase[] = [
  // ===== ARR (Curah Hujan) =====
  {
    id: "arr-cisanti",
    nama: "ARR Situ Cisanti",
    kategori: "hulu",
    tipe: "ARR",
    lngLat: [107.7861, -7.2069],
    elevasi: 1450,
    keterangan: "Mata air Citarum, kaki G. Wayang.",
  },
  {
    id: "arr-kertasari",
    nama: "ARR Kertasari",
    kategori: "hulu",
    tipe: "ARR",
    lngLat: [107.7503, -7.1492],
    elevasi: 1180,
    keterangan: "Daerah tangkapan air selatan.",
  },
  {
    id: "arr-pacet",
    nama: "ARR Pacet",
    kategori: "hulu",
    tipe: "ARR",
    lngLat: [107.8211, -7.1100],
    elevasi: 980,
    keterangan: "Lereng timur sub-DAS Citarum.",
  },
  {
    id: "arr-paseh",
    nama: "ARR Paseh",
    kategori: "tengah",
    tipe: "ARR",
    lngLat: [107.7905, -7.0598],
    elevasi: 690,
    keterangan: "Curah hujan wilayah tengah.",
  },
  // ===== AWLR (Tinggi Muka Air) =====
  {
    id: "awlr-majalaya",
    nama: "AWLR Majalaya Kota",
    kategori: "tengah",
    tipe: "AWLR",
    lngLat: [107.7619, -7.0428],
    elevasi: 670,
    keterangan: "Cekungan Majalaya — rawan banjir.",
  },
  {
    id: "awlr-baleendah",
    nama: "AWLR Baleendah",
    kategori: "hilir",
    tipe: "AWLR",
    lngLat: [107.6286, -7.0036],
    elevasi: 655,
    keterangan: "Pertemuan Citarum–Cisangkuy.",
  },
  {
    id: "awlr-dayeuhkolot",
    nama: "AWLR Dayeuhkolot",
    kategori: "hilir",
    tipe: "AWLR",
    lngLat: [107.6175, -6.9836],
    elevasi: 660,
    keterangan: "Hilir Citarum, dekat Bandung.",
  },
];

// === Mockup realtime generator ===
// ARR: curah hujan 0–40 mm/jam (siaga >20, awas >30)
// AWLR: 0.4–3.5 m (siaga >2.0, awas >2.8)
const seedReading = (p: PosBase): PosReading => {
  if (p.tipe === "ARR") {
    const v = Math.random() * 18 + (p.kategori === "hulu" ? 4 : 0);
    return { value: v, status: classifyARR(v), updatedAt: Date.now() };
  }
  const base = p.kategori === "hilir" ? 1.6 : 1.1;
  const v = base + Math.random() * 0.8;
  return { value: v, status: classifyAWLR(v), updatedAt: Date.now() };
};

const classifyARR = (v: number): PosReading["status"] =>
  v >= 30 ? "awas" : v >= 20 ? "siaga" : "normal";
const classifyAWLR = (v: number): PosReading["status"] =>
  v >= 2.8 ? "awas" : v >= 2.0 ? "siaga" : "normal";

const stepReading = (p: PosBase, prev: PosReading): PosReading => {
  if (p.tipe === "ARR") {
    const drift = (Math.random() - 0.45) * 6; // tend to slowly rise
    const v = Math.max(0, Math.min(45, prev.value + drift));
    return { value: v, status: classifyARR(v), updatedAt: Date.now() };
  }
  const drift = (Math.random() - 0.5) * 0.25;
  const v = Math.max(0.3, Math.min(3.6, prev.value + drift));
  return { value: v, status: classifyAWLR(v), updatedAt: Date.now() };
};

const Index = () => {
  const mapRef = useRef<MLMap | null>(null);
  const [pitch, setPitch] = useState(70);
  const [bearing, setBearing] = useState(-25);
  const [activePos, setActivePos] = useState<PosMonitoring | null>(null);

  // Live readings keyed by pos id
  const [readings, setReadings] = useState<Record<string, PosReading>>(() => {
    const init: Record<string, PosReading> = {};
    POS_BASE.forEach((p) => (init[p.id] = seedReading(p)));
    return init;
  });

  // Tick every 4s — mockup "real-time"
  useEffect(() => {
    const id = window.setInterval(() => {
      setReadings((prev) => {
        const next: Record<string, PosReading> = {};
        POS_BASE.forEach((p) => {
          next[p.id] = stepReading(p, prev[p.id] ?? seedReading(p));
        });
        return next;
      });
    }, 4000);
    return () => window.clearInterval(id);
  }, []);

  const posList: PosMonitoring[] = useMemo(
    () => POS_BASE.map((p) => ({ ...p, reading: readings[p.id] })),
    [readings],
  );

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

  const arrList = useMemo(() => posList.filter((p) => p.tipe === "ARR"), [posList]);
  const awlrList = useMemo(() => posList.filter((p) => p.tipe === "AWLR"), [posList]);

  // Aggregate alert counts
  const alerts = useMemo(() => {
    let siaga = 0, awas = 0;
    posList.forEach((p) => {
      if (p.reading?.status === "siaga") siaga++;
      else if (p.reading?.status === "awas") awas++;
    });
    return { siaga, awas };
  }, [posList]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background">
      <h1 className="sr-only">Peta 3D Hidrometeorologi Majalaya — ARR & AWLR DAS Citarum</h1>

      <Map3D onMapReady={handleMapReady} posList={posList} onPosClick={flyToPos} />

      {/* Top-left: brand + legend */}
      <div
        className="pointer-events-auto absolute left-4 top-4 w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 p-4 text-panel-foreground shadow-[var(--shadow-panel)] backdrop-blur-xl"
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
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold text-emerald-300">
            <Radio className="h-3 w-3 animate-pulse" /> LIVE
          </span>
        </div>

        <div className="mt-4 space-y-2 text-xs">
          <p className="font-semibold text-white/80">Jenis pos:</p>
          <LegendRow color="#ef4444" title="ARR" desc="Automatic Rain Recorder — curah hujan (mm/jam)" />
          <LegendRow color="#0ea5e9" title="AWLR" desc="Automatic Water Level Recorder — TMA (m)" />
        </div>

        <div className="mt-3 space-y-1.5 text-xs">
          <p className="font-semibold text-white/80">Status (cincin marker):</p>
          <div className="flex items-center gap-3">
            <StatusChip color="#22c55e" label="Normal" />
            <StatusChip color="#f59e0b" label="Siaga" />
            <StatusChip color="#ef4444" label="Awas" />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <StatBox color="#f59e0b" label="Siaga" value={alerts.siaga} />
          <StatBox color="#ef4444" label="Awas" value={alerts.awas} />
        </div>

        <p className="mt-3 flex items-start gap-2 rounded-lg bg-white/5 p-2 text-[11px] leading-relaxed text-white/70">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
          Data simulasi (mockup) — di-update tiap 4 detik. ARR tinggi di hulu = waspada kenaikan AWLR di hilir 2–6 jam ke depan.
        </p>
      </div>

      {/* Right-side pos list */}
      <aside
        className="pointer-events-auto absolute right-4 top-4 hidden w-[300px] max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl border border-white/10 text-panel-foreground shadow-[var(--shadow-panel)] backdrop-blur-xl md:flex"
        style={{ background: "var(--gradient-panel)", marginRight: "60px" }}
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <Droplets className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold">Pos Monitoring</h3>
          <span className="ml-auto text-[10px] text-white/50">{posList.length} titik</span>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-3">
          <PosGroup
            icon={<CloudRain className="h-3.5 w-3.5" />}
            title="ARR — Curah Hujan"
            unit="mm/jam"
            items={arrList}
            active={activePos}
            onClick={flyToPos}
          />
          <PosGroup
            icon={<Activity className="h-3.5 w-3.5" />}
            title="AWLR — Tinggi Muka Air"
            unit="m"
            items={awlrList}
            active={activePos}
            onClick={flyToPos}
          />
        </div>
      </aside>

      {/* Custom controls */}
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

const STATUS_HSL: Record<PosReading["status"], string> = {
  normal: "#22c55e",
  siaga: "#f59e0b",
  awas: "#ef4444",
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

const StatusChip = ({ color, label }: { color: string; label: string }) => (
  <span className="inline-flex items-center gap-1.5 text-[11px] text-white/70">
    <span className="inline-block h-2.5 w-2.5 rounded-full ring-2" style={{ background: color, boxShadow: `0 0 0 3px ${color}33` }} />
    {label}
  </span>
);

const StatBox = ({ color, label, value }: { color: string; label: string; value: number }) => (
  <div
    className="rounded-lg border px-3 py-2"
    style={{ borderColor: `${color}55`, background: `${color}15` }}
  >
    <div className="text-[10px] font-semibold uppercase tracking-wider text-white/60">{label}</div>
    <div className="mt-0.5 font-mono text-lg font-bold" style={{ color }}>{value}</div>
  </div>
);

const PosGroup = ({
  icon, title, unit, items, active, onClick,
}: {
  icon: React.ReactNode;
  title: string;
  unit: string;
  items: PosMonitoring[];
  active: PosMonitoring | null;
  onClick: (p: PosMonitoring) => void;
}) => (
  <div>
    <div className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-bold tracking-wider text-white/50">
      {icon}
      {title}
    </div>
    <div className="space-y-1">
      {items.map((p) => {
        const status = p.reading?.status ?? "normal";
        const statusColor = STATUS_HSL[status];
        return (
          <button
            key={p.id}
            onClick={() => onClick(p)}
            className={`w-full rounded-lg border px-2.5 py-2 text-left text-xs transition ${
              active?.id === p.id
                ? "border-white/30 bg-white/15"
                : "border-white/5 bg-white/[.03] hover:bg-white/10"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium truncate">{p.nama}</span>
              <span
                className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase"
                style={{ background: `${statusColor}25`, color: statusColor }}
              >
                {status}
              </span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-mono text-[10px] text-white/50">
                {p.elevasi != null ? `${p.elevasi} mdpl` : ""}
              </span>
              <span className="font-mono text-sm font-semibold text-white">
                {p.reading
                  ? p.tipe === "ARR"
                    ? `${p.reading.value.toFixed(1)} ${unit}`
                    : `${p.reading.value.toFixed(2)} ${unit}`
                  : "—"}
              </span>
            </div>
          </button>
        );
      })}
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
