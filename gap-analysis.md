# Gap analysis ALERA-FI terhadap requirements.md

Tanggal: 29 September 2026. Baseline: working tree lokal saat audit, termasuk perubahan yang belum di-commit. Bukan audit deployment alera.fi.

## Kesimpulan

Implementasi adalah prototipe alur relawan, belum platform operasional sesuai PRD. Sebagian besar alur UI inti tersedia, tetapi autentikasi, data aktual, forecast, AI, dan penyimpanan lintas pengguna belum tersedia. Ada gap fitur yang tetap nyata bahkan jika dinilai sebagai prototipe: pengelolaan sumber monitoring hilang, onboarding akun buatan admin dapat terlewati, dan isi pengetahuan tidak bisa diperbarui.

Tidak digunakan persentase kepatuhan: menghitung layar yang tersedia sebagai fitur selesai akan menyamakan simulator dengan kemampuan operasional.

## Metode dan batas verifikasi

- Membaca seluruh requirements.md, App.tsx, model.ts, Map.tsx, KnowledgePanel.tsx, README, CSS responsif, dan dua berkas pengujian.
- Menjalankan npm test, npm run build, npm run lint, dan npx tsc --noEmit -p tsconfig.app.json: semuanya lulus; 8 tes pada 2 berkas.
- Tes workflow memalsukan komponen peta dan window.open. Kelulusan tidak membuktikan rendering peta, pembukaan WhatsApp pada perangkat nyata, maupun keterpakaian mobile.
- Repo juga memuat ekspor workflow n8n untuk ETL/EWS dan Supabase. Kode aplikasi aktif tidak memanggil workflow tersebut; deployment, kredensial, eksekusi, dan kesehatan pipeline eksternal tidak diverifikasi. Temuan belum terintegrasi tidak berarti tidak ada pekerjaan backend di luar aplikasi ini.
- Tidak melakukan browser visual QA, pengiriman WhatsApp, uji pengguna, atau pemeriksaan sistem produksi pada audit ini.
- Tidak mengubah kode aplikasi. Perubahan audit hanya dokumen ini.

## Matriks seluruh functional requirements

Status “Tersedia lokal” berarti perilaku terlihat dalam kode/alur lokal, bukan siap produksi. “Sebagian” berarti bagian penting belum memenuhi kebutuhan. “Simulasi” berarti UI tersedia tetapi kapabilitas inti digantikan fixture/template.

