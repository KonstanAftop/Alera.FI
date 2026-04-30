import { useMemo, useState } from "react";
import { usePosStore, THRESHOLDS, type PosWithTrend, type Tren } from "@/data/posStore";
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

type StatusFilter = "all" | "awas" | "siaga" | "normal";

const STATUS_BADGE: Record<string, string> = {
  normal: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  siaga: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  awas: "bg-rose-500/15 text-rose-700 border-rose-500/30",
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

const formatThreshold = (p: PosWithTrend) => {
  const t = p.tipe === "ARR" ? THRESHOLDS.ARR : THRESHOLDS.AWLR;
  if (p.tipe === "ARR") return `Siaga ≥${t.siaga} · Awas ≥${t.awas} mm/jam`;
  return `Siaga ≥${(t.siaga * 100).toFixed(0)} · Awas ≥${(t.awas * 100).toFixed(0)} cm`;
};

// --- Mock draft generator (multi-stasiun) ---
const generateMockDraft = (selected: PosWithTrend[], context: string) => {
  const awas = selected.filter((p) => p.reading?.status === "awas");
  const siaga = selected.filter((p) => p.reading?.status === "siaga");
  const naik = selected.filter((p) => p.tren === "naik");
  const tingkat = awas.length > 0 ? "AWAS" : siaga.length > 0 ? "SIAGA" : "INFORMASI";
  const lines: string[] = [];
  lines.push("⚠️ PERINGATAN RESMI PACU MAJALAYA");
  lines.push("");
  lines.push(`Status: ${tingkat}`);
  lines.push(`Waktu: ${new Date().toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}`);
  lines.push("");
  lines.push("Pos terpantau:");
  selected.forEach((p) => {
    lines.push(`• ${p.nama} (${p.kategori}) — ${formatValue(p)} — ${p.reading?.status?.toUpperCase()} — tren ${p.tren}`);
  });
  lines.push("");
  if (awas.length > 0) lines.push(`🚨 ${awas.length} pos berstatus AWAS. Warga di bantaran sungai diminta SIAP EVAKUASI.`);
  else if (siaga.length > 0) lines.push(`⚠️ ${siaga.length} pos berstatus SIAGA. Pantau perkembangan & siapkan barang penting.`);
  if (naik.length > 0 && awas.length === 0) lines.push(`📈 ${naik.length} pos menunjukkan tren NAIK — kewaspadaan ditingkatkan.`);
  if (context.trim()) { lines.push(""); lines.push("Catatan lapangan:"); lines.push(context.trim()); }
  lines.push("");
  lines.push("Tetap tenang & ikuti arahan petugas. — Tim PACU Majalaya");
  return lines.join("\n");
};

// --- Mock draft generator (1 stasiun, fokus historis) ---
const generateSingleDraft = (p: PosWithTrend, hist: number[], context: string) => {
  const status = p.reading?.status ?? "normal";
  const tingkat = status === "awas" ? "AWAS" : status === "siaga" ? "SIAGA" : "INFORMASI";
  const min = hist.length ? Math.min(...hist) : p.reading?.value ?? 0;
  const max = hist.length ? Math.max(...hist) : p.reading?.value ?? 0;
  const first = hist[0] ?? p.reading?.value ?? 0;
  const last = hist[hist.length - 1] ?? p.reading?.value ?? 0;
  const delta = last - first;
  const arah = Math.abs(delta) < (p.tipe === "ARR" ? 1 : 0.05) ? "stabil" : delta > 0 ? "naik" : "turun";

  const lines: string[] = [];
  lines.push("⚠️ PERINGATAN RESMI PACU MAJALAYA");
  lines.push("");
  lines.push(`Status: ${tingkat} — ${p.nama}`);
  lines.push(`Lokasi: ${p.kategori.toUpperCase()} · ${p.elevasi} mdpl`);
  lines.push(`Waktu laporan: ${new Date().toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}`);
  lines.push("");
  lines.push(`Nilai sekarang : ${formatValue(p)}`);
  lines.push(`Rentang ${hist.length} pembacaan terakhir:`);
  lines.push(`  • Minimum   : ${formatRaw(p.tipe, min)}`);
  lines.push(`  • Maksimum  : ${formatRaw(p.tipe, max)}`);
  lines.push(`  • Awal→akhir: ${formatRaw(p.tipe, first)} → ${formatRaw(p.tipe, last)} (${arah})`);
  lines.push(`Threshold     : ${formatThreshold(p)}`);
  lines.push("");
  if (status === "awas") lines.push("🚨 Stasiun ini melampaui ambang AWAS. Warga di sekitar diminta SIAP EVAKUASI.");
  else if (status === "siaga") lines.push("⚠️ Stasiun ini berstatus SIAGA. Pantau perkembangan & siapkan barang penting.");
  else if (arah === "naik") lines.push("📈 Status normal namun tren NAIK — tetap waspada.");
  else lines.push("ℹ️ Kondisi terpantau normal & stabil.");

  if (context.trim()) { lines.push(""); lines.push("Catatan lapangan:"); lines.push(context.trim()); }
  lines.push("");
  lines.push(`— Pos ${p.nama} · Tim PACU Majalaya`);
  return lines.join("\n");
};

// --- Sparkline ---
const Sparkline = ({ values, tipe }: { values: number[]; tipe: "ARR" | "AWLR" }) => {
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
  const t = tipe === "ARR" ? THRESHOLDS.ARR : THRESHOLDS.AWLR;
  const yFor = (val: number) => h - pad - ((val - min) / range) * (h - pad * 2);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-32 w-full">
      {/* threshold lines if in range */}
      {[{ v: t.siaga, c: "hsl(38 92% 50%)", label: "Siaga" }, { v: t.awas, c: "hsl(0 84% 60%)", label: "Awas" }].map((th) =>
        th.v >= min && th.v <= max ? (
          <g key={th.label}>
            <line x1={pad} x2={w - pad} y1={yFor(th.v)} y2={yFor(th.v)} stroke={th.c} strokeDasharray="4 4" strokeWidth={1} opacity={0.6} />
            <text x={w - pad - 2} y={yFor(th.v) - 3} textAnchor="end" fontSize="9" fill={th.c}>{th.label}</text>
          </g>
        ) : null,
      )}
      <polyline fill="none" stroke="hsl(var(--primary))" strokeWidth={2} points={points.join(" ")} />
      <circle cx={points[points.length - 1].split(",")[0]} cy={points[points.length - 1].split(",")[1]} r={3.5} fill="hsl(var(--primary))" />
    </svg>
  );
};

