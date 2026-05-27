# Outline Detail BAB 1–3 (Inti) — Tugas Akhir ALERA-FI

Panduan penulisan per sub-bab: **tujuan paragraf**, **poin wajib**, **tabel/gambar**, **rujukan implementasi**, dan **catatan sidang**.

> Keputusan desain: [PANDUAN-PENULISAN-TA.md](./PANDUAN-PENULISAN-TA.md)  
> Versi ini **tanpa**: landasan komunikasi risiko (2.1.4), rancangan UI (2.2.7), keamanan (2.2.8), rancangan pengujian (2.3), pengujian/validasi (3.2), pembahasan (3.3), kesimpulan & saran (3.5).

**Legenda:**
- 📝 = narasi | 📊 = tabel/gambar | 🔗 = kode/repo | ⚠️ = catatan sidang

---

## Estimasi halaman

| Bab | Estimasi | Catatan |
|-----|----------|---------|
| BAB 1 | 15–25 hal | Latar, kebutuhan, tujuan |
| BAB 2 | 20–32 hal | Arsitektur + alur sistem |
| BAB 3 | 12–20 hal | Hasil implementasi + anggaran |
| **Total** | **47–77 hal** | + lampiran |

---

# BAB 1 — PENDAHULUAN

## 1.1 Latar Belakang

### 1.1.1 Karakteristik DAS Citarum dan risiko banjir

| Item | Detail penulisan |
|------|------------------|
| **Tujuan paragraf** | Menempatkan masalah pada wilayah yang valid secara geografis dan sosial |
| **Isi 📝** | Letak DAS (Jabar–Banten, muara Jakarta); peran irigasi, industri, domestik; banjir kiriman vs genangan |
| **Isi 📝** | Zonasi hulu (Bandung Raya), tengah, hilir (Bekasi–Karawang) |
| **📊** | Peta DAS Citarum |
| **⚠️** | Spesifik Citarum, bukan banjir nasional umum |

### 1.1.2 Riwayat peristiwa banjir dan urgensi EWS

| Item | Detail penulisan |
|------|------------------|
| **Isi 📝** | 2–4 peristiwa (tahun, lokasi, dampak) |
| **Isi 📝** | Pemicu: hujan hulu, urbanisasi, dll. |
| **📊** | Tabel: Tahun \| Lokasi \| Pemicu \| Dampak |

### 1.1.3 Kriteria Early Warning System yang efektif

| Item | Detail penulisan |
|------|------------------|
| **Isi 📝** | Definisi EWS (UN/ISDR atau PRB Indonesia) |
| **Isi 📝** | Tepat waktu, jelas, actionable, saluran push, konteks lokal |
| **📊** | Tabel kriteria EWS vs sistem konvensional |
| **⚠️** | Forward reference ke KPPC (BAB 2.2.5) |

### 1.1.4 Masalah pada praktik EWS dan komunitas saat ini

| No | Masalah | Contoh lapangan |
|----|---------|-----------------|
| M1 | Pesan EWS generik | BMKG area luas |
| M2 | Dashboard pasif | Portal PDA/ARR |
| M3 | Komunitas manual | WA template terpisah dari sensor |
| M4 | Data tidak terintegrasi | Spreadsheet / grup chat |
| M5 | Dokumentasi peristiwa lemah | Laporan lisan pasca banjir |

**📊** Tabel M1–M5 + kolom dampak bagi warga.

### 1.1.5 Solusi: platform ALERA-FI

| Item | Detail penulisan |
|------|------------------|
| **Isi 📝** | Monitoring hujan & muka air + EWS + KDG |
| **Isi 📝** | **Inklusif** (individu, DM, KPPC) + **eksklusif** (komunitas, grup, template, KDG) |
| **🔗** | README proyek |

### 1.1.6 Kerangka pesan KPPC

| Item | Detail penulisan |
|------|------------------|
| **Isi 📝** | Baseline: Cuaca → Sungai → Bahaya → … → Tindakan generik |
| **Isi 📝** | KPPC: **Dampak → Tindakan spesifik → Cuaca → Sungai → Bahaya → Penegasan → Info lanjut** |
| **📊** | Tabel blok pesan (PANDUAN §4.2) |
| **⚠️** | Kontribusi = kerangka + konteks data, bukan sekadar "AI" |

---

## 1.2 Analisis Kebutuhan

### 1.2.1 Pemangku kepentingan

| Stakeholder | Peran di ALERA-FI |
|-------------|-------------------|
| Warga individu | `personal`, KPPC |
| Komunitas | `community`, KDG |
| Operator komunitas | Dashboard, broadcast |

