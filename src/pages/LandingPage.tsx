import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Droplets,
  Radio,
  MapPin,
  Bell,
  ShieldCheck,
  ArrowRight,
  Activity,
  User,
  Building2,
  type LucideIcon,
} from "lucide-react";
import bgImage from "@/assets/landing-bg.jpg";

type Feature = {
  icon: LucideIcon;
  title: string;
  desc: string;
  warga?: string;
  operator: string;
};

const features: Feature[] = [
  {
    icon: Radio,
    title: "Pemantauan telemetri",
    desc: "Data tinggi air dan curah hujan dari sensor ARR/AWLR di DAS Citarum, diperbarui tiap 10 menit.",
    warga: "Lihat status pos langganan di peta: aman, waspada, atau bahaya",
    operator: "Data tabel multi-pos, grafik tren, dan siapkan draf kewaspadaan",
  },
  {
    icon: MapPin,
    title: "Peta 3D Interaktif",
    desc: "Visualisasi topografi DAS Citarum dengan marker pos yang berubah warna sesuai kondisi terkini.",
    warga: "Lokasi rumah dan pos langganan Anda di satu peta",
    operator: "Semua pos di wilayah kelola dalam satu tampilan peta",
  },
  {
    icon: Bell,
    title: "Informasi Kewaspadaan",
    desc: "Notifikasi otomatis saat tingkat siaga pos berubah.",
    warga: "Informasi kewaspadaan ke Telegram pribadi (DM), disesuaikan profil risiko & lokasi rumah",
    operator: "Auto-alert ke grup Telegram + kirim broadcast manual dari dashboard",
  },
  {
    icon: ShieldCheck,
    title: "Laporan Banjir",
    desc: "Akun komunitas/instansi mencatat kondisi banjir di wilayah kelola untuk arsip dan dokumentasi.",
    operator: "Input lokasi, tingkat dampak, dan catatan — kelola riwayat laporan di dashboard",
  },
];

