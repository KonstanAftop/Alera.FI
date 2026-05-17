FEWS — Requirements yang Sudah Dimatangkan
👤 User & Auth
ASPEK
KEPUTUSAN
Tipe akun
Individual + Community (independent)
Auth Telegram
Activation code → N8N webhook 
Pasted_Text_1778522729248.txt
Struktur tabel
users (base) + individual_profiles + community_profiles


📡 Data & Sensor
ASPEK
KEPUTUSAN
Sumber ETL
6 sumber, polling 10 menit 
Pasted_Text_1778522729248.txt
Sensor type
water_level + rainfall
sensor_current_state
Di-maintain via Supabase Postgres trigger
Field tambahan
last_notified_at untuk spam prevention


🚨 Alert Pipeline
ASPEK
KEPUTUSAN
Trigger mekanisme
Supabase Realtime → webhook → N8N
Kondisi trigger
current_warning != prev_warning
Spam prevention
Trigger on change + 1x reminder jika kondisi bertahan
Pesan individual
LLM-generated, struktur: Impacts > Actions > Weather > River > Hazard > Reassurance > Info 
Pasted_Text_1778522268856.txt
Pesan komunitas otomatis
Faktual singkat (nama stasiun, level, nilai, trend)


🖥️ Community Dashboard
ASPEK
KEPUTUSAN
Fitur
Monitor sensor real-time, broadcast manual, histori flood report
Pilih stasiun
Manual dari peta MapLibre 
Pasted_Text_1778523071938.txt
Broadcast flow
LLM generate operational briefing draft → operator edit → kirim
Telegram group
Operator setup sendiri via bot linking
Flood report
Semua akun komunitas bisa submit


🗄️ Schema Database Final

Collapse
Save
Copy
1
2
3
4
5
6
7
8
9
users                    — base auth table
individual_profiles      — lokasi, elevasi, risk_profile
community_profiles       — community_name, telegram_group_id
user_subscriptions       — sensor, assigned_by, distance_km, elevation_diff
community_subscriptions  — community_id, sensor_id
sensor_current_state     — current/prev warning, value, 3h_trend, last_notified_at
flood_reports            — community_id, location_text, severity, description
obs_data                 — sudah ada [2]
instrument_metadata      — sudah ada [2]
🔧 Backend & Stack
ASPEK
KEPUTUSAN
Frontend
React + Vite + TypeScript + Tailwind + Shadcn + MapLibre 
Pasted_Text_1778523071938.txt
Registration logic
Python backend — elevasi (Open-Meteo) + rasterio (.tiff) + SQL
Upstream assignment
Elevation-based: elevasi > user + radius ≤5km
Lokasi input
GPS default + drag pin MapLibre untuk koreksi


Gap yang Perlu Dibangun (Priority Order)
Postgres trigger → sensor_current_state upsert
N8N alert workflow → Supabase Realtime webhook → LLM → Telegram
Reminder scheduler → cron cek warning persisten
Python registration endpoint → elevasi + risk profile + subscription assignment
Community dashboard → sensor monitor, broadcast, flood report, histori