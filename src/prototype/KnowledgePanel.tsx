import { useState } from "react";
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
  return <>
    <h2>Basis pengetahuan AI</h2>
    <p>Unggah dokumen untuk menjadi rujukan asisten.</p>
    <section className="panel">
      <label>
        Unggah file
        <input type="file" multiple accept=".txt,.md,text/plain,text/markdown" disabled={reading} onChange={async (event) => {
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
      <small>TXT / Markdown · Maks. 200 KB per file · Tersimpan di browser ini</small>
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
        {pending.map((item) => <div key={item.id}>
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
    <h3>Dokumen rujukan ({knowledge.length})</h3>
    {knowledge.map((item) => <section className="panel" key={item.id}>
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
      <div className="actions">
        <button onClick={() => setEditing(item.id)}>Ubah judul</button>
        <button aria-label={`${item.enabled ? "Nonaktifkan" : "Aktifkan"} ${item.title}`} onClick={() => onChange((items) => items.map((x) => x.id === item.id ? { ...x, enabled: !x.enabled } : x))}>{item.enabled ? "Nonaktifkan" : "Aktifkan"}</button>
        <button aria-label={`Hapus ${item.title}`} onClick={() => onChange((items) => items.filter((x) => x.id !== item.id))}>Hapus</button>
      </div>
      <small>{item.enabled ? "Aktif sebagai rujukan" : "Tidak aktif"}</small>
    </section>)}
  </>;
}
