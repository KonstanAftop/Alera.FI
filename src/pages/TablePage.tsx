import { useMemo, useState } from "react";
import { usePosStore, THRESHOLDS, type PosWithTrend, type Tren } from "@/data/posStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowUpRight, ArrowDownRight, Minus, RefreshCw, Sparkles, Send, AlertTriangle, Loader2,
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

const formatThreshold = (p: PosWithTrend) => {
  const t = p.tipe === "ARR" ? THRESHOLDS.ARR : THRESHOLDS.AWLR;
  if (p.tipe === "ARR") return `Siaga ≥${t.siaga} · Awas ≥${t.awas} mm/jam`;
  return `Siaga ≥${(t.siaga * 100).toFixed(0)} · Awas ≥${(t.awas * 100).toFixed(0)} cm`;
};

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
    const val = formatValue(p);
    lines.push(`• ${p.nama} (${p.kategori}) — ${val} — ${p.reading?.status?.toUpperCase()} — tren ${p.tren}`);
  });
  lines.push("");

  if (awas.length > 0) {
    lines.push(`🚨 ${awas.length} pos berstatus AWAS. Warga di bantaran sungai diminta SIAP EVAKUASI.`);
  } else if (siaga.length > 0) {
    lines.push(`⚠️ ${siaga.length} pos berstatus SIAGA. Pantau perkembangan & siapkan barang penting.`);
  }
  if (naik.length > 0 && awas.length === 0) {
    lines.push(`📈 ${naik.length} pos menunjukkan tren NAIK — kewaspadaan ditingkatkan.`);
  }

  if (context.trim()) {
    lines.push("");
    lines.push("Catatan lapangan:");
    lines.push(context.trim());
  }

  lines.push("");
  lines.push("Tetap tenang & ikuti arahan petugas. — Tim PACU Majalaya");
  return lines.join("\n");
};

const TablePage = () => {
  const { posList, lastTickAt } = usePosStore();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [context, setContext] = useState("");
  const [draft, setDraft] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  const filtered = useMemo(() => {
    return posList.filter((p) => {
      if (statusFilter !== "all" && p.reading?.status !== statusFilter) return false;
      if (search.trim() && !p.nama.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [posList, statusFilter, search]);

  const counts = useMemo(() => {
    const c = { all: posList.length, awas: 0, siaga: 0, normal: 0 };
    posList.forEach((p) => {
      const s = p.reading?.status ?? "normal";
      c[s]++;
    });
    return c;
  }, [posList]);

  const selected = useMemo(() => posList.filter((p) => selectedIds.has(p.id)), [posList, selectedIds]);
  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id));

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((p) => next.add(p.id));
        return next;
      });
    }
  };

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (selected.length === 0) return;
    setGenerating(true);
    // Simulate brief AI call
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
    toast.success("Pesan dikirim ke channel Telegram (simulasi)", {
      description: `${draft.length} karakter ke @pacu_majalaya`,
    });
  };

  return (
    <section className="container mx-auto max-w-7xl px-4 py-6">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tabel Pos Pemantauan</h1>
          <p className="text-sm text-muted-foreground">Data realtime semua pos ARR & AWLR.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="h-3.5 w-3.5 animate-spin [animation-duration:8s]" />
          Auto-refresh tiap 10 menit · update terakhir{" "}
          <span className="font-mono text-foreground">{new Date(lastTickAt).toLocaleTimeString("id-ID")}</span>
        </div>
      </header>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(["all", "awas", "siaga", "normal"] as StatusFilter[]).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? "default" : "outline"}
            onClick={() => setStatusFilter(s)}
            className="capitalize"
          >
            {s === "all" ? "Semua" : s} <span className="ml-1.5 opacity-60">{counts[s]}</span>
          </Button>
        ))}
        <Input
          placeholder="Cari nama stasiun…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-auto h-9 w-64"
        />
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
              <TableHead>Sumber</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                  Tidak ada pos sesuai filter.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((p) => {
              const status = p.reading?.status ?? "normal";
              return (
                <TableRow key={p.id} data-state={selectedIds.has(p.id) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(p.id)}
                      onCheckedChange={() => toggle(p.id)}
                      aria-label={`Pilih ${p.nama}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{p.nama}</div>
                    <div className="text-[11px] capitalize text-muted-foreground">{p.kategori} · {p.elevasi} mdpl</div>
                  </TableCell>
                  <TableCell>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">{p.tipe}</span>
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">{formatValue(p)}</TableCell>
                  <TableCell><TrenCell tren={p.tren} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatThreshold(p)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_BADGE[status]}`}>
                      {status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {p.reading ? new Date(p.reading.updatedAt).toLocaleTimeString("id-ID") : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">PACU Mockup</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {selected.length > 0 && (
        <div className="mt-4 rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
          <header className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Kirim Peringatan Dini</h2>
            <span className="ml-auto text-xs text-muted-foreground">{selected.length} pos terpilih</span>
          </header>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium">Konteks tambahan (opsional)</label>
                <Textarea
                  placeholder="Mis. Informan hulu lapor air keruh, suara gemuruh dari arah Cisanti..."
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
              <Button onClick={handleSend} disabled={!draft.trim() || sending} className="w-full" variant="default">
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