### 1.2.2 Kebutuhan pengguna

**Individu**

| ID | Kebutuhan | Terpenuhi oleh |
|----|-----------|----------------|
| UR-I1 | Daftar + lokasi rumah | `/auth`, registration API |
| UR-I2 | Langganan pos pantau | `user_subscriptions` |
| UR-I3 | Alert tanpa buka dashboard | Telegram DM + EWS |
| UR-I4 | Pesan mudah dimengerti | KPPC |
| UR-I5 | Dashboard monitoring | `/` |
| UR-I6 | Hubung Telegram | Telegram auth workflow |

**Komunitas**

| ID | Kebutuhan | Terpenuhi oleh |
|----|-----------|----------------|
| UR-C1 | Monitoring multi-pos | `/` + subscriptions |
| UR-C2 | Auto-alert grup | `auto_alert_enabled`, n8n |
| UR-C3 | Broadcast manual | `telegram.py` |
| UR-C4 | Laporan banjir (KDG) | `/laporkan` |
| UR-C5 | Tabel historis | `/table` |
| UR-C6 | Profil & area kelola | `/profile` |

### 1.2.3 Kebutuhan sistem

| ID | Kebutuhan | Modul |
|----|-----------|-------|
| SR-1 | Integrasi observasi multi-pos | n8n ETL → `obs_data` |
| SR-2 | Deteksi perubahan TSH | `sensor_current_state` |
| SR-3 | Antrean & konsolidasi alert | `ews_alert_queue` |
| SR-4 | Konteks KPPC | `v_alert_context` |
| SR-5 | Jalur personal vs community | `recipient_type` |
| SR-6 | Log notifikasi | `notification_log` |
| SR-7 | Dokumentasi KDG | `flood_reports` |

### 1.2.4 Perbandingan sistem existing

**📊 Tabel wajib:** BMKG \| Dashboard PDA \| Komunitas manual \| ALERA-FI (saluran, personalisasi, bahasa, integrasi, arsip genangan).

---

## 1.3 Tujuan Penelitian

1. **Umum:** Merancang dan mengembangkan ALERA-FI untuk pemantauan hidrometeorologi dan EWS di DAS Citarum (dual-audience).

2. **Khusus:**
   - Integrasi data ARR/AWLR ke basis data terpusat.
   - Mekanisme TSH + antrean EWS terkonsolidasi.
   - KPPC pada notifikasi individu (Telegram DM).
   - Modul komunitas: monitoring, auto-alert, broadcast, KDG.
   - Purwarupa high-fidelity end-to-end.

**Kalimat kontribusi:** lihat PANDUAN §2.

**📊** Matriks tujuan khusus ↔ bukti di BAB 3.1.

---

## 1.4 Tipe dan Ruang Lingkup Purwarupa

### 1.4.1 Tipe

| Tipe | Definisi | Bukti |
|------|----------|-------|
| **High-fidelity** | Alur lengkap: UI, API, DB, n8n, Telegram | BAB 3.1 |

### 1.4.2 Ruang lingkup

| Lingkup | Klaim |
|---------|-------|
| **Desain** | Seluruh DAS Citarum |
| **Implementasi** | Subset **N** pos terintegrasi |

**📊** Peta DAS + titik pos aktif.

### 1.4.3 Batasan penelitian

- Tidak semua pos BBWS terintegrasi pada fase purwarupa.
- Kanal: Telegram saja.
- KDG tanpa moderasi pihak ketiga.
- Ketergantungan API sumber data eksternal.

---

## 1.5 Sasaran Pengguna

### 1.5.1 Individu (`personal`)

Warga DAS; akun + lokasi + Telegram; menerima KPPC saat TSH berubah.

### 1.5.2 Komunitas (`community`)

Organisasi stabil; **satu akun = satu organisasi**; warga via grup Telegram.

---

## 1.6 Sistematika Penulisan

| Bab | Isi |
|-----|-----|
| 1 | Pendahuluan |
| 2 | Rancangan purwarupa (sumber daya, alur sistem) |
| 3 | Hasil implementasi, anggaran |
| Lampiran | Skema DB, inventaris pos, prompt KPPC, screenshot |

---

# BAB 2 — RANCANGAN PURWARUPA

## 2.1 Sumber Daya

### 2.1.1 Arsitektur infrastruktur

**📊 Diagram deployment:**

```
[API ARR/AWLR] → [n8n ETL] → [Supabase]
                      ↓
              [n8n EWS] → [LLM] / [Telegram]
                      ↓
         DM individu    Grup komunitas

[React] → [FastAPI] → [Supabase]
```

