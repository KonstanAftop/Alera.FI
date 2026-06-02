import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSensorData, type PosWithTrend, type Tren } from "@/hooks/useSensorData";
import { useHistoricalSensorData } from "@/hooks/useHistoricalSensorData";
import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowUpRight, ArrowDownRight, Minus, RefreshCw, Sparkles, Send, AlertTriangle, Loader2,
  History, X, Radio,
} from "lucide-react";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api";
import {
  formatDateTimeWIB,
  formatDateTimeWIBFromMs,
  formatTimeWIB,
  parseWIBNaiveMs,
} from "@/lib/wibDatetime";

type StatusFilter = "all" | "siaga1" | "siaga2" | "siaga3" | "normal";

const STATUS_BADGE: Record<string, string> = {
  normal: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  siaga3: "bg-blue-500/15 text-blue-700 border-blue-500/30",
  siaga2: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  siaga1: "bg-rose-500/15 text-rose-700 border-rose-500/30",
};

const TrenCell = ({ tren }: { tren: Tren }) => {
  if (tren === "naik")
    return <span className="inline-flex items-center gap-1 font-medium text-rose-600"><ArrowUpRight className="h-3.5 w-3.5" />naik</span>;
  if (tren === "turun")
    return <span className="inline-flex items-center gap-1 font-medium text-emerald-600"><ArrowDownRight className="h-3.5 w-3.5" />turun</span>;
  return <span className="inline-flex items-center gap-1 text-muted-foreground"><Minus className="h-3.5 w-3.5" />stabil</span>;
};

const formatValue = (p: PosWithTrend) => {
  if (!p.reading) return "—";
  return p.tipe === "ARR" ? `${p.reading.value.toFixed(1)} mm/jam` : `${(p.reading.value * 100).toFixed(0)} cm`;
};
const formatRaw = (tipe: "ARR" | "AWLR", v: number) =>
  tipe === "ARR" ? `${v.toFixed(1)} mm/jam` : `${(v * 100).toFixed(0)} cm`;


// --- Warning draft generator (multi-stasiun) ---
const generateWarningDraft = (selected: PosWithTrend[], context: string, communityName: string = "AleraFI", managedArea: string = "") => {
  const siaga1 = selected.filter((p) => p.reading?.status === "siaga1");
  const siaga2 = selected.filter((p) => p.reading?.status === "siaga2");
  const siaga3 = selected.filter((p) => p.reading?.status === "siaga3");
  const naik = selected.filter((p) => p.tren === "naik");
  const tingkat = siaga1.length > 0 ? "SIAGA 1" : siaga2.length > 0 ? "SIAGA 2" : siaga3.length > 0 ? "SIAGA 3" : "INFORMASI";
  const lines: string[] = [];
  const areaStr = managedArea ? ` - Wilayah ${managedArea}` : "";
  lines.push(`⚠️ PERINGATAN RESMI ${communityName.toUpperCase()}${areaStr}`);
  lines.push("");
  lines.push(`Status: ${tingkat}`);
  lines.push(`Waktu: ${new Date().toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}`);
  lines.push("");
  lines.push("Pos terpantau:");
  selected.forEach((p) => {
    lines.push(`• ${p.nama} (${p.kategori}) — ${formatValue(p)} — ${p.reading?.status?.toUpperCase()} — tren ${p.tren}`);
  });
  lines.push("");
  if (siaga1.length > 0) lines.push(`🚨 ${siaga1.length} pos berstatus SIAGA 1. Warga di bantaran sungai diminta SIAP EVAKUASI.`);
  else if (siaga2.length > 0) lines.push(`⚠️ ${siaga2.length} pos berstatus SIAGA 2. Pantau perkembangan & siapkan barang penting.`);
  else if (siaga3.length > 0) lines.push(`📘 ${siaga3.length} pos berstatus SIAGA 3. Waspadai perkembangan cuaca.`);
  if (naik.length > 0 && siaga1.length === 0) lines.push(`📈 ${naik.length} pos menunjukkan tren NAIK — kewaspadaan ditingkatkan.`);
  if (context.trim()) { lines.push(""); lines.push("Catatan lapangan:"); lines.push(context.trim()); }
  lines.push("");
  lines.push(`Tetap tenang & ikuti arahan petugas. — Tim ${communityName}`);
  return lines.join("\n");
};