| PRD | Status | Implementasi dan gap | Bukti |
| --- | --- | --- | --- |
| FR-01 Authentication | Simulasi | Login memilih akun, termasuk admin, tanpa kredensial. Session dan role hanya browser-local; tidak ada autentikasi/otorisasi server. | App.tsx |
| FR-02 Village Assignment | Tersedia lokal | Registrasi, admin, dan profil menghubungkan akun dengan desa. Desa disimpan sebagai nama, bukan entity ID. | App.tsx |
| FR-03 Monitoring Preference | Sebagian | Registrasi mandiri mewajibkan pilihan awal; preferensi dapat diedit. Akun buatan admin login dengan onboarding=false walau preferences kosong. Refresh juga menghilangkan state onboarding. | App.tsx |
| FR-04 Scope Filter | Tersedia lokal | Pos Saya default pada mount; Semua Pos tidak dibatasi desa/preferensi. Scope tidak direset saat logout, sehingga login berikutnya dalam instance yang sama dapat mewarisi Semua Pos. | App.tsx |
| FR-05 Integrated Map | Sebagian | Peta interaktif AWLR/ARR; CCTV melekat pada pos Majalaya. Lokasi dan sumber adalah fixture. Penggabungan fasilitas CCTV sendiri bukan pelanggaran PRD. | Map.tsx; model.ts |
| FR-06 Monitoring Status | Simulasi | Marker memuat tipe, nilai, status, warna, dan pilihan. Nilai sintetis; klasifikasi satu ambang per pos. | Map.tsx; model.ts |
| FR-07 Data Freshness | Sebagian | Timestamp dan label stale/unavailable ada. Status stale berasal dari flag tetap, bukan usia timestamp; snapshot lama dapat tetap berstatus aktif. | App.tsx; model.ts |
| FR-08 Historical Context | Simulasi | Riwayat 6 jam dan perubahan AWLR dihitung dari fixture; narasi tren AWLR/ARR sebagian hardcoded, bukan deteksi tren umum. | model.ts; App.tsx |
| FR-09 Rainfall Accumulation | Sebagian | Integrasi interval 15 menit bertimestamp untuk 1/3/6 jam tersedia, bukan ekstrapolasi satu nilai. Belum terhubung riwayat sumber asli atau menangani gap/interval tidak teratur. | model.ts; model.test.ts |
| FR-10 Water-Level Forecast | Simulasi | +2/+3/+4 jam tersedia, dihitung current+0.4/+0.7/+1. Tidak ada model, input model, atau pipeline prakiraan. | model.ts |
| FR-11 Observation vs Forecast | Tersedia lokal | Bagian prakiraan, horizon, dan copy pembeda tersedia pada bottom sheet, detail, dan draf. | App.tsx; model.ts |
| FR-12 Monitoring Selection | Tersedia lokal | Pilih beberapa pos, marker terpilih, tray, tinjau/hapus tersedia. | App.tsx; Map.tsx |
| FR-13 Automatic Context Collection | Sebagian | Draf membawa sebagian konteks via explain(). Snapshot sumber hanya menyimpan metadata, nilai, observedAt, dan array forecast; tidak menyimpan riwayat, perubahan, akumulasi, durasi, atau waktu tiap forecast secara eksplisit. | App.tsx; model.ts |
| FR-14 AI Message Drafting | Simulasi | Template deterministik, bukan AI. Lokasi, kondisi, perubahan AWLR, forecast +4 jam, akumulasi ARR 3 jam disertakan; cakupan konteks belum lengkap. | model.ts; App.tsx |
| FR-15 Message Editing | Tersedia lokal | Textarea dapat diedit; data pendukung, ubah sumber/buat ulang, dan lanjut bagikan tersedia. Buat ulang membuat pesan baru dan meninggalkan draf lama. | App.tsx |
| FR-16 WhatsApp Handoff | Tersedia lokal | wa.me dengan encoded final text atas aksi pengguna; window.open diuji sebagai mock. Handoff perangkat nyata dan popup gagal belum diverifikasi/ditangani. | App.tsx; workflow.test.tsx |
| FR-17 Dissemination Confirmation | Tersedia lokal | Belum / Ya sudah dikirim, timestamp konfirmasi, dan penegasan bukan bukti delivery tersedia. | App.tsx |
| FR-18 Activity Logging | Sebagian | Seleksi, draft, edit onBlur, siap bagikan, handoff, konfirmasi dicatat; volunteer difilter, admin melihat seluruh data pada browser yang sama. Tidak ada shared durable audit storage atau entity/message ID di Activity. | App.tsx; model.ts |
| FR-19 Contextual Explanation | Simulasi | Tombol menerima pos terpilih otomatis; hasil adalah template explain(), bukan AI. | App.tsx; model.ts |
| FR-20 AI Assistant | Simulasi | Pencarian kata pada maksimal dua knowledge aktif, lalu mengembalikan teks dan sumber. Tidak ada penalaran percakapan, konteks pesan sebelumnya, atau model AI. | App.tsx |
| FR-21 User Management | Sebagian | Buat akun lokal, aktif/nonaktif, ubah desa, daftar relawan tersedia. Tidak ada akun backend/lintas perangkat. Undangan email tidak wajib terpisah jika opsi create account berfungsi sesuai PRD. | App.tsx |
| FR-22 AI Knowledge Management | Sebagian | Unggah TXT/MD, ubah judul, aktif/nonaktif, hapus tersedia. Isi knowledge yang sudah tersimpan tidak dapat diedit/diganti pada entity yang sama. Seluruhnya browser-local. | KnowledgePanel.tsx |

## Gap prioritas dan kriteria selesai

### P0 — penghalang penggunaan operasional

1. **Identitas dan penyimpanan bersama belum ada** — FR-01, §23, §28. Pemilihan akun bukan autentikasi; admin hanya melihat aktivitas yang disimpan browser tersebut. Selesai ketika akun terautentikasi, izin diverifikasi server, dan admin dapat membaca aktivitas relawan dari perangkat berbeda sesuai hak akses. Backend bukan nama teknologi yang diwajibkan PRD, tetapi konsekuensi kebutuhan multi-user ini.
2. **Ingest monitoring dan freshness belum operasional** — FR-06–09. `at` tersimpan sekali; `status()` tidak membandingkan waktu sekarang dengan timestamp. Selesai ketika timestamp asli sumber dipertahankan, klasifikasi memakai konfigurasi pos, dan transisi stale/unavailable berjalan berdasarkan kebijakan sumber yang disepakati. Mengubah angka di Konfigurasi sekarang hanya memengaruhi kalimat pada panel itu.
3. **Forecast dan AI belum diimplementasikan** — FR-10, FR-14, FR-19, FR-20. Selesai ketika pipeline menghasilkan forecast bertimestamp untuk target yang didukung dan bantuan AI menggunakan konteks/knowledge aktif dengan batas klaim yang sesuai PRD. Pilihan model masih keputusan terbuka; keberadaan fiturnya tetap kebutuhan inti.

