# Alera FI - Flood Monitoring & Early Warning Platform

Alera FI is a comprehensive, multi-platform flood monitoring and early warning system. Built for hydrometeorological data integration, community-driven disaster preparedness, and alert dissemination across multiple channels.

## Key Features

- **Monitoring Dashboard**: Visualization of rainfall (ARR) and water level (AWLR) data with interactive 3D terrain mapping.
- **Early Warning System**: Automated multi-tier alert levels (Normal, Siaga 3/2/1) with threshold-based detection.
- **Community-Based Reporting**: Citizen-driven flood and disaster reporting for ground-truth data collection.
- **Multi-Channel Alerts**: Integrated Telegram notifications and alert distribution to communities.
- **Geospatial Intelligence**: Interactive maps with MapLibre GL, DEM visualization, and location-based recommendations.
- **Role-Based Access**: Support for individual citizens and community organizations with tailored interfaces.
- **Knowledge Center**: Disaster preparedness documentation and technical protocols.

## Technology Stack

- **Frontend**: React, TypeScript, Vite.
- **Data Visualization**: MapLibre GL JS, Recharts, Shadcn UI.
- **Styling**: Tailwind CSS, Lucide React icons.
- **State Management**: Zustand & React Query.
- **Backend**: FastAPI, Supabase, Data Integration.

## Struktur repositori (ringkas)

| Lokasi | Isi |
|--------|-----|
| `public/geo/` | Aset geospasial untuk web: `rivers_bandung.geojson`, `flood_risk.tiff` |
| `scripts/` | Utilitas: `extract_rivers.py`, `test_spatial.py`, `start-dev.sh` |
| `docs/` | Konteks (`CONTEXT.md`), deploy VPS (`DEPLOYMENT.md`), skema Supabase |
| `data/` | Opsional: input mentah (mis. shapefile); lihat `data/README.md` |
| `backend/` | API FastAPI (`main.py`) |

## Cara Menjalankan

### Frontend saja

1. Pastikan Node.js dan npm sudah terinstal.
2. Instal dependensi frontend:

   ```bash
   npm install
   ```

3. Siapkan file `.env` dan isi variabel Supabase yang diperlukan.
4. Jalankan server pengembangan:

   ```bash
   npm run dev
   ```

5. Buka URL yang ditampilkan Vite di terminal, biasanya `http://localhost:8080`.

### Backend dan frontend

Backend membutuhkan Python virtual environment. Dari root repository, jalankan:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
bash scripts/start-dev.sh
```

Script tersebut menjalankan backend FastAPI di `http://localhost:8005` dan frontend melalui Vite. Script juga akan menghentikan proses yang menggunakan port pengembangan umum (`8005`, `5173`, `8080`, dan `8081`) sebelum memulai layanan.

Jika `.venv` sudah dibuat, cukup jalankan:

```bash
bash scripts/start-dev.sh
```
