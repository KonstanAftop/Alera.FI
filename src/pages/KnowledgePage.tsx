import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileText, Trash2, Plus, Search, FileType2 } from "lucide-react";
import { toast } from "sonner";

interface KnowledgeDoc {
  id: string;
  name: string;
  type: "pdf" | "docx" | "txt" | "manual";
  size: number; // bytes
  uploadedAt: number;
  content: string; // preview text (or full for txt/manual)
}

const formatBytes = (b: number) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
};

const detectType = (name: string): KnowledgeDoc["type"] => {
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return "pdf";
  if (n.endsWith(".docx")) return "docx";
  return "txt";
};

const TYPE_BADGE: Record<KnowledgeDoc["type"], string> = {
  pdf: "bg-rose-500/15 text-rose-700 border-rose-500/30",
  docx: "bg-sky-500/15 text-sky-700 border-sky-500/30",
  txt: "bg-slate-500/15 text-slate-700 border-slate-500/30",
  manual: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
};

const KnowledgePage = () => {
  const [docs, setDocs] = useState<KnowledgeDoc[]>(() => [
    {
      id: "seed-1",
      name: "Protokol Peringatan Dini Banjir Majalaya.txt",
      type: "txt",
      size: 1240,
      uploadedAt: Date.now() - 86400000,
      content:
        "Protokol Peringatan Dini Banjir Majalaya\n\n1. Pos ARR di hulu (Cisanti, Kertasari, Pacet) memantau curah hujan tiap 10 menit.\n2. Jika ARR ≥ 20 mm/jam selama 2 jam berturut-turut, status SIAGA.\n3. Jika ARR ≥ 30 mm/jam atau AWLR Majalaya ≥ 2.0 m, status AWAS.\n4. Tim PACU mengirim broadcast Telegram ke channel @pacu_majalaya.\n5. Warga zona merah menyiapkan evakuasi.",
    },
    {
      id: "seed-2",
      name: "Daftar RT/RW Zona Rawan Banjir.txt",
      type: "txt",
      size: 820,
      uploadedAt: Date.now() - 3 * 86400000,
      content:
        "Zona rawan banjir Kec. Majalaya:\n\n- Kel. Majalaya: RW 01, 02, 05, 09 (bantaran Citarum)\n- Kel. Majakerta: RW 03, 04 (pertemuan Citarum-Cikaro)\n- Kel. Sukamaju: RW 02, 06\n- Kel. Wangisagara: RW 01\n\nTotal estimasi 4.500 KK terdampak saat banjir besar.",
    },
  ]);
  const [selectedId, setSelectedId] = useState<string | null>("seed-1");
  const [search, setSearch] = useState("");
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualContent, setManualContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    return docs.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));
  }, [docs, search]);

  const selected = docs.find((d) => d.id === selectedId) ?? null;

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newDocs: KnowledgeDoc[] = [];
    for (const f of Array.from(files)) {
      const type = detectType(f.name);
      let content = "";
      if (type === "txt") {
        try {
          content = await f.text();
        } catch {
          content = "(gagal membaca isi file)";
        }
      } else {
        content = `(Preview ${type.toUpperCase()} tidak tersedia di mockup. File "${f.name}" berukuran ${formatBytes(f.size)} berhasil di-upload.)`;
      }
      newDocs.push({
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: f.name,
        type,
        size: f.size,
        uploadedAt: Date.now(),
        content,
      });
    }
    setDocs((prev) => [...newDocs, ...prev]);
    setSelectedId(newDocs[0].id);
    toast.success(`${newDocs.length} dokumen di-upload`);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddManual = () => {
    if (!manualTitle.trim() || !manualContent.trim()) {
      toast.error("Judul dan isi tidak boleh kosong");
      return;
    }
    const doc: KnowledgeDoc = {
      id: `doc-${Date.now()}`,
      name: manualTitle.trim().endsWith(".txt") ? manualTitle.trim() : `${manualTitle.trim()}.txt`,
      type: "manual",
      size: new Blob([manualContent]).size,
      uploadedAt: Date.now(),
      content: manualContent,
    };
    setDocs((prev) => [doc, ...prev]);
    setSelectedId(doc.id);
    setManualTitle("");
    setManualContent("");
    setShowManualForm(false);
    toast.success("Konten manual ditambahkan");
  };

  const handleDelete = (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
    if (selectedId === id) setSelectedId(null);
    toast.success("Dokumen dihapus");
  };

  return (
    <section className="container mx-auto max-w-7xl px-4 py-6">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground">Dokumen referensi untuk konteks peringatan dini.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" /> Upload File
          </Button>
          <Button onClick={() => setShowManualForm((v) => !v)}>
            <Plus className="h-4 w-4" /> Tambah Manual
          </Button>
        </div>
      </header>

      {showManualForm && (
        <div className="mb-4 rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
          <h2 className="mb-3 text-sm font-semibold">Tambah Konten Manual</h2>
          <div className="space-y-3">
            <Input
              placeholder="Judul dokumen…"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
            />
            <Textarea
              placeholder="Isi dokumen…"
              value={manualContent}
              onChange={(e) => setManualContent(e.target.value)}
              rows={6}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowManualForm(false)}>Batal</Button>
              <Button onClick={handleAddManual}>Simpan</Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-[360px_1fr]">
        {/* Document list */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center gap-2 border-b p-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari dokumen…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 border-0 px-0 shadow-none focus-visible:ring-0"
            />
            <span className="text-xs text-muted-foreground">{filtered.length}</span>
          </div>
          <ScrollArea className="h-[calc(100vh-18rem)]">
            <div className="space-y-1 p-2">
              {filtered.length === 0 && (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Belum ada dokumen.
                </div>
              )}
              {filtered.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedId(d.id)}
                  className={`group w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                    selectedId === d.id
                      ? "border-primary bg-primary/10"
                      : "border-transparent hover:bg-muted"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{d.name}</div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className={`rounded border px-1.5 py-px font-bold uppercase ${TYPE_BADGE[d.type]}`}>
                          {d.type}
                        </span>
                        <span>{formatBytes(d.size)}</span>
                        <span>·</span>
                        <span>{new Date(d.uploadedAt).toLocaleDateString("id-ID")}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(d.id);
                      }}
                      className="rounded p-1 text-muted-foreground opacity-0 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                      aria-label="Hapus"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Preview */}
        <div className="rounded-xl border bg-card">
          {selected ? (
            <>
              <header className="flex items-start justify-between gap-3 border-b p-4">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold">{selected.name}</h2>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={`rounded border px-1.5 py-0.5 font-bold uppercase ${TYPE_BADGE[selected.type]}`}>
                      {selected.type}
                    </span>
                    <span>{formatBytes(selected.size)}</span>
                    <span>·</span>
                    <span>Diupload {new Date(selected.uploadedAt).toLocaleString("id-ID")}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(selected.id)}
                >
                  <Trash2 className="h-4 w-4" /> Hapus
                </Button>
              </header>
              <ScrollArea className="h-[calc(100vh-22rem)]">
                <pre className="whitespace-pre-wrap p-4 font-sans text-sm leading-relaxed">{selected.content}</pre>
              </ScrollArea>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center text-muted-foreground">
              <FileType2 className="h-10 w-10" />
              <p>Pilih dokumen untuk melihat preview.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default KnowledgePage;
