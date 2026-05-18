# Panduan Deploy VPS — Alera FI

Dokumen ini untuk deploy production di VPS (Ubuntu), setup yang dipakai:

| Item | Nilai |
|------|--------|
| User SSH | `alera-fi` |
| Path project | `~/alera-fi` (`/home/alera-fi/alera-fi`) |
| Frontend (Nginx) | `~/alera-fi/web/` |
| Backend | Docker container `alera-backend` → `127.0.0.1:8005` |
| Database & auth | Supabase (cloud) |
| SSH port (Tencent) | **2222** (bukan 22) |

---

## Arsitektur

```text
Browser → http://IP atau https://domain
              ↓
           Nginx :80 / :443
              ├─ /              →  ~/alera-fi/web/   (React build)
              └─ /api, /auth, … →  127.0.0.1:8005   (FastAPI di Docker)
Supabase (cloud) ← auth + Postgres
```

- **Frontend:** file statis hasil `npm run build` (bukan `npm run dev` di production).
- **Backend:** hanya di Docker; port 8005 tidak perlu dibuka ke internet.

---

## File environment (`.env`)

Salin dari `.env.example` ke `.env` di root project. **Jangan commit `.env`.**

| Variable | Dipakai oleh | Keterangan |
|----------|--------------|------------|
| `VITE_SUPABASE_URL` | Frontend (build) + backend | URL project Supabase |
| `VITE_SUPABASE_ANON_KEY` | Frontend (build) | Public anon key |
| `VITE_API_URL` | Frontend (build) | URL API yang dilihat browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend only | Rahasia — jangan expose ke browser |
| `TELEGRAM_BOT_TOKEN` | Backend only | Opsional, untuk fitur Telegram |

### `VITE_API_URL` menurut fase

| Fase | Nilai contoh |
|------|----------------|
| Tanpa domain | `http://IP_PUBLIK_VPS` |
| Dengan domain + HTTPS | `https://domain-anda.com` |
| Dev lokal | `http://localhost:8005` |

Tanpa slash di akhir. Setelah mengubah `VITE_*`, **wajib** `npm run build` ulang dan copy ke `web/`.

---

## Deploy pertama (ringkasan)

Login VPS:

```bash
ssh -p 2222 alera-fi@IP_PUBLIK
```

### 1. Dependensi (sekali)

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl nginx
curl -fsSL https://get.docker.com | sudo sh
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs
sudo usermod -aG docker $USER
# logout & login lagi agar grup docker aktif
```

Firewall UFW (contoh):

```bash
sudo ufw allow 2222/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Tencent Security Group: izinkan **2222**, **80**, **443** (sesuaikan dengan UFW).

### 2. Clone & env

```bash
cd ~
git clone https://github.com/USERNAME/Dashboard-Majalaya.git alera-fi
cd ~/alera-fi
nano .env   # isi semua variable (VITE_API_URL = http://IP_PUBLIK)
```

### 3. Backend (Docker)

```bash
cd ~/alera-fi
docker build -t alera-backend .
docker run -d \
  --name alera-backend \
  --restart unless-stopped \
  -p 127.0.0.1:8005:8005 \
  --env-file .env \
  -e PORT=8005 \
  alera-backend

curl http://127.0.0.1:8005/
```

### 4. Frontend (build)

```bash
cd ~/alera-fi
export $(grep -v '^#' .env | xargs)
npm install
npm run build
mkdir -p web
cp -r dist/* web/
ls web/index.html web/alera-logo.png
```

Logo ada di `public/alera-logo.png` → setelah build harus ada `web/alera-logo.png`.

### 5. Nginx

