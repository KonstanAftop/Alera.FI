import { useEffect, useRef } from "react";
const steps = [
  ["Kenali kondisi di peta", ".map-panel", "Hijau: Normal. Kuning: Waspada. Oranye: Hujan lebat. Abu-abu: data lama atau tidak tersedia. Ikuti tur ini sampai contoh pengiriman; seluruh latihan tidak mengirim pesan."],
  ["Atur pos yang terlihat", ".map-toolbar", "Pos Saya mengikuti preferensi Anda; Semua Pos menampilkan seluruh pos. AWLR mengukur tinggi air, ARR mengukur hujan, dan CCTV memberi konteks visual."],
  ["Snapshot pos sudah terbuka", ".station-popup", "Ini ringkasan nilai, status, dan waktu pengamatan. Berikutnya membuka detail pos yang sama."],
  ["Lihat detail dan riwayat", ".modal", "Detail pos menampilkan sumber, riwayat, dan prakiraan jika tersedia. Prakiraan bukan kondisi yang sudah terjadi."],
  ["Pilih informasi dari pos", ".bottom-sheet", "Kondisi pos sudah terbuka. Tekan Pilih untuk Informasi atau Berikutnya untuk memilih pos latihan dan melihat ringkasan sumber."],
  ["Tinjau sumber yang dipilih", ".modal", "Pos latihan sudah dipilih. Periksa konteksnya, lalu tekan Buat draf AI atau Berikutnya. Pilihan asli Anda tidak berubah."],
  ["Edit draf pesan", ".modal", "Editor sebenarnya sudah terbuka dengan draf latihan. Coba ubah teksnya. Tekan Lanjut bagikan atau Berikutnya setelah meninjau."],
  ["Siap membagikan", ".modal", "Pada pemakaian biasa tombol ini membuka WhatsApp. Dalam tur, tombol hanya membuka tahap konfirmasi latihan, tanpa membuka WhatsApp."],
  ["Konfirmasi setelah mengirim", ".context-box", "Pada pemakaian biasa, kirim sendiri di WhatsApp lalu kembali ke sini. Coba Ya, sudah dikirim atau Berikutnya untuk melihat hasil latihan."],
  ["Alur selesai", ".context-box", "Anda sudah mengikuti alur dari peta sampai konfirmasi. Tidak ada pesan atau aktivitas pengiriman yang disimpan. Pengiriman di luar latihan tetap memerlukan persetujuan admin. Tur bisa diulang melalui Account."],
];
const tourStorageKey = (id: string) => `alera.tour.v2.${id}`;
export default function GuidedTour({ userId, replay, step, onStep }: {
  userId: string; replay: number; step: number | null; onStep: (step: number | null) => void;
}) {
  const previousReplay = useRef(replay);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (replay !== previousReplay.current || localStorage.getItem(tourStorageKey(userId)) !== "done") {
      previousReplay.current = replay;
      onStep(0);
    }
  }, [userId, replay, onStep]);
  const current = step === null ? null : steps[step];
  useEffect(() => {
    if (!current) return;
    const frame = requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      const target = document.querySelector<HTMLElement>(current[1]);
      target?.classList.add("tour-highlight");
      target?.scrollIntoView?.({ behavior: "instant", block: "start" });
    });
    return () => {
      cancelAnimationFrame(frame);
      document.querySelectorAll(".tour-highlight").forEach((el) => el.classList.remove("tour-highlight"));
    };
  }, [current]);
  const finish = () => {
    localStorage.setItem(tourStorageKey(userId), "done");
    onStep(null);
  };
  if (!current || step === null) return null;
  return <aside className="guided-tour" aria-label="Panduan aplikasi" onKeyDown={(e) => {
    if (e.key === "Escape") { e.stopPropagation(); finish(); }
  }}>
    <div className="tour-meta"><span>PENGENALAN · {step + 1}/{steps.length}</span><button onClick={finish}>Lewati</button></div>
    <h2 ref={heading} tabIndex={-1}>{current[0]}</h2>
    <p>{current[2]}</p>
    <div className="tour-actions">
      <button disabled={step === 0} onClick={() => onStep(step - 1)}>Kembali</button>
      <button className="primary" onClick={() => step === steps.length - 1 ? finish() : onStep(step + 1)}>{step === steps.length - 1 ? "Selesai" : "Berikutnya"}</button>
    </div>
  </aside>;
}
