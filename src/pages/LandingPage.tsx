import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Droplets, Radio, MapPin, Bell, ShieldCheck, ArrowRight, Activity, Users } from "lucide-react";
import bgImage from "@/assets/landing-bg.jpg";

const features = [
  {
    icon: Radio,
    title: "Pemantauan Real-Time",
    desc: "Data TMA & curah hujan dari pos sensor di sepanjang DAS Citarum, diperbarui tiap 10 menit.",
  },
  {
    icon: MapPin,
    title: "Peta 3D Interaktif",
    desc: "Visualisasi topografi Majalaya dengan marker pos yang berubah warna sesuai status terkini.",
  },
  {
    icon: Bell,
    title: "Peringatan Dini",
    desc: "Notifikasi otomatis ke Telegram saat status pos memasuki level Siaga atau Awas.",
  },
  {
    icon: Users,
    title: "Laporan Warga",
    desc: "Komunitas dapat melaporkan kondisi banjir lokal dengan timestamp & lokasi presisi.",
  },
];

const stats = [
  { label: "Pos Pantau", value: "12+" },
  { label: "Kecamatan", value: "5" },
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
            alt="Citarum river valley Majalaya"
            className="h-full w-full object-cover"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
        </div>

        {/* Top nav */}
        <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
          <Link to="/landing" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-black flex items-center justify-center shadow-lg ring-1 ring-primary/30">
              <img src="/alera-logo.png" alt="Alera FI" className="h-9 w-9 rounded-full object-cover" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight">Alera FI</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Flood Early Warning</p>
            </div>
          </Link>
          <nav className="hidden gap-8 text-sm font-medium md:flex">
            <a href="#features" className="hover:text-primary transition">Fitur</a>
            <a href="#how" className="hover:text-primary transition">Cara Kerja</a>
            <a href="#community" className="hover:text-primary transition">Komunitas</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" className="hidden sm:inline-flex">Masuk</Button>
            </Link>
            <Link to="/auth">
              <Button className="shadow-lg shadow-primary/30">Mulai Gratis</Button>
            </Link>
          </div>
        </header>

        {/* Hero content */}
        <div className="relative z-10 mx-auto max-w-7xl px-6 pt-16 pb-32 md:px-12 md:pt-28 md:pb-40">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Sistem aktif memantau DAS Citarum Hulu
            </div>

            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              Setiap menit
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-primary-glow bg-clip-text text-transparent">
                menyelamatkan Majalaya.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
              Platform peringatan dini banjir berbasis komunitas — memadukan data sensor real-time,
              peta 3D, dan jaringan warga PACU Majalaya untuk merespons lebih cepat dari air yang naik.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/auth">
                <Button size="lg" className="h-12 px-6 text-base font-semibold shadow-lg shadow-primary/30 group">
                  Mulai Pantau
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="h-12 px-6 text-base font-semibold bg-background/40 backdrop-blur">
                  Lihat Fitur
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

      {/* Features */}
      <section id="features" className="relative px-6 py-24 md:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Yang Kami Tawarkan</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Dirancang untuk komunitas yang hidup berdampingan dengan sungai.
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative px-6 py-24 md:px-12 bg-muted/30">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Cara Kerja</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Dari sensor di sungai, ke ponsel di tangan warga.
            </h2>
          </div>

          <ol className="grid gap-8 md:grid-cols-3">
            {[
              { icon: Droplets, title: "1. Sensor Mengukur", desc: "AWLR & ARR di hulu Citarum membaca TMA dan curah hujan tiap menit." },
              { icon: Activity, title: "2. Sistem Menganalisis", desc: "Algoritma menentukan status: Normal, Siaga, atau Awas berdasarkan ambang batas." },
              { icon: ShieldCheck, title: "3. Warga Diperingatkan", desc: "Notifikasi Telegram dikirim ke komunitas terdekat sebelum air sampai." },
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
      <section id="community" className="relative overflow-hidden px-6 py-24 md:px-12">
        <div className="mx-auto max-w-5xl rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-10 text-center shadow-2xl shadow-primary/10 md:p-16">
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            Jadi bagian dari jaring pengaman Majalaya.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Daftar sebagai individu atau komunitas. Pilih pos pantau Anda, dan terima peringatan
            yang relevan dengan lokasi Anda.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth">
              <Button size="lg" className="h-12 px-8 text-base font-semibold shadow-lg shadow-primary/30">
                Daftar Sekarang
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base font-semibold">
                Sudah punya akun
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-xs text-muted-foreground md:px-12">
        © 2026 Alera FI · Dibangun bersama komunitas PACU Majalaya
      </footer>
    </div>
  );
};

export default LandingPage;
