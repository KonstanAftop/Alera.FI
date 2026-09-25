import { useState, useEffect, useCallback } from "react";
import {
  MapPinned,
  Activity as ActivityIcon,
  MessagesSquare,
  UserRound,
  Shield,
  Waves,
  ArrowUpRight,
  X,
  Plus,
  Check,
  ChevronRight,
  LogOut,
  Info,
  Droplets,
  Camera,
  Layers,
  Send,
} from "lucide-react";
import MonitoringMap from "./prototype/Map";
import {
  Post,
  User,
  Activity,
  Knowledge,
  Message,
  initialPosts,
  initialUsers,
  initialKnowledge,
  demoTime,
  value,
  status,
  forecast,
  accumulation,
  observations,
  observedAt,
  explain,
  draft,
  recentChange,
} from "./prototype/model";
function useStored<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    try {
      return JSON.parse(localStorage.getItem(key) || "null") ?? initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);
  return [state, setState] as const;
}
const time = (v: string) =>
  new Date(v).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }) + " WIB";
const uid = () => crypto.randomUUID();
const glossary =
  "AWLR: pencatat tinggi muka air. ARR: pencatat curah hujan. TMA: tinggi muka air pada pos, bukan kedalaman banjir. Akumulasi: total hujan dalam rentang waktu. Prakiraan: perkiraan mendatang yang mengandung ketidakpastian.";
