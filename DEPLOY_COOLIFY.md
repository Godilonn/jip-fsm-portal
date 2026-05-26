# Deploy ke VPS via Coolify

Coolify otomatis handle: reverse proxy, SSL (HTTPS), domain, logs, restart otomatis.
Tidak perlu setup Nginx manual.

---

## Step 1 — Install Coolify di VPS

SSH ke VPS kamu:
```bash
ssh root@IP_VPS_KAMU
```

Jalankan installer Coolify (satu perintah):
```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Tunggu ~2 menit. Setelah selesai, buka browser:
```
http://IP_VPS_KAMU:8000
```

Buat akun admin (email + password). Selesai.

---

## Step 2 — Upload Project ke VPS

Dari komputer lokal (PowerShell / Terminal), upload folder project:
```bash
scp -r "C:\PATH\ke\sistem-manajemen-servis-printer" root@IP_VPS_KAMU:/opt/jip-fsm
```

> Atau bisa pakai **FileZilla** / **WinSCP** jika lebih nyaman GUI.

---

## Step 3 — Tambah Server di Coolify

1. Login ke Coolify → **Servers** → **Add Server**
2. Pilih **Local** (VPS itu sendiri) → **Validate & Save**

---

## Step 4 — Buat Project & Deploy App

1. **Projects** → **New Project** → beri nama "JIP FSM Portal"
2. **Add Resource** → **Docker Compose**
3. Pilih server yang tadi ditambahkan
4. Di bagian **Docker Compose Location**, pilih:
   - **Load from server path**: `/opt/jip-fsm/docker-compose.yml`
5. Klik **Save**

---

## Step 5 — Set Environment Variables

Di halaman resource, masuk ke tab **Environment Variables**, lalu isi:

| Key | Value |
|-----|-------|
| `POSTGRES_DB` | `jip_fsm_db` |
| `POSTGRES_USER` | `jip_user` |
| `POSTGRES_PASSWORD` | *(password kuat, min 20 karakter)* |
| `BETTER_AUTH_SECRET` | *(random string, generate: `openssl rand -base64 32`)* |
| `BETTER_AUTH_URL` | `http://IP_VPS_KAMU` *(ganti ke https://domain setelah SSL aktif)* |
| `GEMINI_API_KEY` | *(API key Gemini kamu)* |

---

## Step 6 — Deploy

Klik tombol **Deploy**. Coolify akan:
- Build Docker image dari `Dockerfile`
- Start container PostgreSQL + App
- Expose app di port 3000

App bisa diakses di: `http://IP_VPS_KAMU:3000`

---

## Step 7 — Jalankan Migrasi Database

Setelah container jalan, jalankan migrasi sekali:

1. Di Coolify → resource **app** → tab **Terminal**
2. Ketik:
```bash
npm run db:migrate
```

Atau via SSH:
```bash
docker exec -it jip_app npm run db:migrate
```

---

## Step 8 — Pasang Domain & SSL (Opsional)

Jika sudah punya domain:

1. Di DNS domain kamu, tambah record:
   ```
   A    @    IP_VPS_KAMU
   ```
2. Di Coolify → resource **app** → tab **Domains**
3. Masukkan domain: `https://domain-kamu.com`
4. Coolify otomatis request SSL dari Let's Encrypt ✅
5. Update `BETTER_AUTH_URL` → `https://domain-kamu.com`
6. Deploy ulang

---

## Perintah Berguna (via SSH)

```bash
# Cek status container
docker compose -f /opt/jip-fsm/docker-compose.yml ps

# Lihat log app realtime
docker logs -f jip_app

# Lihat log postgres
docker logs -f jip_postgres

# Restart app
docker restart jip_app

# Update app (setelah upload file baru)
cd /opt/jip-fsm
docker compose up -d --build app
```
