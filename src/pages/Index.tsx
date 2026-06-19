import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import maplibregl, { type Map as MLMap } from "maplibre-gl";
import Map3D, { type PosMonitoring, type PosReading } from "@/components/Map3D";
import { Button } from "@/components/ui/button";
import {
  Plus, Minus, RotateCcw, Mountain, Compass, Droplets,
  TriangleAlert, CloudRain, Activity, Waves, ArrowUpRight, ArrowDownRight, Minus as MinusIcon,
  X, Info, List, MapPin, CheckCircle2, Radio, Loader2, HelpCircle,
} from "lucide-react";
import { useSensorData, type PosWithTrend, type Tren } from "@/hooks/useSensorData";
import { useAuth } from "@/hooks/useAuth";
import TelegramConnectModal from "@/components/TelegramConnectModal";
import { isSensorStale } from "@/lib/sensorUtils";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

const STATUS_HSL: Record<PosReading["status"], string> = {
  normal: "#22c55e",
  waspada: "#eab308",
  siaga: "#f97316",
  awas: "#ef4444",
};

const TrenIcon = ({ tren }: { tren: Tren }) => {
  if (tren === "naik") return <ArrowUpRight className="h-3 w-3 text-red-600" />;
  if (tren === "turun") return <ArrowDownRight className="h-3 w-3 text-green-600" />;
  return <MinusIcon className="h-3 w-3 text-muted-foreground" />;
};

const LegendRow = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="flex items-center gap-2.5">
    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted border border-border">
      {icon}
    </div>
    <div className="min-w-0">
      <span className="font-bold text-foreground text-xs">{title}</span>
      <span className="text-muted-foreground text-xs"> — {desc}</span>
    </div>
  </div>
);

