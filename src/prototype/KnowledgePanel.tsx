import { useState } from "react";
import { UploadCloud, FileText, BookOpen, Search } from "lucide-react";
import type { Knowledge } from "./model";

type Props = {
  knowledge: Knowledge[];
  onChange: (update: (items: Knowledge[]) => Knowledge[]) => void;
};

export default function KnowledgePanel({ knowledge, onChange }: Props) {
  const [pending, setPending] = useState<Knowledge[]>([]);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const documents = knowledge.filter((item) => `${item.title} ${item.fileName ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <div className="knowledge-base">
    <div className="kb-heading">
    <span className="kb-heading-icon"><BookOpen size={24} /></span>
    <div>
    <h2>Basis pengetahuan AI</h2>
    <p>Kelola dokumen yang digunakan AI sebagai sumber referensi saat menjawab pertanyaan.</p>
    </div>
    </div>
    <section className="panel kb-upload-panel">
      <label className="kb-upload">
        <UploadCloud size={30} aria-hidden="true" />
        <strong>Tambahkan dokumen pengetahuan</strong>
        <span>Unggah panduan, SOP, atau materi pemantauan untuk referensi AI.</span>
        <span className="kb-upload-button">Unggah file</span>
        <small>TXT atau Markdown · Maks. 200 KB per file · Bisa pilih beberapa file</small>
        <input aria-label="Unggah file" type="file" multiple accept=".txt,.md,text/plain,text/markdown" disabled={reading} onChange={async (event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (!files.length) return;
          setError("");
          if (files.some((file) => !/\.(txt|md)$/i.test(file.name) || file.size > 200 * 1024)) {
            setError("Gunakan file TXT atau Markdown maksimal 200 KB per file.");
            return;
          }
          setReading(true);
          try {
            const documents = await Promise.all(files.map(async (file) => {
              const text = await file.text();
              if (!text.trim()) throw new Error("empty");
              return { id: crypto.randomUUID(), title: file.name.replace(/\.[^.]+$/, ""), fileName: file.name, text, enabled: true };
            }));
            setPending((items) => [...items, ...documents]);
          } catch {
            setError("File kosong atau gagal dibaca. Pilih file berisi teks dan coba lagi.");
          } finally {
            setReading(false);
          }
        }} />
      </label>
      <p className="kb-storage-note">Mode demo: dokumen disimpan di browser ini. Pengindeksan RAG belum terhubung.</p>
      {reading && <p role="status">Membaca file…</p>}
      {error && <p role="alert">{error}</p>}
      {pending.length > 0 && <form onSubmit={(event) => {
        event.preventDefault();
        if (pending.some((item) => !item.title.trim())) {
          setError("Judul dokumen tidak boleh kosong.");
          return;
        }
        onChange((items) => [...items, ...pending.map((item) => ({ ...item, title: item.title.trim() }))]);
        setPending([]);
        setError("");
      }}>
        <h3>Tinjau sebelum menyimpan</h3>
        <p>Sesuaikan judul agar dokumen mudah dikenali.</p>
        {pending.map((item) => <div className="kb-pending" key={item.id}>
          <p style={{ overflowWrap: "anywhere" }}>{item.fileName}</p>
          <label>Judul
            <input required value={item.title} onChange={(event) => setPending((items) => items.map((x) => x.id === item.id ? { ...x, title: event.target.value } : x))} />
          </label>
        </div>)}
        <div className="actions">
          <button className="primary" disabled={reading}>Simpan dokumen</button>
          <button type="button" onClick={() => { setPending([]); setError(""); }}>Batal</button>
        </div>
      </form>}
    </section>
    <section className="kb-library">
    <div className="kb-library-heading">
      <div><h3>Dokumen rujukan <span className="kb-count">{knowledge.length}</span></h3>
      <p>{knowledge.filter((item) => item.enabled).length} dokumen aktif sebagai referensi AI</p></div>
      <label className="search-field"><Search size={16} aria-hidden="true" /><input aria-label="Cari dokumen" placeholder="Cari dokumen…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
    </div>
    {documents.length === 0 && <div className="empty">{knowledge.length ? "Dokumen tidak ditemukan. Coba kata kunci lain." : "Belum ada dokumen. Unggah dokumen pertama untuk menambahkan referensi AI."}</div>}
    {documents.map((item) => <section className="kb-document" key={item.id}>
      <span className="kb-file-icon"><FileText size={21} aria-hidden="true" /></span>
      <div className="kb-document-body">
      {editing === item.id ? <form onSubmit={(event) => {
        event.preventDefault();
        const title = String(new FormData(event.currentTarget).get("title") ?? "").trim();
        if (!title) return;
        onChange((items) => items.map((x) => x.id === item.id ? { ...x, title } : x));
        setEditing(null);
      }}>
        <label>Judul<input name="title" required defaultValue={item.title} /></label>
        <div className="actions"><button>Simpan judul</button><button type="button" onClick={() => setEditing(null)}>Batal</button></div>
      </form> : <h3 style={{ overflowWrap: "anywhere" }}>{item.title}</h3>}
      <p style={{ overflowWrap: "anywhere" }}>{item.fileName ?? "Rujukan bawaan"}</p>
      <span className={item.enabled ? "access-badge active" : "access-badge"}>{item.enabled ? "Aktif sebagai rujukan" : "Tidak aktif"}</span>
      </div>
      <div className="actions">
        <button onClick={() => setEditing(item.id)}>Ubah judul</button>
        <button aria-label={`${item.enabled ? "Nonaktifkan" : "Aktifkan"} ${item.title}`} onClick={() => onChange((items) => items.map((x) => x.id === item.id ? { ...x, enabled: !x.enabled } : x))}>{item.enabled ? "Nonaktifkan" : "Aktifkan"}</button>
        <button aria-label={`Hapus ${item.title}`} onClick={() => onChange((items) => items.filter((x) => x.id !== item.id))}>Hapus</button>
      </div>
    </section>)}
    </section>
  </div>;
}
