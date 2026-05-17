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
| `docs/` | Catatan konteks (`CONTEXT.md`), skema Supabase |
| `data/` | Opsional: input mentah (mis. shapefile); lihat `data/README.md` |
| `backend/` | API FastAPI (`main.py`) |

## Cara Menjalankan

1. Pastikan Anda memiliki Node.js terinstal.
2. Jalankan `npm install` untuk menginstal dependensi.
3. Jalankan `npm run dev` untuk memulai server pengembangan.
4. Buka `http://localhost:8080` di browser Anda (port default Vite; lihat output terminal jika berbeda).

Backend dan frontend bersamaan (opsional): dari root repo jalankan `bash scripts/start-dev.sh`.

Untuk variabel lingkungan frontend, salin `.env.example` menjadi `.env` dan isi nilai Supabase Anda.
