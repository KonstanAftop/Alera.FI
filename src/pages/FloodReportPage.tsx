import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Search, Send, Trash2, Clock, Loader2, Droplets } from "lucide-react";
import { addFloodReport, removeFloodReport, useFloodReports, LOKASI_SUGGESTIONS } from "@/data/floodReports";
import { toast } from "sonner";

const formatTime = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
};

const timeAgo = (ts: number) => {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}d lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
  return `${Math.floor(diff / 86400)}h lalu`;
};

const FloodReportPage = () => {
  const reports = useFloodReports();
  const [query, setQuery] = useState("");
  const [pelapor, setPelapor] = useState("");
  const [catatan, setCatatan] = useState("");
  const [selectedLokasi, setSelectedLokasi] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LOKASI_SUGGESTIONS.slice(0, 8);
    return LOKASI_SUGGESTIONS.filter((l) => l.toLowerCase().includes(q)).slice(0, 8);
  }, [query]);

  const lokasiFinal = selectedLokasi ?? query.trim();

  const handleSubmit = async () => {
    if (!lokasiFinal) {
      toast.error("Lokasi wajib diisi", { description: "Cari atau ketik nama daerah." });
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 500));
    addFloodReport({ lokasi: lokasiFinal, catatan: catatan.trim() || undefined, pelapor: pelapor.trim() || undefined });
    setQuery("");
    setSelectedLokasi(null);
    setCatatan("");
    setSubmitting(false);
    toast.success("Laporan banjir tercatat", { description: `${lokasiFinal} · ${new Date().toLocaleTimeString("id-ID")}` });
  };

  return (
    <section className="container mx-auto max-w-7xl px-4 py-6">
      <header className="mb-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Droplets className="h-6 w-6 text-primary" /> Laporkan Banjir
        </h1>
        <p className="text-sm text-muted-foreground">
          Cari daerah terdampak, lalu kirim laporan. Setiap laporan otomatis dapat <span className="font-medium">timestamp</span>.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        {/* Form */}
        <div className="space-y-4 rounded-xl border bg-card p-4">
          <div>
            <label className="mb-1 block text-xs font-medium">Daerah banjir</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedLokasi(null);
                }}
                placeholder="Cari/ketik nama daerah… mis. Wangisagara"
                className="pl-8"
              />
            </div>
            {selectedLokasi && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <MapPin className="h-3 w-3" /> {selectedLokasi}
                <button className="ml-1 opacity-70 hover:opacity-100" onClick={() => setSelectedLokasi(null)}>×</button>
              </div>
            )}
            {!selectedLokasi && matches.length > 0 && (
              <div className="mt-2 max-h-44 overflow-y-auto rounded-md border bg-background">
                {matches.map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      setSelectedLokasi(l);
                      setQuery(l);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-muted"
                  >
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">Nama pelapor (opsional)</label>
            <Input value={pelapor} onChange={(e) => setPelapor(e.target.value)} placeholder="Mis. Pak RT 03 / Tim PACU" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">Catatan (opsional)</label>
            <Textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={4}
              placeholder="Mis. Air mulai masuk rumah ±30cm, jalan utama tergenang…"
            />
          </div>

          <Button onClick={handleSubmit} disabled={submitting || !lokasiFinal} className="w-full">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Kirim Laporan
          </Button>
        </div>

        {/* List */}
        <div className="rounded-xl border bg-card">
          <header className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Riwayat Laporan</h2>
            </div>
            <span className="text-xs text-muted-foreground">{reports.length} laporan</span>
          </header>
          {reports.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              Belum ada laporan banjir. Kirim yang pertama dari form di samping.
            </div>
          ) : (
            <ul className="divide-y">
              {reports.map((r) => (
                <li key={r.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="truncate font-medium">{r.lokasi}</span>
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                          {timeAgo(r.createdAt)}
                        </span>
                      </div>
                      {r.catatan && <p className="mt-1 text-sm text-muted-foreground">{r.catatan}</p>}
                      <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
                        <span className="font-mono">{formatTime(r.createdAt)}</span>
                        {r.pelapor && <span>· oleh {r.pelapor}</span>}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0"
                      onClick={() => {
                        removeFloodReport(r.id);
                        toast("Laporan dihapus");
                      }}
                      aria-label="Hapus laporan"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};

export default FloodReportPage;