// --- Draft generator with real historical data (1 stasiun, fokus historis) ---
interface HistoricalPoint {
  value: number;
  measured_at: string;
  warning_level: number;
}

/** 3 jam @ interval 10 menit = 18 titik */
const HISTORY_DRAFT_RECORDS = 18;
const HISTORY_INTERVAL_MS = 10 * 60 * 1000;

/** 18 slot 10 menit terakhir; tiap slot = observasi terbaru dalam jendela itu. */
const pickHistoryDraftPoints = (data: HistoricalPoint[]): HistoricalPoint[] => {
  if (data.length === 0) return [];

  const sorted = [...data].sort(
    (a, b) => parseWIBNaiveMs(a.measured_at) - parseWIBNaiveMs(b.measured_at),
  );
  const latestMs = parseWIBNaiveMs(sorted[sorted.length - 1].measured_at);
  const points: HistoricalPoint[] = [];

  for (let i = 0; i < HISTORY_DRAFT_RECORDS; i++) {
    const slotEnd = latestMs - (HISTORY_DRAFT_RECORDS - 1 - i) * HISTORY_INTERVAL_MS;
    const slotStart = slotEnd - HISTORY_INTERVAL_MS;
    const inSlot = sorted.filter((p) => {
      const t = parseWIBNaiveMs(p.measured_at);
      return t > slotStart && t <= slotEnd;
    });
    if (inSlot.length > 0) {
      points.push(inSlot[inSlot.length - 1]);
    } else {
      const nearest = sorted.reduce((best, p) => {
        const t = parseWIBNaiveMs(p.measured_at);
        const bestT = parseWIBNaiveMs(best.measured_at);
        return Math.abs(t - slotEnd) < Math.abs(bestT - slotEnd) ? p : best;
      });
      points.push(nearest);
    }
  }

  return points;
};

const getStatusEmoji = (level: number) => {
  if (level >= 3) return "🔴";
  if (level >= 2) return "🟡";
  if (level >= 1) return "🔵";
  return "🟢";
};

const generateSingleDraft = (p: PosWithTrend, fullHistData: HistoricalPoint[], context: string, communityName: string = "AleraFI") => {
  const lines: string[] = [];
  const trendPoints = pickHistoryDraftPoints(fullHistData);
  const trendLabel =
    p.tipe === "ARR"
      ? "Tren curah hujan (18 titik × 10 menit, 3 jam, WIB):"
      : "Tren tinggi muka air (18 titik × 10 menit, 3 jam, WIB):";

  lines.push(`📊 LAPORAN HISTORIS (3 JAM): ${p.nama}`);
  lines.push(`Lokasi: ${p.kategori.toUpperCase()} · Tipe: ${p.tipe}`);

  const waktuLaporan =
    trendPoints.length > 0
      ? `${formatDateTimeWIB(trendPoints[trendPoints.length - 1].measured_at)} WIB`
      : new Date().toLocaleString("id-ID", {
          dateStyle: "short",
          timeStyle: "short",
          timeZone: "Asia/Jakarta",
        }) + " WIB";
  lines.push(`Waktu laporan: ${waktuLaporan}`);
  lines.push("");
  lines.push(trendLabel);

  if (trendPoints.length === 0) {
    lines.push("Belum ada data historis 3 jam terakhir.");
  } else {
    for (const point of trendPoints) {
      const timeStr = formatTimeWIB(point.measured_at);
      const emoji = getStatusEmoji(Number(point.warning_level) || 0);
      lines.push(`${timeStr} → ${formatRaw(p.tipe, Number(point.value))} ${emoji}`);
    }
    const uniqueTimestamps = new Set(trendPoints.map((pt) => pt.measured_at)).size;
    if (uniqueTimestamps < HISTORY_DRAFT_RECORDS) {
      lines.push("");
      lines.push(
        `_(Hanya ${fullHistData.length} observasi di database; ${uniqueTimestamps} waktu unik dalam 18 slot.)_`,
      );
    }
  }

  lines.push("");
  lines.push(`Status Saat Ini : ${p.reading?.status?.toUpperCase() ?? "NORMAL"}`);
  lines.push(`Kecenderungan   : ${p.tren.toUpperCase()}`);

  if (context.trim()) {
    lines.push("");
    lines.push("Catatan Lapangan:");
    lines.push(context.trim());
  }

  lines.push("");
  lines.push(`— Pos ${p.nama} · Tim ${communityName}`);
  return lines.join("\n");
};

