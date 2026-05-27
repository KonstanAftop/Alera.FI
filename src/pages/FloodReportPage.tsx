import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import LocationGeocodeSearch from "@/components/flood/LocationGeocodeSearch";
import { Trash2, Clock, Loader2, Droplets } from "lucide-react";
import { useFloodReports, addFloodReport, deleteFloodReport } from "@/hooks/useFloodReports";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  FLOOD_SEVERITY_OPTIONS,
  getFloodSeverityOption,
  type FloodSeverity,
} from "@/lib/floodSeverity";

const PAGE_SIZE = 7;

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
  const { reports, loading, refetch } = useFloodReports(user?.id);
  const [lokasi, setLokasi] = useState("");
  const [severity, setSeverity] = useState<FloodSeverity>("medium");
  const [catatan, setCatatan] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(reports.length / PAGE_SIZE));

  const paginatedReports = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return reports.slice(start, start + PAGE_SIZE);
  }, [reports, page]);

  const rangeStart = reports.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, reports.length);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleSubmit = async () => {
    if (!lokasi.trim()) {
      toast.error("Lokasi wajib diisi");
      return;
    }
    if (!user?.id) {
      toast.error("User tidak terautentikasi");
      return;
    }
    const locationLabel = lokasi.trim();
    setSubmitting(true);
    try {
      await addFloodReport({
        community_id: user.id,
        location_text: locationLabel,
        severity,
        description: catatan.trim() || null,
        image_url: null,
      });
      setLokasi("");
      setCatatan("");
      setSeverity("medium");
      setPage(1);
      await refetch();
      toast.success("Laporan banjir tercatat", {
        description: `${locationLabel} · ${new Date().toLocaleTimeString("id-ID")}`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan";
      console.error("Error submitting report:", error);
      toast.error("Gagal mengirim laporan", { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFloodReport(id);
      await refetch();
      toast.success("Laporan dihapus");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan";
      toast.error("Gagal menghapus", { description: message });
    }
  };

  return (
    <section className="container mx-auto max-w-7xl px-4 py-6">
      <header className="mb-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Droplets className="h-6 w-6 text-primary" /> Laporkan Banjir
        </h1>
        <p className="text-sm text-muted-foreground">
          Dokumentasikan kejadian banjir di lapangan untuk monitoring tim. Klasifikasi kedalaman
          mengacu pada Nurul Yuhan (ITB, 2017).
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4 rounded-xl border bg-card p-4">
          <div>
            <Label className="mb-2 block text-sm font-medium">Lokasi Banjir *</Label>
            <LocationGeocodeSearch
              value={lokasi}
              onChange={setLokasi}
              disabled={submitting}
            />
          </div>
          <div>
            <Label className="mb-2 block text-sm font-medium">Tingkat Keparahan *</Label>
            <RadioGroup value={severity} onValueChange={(v) => setSeverity(v as typeof severity)}>
              <div className="grid gap-2">
                {FLOOD_SEVERITY_OPTIONS.map((opt) => (
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

        <div className="flex flex-col rounded-xl border bg-card">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Riwayat Laporan</h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{reports.length} laporan</span>
              {reports.length > PAGE_SIZE && (
                <>
                  <span>·</span>
                  <span>
                    Halaman {page}/{totalPages}
                  </span>
                </>
              )}
            </div>
          </header>

          {loading ? (
            <div className="flex flex-1 items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : reports.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              Belum ada laporan banjir.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[140px]">Lokasi</TableHead>
                      <TableHead className="w-[100px]">Tingkat</TableHead>
                      <TableHead className="hidden min-w-[120px] sm:table-cell">Catatan</TableHead>
                      <TableHead className="min-w-[130px]">Waktu</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedReports.map((r) => {
                      const severityOpt = getFloodSeverityOption(r.severity);
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="max-w-[200px]">
                            <span className="line-clamp-2 font-medium" title={r.location_text}>
                              {r.location_text}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-bold">
                              <span>{severityOpt?.icon}</span>
                              <span>{severityOpt?.label.toUpperCase()}</span>
                            </span>
                          </TableCell>
                          <TableCell className="hidden max-w-[180px] sm:table-cell">
                            <span className="line-clamp-2 text-muted-foreground">
                              {r.description || "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <div className="font-mono">{formatTime(r.reported_at)}</div>
                              <div className="text-muted-foreground">{timeAgo(r.reported_at)}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => handleDelete(r.id)}
                              aria-label="Hapus laporan"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <footer className="mt-auto flex flex-col items-center gap-3 border-t px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  Menampilkan {rangeStart}–{rangeEnd} dari {reports.length} laporan
                </p>
                {reports.length > PAGE_SIZE && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          onClick={(e) => {
                            e.preventDefault();
                            if (page > 1) setPage(page - 1);
                          }}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <PaginationItem key={p}>
                          <PaginationLink
                            href="#"
                            isActive={p === page}
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              setPage(p);
                            }}
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          className={
                            page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                          }
                          onClick={(e) => {
                            e.preventDefault();
                            if (page < totalPages) setPage(page + 1);
                          }}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </footer>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default FloodReportPage;
