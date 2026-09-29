export type Post = {
  id: string;
  name: string;
  type: "AWLR" | "ARR" | "CCTV";
  lat: number;
  lng: number;
  source: string;
  unit: string;
  availability: "active" | "stale" | "unavailable";
  threshold: number;
  forecast: boolean;
  cctv?: { availability: "unavailable"; location: string };
};
export type User = {
  id: string;
  name: string;
  email: string;
  village: string;
  role: "Volunteer" | "Admin";
  active: boolean;
  approval: "pending" | "approved";
  preferences: string[];
};
export type Knowledge = {
  id: string;
  title: string;
  text: string;
  enabled: boolean;
  fileName?: string;
};
export type Activity = {
  id: string;
  userId: string;
  user: string;
  village: string;
  action: string;
  posts: string[];
  message: string;
  at: string;
  confirmedAt?: string;
};
export type Message = {
  id: string;
  userId: string;
  village: string;
  generated: string;
  final: string;
  postIds: string[];
  sources: {
    post: Post;
    observedAt: string;
    value: number | null;
    forecast: number[];
  }[];
  status: "Draft" | "Ready to Share" | "WhatsApp Handoff" | "Confirmed Sent";
  createdAt: string;
  confirmedAt?: string;
};
export const demoTime = new Date().toISOString();
export const initialPosts: Post[] = [
  {
    cctv: { availability: "unavailable", location: "Pos Majalaya" },
    id: "mjl",
    name: "Majalaya",
    type: "AWLR",
    lat: -7.049,
    lng: 107.759,
    source: "AWLR simulasi",
    unit: "m",
    availability: "active",
    threshold: 3,
    forecast: true,
  },
  {
    id: "wng",
    name: "Wangisagara",
    type: "AWLR",
    lat: -7.085,
    lng: 107.744,
    source: "AWLR simulasi",
    unit: "m",
    availability: "active",
    threshold: 3,
    forecast: true,
  },
  {
    id: "kts",
    name: "Kertasari",
    type: "ARR",
    lat: -7.16,
    lng: 107.68,
    source: "ARR simulasi",
    unit: "mm/jam",
    availability: "active",
    threshold: 20,
    forecast: false,
  },
  {
    id: "cip",
    name: "Ciparay",
    type: "ARR",
    lat: -7.032,
    lng: 107.702,
    source: "ARR simulasi",
    unit: "mm/jam",
    availability: "stale",
    threshold: 20,
    forecast: false,
  },

];
export const initialUsers: User[] = [
  {
    id: "volunteer",
    name: "Relawan Majalaya",
    email: "relawan@demo.alera",
    village: "Majalaya",
    role: "Volunteer",
    active: true,
    approval: "approved",
    preferences: ["mjl", "kts"],
  },
  {
    id: "admin",
    name: "Jaga Balai Majalaya",
    email: "admin@demo.alera",
    village: "Majalaya",
    role: "Admin",
    active: true,
    approval: "approved",
    preferences: ["mjl", "wng", "kts"],
  },
];
export const initialKnowledge: Knowledge[] = [
  {
    id: "awlr",
    title: "Apa itu AWLR?",
    text: "AWLR adalah alat pencatat tinggi muka air. Angka menunjukkan ketinggian air di pos tersebut, bukan kedalaman banjir di rumah warga.",
    enabled: true,
  },
  {
    id: "arr",
    title: "Hujan dan ARR",
    text: "ARR mencatat curah hujan. Hujan di hulu dapat memengaruhi aliran di hilir; waktu dan besar pengaruhnya perlu dinilai bersama data lain.",
    enabled: true,
  },
  {
    id: "forecast",
    title: "Membaca prakiraan",
    text: "Prakiraan adalah perkiraan kondisi mendatang, bukan pengamatan saat ini. Ketidakpastian tetap ada. Relawan menilai relevansi sebelum menyampaikan informasi.",
    enabled: true,
  },
  {
    id: "accumulation",
    title: "Akumulasi hujan",
    text: "Akumulasi adalah jumlah hujan selama suatu rentang waktu. Total 3 jam dihitung dari pengamatan bertimestamp selama tiga jam, bukan intensitas saat ini dikali tiga.",
    enabled: true,
  },
  {
    id: "guide",
    title: "Memilih pos dan membuat informasi",
    text: "Pilih pos yang relevan secara mandiri. Buka pos, pilih untuk informasi, tinjau data, buat draf, edit, lalu bagikan ke WhatsApp. Konfirmasi setelah Anda benar-benar mengirim.",
    enabled: true,
  },
];
export function observations(post: Post, at: string) {
  const end = new Date(at).getTime();
  return Array.from({ length: 25 }, (_, i) => ({
    at: new Date(end - (24 - i) * 15 * 60000).toISOString(),
    value:
      post.type === "AWLR"
        ? Number(((post.id === "wng" ? 1.05 : 2.05) + i * 0.05625).toFixed(3))
        : [4, 8, 12, 16, 20, 24, 28, 32][i % 8],
    intervalMinutes: 15,
  }));
}
export function accumulation(post: Post, at: string, hours: number) {
  const end = Date.parse(at);
  return observations(post, at)
    .filter(
      (o) =>
        Date.parse(o.at) > end - hours * 3600000 && Date.parse(o.at) <= end,
    )
    .reduce((n, o) => n + (o.value * o.intervalMinutes) / 60, 0);
}
export function value(post: Post, at: string) {
  return post.availability === "unavailable" || post.type === "CCTV"
    ? null
    : (observations(post, at)[24]?.value ?? null);
}
export function status(post: Post, at: string) {
  if (post.availability === "unavailable") return "Tidak tersedia";
  if (post.availability === "stale") return "Data lama";
  return (value(post, at) ?? 0) >= post.threshold
    ? post.type === "AWLR"
      ? "Waspada"
      : "Hujan lebat"
    : "Normal";
}
export function forecast(post: Post, at: string) {
  const current = value(post, at);
  return post.type === "AWLR" &&
    post.forecast &&
    post.availability === "active" &&
    current !== null
    ? [current + 0.4, current + 0.7, current + 1]
    : [];
}
export function observedAt(post: Post, at: string) {
  return new Date(
    Date.parse(at) - (post.availability === "stale" ? 180 : 0) * 60000,
  ).toISOString();
}
export function explain(post: Post, at: string) {
  if (post.availability !== "active")
    return `${post.name}: ${status(post, at)}. Data ini tidak dapat dipakai untuk menyatakan kondisi saat ini.`;
  if (post.type === "CCTV")
    return "CCTV adalah informasi visual pendukung dan tidak menetapkan status peringatan.";
  return post.type === "AWLR"
    ? `Tinggi air di ${post.name} teramati ${value(post, at)?.toFixed(2)} m (${status(post, at)}), naik ${recentChange(post, at)} cm dalam 2 jam terakhir.${forecast(post, at).length ? ` Prakiraan +4 jam adalah ${forecast(post, at)[2].toFixed(2)} m; ini bukan kondisi saat ini.` : ""} Nilai relevansinya sebelum membagikan informasi.`
    : `Hujan di ${post.name} teramati ${value(post, at)} mm/jam (${status(post, at)}). Total hujan tiga jam terakhir ${accumulation(post, at, 3)} mm, dihitung dari catatan per 15 menit. Data satu pos tidak menentukan kondisi seluruh desa.`;
}
export function draft(posts: Post[], at: string) {
  return `SIMULASI PROTOTIPE — bukan informasi operasional\nInformasi pemantauan • ${new Date(at).toLocaleString("id-ID", {timeZone: "Asia/Jakarta"})} WIB\n\n${posts.map((p) => explain(p, at)).join("\n\n")}\n\nTetap pantau informasi terbaru. Informasi ini perlu ditinjau oleh relawan sebelum dibagikan.`;
}

export function recentChange(post: Post, at: string) { const records = observations(post, at); return Math.round((records[24].value - records[16].value) * 100); }

// Migrate the old demo camera into its monitoring post without discarding other posts.
export function mergePostFacilities(posts: Post[]): Post[] {
  const camera = posts.find((p) => p.id === "cam" && p.type === "CCTV");
  if (!camera || !posts.some((p) => p.id === "mjl")) return posts;
  return posts.filter((p) => p !== camera).map((p) => p.id === "mjl"
    ? { ...p, cctv: p.cctv ?? { availability: "unavailable", location: "Pos Majalaya" } }
    : p);
}
export const postTypes = (post: Post) => post.cctv ? [post.type, "CCTV"] : [post.type];
