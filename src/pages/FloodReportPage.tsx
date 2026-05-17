import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { MapPin, Trash2, Clock, Loader2, Droplets } from "lucide-react";
import { useFloodReports, addFloodReport, deleteFloodReport } from "@/hooks/useFloodReports";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const SEVERITY_OPTIONS = [
  { value: "low", label: "Rendah", color: "bg-emerald-500", icon: "🟢", desc: "Genangan < 30cm" },
  { value: "medium", label: "Sedang", color: "bg-yellow-500", icon: "🟡", desc: "Genangan 30-60cm" },
  { value: "high", label: "Tinggi", color: "bg-orange-500", icon: "🟠", desc: "Genangan 60-100cm" },
  { value: "critical", label: "Kritis", color: "bg-red-500", icon: "🔴", desc: "Genangan > 100cm" },
] as const;

const formatTime = (isoString: string) => {
  const d = new Date(isoString);
  return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
};

const timeAgo = (isoString: string) => {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return `${diff}d lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
  return `${Math.floor(diff / 86400)}h lalu`;
};

const FloodReportPage = () => {
  const { user } = useAuth();
  const { reports, loading } = useFloodReports(user?.id);
  const [lokasi, setLokasi] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [catatan, setCatatan] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!lokasi.trim()) {
      toast.error("Lokasi wajib diisi");
      return;
    }
    if (!user?.id) {
      toast.error("User tidak terautentikasi");
      return;
    }
    setSubmitting(true);
    try {
      await addFloodReport({
        community_id: user.id,
        location_text: lokasi.trim(),
        severity,
        description: catatan.trim() || null,
        image_url: null,
      });
      setLokasi("");
      setCatatan("");
      setSeverity("medium");
      toast.success("Laporan banjir tercatat", {
        description: `${lokasi} · ${new Date().toLocaleTimeString("id-ID")}`,
      });
    } catch (error: any) {
      console.error("Error submitting report:", error);
      toast.error("Gagal mengirim laporan", { description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFloodReport(id);
      toast.success("Laporan dihapus");
    } catch (error: any) {
      toast.error("Gagal menghapus", { description: error.message });
    }
  };

  return (
    <section className="container mx-auto max-w-7xl px-4 py-6">
      <header className="mb-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Droplets className="h-6 w-6 text-primary" /> Laporkan Banjir
        </h1>
        <p className="text-sm text-muted-foreground">
          Dokumentasikan kejadian banjir di lapangan untuk monitoring tim.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        {/* Form */}
        <div className="space-y-4 rounded-xl border bg-card p-4">
          <div>
            <Label className="mb-2 block text-sm font-medium">Lokasi Banjir *</Label>
            <Input
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
              placeholder="Mis. Kp. Wangisagara RT 02/05"
            />
          </div>
          <div>
            <Label className="mb-2 block text-sm font-medium">Tingkat Keparahan *</Label>
            <RadioGroup value={severity} onValueChange={(v) => setSeverity(v as any)}>
              <div className="grid gap-2">
                {SEVERITY_OPTIONS.map((opt) => (
                  <div
                    key={opt.value}
                    className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50"
                  >
                    <RadioGroupItem value={opt.value} id={opt.value} />
                    <Label htmlFor={opt.value} className="flex flex-1 cursor-pointer items-center gap-3">
                      <span className="text-lg">{opt.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium">{opt.label}</div>
                        <div className="text-xs text-muted-foreground">{opt.desc}</div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
          <div>
            <Label className="mb-2 block text-sm font-medium">Catatan (opsional)</Label>
            <Textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={4}
              placeholder="Mis. Air mulai masuk rumah ±30cm, jalan utama tergenang…"
            />
          </div>
          <Button onClick={handleSubmit} disabled={submitting || !lokasi.trim()} className="w-full">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Droplets className="h-4 w-4" />}
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : reports.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              Belum ada laporan banjir.
            </div>
          ) : (
            <ul className="divide-y">
              {reports.map((r) => {
                const severityOpt = SEVERITY_OPTIONS.find((s) => s.value === r.severity);
                return (
                  <li key={r.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span className="truncate font-medium">{r.location_text}</span>
                          <span className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold">
                            <span>{severityOpt?.icon}</span>
                            <span>{severityOpt?.label.toUpperCase()}</span>
                          </span>
                        </div>
                        {r.description && (
                          <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
                        )}
                        <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
                          <span className="font-mono">{formatTime(r.reported_at)}</span>
                          <span>·</span>
                          <span>{timeAgo(r.reported_at)}</span>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 shrink-0"
                        onClick={() => handleDelete(r.id)}
                        aria-label="Hapus laporan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};

export default FloodReportPage;