const StatBox = ({ color, label, value }: { color: string; label: string; value: number }) => (
  <div
    className="rounded-lg border px-2 py-2 text-center"
    style={{ borderColor: `${color}55`, background: `${color}15` }}
  >
    <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
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
  <div className="space-y-1">
    <div className="mb-1 flex items-center gap-1.5 px-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
      {icon}
      {title}
    </div>
    <div className="grid gap-1">
      {items.map((p) => {
        const status = p.reading?.status ?? "normal";
        const stale = isSensorStale(p.reading?.updatedAt);
        const statusColor = stale ? "#64748b" : STATUS_HSL[status];
        const isSelected = active?.id === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onClick(p)}
            className={`group flex items-center justify-between rounded-lg border px-2 py-1.5 transition ${
              isSelected
                ? "border-primary/50 bg-primary/10"
                : "border-border bg-muted/50 hover:bg-muted"
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="h-1 w-1 shrink-0 rounded-full" style={{ background: statusColor }} />
                <span className="truncate text-[11px] font-medium text-foreground">{p.nama}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[9px] text-muted-foreground">
                {stale ? (
                  <span className="font-semibold text-red-500">⚠ Offline</span>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-0.5">
                      <TrenIcon tren={p.tren} />
                      {p.tren}
                    </span>
                    <span>·</span>
                    <span className="capitalize">{p.kategori}</span>
                  </>
                )}
              </div>
            </div>
            <div className="ml-2 text-right">
              <div className={`font-mono text-xs font-bold ${stale ? "text-muted-foreground/60" : "text-foreground"}`}>
                {p.reading
                  ? p.tipe === "ARR"
                    ? p.reading.value.toFixed(1)
                    : p.reading.value.toFixed(2)
                  : "—"}
                <span className="ml-0.5 text-[8px] font-normal text-muted-foreground">{unit}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

const ControlStack = ({ children }: { children: React.ReactNode }) => (
  <div
    className="flex w-11 flex-col overflow-hidden rounded-2xl border border-border shadow-[var(--shadow-panel)] backdrop-blur-xl"
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
    className="flex h-11 w-11 items-center justify-center rounded-none text-foreground hover:bg-muted/50 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-border p-0"
  >
    {children}
  </Button>
);
const MAP_PADDING_BASE = 16;
const MAP_PANEL_WIDTH = 300;
const MAP_PANEL_GAP = 16;
type PanelTab = "info" | "monitoring";

function isValidLngLat([lng, lat]: [number, number]): boolean {
  return Number.isFinite(lng) && Number.isFinite(lat) && !(lng === 0 && lat === 0);
}

const Index = () => {
  const mapRef = useRef<MLMap | null>(null);
  const hasAutoFocusedPosRef = useRef(false);
  const hasAutoFitCommunityRef = useRef(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [pitch, setPitch] = useState(70);
  const [bearing, setBearing] = useState(-25);
  const [activePos, setActivePos] = useState<PosMonitoring | null>(null);
  const [mode, setMode] = useState<"2d" | "3d">("3d");
  const [panelVisible, setPanelVisible] = useState(true);
  const [activeTab, setActiveTab] = useState<PanelTab>("monitoring");
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [hasDismissedAutoModal, setHasDismissedAutoModal] = useState(false);
  const navigate = useNavigate();

  const { posList, loading: sensorsLoading } = useSensorData();
  const [markersReady, setMarkersReady] = useState(false);
  const { user, refreshUser } = useAuth();
  const userRole = user?.role || "community";
  const mapPadding = useMemo(
    () => ({
      top: MAP_PADDING_BASE,
      right: panelVisible ? MAP_PANEL_WIDTH + MAP_PANEL_GAP * 2 : MAP_PADDING_BASE,
      bottom: MAP_PADDING_BASE,
      left: MAP_PADDING_BASE,
    }),
    [panelVisible],
  );
  const subscribedPosList = useMemo(() => {
    if (userRole !== "personal") return posList;
    if (!user?.subscribedPosIds?.length) return [];
    return user.subscribedPosIds
      .map((posId) => posList.find((pos) => pos.id === posId))
      .filter((pos): pos is PosWithTrend => Boolean(pos));
  }, [posList, user?.subscribedPosIds, userRole]);
  const statusPosList = userRole === "personal" ? subscribedPosList : posList;
  const initialPersonalPos = useMemo(() => {
    if (userRole !== "personal" || posList.length === 0) return null;
    if (subscribedPosList.length > 0) return subscribedPosList[0];
    return null;
  }, [posList, subscribedPosList, userRole]);

  // Show Telegram connection prompt for personal users not yet linked
  useEffect(() => {
    if (userRole === "personal" && user?.activationCode && !user?.telegramLinked && !hasDismissedAutoModal) {
      setShowTelegramModal(true);
    }
  }, [userRole, user?.activationCode, user?.telegramLinked, hasDismissedAutoModal]);

  useEffect(() => {
    setActiveTab("monitoring");
  }, [userRole]);

  const handleMapReady = useCallback((map: MLMap) => {
    mapRef.current = map;
    setIsMapReady(true);
    map.on("pitch", () => setPitch(map.getPitch()));
    map.on("rotate", () => setBearing(map.getBearing()));
    map.easeTo({ padding: mapPadding, duration: 0, essential: true });

    // Zoom to home if personal
    if (userRole === "personal" && user?.homeLngLat) {
      map.flyTo({ center: user.homeLngLat, zoom: 12.5, duration: 2000, padding: mapPadding });
    }
  }, [mapPadding, userRole, user?.homeLngLat]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ padding: mapPadding, duration: 300, essential: true });
  }, [mapPadding]);

  const flyToPos = useCallback((pos: PosMonitoring) => {
    setActivePos(pos);
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({
      center: pos.lngLat,
      zoom: 14,
      pitch: mode === "3d" ? 55 : 0,
      bearing: mode === "3d" ? -25 : 0,
      offset: [0, 80],
      padding: mapPadding,
      duration: 1400,
      essential: true,
    });
  }, [mapPadding, mode]);

  const fitMapToPositions = useCallback(
    (positions: PosMonitoring[]) => {
      const map = mapRef.current;
      if (!map) return;

      const coords = positions
        .filter((p) => isValidLngLat(p.lngLat))
        .map((p) => p.lngLat);
      if (coords.length === 0) return;

      const pitch = mode === "3d" ? 70 : 0;
      const bearing = mode === "3d" ? -25 : 0;

      if (coords.length === 1) {
        map.flyTo({
          center: coords[0],
          zoom: 13,
          pitch,
          bearing,
          padding: mapPadding,
          duration: 1400,
          essential: true,
        });
        return;
      }

      const bounds = coords.reduce(
        (b, lngLat) => b.extend(lngLat),
        new maplibregl.LngLatBounds(coords[0], coords[0]),
      );
      map.fitBounds(bounds, {
        padding: mapPadding,
        maxZoom: 14,
        pitch,
        bearing,
        duration: 1400,
        essential: true,
      });
    },
    [mapPadding, mode],
  );

  const communityPosWithCoords = useMemo(
    () => (userRole === "community" ? posList.filter((p) => isValidLngLat(p.lngLat)) : []),
    [posList, userRole],
  );

  useEffect(() => {
    if (userRole !== "personal") {
      hasAutoFocusedPosRef.current = false;
      return;
    }
    if (hasAutoFocusedPosRef.current || !isMapReady || !initialPersonalPos || !mapRef.current) return;
    hasAutoFocusedPosRef.current = true;
    flyToPos(initialPersonalPos);
  }, [flyToPos, initialPersonalPos, isMapReady, userRole]);

  useEffect(() => {
    if (userRole !== "community") {
      hasAutoFitCommunityRef.current = false;
      return;
    }
    if (
      hasAutoFitCommunityRef.current ||
      !isMapReady ||
      sensorsLoading ||
      communityPosWithCoords.length === 0
    ) {
      return;
    }
    hasAutoFitCommunityRef.current = true;
    fitMapToPositions(communityPosWithCoords);
  }, [
    communityPosWithCoords,
    fitMapToPositions,
    isMapReady,
    sensorsLoading,
    userRole,
  ]);

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
  const resetView = () => {
    if (userRole === "community" && communityPosWithCoords.length > 0) {
      fitMapToPositions(communityPosWithCoords);
      return;
    }
    mapRef.current?.easeTo({
      center: userRole === "personal" && user?.homeLngLat ? user.homeLngLat : [107.6191, -6.9175],
      zoom: 9.5,
      pitch: mode === "3d" ? 70 : 0,
      bearing: mode === "3d" ? -25 : 0,
      padding: mapPadding,
      duration: 900,
    });
  };

  const arrList = useMemo(() => statusPosList.filter((p) => p.tipe === "ARR"), [statusPosList]);
  const awlrList = useMemo(() => statusPosList.filter((p) => p.tipe === "AWLR"), [statusPosList]);

  const counts = useMemo(() => {
    let normal = 0, waspada = 0, siaga = 0, awas = 0, offline = 0;
    statusPosList.forEach((p) => {
      if (isSensorStale(p.reading?.updatedAt)) { offline++; return; }
      if (p.reading?.status === "awas") awas++;
      else if (p.reading?.status === "siaga") siaga++;
      else if (p.reading?.status === "waspada") waspada++;
      else normal++;
    });
    return { normal, waspada, siaga, awas, offline };
  }, [statusPosList]);

  return (
    <section className="relative h-[calc(100vh-3.5rem)] w-full overflow-hidden">
      <h1 className="sr-only">Peta 3D AleraFI — To be safe, alert and aware</h1>

      <Map3D
        onMapReady={handleMapReady}
        onMarkersReady={() => setMarkersReady(true)}
        sensorDataReady={!sensorsLoading}
        posList={posList}
        onPosClick={flyToPos}
        homeLngLat={userRole === "personal" ? user?.homeLngLat : undefined}
        homeLabel={user?.homeAddress}
      />

      {!markersReady && (
        <div
          className="pointer-events-none absolute inset-0 z-[5] flex flex-col items-center justify-center gap-3 bg-background/40 backdrop-blur-[2px]"
          aria-live="polite"
          aria-busy="true"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-foreground/80">Memuat peta dan pos pantau…</p>
        </div>
      )}

      {/* Main Panel Sidebar */}
      {panelVisible ? (
        <aside
          className="pointer-events-auto absolute right-2 sm:right-4 top-4 z-10 flex w-full max-w-[320px] sm:w-[300px] flex-col overflow-hidden rounded-2xl border border-border text-foreground shadow-[var(--shadow-panel)] backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-right-4"
          style={{ background: "var(--gradient-panel)", maxHeight: "calc(100vh - 10rem)" }}
        >
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <div className="h-8 w-8 flex items-center justify-center">
              <img
                src="/alera-logo.png"
                alt="AleraFI Logo"
                className="h-8 w-8 object-contain"
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold leading-tight">AleraFI</h2>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">To be safe, alert and aware</p>
            </div>
            <button
              onClick={() => setPanelVisible(false)}
              className="ml-auto rounded-md p-1.5 sm:p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Tutup panel"
            >
              <X className="h-5 w-5 sm:h-4 sm:w-4" />
            </button>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PanelTab)} className="flex flex-1 flex-col overflow-hidden">
            <TabsList className="mx-4 mt-4 grid grid-cols-2 bg-muted p-1 text-muted-foreground">
              <TabsTrigger
                value="info"
                className={userRole === "personal" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-600" : "data-[state=active]:bg-primary/20 data-[state=active]:text-primary"}
              >
                <Info className="mr-2 h-3.5 w-3.5" /> {userRole === "personal" ? "Area" : "Legenda"}
              </TabsTrigger>
              <TabsTrigger
                value="monitoring"
                className={userRole === "personal" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-600" : "data-[state=active]:bg-primary/20 data-[state=active]:text-primary"}
              >
                <List className="mr-2 h-3.5 w-3.5" /> Pos Pantau
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 overflow-y-auto">
              <TabsContent value="info" className="m-0 space-y-4 p-4 animate-in fade-in duration-300">
                {userRole === "personal" && (
                  <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 mb-2">
                    <h3 className="text-sm font-bold text-blue-700 mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> Lokasi Pantau
                    </h3>
                    <p className="text-[11px] text-blue-900 leading-relaxed italic">
                      {user?.homeAddress || "Lokasi rumah terdaftar."}
                    </p>
                  </div>
                )}

                {/* Penjelasan Pos Pantau */}
                <div className="rounded-lg bg-muted/60 border border-border px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <HelpCircle className="h-3 w-3 text-primary" />
                    <span className="text-[10px] font-bold text-foreground">Apa itu Pos Pantau?</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Stasiun sensor otomatis yang mengukur kondisi sungai secara berkala setiap 10 menit.
                  </p>
                </div>

                {/* Jenis Sensor */}
                <div className="space-y-1.5">
                  <p className="font-semibold text-muted-foreground uppercase tracking-widest text-[9px]">Jenis Sensor</p>
                  <LegendRow icon={<CloudRain className="h-3.5 w-3.5 text-muted-foreground" />} title="ARR" desc="Curah Hujan (mm/jam)" />
                  <LegendRow icon={<Waves className="h-3.5 w-3.5 text-muted-foreground" />} title="AWLR" desc="Tinggi Muka Air (m)" />
                </div>

                {/* Kategori Lokasi */}
                <div className="space-y-1.5">
                  <p className="font-semibold text-muted-foreground uppercase tracking-widest text-[9px]">Kategori Lokasi</p>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                    <div className="rounded-md bg-muted/50 border border-border px-2 py-1.5 text-center">
                      <div className="font-bold text-foreground">Hulu</div>
                      <div className="text-muted-foreground">Atas sungai</div>
                    </div>
                    <div className="rounded-md bg-muted/50 border border-border px-2 py-1.5 text-center">
                      <div className="font-bold text-foreground">Tengah</div>
                      <div className="text-muted-foreground">Bagian tengah</div>
                    </div>
                    <div className="rounded-md bg-muted/50 border border-border px-2 py-1.5 text-center">
                      <div className="font-bold text-foreground">Hilir</div>
                      <div className="text-muted-foreground">Bawah/muara</div>
                    </div>
                  </div>
                </div>

                {/* Warna & Status */}
                <div className="space-y-1.5">
                  <p className="font-semibold text-muted-foreground uppercase tracking-widest text-[9px]">Warna Status</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="rounded-lg border px-2.5 py-2" style={{ borderColor: "#22c55e55", background: "#22c55e15" }}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: "#22c55e" }} />
                        <span className="text-[10px] font-bold" style={{ color: "#22c55e" }}>Normal — {counts.normal}</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground">Aman, tidak perlu tindakan</p>
                    </div>
                    <div className="rounded-lg border px-2.5 py-2" style={{ borderColor: "#eab30855", background: "#eab30815" }}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: "#eab308" }} />
                        <span className="text-[10px] font-bold" style={{ color: "#eab308" }}>Waspada — {counts.waspada}</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground">Waspada, pantau perkembangan</p>
                    </div>
                    <div className="rounded-lg border px-2.5 py-2" style={{ borderColor: "#f9731655", background: "#f9731615" }}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: "#f97316" }} />
                        <span className="text-[10px] font-bold" style={{ color: "#f97316" }}>Siaga — {counts.siaga}</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground">Bersiap, siapkan barang penting</p>
                    </div>
                    <div className="rounded-lg border px-2.5 py-2" style={{ borderColor: "#ef444455", background: "#ef444415" }}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: "#ef4444" }} />
                        <span className="text-[10px] font-bold" style={{ color: "#ef4444" }}>Awas — {counts.awas}</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground">Bahaya, siap evakuasi!</p>
                    </div>
                    <div className="col-span-2 rounded-lg border px-2.5 py-2" style={{ borderColor: "#64748b55", background: "#64748b15" }}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: "#64748b" }} />
                        <span className="text-[10px] font-bold" style={{ color: "#64748b" }}>Offline — {counts.offline}</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground">Sensor tidak mengirim data &gt; 30 menit. Perangkat atau jaringan mungkin bermasalah.</p>
                    </div>
                  </div>
                </div>

                {/* Tren */}
                <div className="space-y-1.5">
                  <p className="font-semibold text-muted-foreground uppercase tracking-widest text-[9px]">Tren 3 Jam Terakhir</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px]">
                      <ArrowUpRight className="h-3 w-3 text-red-500" />
                      <span><span className="font-bold text-foreground">Naik</span> <span className="text-muted-foreground">— Kondisi memburuk</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <MinusIcon className="h-3 w-3 text-muted-foreground" />
                      <span><span className="font-bold text-foreground">Stabil</span> <span className="text-muted-foreground">— Kondisi tetap</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <ArrowDownRight className="h-3 w-3 text-green-500" />
                      <span><span className="font-bold text-foreground">Turun</span> <span className="text-muted-foreground">— Kondisi membaik</span></span>
                    </div>
                  </div>
                </div>

              </TabsContent>

              <TabsContent value="monitoring" className="m-0 space-y-4 p-4 animate-in fade-in duration-300">
                <>
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
                    title="AWLR — TMA"
                    unit="m"
                    items={awlrList}
                    active={activePos}
                    onClick={flyToPos}
                  />
                </>

                {subscribedPosList.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted py-10 text-center">
                    <Radio className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="px-6 text-[11px] text-muted-foreground">Belum ada pos yang terpasang ke akun ini.</p>
                    <Button variant="link" className="mt-2 text-xs text-primary" onClick={() => navigate("/profile")}>Atur di Profil</Button>
                  </div>
                )}

                {userRole === "personal" && subscribedPosList.length > 0 && (
                  user?.telegramLinked ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-emerald-900">Bot Telegram</h4>
                          <p className="text-[10px] text-emerald-700">Alert Aktif</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 animate-pulse">
                            <Radio className="h-5 w-5 text-amber-600" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-amber-900">Bot Telegram</h4>
                            <p className="text-[10px] text-amber-700">Belum Terhubung</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setHasDismissedAutoModal(false);
                            setShowTelegramModal(true);
                          }}
                          className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs py-1.5 h-auto font-medium"
                        >
                          Hubungkan Sekarang
                        </Button>
                      </div>
                    </div>
                  )
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </aside>
        ) : (
          <button
            onClick={() => setPanelVisible(true)}
            className="pointer-events-auto absolute right-2 sm:right-4 top-4 z-10 flex h-12 w-12 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-border text-foreground shadow-[var(--shadow-panel)] backdrop-blur-xl hover:bg-muted/50 animate-in fade-in zoom-in"
            style={{ background: "var(--gradient-panel)" }}
            title="Buka Panel Dashboard"
          >
            <List className="h-5 w-5 sm:h-4 sm:w-4" />
          </button>
        )}

      {/* Custom controls - Moved to bottom-left to avoid panel collision */}
      <div className="pointer-events-auto absolute bottom-20 sm:bottom-24 left-2 sm:left-4 flex flex-col gap-2 sm:gap-3">
        <ControlStack>
          <CtrlBtn onClick={() => zoomBy(1)}><Plus className="h-5 w-5" /></CtrlBtn>
          <CtrlBtn onClick={() => zoomBy(-1)}><Minus className="h-5 w-5" /></CtrlBtn>
        </ControlStack>
        <ControlStack>
          <CtrlBtn onClick={() => rotateBy(-30)}><RotateCcw className="h-5 w-5" /></CtrlBtn>
          <CtrlBtn onClick={() => rotateBy(30)}><RotateCcw className="h-5 w-5 -scale-x-100" /></CtrlBtn>
        </ControlStack>
        <div
          className="flex flex-col overflow-hidden rounded-2xl border border-border shadow-[var(--shadow-panel)] backdrop-blur-xl"
          style={{ background: "var(--gradient-panel)" }}
        >
          <button
            onClick={setMode2D}
            className={`h-11 w-11 text-xs font-bold transition ${mode === "2d" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted/50"}`}
          >
            2D
          </button>
          <button
            onClick={setMode3D}
            className={`h-11 w-11 text-xs font-bold transition ${mode === "3d" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted/50"}`}
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

      {/* Telegram Activation Modal */}
      {showTelegramModal && user && (
        <TelegramConnectModal
          activationCode={user.activationCode || ""}
          telegramLinked={user.telegramLinked}
          refreshUser={refreshUser}
          onDismiss={() => {
            setShowTelegramModal(false);
            setHasDismissedAutoModal(true);
          }}
        />
      )}

    </section>
  );
};

export default Index;