const TablePage = () => {
  const { posList, history, lastTickAt } = usePosStore();
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

  const filtered = useMemo(() => {
    return posList.filter((p) => {
      if (statusFilter !== "all" && p.reading?.status !== statusFilter) return false;
      if (search.trim() && !p.nama.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [posList, statusFilter, search]);

  const counts = useMemo(() => {
    const c = { all: posList.length, awas: 0, siaga: 0, normal: 0 };
    posList.forEach((p) => { c[p.reading?.status ?? "normal"]++; });
    return c;
  }, [posList]);

  const selected = useMemo(() => posList.filter((p) => selectedIds.has(p.id)), [posList, selectedIds]);
  const singlePos = useMemo(() => posList.find((p) => p.id === singleId) ?? null, [posList, singleId]);
  const singleHist = singleId ? history[singleId] ?? [] : [];

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
    await new Promise((r) => setTimeout(r, 700));
    setDraft(generateMockDraft(selected, context));
    setGenerating(false);
    toast.success("Draft peringatan dibuat", { description: "Edit dulu sebelum kirim." });
  };
  const handleSend = async () => {
    if (!draft.trim()) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 900));
    setSending(false);
    toast.success("Pesan dikirim ke channel Telegram (simulasi)", { description: `${draft.length} karakter ke @pacu_majalaya` });
  };

  const handleSingleGenerate = async () => {
    if (!singlePos) return;
    setSingleGenerating(true);
    await new Promise((r) => setTimeout(r, 600));
    setSingleDraft(generateSingleDraft(singlePos, singleHist, singleContext));
    setSingleGenerating(false);
    toast.success(`Draft historis ${singlePos.nama} dibuat`);
  };
  const handleSingleSend = async () => {
    if (!singleDraft.trim() || !singlePos) return;
    setSingleSending(true);
    await new Promise((r) => setTimeout(r, 900));
    setSingleSending(false);
    toast.success("Laporan stasiun dikirim (simulasi)", { description: `${singlePos.nama} → @pacu_majalaya` });
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
          Auto-refresh tiap 10 menit · update terakhir{" "}
          <span className="font-mono text-foreground">{new Date(lastTickAt).toLocaleTimeString("id-ID")}</span>
        </div>
      </header>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(["all", "awas", "siaga", "normal"] as StatusFilter[]).map((s) => (
          <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)} className="capitalize">
            {s === "all" ? "Semua" : s} <span className="ml-1.5 opacity-60">{counts[s]}</span>
          </Button>
        ))}
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
              <TableHead>Threshold</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Update</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">Tidak ada pos sesuai filter.</TableCell>
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
                    <div className="text-[11px] capitalize text-muted-foreground">{p.kategori} · {p.elevasi} mdpl</div>
                  </TableCell>
                  <TableCell><span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">{p.tipe}</span></TableCell>
                  <TableCell className="text-right font-mono font-semibold">{formatValue(p)}</TableCell>
                  <TableCell><TrenCell tren={p.tren} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatThreshold(p)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_BADGE[status]}`}>{status}</span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {p.reading ? new Date(p.reading.updatedAt).toLocaleTimeString("id-ID") : "—"}
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
                  <span>Grafik {singleHist.length} pembacaan terakhir</span>
                  <span>tren: <span className="font-medium text-foreground">{singlePos.tren}</span></span>
                </div>
                <Sparkline values={singleHist} tipe={singlePos.tipe} />
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
                Generate Draft Historis
              </Button>
            </div>

            {/* Kanan: draft + send */}
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium">Draft pesan (bisa diedit)</label>
                <Textarea
                  value={singleDraft}
                  onChange={(e) => setSingleDraft(e.target.value)}
                  placeholder="Klik Generate Draft Historis untuk membuat pesan otomatis dari data stasiun ini…"
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
                Generate Draft
              </Button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium">Draft pesan (bisa diedit)</label>
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Klik Generate Draft untuk membuat pesan otomatis…"
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