export default function App() {
  const [posts, setPosts] = useStored<Post[]>("alera.posts.v1", initialPosts);
  const [users, setUsers] = useStored<User[]>("alera.users.v1", initialUsers);
  const [villages, setVillages] = useStored<string[]>("alera.villages.v1", [
    "Majalaya",
    "Wangisagara",
    "Sukamaju",
    "Majakerta",
  ]);
  const [knowledge, setKnowledge] = useStored<Knowledge[]>(
    "alera.knowledge.v1",
    initialKnowledge,
  );
  const [activities, setActivities] = useStored<Activity[]>(
    "alera.activity.v1",
    [],
  );
  const [messages, setMessages] = useStored<Message[]>("alera.messages.v1", []);
  const [at] = useStored("alera.snapshot.v1", demoTime);
  const [session, setSession] = useStored<string | null>(
    "alera.session.v1",
    null,
  );
  const [config, setConfig] = useStored("alera.config.v1", {
    staleMinutes: 60,
  });
  const user = users.find((u) => u.id === session && u.active);
  const [page, setPage] = useState("Monitoring");
  const [onboarding, setOnboarding] = useState(false);
  const [scope, setScope] = useState("Pos Saya");
  const [types, setTypes] = useState(["AWLR", "ARR", "CCTV"]);
  const [satellite, setSatellite] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [opened, setOpened] = useState<string | null>(null);
  const [modal, setModal] = useState<
    "review" | "editor" | "detail" | "help" | null
  >(null);
  const [explanation, setExplanation] = useState(false);
  const [messageId, setMessageId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [chat, setChat] = useState<
    {
      role: string;
      text: string;
    }[]
  >([]);
  const [question, setQuestion] = useState("");
  const [adminTab, setAdminTab] = useState("Relawan");
  const [register, setRegister] = useState(false);
  useEffect(() => {
    if (!opened && !modal) return;
    const previous = document.activeElement as HTMLElement;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const focusable = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input, select, textarea, summary, [tabindex="0"]',
        ) || [],
      );
    focusable()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpened(null);
        setModal(null);
      }
      if (e.key === "Tab") {
        const nodes = focusable();
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [opened, modal]);
  const post = posts.find((p) => p.id === opened);
  const message = messages.find((m) => m.id === messageId);
  const chosen = posts.filter((p) => selected.includes(p.id));
  const log = (
    action: string,
    content = "",
    ids = selected,
    confirmedAt?: string,
  ) => {
    if (user)
      setActivities((a) => [
        {
          id: uid(),
          userId: user.id,
          user: user.name,
          village: user.village,
          action,
          posts: posts
            .filter((p) => ids.includes(p.id))
            .map((p) => p.type + " " + p.name),
          message: content,
          at: new Date().toISOString(),
          confirmedAt,
        },
        ...a,
      ]);
  };
  const updateUser = (patch: Partial<User>) =>
    setUsers((us) =>
      us.map((u) => (u.id === user?.id ? { ...u, ...patch } : u)),
    );
  const openPost = useCallback((id: string) => {
    setOpened(id);
    setExplanation(false);
  }, []);
  const toggleSelection = (id: string) => {
    const ids = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    setSelected(ids);
    log("Pilihan informasi diubah", "", ids);
  };
  const generate = () => {
    const content = draft(chosen, at);
    const m: Message = {
      id: uid(),
      userId: user!.id,
      village: user!.village,
      generated: content,
      final: content,
      postIds: [...selected],
      sources: chosen.map((p) => ({
        post: { ...p },
        observedAt: observedAt(p, at),
        value: value(p, at),
        forecast: forecast(p, at),
      })),
      status: "Draft",
      createdAt: new Date().toISOString(),
    };
    setMessages((ms) => [m, ...ms]);
    setMessageId(m.id);
    log("Draf simulasi AI dibuat", content);
    setModal("editor");
    setOpened(null);
  };
  const patchMessage = (patch: Partial<Message>) =>
    setMessages((ms) =>
      ms.map((m) => (m.id === messageId ? { ...m, ...patch } : m)),
    );
  const share = () => {
    if (!message) return;
    window.open(
      "https://wa.me/?text=" + encodeURIComponent(message.final),
      "_blank",
      "noopener,noreferrer",
    );
    patchMessage({ status: "WhatsApp Handoff" });
    log("WhatsApp dibuka", message.final, message.postIds);
  };
  const ask = (q: string) => {
    if (!q.trim()) return;
    const tokens = q
      .toLowerCase()
      .split(/\W+/)
      .filter((t) => t.length > 3);
    const relevant = knowledge
      .filter((k) => k.enabled)
      .map((k) => ({
        k,
        score: tokens.filter((t) =>
          (k.title + " " + k.text).toLowerCase().includes(t),
        ).length,
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);
    setChat((c) => [
      ...c,
      { role: "Anda", text: q },
      {
        role: "Asisten · simulasi",
        text: relevant.length
          ? relevant
              .map(({ k }) => k.text + "\nSumber: " + k.title)
              .join("\n\n")
          : "Belum ada rujukan yang sesuai dalam basis pengetahuan aktif. Hubungi koordinator Jaga Balai Majalaya. Saya tidak dapat menyimpulkan kondisi lapangan tanpa data.",
      },
    ]);
    setQuestion("");
  };
  const preferences = (
    <div className="choice-list">
      {posts.map((p) => (
        <label key={p.id}>
          <input
            type="checkbox"
            checked={user?.preferences.includes(p.id) || false}
            onChange={() =>
              updateUser({
                preferences: user!.preferences.includes(p.id)
                  ? user!.preferences.filter((x) => x !== p.id)
                  : [...user!.preferences, p.id],
              })
            }
          />
          <span>
            <strong>
              {p.type} {p.name}
            </strong>
            <small>
              {p.source} · {status(p, at)}
            </small>
          </span>
        </label>
      ))}
    </div>
  );
  if (!user)
    return (
      <div className="login">
        <section className="login-story">
          <div className="brand">
            <Waves /> ALERA<span>FI</span>
          </div>
          <span className="eyebrow">JAGA BALAI MAJALAYA</span>
          <h1>
            Pahami kondisi.
            <br />
            Sampaikan dengan
            <br />
            <em>kepedulian.</em>
          </h1>
          <p>
            Pemantauan air dan hujan, dalam satu ruang kerja untuk relawan desa.
          </p>
          <div className="login-wave">
            <Waves size={150} />
          </div>
          <small>MAJALAYA, KABUPATEN BANDUNG</small>
        </section>
        <section className="login-form">
          <span className="badge">PROTOTIPE INTERAKTIF</span>
          <h2>
            {register ? "Mulai sebagai relawan" : "Selamat datang kembali"}
          </h2>
          <p>
            Seluruh data dan bantuan AI adalah simulasi. Akun demo tersimpan
            hanya di browser ini.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              if (register) {
                const email = String(f.get("email")).trim();
                if (users.some((u) => u.email === email)) {
                  setNotice(
                    "Email sudah digunakan. Pilih akun demo yang tersedia.",
                  );
                  return;
                }
                const u: User = {
                  id: uid(),
                  name: String(f.get("name")),
                  email,
                  village: String(f.get("village")),
                  role: "Volunteer",
                  active: true,
                  preferences: [],
                };
                setUsers((us) => [...us, u]);
                setSession(u.id);
                setOnboarding(true);
              } else {
                setSession(String(f.get("account")));
                setOnboarding(false);
              }
              setNotice("");
              setPage("Monitoring");
            }}
          >
            {register ? (
              <>
                <label>
                  Nama
                  <input name="name" required />
                </label>
                <label>
                  Email
                  <input name="email" type="email" required />
                </label>
                <label>
                  Desa
                  <select name="village">
                    {villages.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
              </>
            ) : (
              <label>
                Akun demonstrasi
                <select name="account">
                  {users
                    .filter((u) => u.active)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} · {u.role}
                      </option>
                    ))}
                </select>
              </label>
            )}
            <button className="primary" type="submit">
              {register ? "Lanjut pilih pos" : "Masuk ke ruang monitoring"}{" "}
              <ArrowUpRight size={18} />
            </button>
          </form>
          <button
            className="text-button"
            onClick={() => setRegister(!register)}
          >
            {register ? "Kembali ke akun demo" : "Buat akun relawan demo"}
          </button>
          {notice && <p role="alert">{notice}</p>}
          <small>Login ini hanya simulasi, bukan autentikasi produksi.</small>
        </section>
      </div>
    );
  if (onboarding)
    return (
      <main className="onboarding">
        <div className="brand">
          <Waves /> ALERA FI
        </div>
        <span className="eyebrow">PENGATURAN AWAL · 2 DARI 2</span>
        <h1>Pos mana yang ingin Anda pantau?</h1>
        <p>
          Pilih pos yang relevan. Pilihan tidak dibatasi oleh desa dan dapat
          diubah kapan saja.
        </p>
        {preferences}
        <button
          className="primary"
          disabled={!user.preferences.length}
          onClick={() => setOnboarding(false)}
        >
          Mulai monitoring <ArrowUpRight size={18} />
        </button>
      </main>
    );
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <Waves /> ALERA<span>FI</span>
        </div>
        <div className="workspace">
          <span className="eyebrow">RUANG OPERASIONAL</span>
          <strong>Majalaya</strong>
          <small>Jaga Balai Majalaya</small>
        </div>
        <nav>
          {[
            ["Monitoring", MapPinned],
            ["Activity", ActivityIcon],
            ["AI Assistant", MessagesSquare],
            ["Account", UserRound],
            ...(user.role === "Admin" ? [["Admin", Shield]] : []),
          ].map(([name, Icon]) => {
            const I = Icon as typeof MapPinned;
            return (
              <button
                key={String(name)}
                className={page === name ? "active" : ""}
                onClick={() => {
                  setPage(String(name));
                  setOpened(null);
                  setModal(null);
                }}
              >
                <I size={20} />
                <span>{String(name)}</span>
                {page === name && <ChevronRight size={16} />}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="avatar">{user.name.slice(0, 1)}</div>
          <div>
            <strong>{user.name}</strong>
            <small>
              {user.role} · {user.village}
            </small>
          </div>
          <button
            aria-label="Keluar"
            onClick={() => {
              setSession(null);
              setSelected([]);
              setModal(null);
              setOpened(null);
              setChat([]);
            }}
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <div className="workspace-main">
        <header>
          <div>
            <span className="eyebrow">ALERA-FI / {page.toUpperCase()}</span>
            <h1>
              {page === "Monitoring"
                ? "Ruang monitoring"
                : page === "Activity"
                  ? "Catatan aktivitas"
                  : page === "AI Assistant"
                    ? "Asisten relawan"
                    : page === "Account"
                      ? "Pengaturan akun"
                      : "Administrasi"}
            </h1>
          </div>
          <span className="badge">DATA SIMULASI</span>
        </header>
        <div className="demo-bar">
          <Info size={15} />
          <span>
            Prototipe demonstrasi · Snapshot {time(at)} · Bukan data operasional
          </span>
        </div>
        {page === "Monitoring" && (
          <main className="monitoring">
            <div className="monitor-intro">
              <div>
                <h2>Situasi di sekitar kita</h2>
                <p>Pantau kondisi, pahami perubahan, bagikan informasi.</p>
              </div>
              <button onClick={() => setModal("help")}>
                <Info size={16} /> Panduan istilah
              </button>
            </div>
            <div className="summary-grid">
              <div>
                <span>
                  <Waves size={17} /> Tinggi muka air
                </span>
                <strong>
                  {posts.filter((p) => p.type === "AWLR").length}{" "}
                  <small>pos pemantauan</small>
                </strong>
              </div>
              <div>
                <span>
                  <Droplets size={17} /> Curah hujan
                </span>
                <strong>
                  {posts.filter((p) => p.type === "ARR").length}{" "}
                  <small>pos pemantauan</small>
                </strong>
              </div>
              <div>
                <span>
                  <Camera size={17} /> Kondisi visual
                </span>
                <strong>
                  {posts.filter((p) => p.type === "CCTV").length}{" "}
                  <small>sumber CCTV</small>
                </strong>
              </div>
            </div>
            <section className="map-panel">
              <div className="map-toolbar">
                <div className="segmented">
                  {["Pos Saya", "Semua Pos"].map((s) => (
                    <button
                      className={scope === s ? "active" : ""}
                      key={s}
                      onClick={() => setScope(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="filters">
                  {["AWLR", "ARR", "CCTV"].map((t) => (
                    <label key={t}>
                      <input
                        type="checkbox"
                        checked={types.includes(t)}
                        onChange={() =>
                          setTypes((ts) =>
                            ts.includes(t)
                              ? ts.filter((x) => x !== t)
                              : [...ts, t],
                          )
                        }
                      />
                      {t}
                    </label>
                  ))}
                  <button
                    className={satellite ? "active" : ""}
                    onClick={() => setSatellite(!satellite)}
                  >
                    <Layers size={15} /> Satelit
                  </button>
                </div>
              </div>
              <MonitoringMap
                posts={posts.filter(
                  (p) =>
                    (scope === "Semua Pos" ||
                      user.preferences.includes(p.id)) &&
                    types.includes(p.type),
                )}
                selected={selected}
                at={at}
                onOpen={openPost}
              />
              <div className="map-label">
                KECAMATAN MAJALAYA <span>Jawa Barat</span>
              </div>
              {satellite && (
                <div className="satellite-note">
                  <strong>Konteks satelit</strong>
                  <p>
                    Data satelit belum tersedia dalam prototipe ini. Tidak ada
                    citra aktual yang ditampilkan.
                  </p>
                </div>
              )}
              <div className="map-legend">
                <span>● Normal</span>
                <span>● Perlu perhatian</span>
                <span>● Lama / tidak tersedia</span>
              </div>
            </section>
            <div className="section-heading">
              <h3>Pos pemantauan</h3>
              <small>Ketuk pos untuk melihat konteks</small>
            </div>
            <div className="post-grid">
              {posts
                .filter(
                  (p) =>
                    (scope === "Semua Pos" ||
                      user.preferences.includes(p.id)) &&
                    types.includes(p.type),
                )
                .map((p) => (
                  <button
                    key={p.id}
                    className={
                      "post-card " + (selected.includes(p.id) ? "chosen" : "")
                    }
                    onClick={() => openPost(p.id)}
                  >
                    <div>
                      <span className="type-label">{p.type}</span>
                      {selected.includes(p.id) && <Check size={17} />}
                    </div>
                    <h3>{p.name}</h3>
                    <strong>
                      {value(p, at)?.toFixed(p.type === "AWLR" ? 2 : 0) ?? "—"}{" "}
                      <small>{p.unit}</small>
                    </strong>
                    <span
                      className={
                        "status " + (p.availability !== "active" ? "muted" : "")
                      }
                    >
                      {status(p, at)}
                    </span>
                    <small>
                      {p.availability === "unavailable"
                        ? "Belum ada pengamatan"
                        : time(observedAt(p, at))}
                    </small>
                  </button>
                ))}
            </div>
            {!posts.some(
              (p) =>
                (scope === "Semua Pos" || user.preferences.includes(p.id)) &&
                types.includes(p.type),
            ) && (
              <div className="empty">
                Tidak ada pos pada filter ini. Buka Semua Pos atau ubah
                preferensi di Account.
              </div>
            )}
          </main>
        )}
        {page === "Activity" && (
          <main className="content">
            <h2>
              {user.role === "Admin"
                ? "Aktivitas seluruh relawan"
                : "Aktivitas Anda"}
            </h2>
            <p>
              Konfirmasi pengiriman berasal dari relawan, bukan bukti pesan
              diterima WhatsApp.
            </p>
            {messages
              .filter(
                (m) => m.userId === user.id && m.status !== "Confirmed Sent",
              )
              .map((m) => (
                <button
                  className="resume"
                  key={m.id}
                  onClick={() => {
                    setMessageId(m.id);
                    setSelected(m.postIds);
                    setModal("editor");
                  }}
                >
                  Lanjutkan pesan · {m.status} <ChevronRight size={18} />
                </button>
              ))}
            {!activities.some(
              (a) => user.role === "Admin" || a.userId === user.id,
            ) && (
              <div className="empty">
                Belum ada aktivitas. Pilih pos pada peta untuk mulai.
              </div>
            )}
            {activities
              .filter((a) => user.role === "Admin" || a.userId === user.id)
              .map((a) => (
                <article className="activity-card" key={a.id}>
                  <span className="timeline-dot" />
                  <div>
                    <small>{time(a.at)}</small>
                    <h3>{a.action}</h3>
                    <p>
                      {a.user} · {a.village}
                    </p>
                    <small>{a.posts.join(" · ")}</small>
                    {a.message && (
                      <details>
                        <summary>Lihat isi pesan</summary>
                        <p className="prewrap">{a.message}</p>
                      </details>
                    )}
                    {a.confirmedAt && (
                      <span className="status">
                        Dikonfirmasi relawan · {time(a.confirmedAt)}
                      </span>
                    )}
                  </div>
                </article>
              ))}
          </main>
        )}
        {page === "AI Assistant" && (
          <main className="content chat">
            <div className="assistant-intro">
              <MessagesSquare size={32} />
              <h2>Apa yang ingin Anda pahami?</h2>
              <p>
                Penjelasan sederhana dari basis pengetahuan yang dikelola Admin.
              </p>
              <span className="badge">
                Respons simulasi berbasis pencarian referensi
              </span>
            </div>
            <div className="suggestions">
              {[
                "Apa itu AWLR?",
                "Bagaimana membaca prakiraan?",
                "Bagaimana memilih pos?",
              ].map((q) => (
                <button key={q} onClick={() => ask(q)}>
                  {q}
                  <ArrowUpRight size={16} />
                </button>
              ))}
            </div>
            {chat.map((c, i) => (
              <article
                key={i}
                className={"chat-message " + (c.role === "Anda" ? "mine" : "")}
              >
                <small>{c.role}</small>
                <p className="prewrap">{c.text}</p>
              </article>
            ))}
            <form
              className="chat-input"
              onSubmit={(e) => {
                e.preventDefault();
                ask(question);
              }}
            >
              <input
                aria-label="Pertanyaan untuk asisten"
                placeholder="Tanyakan tentang data atau cara menggunakan ALERA-FI…"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
              <button
                className="primary"
                aria-label="Kirim pertanyaan"
                disabled={!question.trim()}
              >
                <Send size={18} />
              </button>
            </form>
          </main>
        )}
        {page === "Account" && (
          <main className="content account">
            <section className="panel">
              <h2>Profil relawan</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  updateUser({
                    name: String(f.get("name")),
                    village: String(f.get("village")),
                  });
                  setNotice("Profil disimpan.");
                }}
              >
                <label>
                  Nama
                  <input name="name" defaultValue={user.name} required />
                </label>
                <label>
                  Desa
                  <select name="village" defaultValue={user.village}>
                    {villages.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Informasi akun
                  <input readOnly value={user.email} />
                </label>
                <button className="primary">Simpan profil</button>
              </form>
            </section>
            <section className="panel">
              <h2>Preferensi monitoring</h2>
              <p>
                Tersimpan otomatis untuk Pos Saya. Semua pos tetap dapat
                diakses.
              </p>
              {preferences}
            </section>
            <button
              onClick={() => {
                setSession(null);
                setSelected([]);
                setModal(null);
                setOpened(null);
                setChat([]);
              }}
            >
              <LogOut size={16} /> Keluar dari akun demo
            </button>
          </main>
        )}
        {page === "Admin" && user.role === "Admin" && (
          <main className="content">
            <div className="tabs">
              {[
                "Relawan",
                "Desa",
                "Sumber monitoring",
                "Pengetahuan AI",
                "Konfigurasi",
              ].map((t) => (
                <button
                  className={adminTab === t ? "active" : ""}
                  key={t}
                  onClick={() => setAdminTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            {adminTab === "Relawan" && (
              <>
                <h2>Kelola relawan</h2>
                <form
                  className="panel admin-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    const email = String(f.get("email"));
                    if (users.some((u) => u.email === email)) {
                      setNotice("Email sudah digunakan.");
                      return;
                    }
                    setUsers((us) => [
                      ...us,
                      {
                        id: uid(),
                        name: String(f.get("name")),
                        email,
                        village: String(f.get("village")),
                        role: "Volunteer",
                        active: true,
                        preferences: [],
                      },
                    ]);
                    e.currentTarget.reset();
                    setNotice(
                      "Akun demo dibuat. Tidak ada undangan email yang dikirim.",
                    );
                  }}
                >
                  <label>
                    Nama
                    <input name="name" required />
                  </label>
                  <label>
                    Email
                    <input name="email" type="email" required />
                  </label>
                  <label>
                    Desa
                    <select name="village">
                      {villages.map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                  <button className="primary">
                    <Plus size={16} /> Buat relawan
                  </button>
                </form>
                {users
                  .filter((u) => u.role === "Volunteer")
                  .map((u) => (
                    <article className="panel management-row" key={u.id}>
                      <div>
                        <h3>{u.name}</h3>
                        <small>
                          {u.email} · {u.active ? "Aktif" : "Nonaktif"}
                        </small>
                      </div>
                      <select
                        aria-label={"Desa " + u.name}
                        value={u.village}
                        onChange={(e) =>
                          setUsers((us) =>
                            us.map((x) =>
                              x.id === u.id
                                ? { ...x, village: e.target.value }
                                : x,
                            ),
                          )
                        }
                      >
                        {villages.map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                      <button
                        onClick={() =>
                          setUsers((us) =>
                            us.map((x) =>
                              x.id === u.id ? { ...x, active: !x.active } : x,
                            ),
                          )
                        }
                      >
                        {u.active ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </article>
                  ))}
              </>
            )}
            {adminTab === "Desa" && (
              <>
                <h2>Desa operasional</h2>
                <form
                  className="inline-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    const v = String(f.get("name")).trim();
                    if (v && !villages.includes(v))
                      setVillages((vs) => [...vs, v]);
                    e.currentTarget.reset();
                  }}
                >
                  <input
                    name="name"
                    aria-label="Nama desa"
                    placeholder="Nama desa"
                    required
                  />
                  <button className="primary">Tambah desa</button>
                </form>
                {villages.map((v) => (
                  <div className="panel management-row" key={v}>
                    <strong>{v}</strong>
                    <button
                      disabled={users.some((u) => u.village === v)}
                      onClick={() =>
                        setVillages((vs) => vs.filter((x) => x !== v))
                      }
                    >
                      Hapus
                    </button>
                    {users.some((u) => u.village === v) && (
                      <small>Digunakan akun</small>
                    )}
                  </div>
                ))}
              </>
            )}
            {adminTab === "Sumber monitoring" && (
              <>
                <h2>Sumber monitoring</h2>
                <p>
                  Ambang batas demonstrasi, belum terverifikasi untuk penggunaan
                  operasional.
                </p>
                <button
                  onClick={() =>
                    setPosts((ps) => [
                      ...ps,
                      {
                        id: uid(),
                        name: "Pos baru",
                        type: "AWLR",
                        lat: -7.06,
                        lng: 107.76,
                        source: "Simulasi",
                        unit: "m",
                        availability: "unavailable",
                        threshold: 3,
                        forecast: false,
                      },
                    ])
                  }
                >
                  <Plus size={16} /> Tambah pos
                </button>
                {posts.map((p) => (
                  <form
                    className="panel source-form"
                    key={p.id}
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      setPosts((ps) =>
                        ps.map((x) =>
                          x.id === p.id
                            ? {
                                ...x,
                                name: String(f.get("name")),
                                type: f.get("type") as Post["type"],
                                source: String(f.get("source")),
                                unit: String(f.get("unit")),
                                lat: Number(f.get("lat")),
                                lng: Number(f.get("lng")),
                                threshold: Number(f.get("threshold")),
                                availability: f.get(
                                  "availability",
                                ) as Post["availability"],
                                forecast: f.get("forecast") === "on",
                              }
                            : x,
                        ),
                      );
                      setNotice("Sumber monitoring disimpan.");
                    }}
                  >
                    <small>ID: {p.id}</small>
                    <div className="form-grid">
                      <label>
                        Nama
                        <input name="name" defaultValue={p.name} required />
                      </label>
                      <label>
                        Tipe
                        <select name="type" defaultValue={p.type}>
                          {["AWLR", "ARR", "CCTV"].map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Lintang
                        <input
                          name="lat"
                          type="number"
                          step="any"
                          min="-90"
                          max="90"
                          defaultValue={p.lat}
                          required
                        />
                      </label>
                      <label>
                        Bujur
                        <input
                          name="lng"
                          type="number"
                          step="any"
                          min="-180"
                          max="180"
                          defaultValue={p.lng}
                          required
                        />
                      </label>
                      <label>
                        Sumber
                        <input name="source" defaultValue={p.source} required />
                      </label>
                      <label>
                        Satuan
                        <input name="unit" defaultValue={p.unit} />
                      </label>
                      <label>
                        Ambang perhatian
                        <input
                          name="threshold"
                          type="number"
                          step="any"
                          defaultValue={p.threshold}
                          required
                        />
                      </label>
                      <label>
                        Ketersediaan
                        <select
                          name="availability"
                          defaultValue={p.availability}
                        >
                          <option value="active">Aktif</option>
                          <option value="stale">Data lama</option>
                          <option value="unavailable">Tidak tersedia</option>
                        </select>
                      </label>
                    </div>
                    <label className="check-label">
                      <input
                        type="checkbox"
                        name="forecast"
                        defaultChecked={p.forecast}
                      />{" "}
                      Prakiraan tersedia (AWLR)
                    </label>
                    <div className="actions">
                      <button className="primary">Simpan pos</button>
                      <button
                        type="button"
                        onClick={() => {
                          setPosts((ps) => ps.filter((x) => x.id !== p.id));
                          setSelected((s) => s.filter((x) => x !== p.id));
                          setUsers((us) =>
                            us.map((u) => ({
                              ...u,
                              preferences: u.preferences.filter(
                                (x) => x !== p.id,
                              ),
                            })),
                          );
                        }}
                      >
                        Hapus pos
                      </button>
                    </div>
                  </form>
                ))}
              </>
            )}
            {adminTab === "Pengetahuan AI" && (
              <>
                <h2>Basis pengetahuan AI</h2>
                <p>Materi aktif menjadi rujukan respons asisten simulasi.</p>
                <button
                  onClick={() =>
                    setKnowledge((ks) => [
                      ...ks,
                      {
                        id: uid(),
                        title: "Materi baru",
                        text: "",
                        enabled: false,
                      },
                    ])
                  }
                >
                  <Plus size={16} /> Tambah materi
                </button>
                {knowledge.map((k) => (
                  <form
                    key={k.id}
                    className="panel"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      setKnowledge((ks) =>
                        ks.map((x) =>
                          x.id === k.id
                            ? {
                                ...x,
                                title: String(f.get("title")),
                                text: String(f.get("text")),
                                enabled: f.get("enabled") === "on",
                              }
                            : x,
                        ),
                      );
                      setNotice("Pengetahuan disimpan.");
                    }}
                  >
                    <label>
                      Judul
                      <input name="title" defaultValue={k.title} required />
                    </label>
                    <label>
                      Materi
                      <textarea
                        name="text"
                        defaultValue={k.text}
                        required
                        rows={4}
                      />
                    </label>
                    <label className="check-label">
                      <input
                        name="enabled"
                        type="checkbox"
                        defaultChecked={k.enabled}
                      />{" "}
                      Aktif sebagai rujukan
                    </label>
                    <div className="actions">
                      <button className="primary">Simpan materi</button>
                      <button
                        type="button"
                        onClick={() =>
                          setKnowledge((ks) => ks.filter((x) => x.id !== k.id))
                        }
                      >
                        Hapus
                      </button>
                    </div>
                  </form>
                ))}
              </>
            )}
            {adminTab === "Konfigurasi" && (
              <section className="panel">
                <h2>Konfigurasi demonstrasi</h2>
                <label>
                  Batas usia data (menit)
                  <input
                    type="number"
                    min="1"
                    value={config.staleMinutes}
                    onChange={(e) =>
                      setConfig({
                        staleMinutes: Math.max(1, Number(e.target.value)),
                      })
                    }
                  />
                </label>
                <p>
                  Digunakan pada keterangan usia snapshot. Ambang operasional,
                  polling, model prakiraan, dan penyedia AI belum ditetapkan.
                </p>
                <p>
                  Snapshot{" "}
                  {Date.now() - Date.parse(at) > config.staleMinutes * 60000
                    ? "melewati batas usia konfigurasi"
                    : "masih dalam batas usia konfigurasi"}
                  ; seluruh data tetap simulasi.
                </p>
              </section>
            )}
          </main>
        )}
        {selected.length > 0 && page === "Monitoring" && !modal && (
          <div className="selection-tray">
            <div>
              <strong>{selected.length} informasi dipilih</strong>
              <small>Anda memegang kendali atas pesan.</small>
            </div>
            <button
              onClick={() => {
                setOpened(null);
                setModal("review");
              }}
            >
              Lihat Pilihan
            </button>
            <button
              className="primary"
              onClick={() => {
                setOpened(null);
                setModal("review");
              }}
            >
              Buat Informasi untuk Warga <ArrowUpRight size={17} />
            </button>
          </div>
        )}
      </div>
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button aria-label="Tutup notifikasi" onClick={() => setNotice("")}>
            <X size={16} />
          </button>
        </div>
      )}
      {post && !modal && (
        <div className="sheet-backdrop" onClick={() => setOpened(null)}>
          <section
            className="bottom-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={"Kondisi " + post.name}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-handle" />
            <button
              className="close"
              aria-label="Tutup kondisi"
              onClick={() => setOpened(null)}
            >
              <X />
            </button>
            <span className="eyebrow">{post.type} · PEMANTAUAN SIMULASI</span>
            <h2>{post.name}</h2>
            <span className="status">{status(post, at)}</span>
            <p className="measurement">
              {value(post, at)?.toFixed(post.type === "AWLR" ? 2 : 0) ?? "—"}{" "}
              <small>{post.unit}</small>
            </p>
            <small>
              {post.availability === "unavailable"
                ? "Sumber belum tersedia"
                : `Pengamatan: ${time(observedAt(post, at))}`}
            </small>
            {post.availability === "stale" && (
              <p className="warning">
                Data lama — tidak menunjukkan kondisi saat ini.
              </p>
            )}
            {post.type === "AWLR" && post.availability === "active" && (
              <>
                <div className="context-box">
                  <span>PERUBAHAN 2 JAM TERAKHIR</span>
                  <strong>↗ +{recentChange(post, at)} cm</strong>
                  <small>
                    Tren meningkat sejak {time(observations(post, at)[0].at)}
                  </small>
                </div>
                {forecast(post, at).length > 0 && (
                  <>
                    <h3>Prakiraan tinggi air</h3>
                    <div className="forecast-grid">
                      {forecast(post, at).map((v, i) => (
                        <div key={i}>
                          <small>+{i + 2} jam</small>
                          <strong>{v.toFixed(2)} m</strong>
                          <small>
                            {v >= post.threshold ? "Waspada" : "Normal"}
                          </small>
                        </div>
                      ))}
                    </div>
                    <small>
                      Simulasi prakiraan, bukan pengamatan saat ini.
                    </small>
                  </>
                )}
              </>
            )}
            {post.type === "ARR" && post.availability === "active" && (
              <>
                <h3>Akumulasi hujan</h3>
                <div className="forecast-grid">
                  {[1, 3, 6].map((h) => (
                    <div key={h}>
                      <small>{h} jam</small>
                      <strong>{accumulation(post, at, h)} mm</strong>
                    </div>
                  ))}
                </div>
                <p>
                  Hujan tercatat sepanjang 6 jam pengamatan. Intensitas terbaru
                  menurun dibanding 15 menit sebelumnya.
                </p>
                <small>Total dari pengamatan per 15 menit.</small>
              </>
            )}
            {post.type === "CCTV" && (
              <div className="empty">
                <Camera />
                <p>Feed belum tersedia</p>
                <small>
                  {post.lat}, {post.lng} · Bukan penentu status otomatis.
                </small>
              </div>
            )}
            <div className="sheet-links">
              <button onClick={() => setModal("detail")}>
                Lihat Detail <ChevronRight size={16} />
              </button>
              <button onClick={() => setExplanation(!explanation)}>
                Jelaskan kondisi ini <MessagesSquare size={16} />
              </button>
            </div>
            {explanation && (
              <div className="context-box">
                <small>Penjelasan AI · simulasi</small>
                <p>{explain(post, at)}</p>
              </div>
            )}
            <button
              className="primary full"
              onClick={() => toggleSelection(post.id)}
            >
              {selected.includes(post.id) ? (
                <Check size={17} />
              ) : (
                <Plus size={17} />
              )}{" "}
              {selected.includes(post.id)
                ? "Dipilih · hapus dari pilihan"
                : "Pilih untuk Informasi"}
            </button>
          </section>
        </div>
      )}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={
              modal === "editor" ? "Editor pesan" : "Informasi monitoring"
            }
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close"
              aria-label="Tutup dialog"
              onClick={() => setModal(null)}
            >
              <X />
            </button>
            {modal === "help" && (
              <>
                <span className="eyebrow">PANDUAN SINGKAT</span>
                <h2>Memahami data monitoring</h2>
                <p>{glossary}</p>
                <p>
                  Pilih pos untuk memahami kondisi saat ini, konteks historis,
                  dan prakiraan. Anda menentukan apakah informasi layak
                  dibagikan.
                </p>
              </>
            )}
            {modal === "detail" && post && (
              <>
                <span className="eyebrow">DETAIL POS · {post.type}</span>
                <h2>{post.name}</h2>
                <p>{explain(post, at)}</p>
                <dl>
                  <dt>Sumber</dt>
                  <dd>{post.source}</dd>
                  <dt>Lokasi</dt>
                  <dd>
                    {post.lat}, {post.lng}
                  </dd>
                  <dt>Pengamatan terakhir</dt>
                  <dd>
                    {post.availability === "unavailable"
                      ? "Tidak tersedia"
                      : time(observedAt(post, at))}
                  </dd>
                  <dt>Ambang demonstrasi</dt>
                  <dd>
                    {post.threshold} {post.unit}
                  </dd>
                </dl>
                {post.type !== "CCTV" &&
                  post.availability !== "unavailable" && (
                    <>
                      <h3>Riwayat 6 jam · {post.unit}</h3>
                      <svg
                        className="history-chart"
                        viewBox="0 0 600 150"
                        role="img"
                        aria-label="Grafik historis enam jam"
                      >
                        <path d="M 15 135 H 590" stroke="#D9E0DE" />
                        <polyline
                          fill="none"
                          stroke="#178C8C"
                          strokeWidth="3"
                          points={observations(post, at)
                            .map(
                              (o, i) =>
                                `${15 + i * 24},${135 - (o.value / (post.type === "AWLR" ? 5 : 40)) * 120}`,
                            )
                            .join(" ")}
                        />
                      </svg>
                      <details>
                        <summary>Lihat pengamatan bertimestamp</summary>
                        <table>
                          <thead>
                            <tr>
                              <th>Waktu</th>
                              <th>{post.unit}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {observations(post, observedAt(post, at)).map(
                              (o) => (
                                <tr key={o.at}>
                                  <td>{time(o.at)}</td>
                                  <td>{o.value.toFixed(2)}</td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </details>
                      {forecast(post, at).length > 0 && (
                        <>
                          <h3>Prakiraan · dibuat {time(at)}</h3>
                          {forecast(post, at).map((v, i) => (
                            <p key={i}>
                              +{i + 2} jam (
                              {time(
                                new Date(
                                  Date.parse(at) + (i + 2) * 3600000,
                                ).toISOString(),
                              )}
                              ): {v.toFixed(2)} m ·{" "}
                              {v >= post.threshold ? "Waspada" : "Normal"}
                            </p>
                          ))}
                        </>
                      )}
                    </>
                  )}
                <button onClick={() => setModal(null)}>
                  Kembali ke kondisi pos
                </button>
              </>
            )}
            {modal === "review" && (
              <>
                <span className="eyebrow">01 / TINJAU SUMBER</span>
                <h2>Informasi untuk warga</h2>
                <p>
                  Seluruh konteks pos disertakan: pengamatan, tren, dan
                  prakiraan jika tersedia.
                </p>
                {chosen.map((p) => (
                  <article className="review-item" key={p.id}>
                    <div>
                      <h3>
                        {p.type} {p.name}
                      </h3>
                      <p>{explain(p, at)}</p>
                    </div>
                    <button
                      aria-label={"Hapus " + p.name}
                      onClick={() => toggleSelection(p.id)}
                    >
                      <X size={17} />
                    </button>
                  </article>
                ))}
                {!chosen.length && <p>Belum ada pos dipilih.</p>}
                <div className="actions">
                  <button onClick={() => setModal(null)}>
                    Lanjut pilih pos
                  </button>
                  <button
                    className="primary"
                    disabled={!chosen.length}
                    onClick={generate}
                  >
                    Buat draf AI <ArrowUpRight size={16} />
                  </button>
                </div>
                <small>
                  Draf dibuat oleh simulator lokal, bukan model AI langsung.
                </small>
              </>
            )}
            {modal === "editor" && message && (
              <>
                <span className="eyebrow">02 / TINJAU & BAGIKAN</span>
                <h2>Pesan untuk warga</h2>
                <span className="badge">{message.status}</span>
                <label>
                  Draf pesan
                  <textarea
                    rows={12}
                    value={message.final}
                    readOnly={message.status === "Confirmed Sent"}
                    onChange={(e) =>
                      patchMessage({ final: e.target.value, status: "Draft" })
                    }
                    onBlur={() => {
                      if (message.final !== message.generated)
                        log("Pesan diedit", message.final, message.postIds);
                    }}
                  />
                </label>
                <details>
                  <summary>
                    Data pendukung ({message.sources.length} pos)
                  </summary>
                  {message.sources.map((s) => (
                    <p key={s.post.id}>
                      <strong>
                        {s.post.type} {s.post.name}
                      </strong>
                      <br />
                      {s.value ?? "Tidak tersedia"} {s.post.unit} ·{" "}
                      {time(s.observedAt)}
                      <br />
                      {s.forecast.length > 0 &&
                        `Prakiraan +2 / +3 / +4 jam: ${s.forecast.map((v) => v.toFixed(2) + " m").join(" / ")}`}
                    </p>
                  ))}
                </details>
                {message.status === "Draft" && (
                  <>
                    <p>
                      Tinjau lokasi, waktu, dan isi pesan sebelum melanjutkan.
                    </p>
                    <div className="actions">
                      <button
                        onClick={() => {
                          setSelected(
                            message.postIds.filter((id) =>
                              posts.some((p) => p.id === id),
                            ),
                          );
                          setModal("review");
                        }}
                      >
                        Ubah data / buat ulang
                      </button>
                      <button
                        className="primary"
                        disabled={!message.final.trim()}
                        onClick={() => {
                          patchMessage({ status: "Ready to Share" });
                          log(
                            "Pesan siap dibagikan",
                            message.final,
                            message.postIds,
                          );
                        }}
                      >
                        Lanjut bagikan
                      </button>
                    </div>
                  </>
                )}
                {message.status === "Ready to Share" && (
                  <>
                    <p>
                      WhatsApp akan terbuka dengan pesan terisi. Pilih grup dan
                      tekan kirim sendiri.
                    </p>
                    <button className="primary full" onClick={share}>
                      Bagikan ke WhatsApp <ArrowUpRight size={17} />
                    </button>
                  </>
                )}
                {message.status === "WhatsApp Handoff" && (
                  <div className="context-box">
                    <h3>Apakah informasi sudah dikirim?</h3>
                    <p>Membuka WhatsApp tidak membuktikan pesan terkirim.</p>
                    <div className="actions">
                      <button
                        onClick={() =>
                          patchMessage({ status: "Ready to Share" })
                        }
                      >
                        Belum
                      </button>
                      <button
                        className="primary"
                        onClick={() => {
                          const confirmedAt = new Date().toISOString();
                          patchMessage({
                            status: "Confirmed Sent",
                            confirmedAt,
                          });
                          log(
                            "Dikonfirmasi terkirim oleh relawan",
                            message.final,
                            message.postIds,
                            confirmedAt,
                          );
                          setSelected([]);
                        }}
                      >
                        Ya, sudah dikirim
                      </button>
                    </div>
                  </div>
                )}
                {message.status === "Confirmed Sent" && (
                  <div className="context-box">
                    <Check />
                    <h3>Aktivitas disimpan</h3>
                    <p>
                      Dikonfirmasi oleh relawan pada{" "}
                      {time(message.confirmedAt!)}. Bukan konfirmasi penerimaan
                      WhatsApp.
                    </p>
                    <button
                      onClick={() => {
                        setModal(null);
                        setPage("Activity");
                      }}
                    >
                      Lihat aktivitas
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