| Komponen | Fungsi | 🔗 |
|----------|--------|-----|
| VPS | Hosting | `docs/DEPLOYMENT.md` |
| Supabase | Auth + DB | `supabase/schema.sql` |
| n8n | ETL + EWS | `n8n-workflow/` |
| Telegram | DM & grup | `telegram.py` |

### 2.1.2 Arsitektur aplikasi

| Lapisan | Teknologi |
|---------|-----------|
| Presentasi | React, Vite, MapLibre, Recharts |
| API | FastAPI |
| Otomasi | n8n |
| Data | PostgreSQL (Supabase) |

**Modul backend:** `auth`, `registration`, `api`, `telegram` — 🔗 `backend/main.py`, `src/App.tsx`

### 2.1.3 Data yang digunakan

#### A. Observasi hidrometeorologi

| Jenis | Tabel | 🔗 |
|-------|-------|-----|
| ARR | `obs_data` (rf) | `ETL-Workflow.json` |
| AWLR | `obs_data` (wl) | idem |

#### B. Spasial & profil

| Data | Penggunaan |
|------|------------|
| `instrument_metadata` | Pos, koordinat |
| Elevasi, jarak sungai, `risk_profile` | KPPC, rekomendasi pos |
| GeoJSON sungai | Peta |
| Open-Meteo | Cuaca di KPPC |

#### C. Inventaris pos purwarupa

**📊 Tabel:** sensor_id \| pos_name \| tipe \| lat \| lon \| sub-DAS \| sumber API

**Isi 📝:** N total; hulu/tengah/hilir; pos excluded ETL (jika ada).

---

## 2.2 Rancangan Sistem

### 2.2.1 Gambaran umum

**📊** Diagram konteks: Warga, Komunitas, ALERA-FI, API BBWS, Telegram, Open-Meteo.

**📊** Diagram dual-audience: Core (ETL|TSH|DB) → personal/KPPC/DM vs community/template/grup.

---

### 2.2.2 Onboarding dan manajemen pengguna

#### A. Alur registrasi

| Langkah | Individu | Komunitas |
|---------|----------|-----------|
| 1–2 | `/auth`, akun | sama |
| 3 | Lokasi + geo | Area kelola + pos |
| 4 | Elevasi, risiko, jarak sungai | Langganan pos |
| 5 | Rekomendasi pos (2 hulu + 1 terdekat) | — |
| 6–7 | Profil, link Telegram DM | Profil, link grup |

**🔗** `registration.py`, `AuthPage.tsx`

#### B. Rekomendasi pos (individu)

Prioritas 2 pos hulu terdekat, isi hingga 3 pos.

**📊** Ilustrasi rumah hilir → langganan hulu + lokal.

#### C. Profil individu

`location_lat/lng`, `elevation`, `risk_profile`, `distance_to_river`, `user_subscriptions`.

#### D. Profil komunitas

`community_name`, `managed_area`, `telegram_group_id`, `auto_alert_enabled`, `community_subscriptions`.

**⚠️** Warga tidak login sebagai komunitas.

---

### 2.2.3 ETL dan penyimpanan observasi

**📊 Alur:** trigger n8n → fetch API → filter/map `sensor_id` → TSH → `obs_data` → `sensor_current_state`.

| Tabel | Peran |
|-------|-------|
| `instrument_metadata` | Master pos |
| `obs_data` | Histori |
| `sensor_current_state` | State + deteksi perubahan |

---

### 2.2.4 Tingkat Siaga Hidrometeorologi (TSH)

> Terpisah dari KDG (2.2.6).

#### A. ARR (mm/jam)

| Level | Label | Kriteria (ETL) |
|-------|-------|----------------|
| 0 | Normal | < 5 |
| 1 | Siaga 3 | 5 – < 10 |
| 2 | Siaga 2 | 10 – < 20 |
| 3 | Siaga 1 | ≥ 20 |

#### B. AWLR (m)

Ambang `siaga1/2/3` per pos atau `wlMaster`.

#### C. Pemetaan

| `warning_level` | Label |
|-----------------|-------|
| 0 | Normal |
| 1 | Siaga 3 |
| 2 | Siaga 2 |
| 3 | Siaga 1 |

**⚠️** Siaga 1 = level 3 di database.

#### D. Trend `trend_3h`

`naik` \| `turun` \| `stabil` — dipakai di pesan.

---

### 2.2.5 Mekanisme Early Warning System

#### A. Trigger alert

Perubahan `current_warning_level` → `ews_alert_queue` (field: user, sensor, old/new level, `recipient_type`, status, `batch_id`).

#### B. Konsolidasi