### P1 — gap fungsional dan integritas konteks

4. **Admin monitoring source management tidak tersedia** — §4.2, §26, §33 layar 15. Tab admin hanya Relawan, Desa, Pengetahuan AI, Konfigurasi; state posts tidak mengekspos setter. Admin tidak bisa menambah/memperbarui sumber, koordinat, unit, threshold, atau dukungan forecast. Tes knowledge bahkan mengharapkan tombol Sumber monitoring tidak ada. Selesai ketika sumber dapat dikelola dengan metadata relevan. Jangan menyamakan tes lulus dengan kepatuhan PRD.
5. **Onboarding bisa terlewati** — §6.1 / FR-03. Akun buatan admin punya preferences kosong, tetapi login selalu mematikan onboarding; refresh setelah registrasi juga melewati langkah ini. Selesai ketika status onboarding tersimpan dan login akun belum selesai membawa pengguna ke pemilihan pos.
6. **Snapshot pendukung pesan belum lengkap** — §18, §20, §28 / FR-13. Isi draf memuat klaim perubahan dan akumulasi yang tidak dibekukan dalam message.sources. Selesai ketika kondisi, riwayat relevan/hasil turunannya, dan forecast beserta waktunya dapat ditelusuri dari sumber tersimpan saat pembuatan pesan; tidak harus memakai schema fisik identik dengan PRD.
7. **Update isi knowledge tidak tersedia** — §27 / FR-22. Ubah judul tidak memperbarui substansi SOP atau panduan. Selesai ketika isi bisa diedit atau dokumen dapat diganti; menonaktifkan/hapus lalu unggah ulang saat ini hanya workaround.
8. **Narasi historis belum data-driven secara umum** — §10, §12 / FR-08. AWLR selalu memakai teks naik dan panah naik; ARR selalu menyatakan hujan 6 jam dan intensitas menurun. Itu sesuai fixture sekarang, tetapi belum mendukung data turun/datar/jeda hujan. Selesai ketika narasi berasal dari observasi, interval, dan cakupan data yang benar. Rumus episode hujan perlu diputuskan sesuai §35.
9. **Konsistensi waktu stale perlu diperbaiki** — §8.2, §15. Grafik detail memanggil observations(post, at), sedangkan tabel memanggil observations(post, observedAt(post, at)); untuk pos stale, jendela internal berbeda 3 jam. Bentuk grafik fixture identik sehingga masalah tersamarkan. Selesai ketika grafik, tabel, timestamp terakhir, dan konteks memakai rentang sumber yang sama.

### P2 — kelengkapan konteks dan validasi

10. **CCTV dan satelit baru placeholder** — §13–14. Lokasi/status unavailable ditampilkan dengan jujur, tetapi tidak ada feed, snapshot, atau konteks satelit aktual. Integrasi bergantung keputusan §35. Satelit tidak wajib dibuat sebagai pos terpilih; feed yang benar-benar tidak tersedia tidak boleh dipalsukan.
11. **Default scope setelah pergantian akun** — §7.1. Reset scope ke Pos Saya saat login atau tentukan perilaku persistensi per pengguna agar tidak mewarisi akun sebelumnya.
12. **Validasi mobile dan handoff lapangan belum dibuktikan audit ini** — §32, §36. CSS responsif tersedia. Perlu uji peta/bottom sheet/tray/keyboard pada ponsel, handoff WhatsApp nyata tanpa pengiriman otomatis, dan uji relawan baru menyelesaikan flow mandiri. Build juga memberi warning bundle JS sekitar 996 KB minified / 279 KB gzip; dampak pada ponsel/jaringan perlu diukur, bukan diasumsikan gagal.

## Cakupan bagian PRD di luar matriks FR