const stats = [
  { label: "Pos Pantau", value: "100+" },
  { label: "Langganan", value: "Gratis" },
  { label: "Update", value: "10 mnt" },
  { label: "Akses", value: "24/7" },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src={bgImage}
            alt="DAS Citarum"
            className="h-full w-full object-cover"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
        </div>

        {/* Top nav */}
        <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 backdrop-blur-lg bg-background/95 border-b border-border/50 shadow-sm">
          <Link to="/landing" className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center">
              <img src="/alera-logo.png" alt="AleraFI" className="h-10 w-10 object-contain" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight">AleraFI</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">To be safe, alert and aware</p>
            </div>
          </Link>
          <nav className="hidden gap-1 text-sm font-medium md:flex">
            <a href="#audience" className="px-4 py-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-all">Untuk Siapa</a>
            <a href="#features" className="px-4 py-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-all">Fitur</a>
            <a href="#how" className="px-4 py-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-all">Cara Kerja</a>
            <a href="#community" className="px-4 py-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-all">Daftar</a>
          </nav>
          <Link to="/auth?mode=login">
            <Button className="shadow-lg shadow-primary/30">Masuk</Button>
          </Link>
        </header>

        {/* Hero content */}
        <div className="relative z-10 mx-auto max-w-7xl px-6 pt-16 pb-20 md:px-12 md:pt-24 md:pb-24">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Sistem aktif memantau ARR dan AWLR di DAS Citarum
            </div>

            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              Pantau sungai Citarum, selamatkan keluarga Anda.
              <br />
            </h1>

            <p className="mt-3 text-xl font-semibold text-primary md:text-2xl">
              Sadar lebih cepat, bertindak lebih tepat!
            </p>

            <p className="mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
              Platform pemantauan hidrometeorologi dan informasi kewaspadaan banjir — memadukan data sensor
              telemetri, peta interaktif, dan jaringan informasi kewaspadaan banjir DAS Citarum untuk merespons lebih cepat
              dari air yang naik.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="h-12 px-6 text-base font-semibold shadow-lg shadow-primary/30 group">
                  Mulai Pantau
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <a href="#audience">
                <Button size="lg" variant="outline" className="h-12 px-6 text-base font-semibold bg-background/40 backdrop-blur">
                  Untuk Siapa?
                </Button>
              </a>
            </div>

            {/* Stats */}
            <dl className="mt-14 grid max-w-lg grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="bg-card/80 px-4 py-4 backdrop-blur">
                  <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</dt>
                  <dd className="mt-1 text-2xl font-bold tracking-tight text-primary">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Untuk Siapa */}
      <section id="audience" className="relative px-6 py-16 md:px-12 md:py-20 bg-muted/20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Untuk Siapa</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Dua cara pakai, satu sistem informasi kewaspadaan.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Warga mendapat informasi kewaspadaan secara personal. Operator mendapat dashboard lengkap untuk koordinasi.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-8 transition-all hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <User className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">Untuk Warga & Keluarga</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Pantau kondisi sungai di sekitar rumah Anda.
              </p>
              <ul className="mt-6 space-y-2.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  Daftar dengan lokasi rumah
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  Pilih pos pantau terdekat
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  Terima informasi kewaspadaan via Telegram
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  Pantau pos langganan di peta 3D
                </li>
              </ul>
              <Link to="/auth?mode=signup&role=citizen" className="mt-6 inline-block">
                <Button variant="outline" size="sm" className="group">
                  Daftar sebagai Warga
                  <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>

            <div className="rounded-2xl border border-border bg-card p-8 transition-all hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">Untuk Operator & Pengambil Keputusan</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Dashboard lengkap untuk operasional komunitas.
              </p>
              <ul className="mt-6 space-y-2.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  Pantau banyak pos sekaligus
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  Alert otomatis ke grup Telegram
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  Data tabel & siapkan draf broadcast
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  Catat laporan banjir di wilayah kelola
                </li>
              </ul>
              <Link to="/auth?mode=signup&role=community" className="mt-6 inline-block">
                <Button variant="outline" size="sm" className="group">
                  Daftar sebagai Komunitas
                  <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative px-6 py-16 md:px-12 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 max-w-2xl">
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Dirancang untuk komunitas yang hidup berdampingan dengan sungai.
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative flex flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
                  {f.warga ? (
                    <div className="flex items-start gap-2 text-[11px] leading-snug text-muted-foreground">
                      <User className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                      <span>
                        <span className="font-medium text-foreground">Warga:</span> {f.warga}
                      </span>
                    </div>
                  ) : null}
                  <div className="flex items-start gap-2 text-[11px] leading-snug text-muted-foreground">
                    <Building2 className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                    <span>
                      <span className="font-medium text-foreground">
                        {f.warga ? "Komunitas:" : "Hanya komunitas:"}
                      </span>{" "}
                      {f.operator}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative px-6 py-16 md:px-12 md:py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Cara Kerja</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Dari sensor di sungai, ke ponsel di tangan warga.
            </h2>
          </div>

          <ol className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Droplets,
                title: "1. Sensor Mengukur",
                desc: "Sensor yang tersebar di DAS Citarum membaca tinggi air dan curah hujan secara berkala.",
              },
              {
                icon: Activity,
                title: "2. Sistem mendeteksi",
                desc: "Sistem mendeteksi perubahan kondisi: aman, waspada, atau bahaya berdasarkan ambang batas.",
              },
              {
                icon: ShieldCheck,
                title: "3. Warga Diperingatkan",
                desc: "Notifikasi Telegram dikirim ke warga dan grup komunitas sebelum air sampai.",
              },
            ].map((s, i) => (
              <li key={i} className="relative">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section id="community" className="relative overflow-hidden px-6 py-16 md:px-12 md:py-20">
        <div className="mx-auto max-w-5xl rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-10 text-center shadow-2xl shadow-primary/10 md:p-16">
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            Jadi bagian dari sistem informasi kewaspadaan banjir DAS Citarum.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Warga mendapat informasi kewaspadaan secara personal. Operator mendapat dashboard lengkap untuk koordinasi.
            Pilih pos pantau Anda dan terima informasi yang relevan dengan lokasi Anda.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth?mode=signup">
              <Button size="lg" className="h-12 px-8 text-base font-semibold shadow-lg shadow-primary/30">
                Daftar Sekarang
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth?mode=login">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base font-semibold">
                Sudah punya akun
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-xs text-muted-foreground md:px-12">
        © 2026 AleraFI. Hydrometeorology Monitoring and Flood Alertness Information System.
      </footer>
    </div>
  );
};

export default LandingPage;