- **Personal:** batch pending → group by user → 1 LLM → 1 DM.
- **Community:** batch + `auto_alert_enabled` + grup terhubung → template.

**📊** Diagram sequence: TSH berubah → antrean → batch → kirim.

**🔗** `EWS-consolidate-workflow.json`

#### C. Konteks KPPC

Profil risiko, jarak sungai, sensor (pos, tipe, level, nilai, trend), cuaca WMO.

#### D. KPPC & prompt

1. Struktur 7 blok (PANDUAN §4.2)  
2. Guardrail anti-halusinasi  
3. Hulu/hilir (50 m), jarak pos (5 km)  
4. Nada naik vs turun level  

**📊** Contoh input konteks + screenshot output Telegram.

#### E. Jalur komunitas

Template: emoji level, pos, nilai, trend, WIB. Broadcast: header `ALERA FI — [komunitas]`.

**🔗** `telegram_format.py`

#### F. Logging

`notification_log` — jejak pesan terkirim.

---

### 2.2.6 Klasifikasi Dampak Genangan (KDG)

| Level | Kriteria (Yuhan ITB 2017) |
|-------|---------------------------|
| Rendah | H ≤ 0,3 m |
| Sedang | 0,3 – 0,5 m |
| Tinggi | H ≥ 0,5 m |

Field: `location_text`, `severity`, `description`, `image_url`, `reported_at`.

**Isi 📝:** KDG tidak memicu EWS; fungsi arsip & ground-truth.

**🔗** `floodSeverity.ts`, `FloodReportPage.tsx`

**📊** Contoh entri `flood_reports`.

---

# BAB 3 — HASIL

## 3.1 Hasil Implementasi (High-Fidelity)

### 3.1.1 Lingkungan implementasi

| Item | Isi |
|------|-----|
| URL deployment | |
| Versi stack | |
| Periode | |
| N pos | |

### 3.1.2 Hasil modul ETL

**📊** Log n8n, jumlah `obs_data`, screenshot dashboard, grafik 1 ARR + 1 AWLR.

### 3.1.3 Hasil TSH & deteksi

**📊** Tabel transisi level (waktu, pos, lama → baru, antrean ya/tidak).

### 3.1.4 Hasil jalur individu

| Fitur | Status | Bukti |
|-------|--------|-------|
| Registrasi + geo | | Screenshot |
| Rekomendasi pos | | |
| Telegram DM | | |
| KPPC diterima | | Screenshot pesan |
| Dashboard | | |

**Isi 📝** Narasi alur lengkap 1 user (daftar → langganan → TSH naik → DM).

### 3.1.5 Hasil jalur komunitas

| Fitur | Status | Bukti |
|-------|--------|-------|
| Registrasi komunitas | | |
| Link grup | | |
| Auto-alert | | Screenshot grup |
| Broadcast manual | | |
| Laporan KDG | | |

### 3.1.6 Hasil dokumentasi KDG

**📊** Sample tabel `flood_reports` (anonim).

**Isi 📝** Kaitkan dengan masalah M5 di BAB 1.

### 3.1.7 Matriks ketercapaian kebutuhan

**📊** Traceability UR/SR (1.2) ↔ bukti 3.1 ↔ status Terpenuhi/Sebagian.

---

## 3.2 Rincian Penggunaan Anggaran

**📊 Tabel:**

| No | Komponen | Spesifikasi | Qty | Harga | Total | Ket. |
|----|----------|-------------|-----|-------|-------|------|
| 1 | VPS | | | | | |
| 2 | Domain | | | | | |
| 3 | Supabase | | | | | |
| 4 | API / LLM | | | | | |
| 5 | Lain-lain | | | | | |

**Lampiran:** invoice (jika wajib prodi).

---

# LAMPIRAN (disarankan)

| Lampiran | Isi |
|----------|-----|
| A | `schema.sql` |
| B | Inventaris pos |
| C | Prompt KPPC |
| D | Screenshot UI / Telegram |
| E | Diagram arsitektur |

---

# Checklist sidang

- [ ] TSH ≠ KDG (terminologi konsisten)
- [ ] DAS Citarum (desain) vs N pos (purwarupa) jelas
- [ ] KPPC vs template komunitas dijelaskan
- [ ] Siaga 1 = level 3 dijelaskan di BAB 2
- [ ] Matriks kebutuhan 3.1.7 terisi
- [ ] Kontribusi di abstrak & 1.3 selaras PANDUAN §2

---

*Outline inti — ALERA-FI. Bagian pengujian rubrik, pembahasan, dan kesimpulan ditulis terpisah sesuai format prodi.*