| Bagian | Penilaian |
| --- | --- |
| §1–5 overview, konteks, prinsip, peran, alur | Arah alur UI sesuai; personalisasi tidak membatasi desa, manusia memilih/mengedit/mengirim. Status operasional belum tercapai. |
| §6–12 onboarding, peta, marker, AWLR, forecast, ARR | Alur dasar tersedia; gap onboarding, freshness, integrasi data, narasi, model sebagaimana di atas. |
| §13–16 CCTV, satelit, detail, pembelajaran | Detail dan glossary ada; CCTV/satelit placeholder; dua bantuan AI simulasi. |
| §17–22 seleksi, konteks, drafting, editor, WhatsApp, konfirmasi | Flow lokal tersedia dengan konfirmasi eksplisit; konteks snapshot belum lengkap; drafting simulasi; WhatsApp nyata belum diuji. |
| §23–24 activity dan account | UI tersedia; edit nama/desa, email readonly, preferensi otomatis tersimpan. Aktivitas lintas perangkat belum ada. |
| §25–27 admin | Relawan lokal tersedia; source management tidak ada; knowledge sebagian; desa tambah/hapus tersedia, rename tidak disebut sebagai kewajiban eksplisit PRD. |
| §28 entities | User/Post/Message/Activity ada sebagai objek lokal; village string, preference embedded, observation/forecast dihitung ulang. Representasi embedded bukan otomatis pelanggaran, tetapi identitas sumber, relasi audit, dan shared persistence belum lengkap. |
| §29 lifecycle | Empat state minimum tersedia; Cancelled opsional sehingga ketidakhadirannya bukan gap wajib. |
| §30 navigation | Monitoring, Activity, AI Assistant, Account, Admin tersedia; Monitoring default saat login. |
| §31 FR | Lihat matriks 22 FR. |
| §32 UX | Bahasa Indonesia dominan, progressive disclosure dan human control ada; beberapa label Inggris dipakai sebagaimana rekomendasi nav PRD. Belum uji pengguna/mobile visual pada audit ini. |
| §33 MVP screens | 15 dari 16 kategori layar/alur terwakili, termasuk modal dan langkah gabungan; Admin Monitoring Source Management tidak tersedia. Ini hitungan cakupan UI, bukan persentase fitur selesai. |
| §34 out of scope | Tidak menemukan autonomous warning, pengiriman WhatsApp otomatis, klaim delivery, pembatasan pos otomatis per desa, atau GIS editing volunteer pada kode UI aktif. |
| §35 technical decisions | Sebagian besar masih terbuka/berupa pilihan demo. TXT/MD dan wa.me adalah implementasi lokal saat ini, bukan bukti keputusan operasional final. |
| §36 success | Happy path lokal teruji sebagian. Keberhasilan relawan baru secara mandiri belum dibuktikan dengan uji pengguna. |

## Hal yang tidak layak dihitung sebagai gap wajib

- PDF/DOCX: PRD hanya meminta supported documents jika implementasi memungkinkan; TXT/MD sudah dukungan dokumen yang sah.
- Status tambahan Siaga/Awas: contoh PRD tidak menetapkan set klasifikasi final; perlu keputusan threshold sumber.
- Forecast pada semua pos: hanya target AWLR yang didukung yang diwajibkan.
- WhatsApp delivery/read confirmation, pengiriman otomatis, Analyst approval, dan Cancelled: tidak wajib atau di luar scope.
- Animasi marker: opsional, bukan syarat kepatuhan.
- CCTV harus marker terpisah: tidak diwajibkan; fasilitas di lokasi yang sama dapat digabung selama data/statusnya jelas.

## Urutan tindak lanjut

1. Tetapkan target berikutnya: prototipe lengkap untuk validasi flow atau pilot operasional. Jangan menyebut keduanya dengan ukuran selesai yang sama.
2. Tutup gap prototipe yang tidak menunggu provider: source management, onboarding persisten, pembaruan isi knowledge, snapshot konteks lengkap, default scope, konsistensi waktu.
3. Putuskan kontrak data pada §35: format/timestamp/unit, polling, stale, threshold, hujan, forecast, CCTV/satelit, AI/knowledge.
4. Bangun identitas dan storage bersama, lalu integrasikan satu jalur AWLR/ARR nyata end-to-end sebelum memperluas sumber.
5. Hubungkan forecast dan AI; uji fakta dalam draf serta batas current versus forecast dan stale/unavailable.
6. Validasi mobile, handoff WhatsApp, pemisahan hak akses, dan skenario relawan baru sesuai §36.

Build/test yang lulus memastikan implementasi saat ini konsisten dengan tes yang ada. Hasil itu tidak menghapus gap produk di atas.