```bash
sudo nano /etc/nginx/sites-available/alera
```

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root /home/alera-fi/alera-fi/web;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ ^/(api|auth|register|telegram|geocoding|instruments) {
        proxy_pass http://127.0.0.1:8005;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -sf /etc/nginx/sites-available/alera /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Supabase (disarankan)

Authentication → **URL configuration**:

- **Site URL:** `http://IP_PUBLIK` (atau `https://domain` nanti)
- **Redirect URLs:** `http://IP_PUBLIK/**`

Login email/password sering tetap jalan tanpa ini; setting ini penting untuk reset password, magic link, OAuth.

### 7. Tes

```bash
curl -I http://127.0.0.1
curl -s http://127.0.0.1/api/sensors | head -c 200
curl -I http://127.0.0.1/alera-logo.png
```

Browser: `http://IP_PUBLIK`

---

## Update kode (setelah `git push`)

Jalankan di VPS setiap ada perubahan di GitHub:

```bash
cd ~/alera-fi
git pull

# Backend
docker build -t alera-backend .
docker stop alera-backend && docker rm alera-backend
docker run -d \
  --name alera-backend \
  --restart unless-stopped \
  -p 127.0.0.1:8005:8005 \
  --env-file .env \
  -e PORT=8005 \
  alera-backend

# Frontend (jika ada perubahan UI atau VITE_*)
export $(grep -v '^#' .env | xargs)
npm install
npm run build
cp -r dist/* web/
```

### Hanya ubah `.env` backend

```bash
cd ~/alera-fi
docker stop alera-backend && docker rm alera-backend
docker run -d \
  --name alera-backend \
  --restart unless-stopped \
  -p 127.0.0.1:8005:8005 \
  --env-file .env \
  -e PORT=8005 \
  alera-backend
```

### Hanya ubah `VITE_*` (termasuk `VITE_API_URL`)

```bash
cd ~/alera-fi
export $(grep -v '^#' .env | xargs)
npm run build
cp -r dist/* web/
```

Tidak perlu rebuild Docker hanya karena `VITE_*` berubah.

---

## Setup domain + HTTPS

### 1. DNS

Di registrar domain, buat record:

| Type | Name | Value |
|------|------|--------|
| **A** | `@` | IP publik VPS |
| **A** | `www` | IP publik VPS (opsional) |

Tunggu propagasi (5 menit – 48 jam).

### 2. Certbot (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d domain-anda.com -d www.domain-anda.com
```

Ikuti prompt email & agree terms.

### 3. Update `.env` di VPS

```env
VITE_API_URL=https://domain-anda.com
```

### 4. Rebuild frontend

```bash
cd ~/alera-fi
export $(grep -v '^#' .env | xargs)
npm run build
cp -r dist/* web/
```

### 5. Update Nginx `server_name` (opsional, rapi)

Edit `/etc/nginx/sites-available/alera`:

```nginx
server_name domain-anda.com www.domain-anda.com;
```

Certbot biasanya sudah menambah blok `listen 443 ssl`. Cek:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Supabase

- **Site URL:** `https://domain-anda.com`
- **Redirect URLs:** `https://domain-anda.com/**`

### 7. Tes

- `https://domain-anda.com`
- Login, dashboard, API di Network tab → `https://domain-anda.com/api/...`

### 8. Perpanjangan SSL

Certbot memasang cron otomatis. Cek:

```bash
sudo certbot renew --dry-run
```

---

## N8N / Telegram webhook

File `workflow-tele.json` di repo masih bisa memakai `localhost` untuk dev.

Di production, arahkan webhook ke:

- `https://domain-anda.com/telegram/verify-code`
- `https://domain-anda.com/telegram/link-group`

(atau `http://IP/...` jika belum HTTPS — Telegram kadang mensyaratkan HTTPS.)

---

## Troubleshooting

### Logo tidak muncul (`/alera-logo.png`)

```bash
ls ~/alera-fi/public/alera-logo.png
ls ~/alera-fi/dist/alera-logo.png
ls ~/alera-fi/web/alera-logo.png
curl -I http://127.0.0.1/alera-logo.png
```

Perbaikan: pastikan file ada di repo → `git pull` → `npm run build` → `cp -r dist/* web/`.

### API gagal / 502

```bash
docker ps
docker logs alera-backend --tail 50
curl http://127.0.0.1:8005/
```

Restart:

```bash
docker start alera-backend
# atau docker run ulang (lihat bagian Update kode)
```

### Browser memanggil `localhost:8005`

`VITE_API_URL` salah saat build. Perbaiki `.env` → build ulang → `cp` ke `web/`.

### Login gagal

Cek Supabase Site URL / Redirect URLs cocok dengan URL browser (http vs https, IP vs domain).

### `npm run build` habis RAM

Build di laptop, upload:

```bash
scp -r dist/* alera-fi@IP_PUBLIK:~/alera-fi/web/
scp public/alera-logo.png alera-fi@IP_PUBLIK:~/alera-fi/web/
```

### Situs tidak bisa diakses dari luar

- Tencent Security Group: port 80/443
- `sudo ufw status`
- `sudo systemctl status nginx`

---

## Perintah berguna

| Tugas | Perintah |
|--------|----------|
| Log backend | `docker logs -f alera-backend` |
| Status container | `docker ps -a` |
| Tes Nginx config | `sudo nginx -t` |
| Reload Nginx | `sudo systemctl reload nginx` |
| Isi env di shell | `export $(grep -v '^#' .env \| xargs)` |

---

## Checklist deploy / update

```
[ ] git pull
[ ] .env benar (VITE_API_URL = URL publik yang dipakai user)
[ ] docker build & run (jika ada perubahan backend)
[ ] npm run build && cp dist/* web/ (jika ada perubahan frontend atau VITE_*)
[ ] curl 127.0.0.1:8005/ OK
[ ] curl 127.0.0.1/api/sensors OK
[ ] curl 127.0.0.1/alera-logo.png OK
[ ] browser + login OK
[ ] Supabase URL configuration (setelah ganti IP → domain)
```

---

## Keamanan (disarankan jangka panjang)

- Jangan commit `.env`; rotate key jika pernah bocor.
- Rapikan Tencent Security Group: hapus rule `ALL/ALL`, hanya 2222, 80, 443.
- Batasi SSH (2222) ke IP kantor/rumah jika bisa.
- Backend tetap di `127.0.0.1:8005`, jangan publish port 8005 ke internet.

---

## Dev lokal vs production

| | Lokal | VPS production |
|---|--------|----------------|
| Frontend | `npm run dev` (:8080) | `npm run build` → Nginx `web/` |
| Backend | `python` / uvicorn :8005 | Docker |
| API URL | `http://localhost:8005` | `http://IP` atau `https://domain` |
| Logo | `public/` otomatis (Vite dev) | Harus ada di `web/alera-logo.png` |

Script dev lokal: `bash scripts/start-dev.sh`
