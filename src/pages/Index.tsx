import { useCallback, useMemo, useRef, useState } from "react";
import type { Map as MLMap } from "maplibre-gl";
import Map3D, { type PosMonitoring, type PosReading } from "@/components/Map3D";
import { Button } from "@/components/ui/button";
import {
  Plus, Minus, RotateCcw, Mountain, Compass, Droplets,
  TriangleAlert, CloudRain, Activity, Waves, ArrowUpRight, ArrowDownRight, Minus as MinusIcon,
  ChevronDown, ChevronUp, X, Eye, Info, List,
} from "lucide-react";
import { usePosStore, type PosWithTrend, type Tren } from "@/data/posStore";

const Index = () => {
  const mapRef = useRef<MLMap | null>(null);
  const [pitch, setPitch] = useState(70);
  const [bearing, setBearing] = useState(-25);
  const [activePos, setActivePos] = useState<PosMonitoring | null>(null);
  const [mode, setMode] = useState<"2d" | "3d">("3d");
  const [legendOpen, setLegendOpen] = useState(true);
  const [legendVisible, setLegendVisible] = useState(true);
  const [posPanelOpen, setPosPanelOpen] = useState(true);
  const [posPanelVisible, setPosPanelVisible] = useState(true);

  const { posList, lastTickAt } = usePosStore();

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
      pitch: mode === "3d" ? 72 : 0,
      bearing: pos.kategori === "hulu" ? 20 : pos.kategori === "hilir" ? -160 : -25,
      duration: 1600,
      essential: true,
    });
  }, [mode]);

  const zoomBy = (delta: number) => mapRef.current?.zoomTo(mapRef.current.getZoom() + delta, { duration: 300 });
  const setMode2D = () => {
    setMode("2d");
    mapRef.current?.easeTo({ pitch: 0, bearing: 0, duration: 600 });
  };
  const setMode3D = () => {
    setMode("3d");
    mapRef.current?.easeTo({ pitch: 70, bearing: -25, duration: 600 });
  };
  const rotateBy = (delta: number) =>
    mapRef.current?.easeTo({ bearing: mapRef.current.getBearing() + delta, duration: 400 });
  const resetView = () =>
    mapRef.current?.easeTo({ center: [107.7619, -7.0428], zoom: 12.2, pitch: mode === "3d" ? 70 : 0, bearing: mode === "3d" ? -25 : 0, duration: 900 });

  const arrList = useMemo(() => posList.filter((p) => p.tipe === "ARR"), [posList]);
  const awlrList = useMemo(() => posList.filter((p) => p.tipe === "AWLR"), [posList]);

  const counts = useMemo(() => {
    let normal = 0, siaga = 0, awas = 0;
    posList.forEach((p) => {
      if (p.reading?.status === "awas") awas++;
      else if (p.reading?.status === "siaga") siaga++;
      else normal++;
    });
    return { normal, siaga, awas };
  }, [posList]);

  return (
    <section className="relative h-[calc(100vh-3.5rem)] w-full overflow-hidden">
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
            <h2 className="text-base font-semibold leading-tight">Peta Pos Pemantauan</h2>
            <p className="text-xs text-white/60">DAS Citarum Hulu · Majalaya</p>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-xs">
          <p className="font-semibold text-white/80">Jenis pos:</p>
          <LegendRow color="#ef4444" title="ARR" desc="Curah hujan (mm/jam)" />
          <LegendRow color="#0ea5e9" title="AWLR" desc="Tinggi muka air (m)" />
        </div>

        <div className="mt-3 space-y-1.5 rounded-lg border border-sky-400/20 bg-sky-400/5 p-2 text-xs">
          <p className="flex items-center gap-1.5 font-semibold text-white/80">
            <Waves className="h-3.5 w-3.5 text-sky-300" /> Jaringan sungai
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-white/70">
            <span className="inline-block h-[3px] w-6 rounded-full" style={{ background: "#0369a1", boxShadow: "0 0 8px #38bdf8aa" }} />
            Sungai Citarum
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-white/70">
            <span className="inline-block h-[2px] w-6 rounded-full" style={{ background: "#7dd3fc" }} />
            Anak sungai
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <StatBox color="#22c55e" label="Normal" value={counts.normal} />
          <StatBox color="#f59e0b" label="Siaga" value={counts.siaga} />
          <StatBox color="#ef4444" label="Awas" value={counts.awas} />
        </div>

        <div className="mt-3 flex items-center justify-between rounded-lg bg-white/5 px-2 py-1.5 text-[11px] text-white/70">
          <span>Update terakhir</span>
          <span className="font-mono text-white/90">
            {new Date(lastTickAt).toLocaleTimeString("id-ID")}
          </span>
        </div>

        <p className="mt-3 flex items-start gap-2 rounded-lg bg-white/5 p-2 text-[11px] leading-relaxed text-white/70">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
          Data simulasi (mockup) — ARR tinggi di hulu = waspada kenaikan AWLR di hilir 2–6 jam.
        </p>
      </div>

      {/* Right-side pos list */}
      <aside
        className="pointer-events-auto absolute right-4 top-4 hidden w-[300px] max-h-[calc(100vh-6rem)] flex-col overflow-hidden rounded-2xl border border-white/10 text-panel-foreground shadow-[var(--shadow-panel)] backdrop-blur-xl md:flex"
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
        <div
          className="flex overflow-hidden rounded-2xl border border-white/10 shadow-[var(--shadow-panel)] backdrop-blur-xl"
          style={{ background: "var(--gradient-panel)" }}
        >
          <button
            onClick={setMode2D}
            className={`h-11 w-11 text-xs font-bold transition ${mode === "2d" ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10"}`}
          >
            2D
          </button>
          <button
            onClick={setMode3D}
            className={`h-11 w-11 text-xs font-bold transition ${mode === "3d" ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10"}`}
          >
            3D
          </button>
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
    </section>
  );
};

const STATUS_HSL: Record<PosReading["status"], string> = {
  normal: "#22c55e",
  siaga: "#f59e0b",
  awas: "#ef4444",
};

const TrenIcon = ({ tren }: { tren: Tren }) => {
  if (tren === "naik") return <ArrowUpRight className="h-3 w-3 text-rose-400" />;
  if (tren === "turun") return <ArrowDownRight className="h-3 w-3 text-emerald-400" />;
  return <MinusIcon className="h-3 w-3 text-white/40" />;
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

const StatBox = ({ color, label, value }: { color: string; label: string; value: number }) => (
  <div
    className="rounded-lg border px-2 py-2 text-center"
    style={{ borderColor: `${color}55`, background: `${color}15` }}
  >
    <div className="text-[9px] font-semibold uppercase tracking-wider text-white/60">{label}</div>
    <div className="mt-0.5 font-mono text-lg font-bold" style={{ color }}>{value}</div>
  </div>
);

const PosGroup = ({
  icon, title, unit, items, active, onClick,
}: {
  icon: React.ReactNode;
  title: string;
  unit: string;
  items: PosWithTrend[];
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
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-white/50">
                <TrenIcon tren={p.tren} />
                {p.tren}
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