// --- Sparkline ---
const Sparkline = ({ values, height = 120 }: { values: number[]; height?: number }) => {
  if (values.length < 2) return <div className="text-xs text-muted-foreground">Belum cukup data historis…</div>;
  const w = 560, h = 120, pad = 8;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = (w - pad * 2) / (values.length - 1);
  const points = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: height }}>
      <polyline fill="none" stroke="hsl(var(--primary))" strokeWidth={2} points={points.join(" ")} />
      <circle cx={points[points.length - 1].split(",")[0]} cy={points[points.length - 1].split(",")[1]} r={3.5} fill="hsl(var(--primary))" />
    </svg>
  );
};

const TablePage = () => {
  const { posList, loading, error } = useSensorData();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [singleId, setSingleId] = useState<string | null>(null);
  const [context, setContext] = useState("");
  const [singleContext, setSingleContext] = useState("");
  const [draft, setDraft] = useState("");
  const [singleDraft, setSingleDraft] = useState("");
  const [generating, setGenerating] = useState(false);
  const [singleGenerating, setSingleGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [singleSending, setSingleSending] = useState(false);
  
  // Telegram requirement check for community users
  const isCommunityUser = user?.role === "community";
  const isTelegramConnected = user?.telegramLinked === true;
  const canGenerateDraft = !isCommunityUser || isTelegramConnected;

  useEffect(() => {
    if (user?.role === "community") {
      refreshUser();
    }
  }, [user?.role, refreshUser]);

  const sendTelegramBroadcast = async (message: string) => {
    if (!user?.id) throw new Error("Sesi tidak valid");
    const data = await fetchApi<{ status: string; message?: string }>(
      "/telegram/broadcast",
      {
        method: "POST",
        body: JSON.stringify({ user_id: user.id, message }),
      },
    );
    if (data.status !== "success") {
      throw new Error(data.message || "Gagal mengirim pesan");
    }
    return data;
  };

  const filtered = useMemo(() => {
    return posList.filter((p) => {
      if (statusFilter !== "all" && p.reading?.status !== statusFilter) return false;
      if (search.trim() && !p.nama.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [posList, statusFilter, search]);

  const counts = useMemo(() => {
    const c = { all: posList.length, siaga1: 0, siaga2: 0, siaga3: 0, normal: 0 };
    posList.forEach((p) => { c[p.reading?.status ?? "normal"]++; });
    return c;
  }, [posList]);

  const selected = useMemo(() => posList.filter((p) => selectedIds.has(p.id)), [posList, selectedIds]);
  const singlePos = useMemo(() => posList.find((p) => p.id === singleId) ?? null, [posList, singleId]);
  const { history: singleHist, fullData: singleHistData } = useHistoricalSensorData(singleId);

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id));
  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) filtered.forEach((p) => next.delete(p.id));
      else filtered.forEach((p) => next.add(p.id));
      return next;
    });
  };
  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const openSingle = (id: string) => {
    setSingleId(id);
    setSingleDraft("");
    setSingleContext("");
    // scroll to panel
    setTimeout(() => document.getElementById("single-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const handleGenerate = async () => {
    if (selected.length === 0) return;
    setGenerating(true);
    const communityName = user?.nama || "AleraFI";
    const managedArea = user?.managedArea || "";
    setDraft(generateWarningDraft(selected, context, communityName, managedArea));
    setGenerating(false);
    toast.success("Draft peringatan dibuat", { description: "Edit dulu sebelum kirim." });
  };
  const handleSend = async () => {
    if (!draft.trim()) return;
    if (isCommunityUser && !isTelegramConnected) {
      toast.error("Telegram belum terhubung", { description: "Hubungkan group Telegram terlebih dahulu di Konfigurasi Telegram." });
      return;
    }
    setSending(true);
    try {
      if (!isCommunityUser) {
        toast.error("Fitur ini hanya tersedia untuk akun komunitas", {
          description: "Hubungi admin untuk mengubah peran akun Anda.",
        });
        return;
      }
      const data = await sendTelegramBroadcast(draft);
      toast.success("Pesan dikirim ke group Telegram", {
        description: data.message || `${draft.length} karakter`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengirim pesan";
      toast.error(msg, {
        description: "Pastikan group Telegram sudah terhubung di halaman Konfigurasi Telegram.",
      });
    } finally {
      setSending(false);
    }
  };

  const handleSingleGenerate = async () => {
    if (!singlePos) return;
    setSingleGenerating(true);
    const communityName = user?.nama || "AleraFI";
    setSingleDraft(generateSingleDraft(singlePos, singleHistData, singleContext, communityName));
    setSingleGenerating(false);
    toast.success(`Draft historis 3J ${singlePos.nama} dibuat`);
  };
  const handleSingleSend = async () => {
    if (!singleDraft.trim() || !singlePos) return;
    if (isCommunityUser && !isTelegramConnected) {
      toast.error("Telegram belum terhubung", { description: "Hubungkan group Telegram terlebih dahulu di Konfigurasi Telegram." });
      return;
    }
    setSingleSending(true);
    try {
      if (!isCommunityUser) {
        toast.error("Fitur ini hanya tersedia untuk akun komunitas", {
          description: "Hubungi admin untuk mengubah peran akun Anda.",
        });
        return;
      }
      const data = await sendTelegramBroadcast(singleDraft);
      toast.success("Laporan stasiun dikirim ke group Telegram", {
        description: data.message || `${singlePos.nama} → Telegram`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengirim laporan";
      toast.error(msg, {
        description: "Pastikan group Telegram sudah terhubung di halaman Konfigurasi Telegram.",
      });
    } finally {
      setSingleSending(false);
    }
  };

  return (
    <section className="container mx-auto max-w-7xl px-4 py-6">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tabel Pos Pemantauan</h1>
          <p className="text-sm text-muted-foreground">
            Pilih banyak pos via checkbox untuk peringatan gabungan, atau klik <span className="font-medium">Kirim</span> di baris untuk laporan historis 1 stasiun.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="h-3.5 w-3.5 animate-spin [animation-duration:8s]" />
          {loading ? "Memuat data…" : error ? `Error: ${error}` : "Data realtime aktif"}
        </div>
      </header>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(["all", "siaga1", "siaga2", "siaga3", "normal"] as StatusFilter[]).map((s) => {
          const label = s === "all" ? "Semua" : s === "normal" ? "Normal" : `Siaga ${s.replace("siaga", "")}`;
          return (
            <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)} className="capitalize">
              {label} <span className="ml-1.5 opacity-60">{counts[s]}</span>
            </Button>
          );
        })}
        <Input placeholder="Cari nama stasiun…" value={search} onChange={(e) => setSearch(e.target.value)} className="ml-auto h-9 w-64" />
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allFilteredSelected} onCheckedChange={toggleAll} aria-label="Pilih semua" />
              </TableHead>
              <TableHead>Nama Pos</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead className="text-right">Nilai</TableHead>
              <TableHead>Tren</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Update</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Tidak ada pos sesuai filter.</TableCell>
              </TableRow>
            )}
            {filtered.map((p) => {
              const status = p.reading?.status ?? "normal";
              const isActive = singleId === p.id;
              return (
                <TableRow key={p.id} data-state={selectedIds.has(p.id) || isActive ? "selected" : undefined}>
                  <TableCell><Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => toggle(p.id)} aria-label={`Pilih ${p.nama}`} /></TableCell>
                  <TableCell>
                    <div className="font-medium">{p.nama}</div>
                    <div className="text-[11px] capitalize text-muted-foreground">{p.kategori}</div>
                  </TableCell>
                  <TableCell><span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">{p.tipe}</span></TableCell>
                  <TableCell className="text-right font-mono font-semibold">{formatValue(p)}</TableCell>
                  <TableCell><TrenCell tren={p.tren} /></TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_BADGE[status]}`}>{status}</span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {p.reading
                      ? p.reading.updatedAtRaw
                        ? formatDateTimeWIB(p.reading.updatedAtRaw)
                        : formatDateTimeWIBFromMs(p.reading.updatedAt)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant={isActive ? "default" : "outline"} onClick={() => openSingle(p.id)} className="h-7 gap-1 px-2 text-xs">
                      <History className="h-3.5 w-3.5" /> Kirim
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Panel: laporan historis 1 stasiun */}
      {singlePos && (
        <div id="single-panel" className="mt-4 rounded-xl border-2 border-primary/40 bg-card p-4 shadow-sm">
          <header className="mb-3 flex flex-wrap items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Laporan Historis Stasiun</h2>
            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{singlePos.nama}</span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_BADGE[singlePos.reading?.status ?? "normal"]}`}>
              {singlePos.reading?.status ?? "normal"}
            </span>
            <Button size="sm" variant="ghost" className="ml-auto h-7 gap-1 px-2 text-xs" onClick={() => setSingleId(null)}>
              <X className="h-3.5 w-3.5" /> Tutup
            </Button>
          </header>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
            {/* Kiri: data + grafik */}
            <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-background p-2">
                  <div className="text-[10px] uppercase text-muted-foreground">Sekarang</div>
                  <div className="font-mono text-sm font-bold">{formatValue(singlePos)}</div>
                </div>
                <div className="rounded-md bg-background p-2">
                  <div className="text-[10px] uppercase text-muted-foreground">Min</div>
                  <div className="font-mono text-sm font-bold">{singleHist.length ? formatRaw(singlePos.tipe, Math.min(...singleHist)) : "—"}</div>
                </div>
                <div className="rounded-md bg-background p-2">
                  <div className="text-[10px] uppercase text-muted-foreground">Maks</div>
                  <div className="font-mono text-sm font-bold">{singleHist.length ? formatRaw(singlePos.tipe, Math.max(...singleHist)) : "—"}</div>
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    Data 3 jam terakhir
                    {singleHist.length > 0
                      ? ` (${singleHist.length} titik · draf: 18 interval 10 menit WIB)`
                      : " (belum tersedia)"}
                  </span>
                  <span>tren: <span className="font-medium text-foreground">{singlePos.tren}</span></span>
                </div>
                {singleHist.length > 1 ? <Sparkline values={singleHist} /> : <div className="text-xs text-muted-foreground">Belum cukup data historis…</div>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Konteks tambahan (opsional)</label>
                <Textarea
                  placeholder={`Mis. Pengamatan langsung di ${singlePos.nama}…`}
                  value={singleContext}
                  onChange={(e) => setSingleContext(e.target.value)}
                  rows={3}
                />
              </div>
              <Button onClick={handleSingleGenerate} disabled={singleGenerating} className="w-full">
                {singleGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Buat Draft Historis
              </Button>
            </div>

            {/* Kanan: draft + send */}
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium">Draft pesan (bisa diedit)</label>
                <Textarea
                  value={singleDraft}
                  onChange={(e) => setSingleDraft(e.target.value)}
                  placeholder="Klik 'Buat Draft Historis' untuk menghasilkan pesan otomatis dari data stasiun ini…"
                  rows={14}
                  className="font-mono text-xs"
                />
              </div>
              <Button onClick={handleSingleSend} disabled={!singleDraft.trim() || singleSending} className="w-full">
                {singleSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Kirim Laporan ke Telegram
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Panel: peringatan gabungan multi-pos */}
      {selected.length > 0 && (
        <div className="mt-4 rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
          <header className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Peringatan Gabungan</h2>
            <span className="ml-auto text-xs text-muted-foreground">{selected.length} pos terpilih</span>
          </header>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium">Konteks tambahan (opsional)</label>
                <Textarea
                  placeholder="Mis. Informan hulu lapor air keruh, suara gemuruh dari arah Cisanti…"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={4}
                />
              </div>
              <Button onClick={handleGenerate} disabled={generating} className="w-full">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Buat Draft Peringatan
              </Button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium">Draft pesan (bisa diedit)</label>
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Klik 'Buat Draft' untuk menghasilkan pesan otomatis…"
                  rows={10}
                  className="font-mono text-xs"
                />
              </div>
              <Button onClick={handleSend} disabled={!draft.trim() || sending} className="w-full">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Kirim ke Telegram
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default TablePage;
