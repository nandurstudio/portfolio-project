# Aplikasi Pemilihan Ketua Koperasi Karya Mandiri

Sistem pemilihan ketua koperasi berbasis web dengan backend Laravel, frontend React, database PostgreSQL, dan Docker.

---

## Stack Teknologi

| Layer | Teknologi |
|-------|-----------|
| Backend | PHP 8.3 + Laravel 11 |
| Auth | JWT (tymon/jwt-auth) |
| Frontend | React 18 + TypeScript + Vite |
| Database | PostgreSQL 16 |
| Container | Docker + Docker Compose |
| Web Server | Nginx (frontend) |

---

## Struktur Proyek

```
koperasi-vote/
├── docker-compose.yml
├── .env.example
├── backend/                    # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/   # AuthController, VoteController, dll
│   │   ├── Http/Middleware/    # JwtMiddleware, RoleMiddleware
│   │   └── Models/             # User, Member, Candidate, Vote, dll
│   ├── config/
│   ├── database/
│   │   ├── migrations/         # 5 migrasi tabel
│   │   └── seeders/            # Data awal (users, candidates, members)
│   └── routes/api.php          # Semua API routes
└── frontend/                   # React + Vite
    └── src/
        ├── pages/              # VoterPage, AdminLoginPage, admin/*
        ├── components/         # UI components
        ├── services/api.ts     # Axios API client
        ├── hooks/useAuth.ts    # Zustand auth store
        └── types/index.ts      # TypeScript types
```

---

## Cara Menjalankan (Docker — Direkomendasikan)

### 1. Clone / ekstrak proyek

```bash
cd koperasi-vote
```

### 2. Buat file .env

```bash
cp .env.example .env
```

Edit `.env` dan isi nilai berikut:

```env
APP_KEY=           # akan di-generate otomatis
JWT_SECRET=        # akan di-generate otomatis
DB_PASSWORD=ganti_password_ini
```

### 3. Jalankan Docker

```bash
docker compose up -d
```

Docker akan otomatis:
- Menjalankan PostgreSQL
- Install dependencies Laravel (`composer install`)
- Generate `APP_KEY` dan `JWT_SECRET`
- Menjalankan migrasi database (`php artisan migrate`)
- Menjalankan seeder (`php artisan db:seed`)
- Build dan serve frontend React

### 4. Buka di browser

| URL | Keterangan |
|-----|------------|
| http://localhost:3000 | Halaman voting (publik) |
| http://localhost:3000/admin | Panel admin |
| http://localhost:8000/api | Backend API |

---

## Cara Menjalankan (Lokal Tanpa Docker)

### Backend

```bash
cd backend

# Install dependencies
composer install

# Salin dan edit .env
cp .env.example .env
# Edit DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD sesuai PostgreSQL lokal

# Generate key
php artisan key:generate
php artisan jwt:secret

# Migrasi dan seed
php artisan migrate --seed

# Jalankan server
php artisan serve
# → Backend berjalan di http://localhost:8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Salin dan edit .env
cp .env.example .env
# VITE_API_URL=http://localhost:8000/api

# Jalankan dev server
npm run dev
# → Frontend berjalan di http://localhost:3000
```

---

## Akun Default (Seeder)

| Username | Password | Role | Akses |
|----------|----------|------|-------|
| `admin` | `admin123` | Admin | Semua fitur termasuk manajemen user & pengaturan |
| `panitia1` | `panitia123` | Panitia | Dashboard, kandidat, anggota, rekap suara, audit |

> ⚠️ **Wajib ganti password** setelah pertama login di produksi!

---

## Data Anggota Demo

| NIK | Nama | Site |
|-----|------|------|
| KRY001 | Ahmad Fauzi | Site A |
| KRY002 | Dewi Susanti | Site B |
| KRY003 | Hendra Wijaya | Site A |
| KRY004 | Rina Marlina | Site C |
| KRY005 | Bambang Sumarto | Site B |
| KRY006 | Fitri Handayani | Site C |
| KRY007 | Dodi Prasetyo | Site A |
| KRY008 | Lestari Wulandari | Site B |

---

## API Endpoints

### Public (tanpa auth)
```
POST /api/auth/admin/login      Login admin/panitia
POST /api/voter/verify          Verifikasi identitas voter
POST /api/voter/cast            Submit suara
GET  /api/candidates            Daftar kandidat
GET  /api/election/info         Info pemilihan
GET  /api/election/stats        Statistik partisipasi
GET  /api/results/public        Hasil (hanya setelah difinalisasi)
```

### Admin + Panitia (Bearer Token)
```
GET  /api/admin/dashboard       Data dashboard
GET  /api/admin/candidates      Daftar kandidat + jumlah suara
POST /api/admin/candidates      Tambah kandidat
PUT  /api/admin/candidates/:id  Edit kandidat
GET  /api/admin/members         Daftar anggota
POST /api/admin/members         Tambah anggota
GET  /api/admin/votes           Rekap suara
GET  /api/admin/results         Hasil perhitungan
GET  /api/admin/audit-log       Log aktivitas
```

### Admin Only
```
DELETE /api/admin/candidates/:id          Hapus kandidat
POST   /api/admin/votes/:id/invalidate    Invalidasi suara
POST   /api/admin/election/finalize       Finalisasi hasil
PUT    /api/admin/election/settings       Update pengaturan
GET    /api/admin/users                   Daftar user
POST   /api/admin/users                   Tambah user
PUT    /api/admin/users/:id               Edit user
DELETE /api/admin/users/:id               Hapus user
```

---

## Aturan Bisnis yang Diimplementasikan

- ✅ Satu anggota hanya bisa memilih 1 kali (enforced di DB level dengan `UNIQUE` constraint)
- ✅ Verifikasi wajib Nama + NIK + Site sesuai data keanggotaan
- ✅ Voter token berbasis enkripsi dengan expiry 30 menit
- ✅ Kolom kandidat pada rekap suara **dirahasiakan** (asas rahasia)
- ✅ Pemenang ditentukan dengan threshold ≥ 50% suara sah
- ✅ Status seri (TIE) terdeteksi otomatis
- ✅ Admin dapat invalidasi suara (member bisa memilih ulang)
- ✅ Audit trail otomatis untuk semua aksi penting
- ✅ Role-based access: admin vs panitia
- ✅ Finalisasi mengunci hasil dan menonaktifkan pemilihan

---

## Deployment ke VPS

```bash
# Di server VPS (Ubuntu)
sudo apt install docker.io docker-compose-plugin -y

# Upload proyek
scp -r koperasi-vote/ user@your-vps:/home/user/

# SSH ke VPS
ssh user@your-vps
cd koperasi-vote

# Edit .env untuk produksi
nano .env

# Jalankan
docker compose up -d

# Cek status
docker compose ps
docker compose logs backend
```

Untuk domain + HTTPS, pasang Nginx Reverse Proxy atau Traefik di depannya.

---

## Pengembangan Lanjutan

Fitur yang bisa ditambahkan:
- Import massal anggota via CSV/Excel
- Export Berita Acara ke PDF
- Notifikasi WhatsApp/Email ke anggota
- OTP verification via nomor HP
- Mode revote otomatis saat seri
- Multi-tenancy (banyak koperasi)
