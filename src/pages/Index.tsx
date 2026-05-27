import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Map as MLMap } from "maplibre-gl";
import Map3D, { type PosMonitoring, type PosReading } from "@/components/Map3D";
import { Button } from "@/components/ui/button";
import {
  Plus, Minus, RotateCcw, Mountain, Compass, Droplets,
  TriangleAlert, CloudRain, Activity, Waves, ArrowUpRight, ArrowDownRight, Minus as MinusIcon,
  X, Info, List, MapPin, CheckCircle2, Radio
} from "lucide-react";
import { useSensorData, type PosWithTrend, type Tren } from "@/hooks/useSensorData";
import { useAuth } from "@/hooks/useAuth";
import TelegramConnectModal from "@/components/TelegramConnectModal";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

const STATUS_HSL: Record<PosReading["status"], string> = {
  normal: "#22c55e",
  siaga3: "#3b82f6",
  siaga2: "#f59e0b",
  siaga1: "#ef4444",
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
        const statusColor = STATUS_HSL[status];
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
                <span className="inline-flex items-center gap-0.5">
                  <TrenIcon tren={p.tren} />
                  {p.tren}
                </span>
                <span>·</span>
                <span className="capitalize">{p.kategori}</span>
              </div>
            </div>
            <div className="ml-2 text-right">
              <div className="font-mono text-xs font-bold text-foreground">
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

const Index = () => {
  const mapRef = useRef<MLMap | null>(null);
  const hasAutoFocusedPosRef = useRef(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [pitch, setPitch] = useState(70);
  const [bearing, setBearing] = useState(-25);
  const [activePos, setActivePos] = useState<PosMonitoring | null>(null);
  const [mode, setMode] = useState<"2d" | "3d">("3d");
  const [panelVisible, setPanelVisible] = useState(true);
  const [activeTab, setActiveTab] = useState<PanelTab>("monitoring");
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const navigate = useNavigate();

  const { posList } = useSensorData();
  const { user } = useAuth();
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
    if (userRole === "personal" && user?.activationCode && !user?.telegramLinked) {
      setShowTelegramModal(true);
    }
  }, [userRole, user?.activationCode, user?.telegramLinked]);

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

  useEffect(() => {
    if (userRole !== "personal") {
      hasAutoFocusedPosRef.current = false;
      return;
    }
    if (hasAutoFocusedPosRef.current || !isMapReady || !initialPersonalPos || !mapRef.current) return;
    hasAutoFocusedPosRef.current = true;
    flyToPos(initialPersonalPos);
  }, [flyToPos, initialPersonalPos, isMapReady, userRole]);

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
    mapRef.current?.easeTo({ 
      center: userRole === "personal" && user?.homeLngLat ? user.homeLngLat : [107.6191, -6.9175], // Use Bandung center 
      zoom: 9.5, // Adjusted zoom to better show West Java region
      pitch: mode === "3d" ? 70 : 0, 
      bearing: mode === "3d" ? -25 : 0, 
      padding: mapPadding,
      duration: 900 
    });

  const arrList = useMemo(() => statusPosList.filter((p) => p.tipe === "ARR"), [statusPosList]);
  const awlrList = useMemo(() => statusPosList.filter((p) => p.tipe === "AWLR"), [statusPosList]);

  const counts = useMemo(() => {
    let normal = 0, siaga3 = 0, siaga2 = 0, siaga1 = 0;
    statusPosList.forEach((p) => {
      if (p.reading?.status === "siaga1") siaga1++;
      else if (p.reading?.status === "siaga2") siaga2++;
      else if (p.reading?.status === "siaga3") siaga3++;
      else normal++;
    });
    return { normal, siaga3, siaga2, siaga1 };
  }, [statusPosList]);

  return (
    <section className="relative h-[calc(100vh-3.5rem)] w-full overflow-hidden">
      <h1 className="sr-only">Peta 3D Alera FI — Flood Monitoring & Early Warning Platform</h1>

      <Map3D
        onMapReady={handleMapReady}
        posList={posList}
        onPosClick={flyToPos}
        homeLngLat={userRole === "personal" ? user?.homeLngLat : undefined}
        homeLabel={user?.homeAddress}
      />

      {/* Main Panel Sidebar */}
      {panelVisible ? (
        <aside
          className="pointer-events-auto absolute right-4 top-4 z-10 flex w-[300px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border text-foreground shadow-[var(--shadow-panel)] backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-right-4"
          style={{ background: "var(--gradient-panel)", maxHeight: "calc(100vh - 10rem)" }}
        >
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center shadow-[var(--shadow-glow)]">
              <img
                src="/alera-logo.png"
                alt="Alera FI Logo"
                className="h-7 w-7 rounded-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold leading-tight">Alera FI</h2>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Flood Monitoring</p>
            </div>
            <button
              onClick={() => setPanelVisible(false)}
              className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
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
                <div className="space-y-2 text-[11px]">
                  <p className="font-semibold text-muted-foreground uppercase tracking-widest text-[9px]">Legenda Pos:</p>
                  <LegendRow icon={<CloudRain className="h-3.5 w-3.5 text-muted-foreground" />} title="ARR" desc="Pos Curah Hujan" />
                  <LegendRow icon={<Waves className="h-3.5 w-3.5 text-muted-foreground" />} title="AWLR" desc="Pos Tinggi Air" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <StatBox color="#22c55e" label="Normal" value={counts.normal} />
                  <StatBox color="#3b82f6" label="Siaga 3" value={counts.siaga3} />
                  <StatBox color="#f59e0b" label="Siaga 2" value={counts.siaga2} />
                  <StatBox color="#ef4444" label="Siaga 1" value={counts.siaga1} />
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
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </aside>
        ) : (
          <button
            onClick={() => setPanelVisible(true)}
            className="pointer-events-auto absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground shadow-[var(--shadow-panel)] backdrop-blur-xl hover:bg-muted/50 animate-in fade-in zoom-in"
            style={{ background: "var(--gradient-panel)" }}
            title="Buka Panel Dashboard"
          >
            <List className="h-4 w-4" />
          </button>
        )}

      {/* Custom controls - Moved to bottom-left to avoid panel collision */}
      <div className="pointer-events-auto absolute bottom-24 left-4 flex flex-col gap-3">
        <ControlStack>
          <CtrlBtn onClick={() => zoomBy(1)}><Plus className="h-5 w-5" /></CtrlBtn>
          <CtrlBtn onClick={() => zoomBy(-1)}><Minus className="h-5 w-5" /></CtrlBtn>
        </ControlStack>
        <ControlStack>
          <CtrlBtn onClick={() => rotateBy(-30)}><RotateCcw className="h-5 w-5" /></CtrlBtn>
          <CtrlBtn onClick={() => rotateBy(30)}><RotateCcw className="h-5 w-5 -scale-x-100" /></CtrlBtn>
        </ControlStack>
        <div
          className="flex overflow-hidden rounded-2xl border border-border shadow-[var(--shadow-panel)] backdrop-blur-xl"
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
      {showTelegramModal && user?.activationCode && (
        <TelegramConnectModal
          activationCode={user.activationCode}
          onDismiss={() => setShowTelegramModal(false)}
        />
      )}

      {/* Telemetry */}
      <div
        className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-border px-4 py-2 text-xs text-foreground shadow-[var(--shadow-panel)] backdrop-blur-xl"
        style={{ background: "var(--gradient-panel)" }}
      >
        <span className="font-mono">Pitch {pitch.toFixed(0)}°</span>
        <span className="mx-3 text-muted-foreground">·</span>
        <span className="font-mono">Bearing {bearing.toFixed(0)}°</span>
        {activePos && (
          <>
            <span className="mx-3 text-muted-foreground">·</span>
            <span className="font-mono">{activePos.nama}</span>
          </>
        )}
      </div>
    </section>
  );
};

export default Index;
