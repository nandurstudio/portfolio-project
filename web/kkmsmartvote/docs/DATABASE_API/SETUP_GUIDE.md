# KKM Smart Vote - Database Setup Guide

## Quick Start

### 1️⃣ Import Database dengan SQL Seed Script

```bash
# Dari MySQL console atau via terminal:
mysql -u root -p kkmsmartvote < docs/DATABASE_API/insert_anggota_members_bulk.sql
```

Atau, kalau mau recreate database dari Laravel secara penuh:

```bash
cd backend
php artisan migrate:fresh --seed
```

**Yang akan ter-insert:**
- 2 sites (SITE_A, SITE_B)
- 4 members contoh
- 1 election setting
- 4 users/operators
- 2 candidates contoh
- 1 voucher schema set

---

## 👤 Admin / Operator Login

### Credentials (Development)

| Username | Password | Role |
|----------|----------|------|
| `nandang` | `admin123` | **super_admin** ✅ |
| `beny.santoso` | `panitia123` | panitia |
| `ibnu.setiawan` | `saksi123` | saksi_forensik |
| `abdul.halim` | `panitia123` | panitia |

**⚠️ IMPORTANT (PRODUCTION):**
- Jangan gunakan password contoh di production
- Generate password baru via Laravel:
  ```bash
  php artisan tinker
  >>> Hash::make('your_new_password')
  ```
- Copy hash ke database manual atau update SQL script
- Ganti di file ini juga untuk dokumentasi

---

## ➕ Cara Menambah Anggota Baru

### Metode 1: Edit SQL Script

**File:** `docs/DATABASE_API/insert_anggota_members_bulk.sql`

**Step 1:** Buka section seed members

**Step 2:** Tambah data anggota langsung di array seeder

**Step 3:** Tambah baris baru:

```php
[
    'nik' => '210500077',
    'name' => 'BUDI SANTOSO',
    'site' => 'SITE_A',
    'department' => 'CRM - F A',
]
```

**Contoh:**
```php
DB::table('members')->updateOrInsert(...)
```

**Step 4:** Jalankan ulang script:
```bash
mysql -u root -p kkmsmartvote < docs/DATABASE_API/insert_anggota_members_bulk.sql
```

### Metode 2: Laravel Seeder (Recommended untuk development)

**File:** `backend/database/seeders/MemberSeeder.php`

```php
DB::table('members')->updateOrInsert(
    ['nik' => '210500077'],
    [
        'name' => 'BUDI SANTOSO',
        'site' => 'SITE_A',
        'department' => 'CRM - F A',
        'email' => null,
        'is_eligible' => true,
        'has_voted' => false,
    ]
);
```

Kemudian:
```bash
php artisan db:seed --class=MemberSeeder
```

### Metode 3: Admin UI (Production - belum dibangun)

- Nanti bisa via dashboard admin
- Upload CSV file
- Manual form input

---

## 🧾 Struktur Data Anggota

Schema ini tidak memakai tabel `departments`.

- `site` disimpan sebagai kode site di tabel `members`
- `department` disimpan sebagai string langsung di tabel `members`
- Jika perlu site baru, tambahkan dulu ke tabel `sites`

---

## 👥 Role & Permission Matrix

### Role Hierarchy

```
super_admin (Full Access)
├── admin (Limited Write)
├── panitia (Limited Read)
└── saksi_forensik (Audit Read-Only)
```

### Access Matrix

| Role | Dashboard | Election Settings | Candidate Mgmt | Member Mgmt | Vote Mgmt | Audit | Voucher | Access Control | Landing |
|------|-----------|-------------------|----------------|-------------|----------|-------|---------|------------|----------------|---------|
| **super_admin** | CRUD | CRUD | CRUD | CRUD | R | R | CRUD | CRUD | CRUD |
| **admin** | CRU | RU | CRU | CRU | R | R | CRUD | - | RU |
| **panitia** | R | - | - | R | R | R | - | - | - |
| **saksi_forensik** | R | - | - | - | R | R | - | - | - |

**Legend:** C=Create, R=Read, U=Update, D=Delete

---

## 🔐 Password Hashing Info

### Current Hash (Development)

Password contoh di-hash dengan bcrypt. Gunakan `Hash::make()` untuk menghasilkan hash baru.

### Generate Hash Baru

**Option 1: Via Laravel Tinker**
```bash
php artisan tinker
>>> Hash::make('your_new_password')
=> "$2y$12/..."
```

**Option 2: Via PHP CLI**
```bash
php -r "echo password_hash('your_new_password', PASSWORD_BCRYPT);"
```

**Option 3: Online (untuk testing saja)**
- https://bcrypt-generator.com/
- ⚠️ **NEVER untuk production!** Jangan copy hash dari online ke production

---

## 🔄 Sync & Testing Workflow

### Local Development (Laragon)

```powershell
# 1. Edit docs/DATABASE_API/insert_anggota_members_bulk.sql atau backend/database/seeders/

# 2. Copy ke Laragon
.\run-and-sync.ps1

# 3. Import database
cd F:\laragon\www\koperasi-vote\backend
mysql -u root < ..\..\..\..\folioflix\web\kkmsmartvote\docs\DATABASE_API\insert_anggota_members_bulk.sql

# 4. Atau via seeder
php artisan db:seed --class=MemberSeeder

# 5. Login di http://localhost:5173/admin
# Username: nandang
# Password: admin123
```

### Production Deploy

```bash
# 1. Edit docs/DATABASE_API/insert_anggota_members_bulk.sql di portfolio repo
# 2. Commit & push
# 3. SSH ke server
# 4. Pull latest code
# 5. Run seeder
php artisan migrate --force
php artisan db:seed --force

# Or import raw SQL
mysql -u root -p < docs/DATABASE_API/insert_anggota_members_bulk.sql
```

---

## 🎯 Election Settings

**Saat ini:**
- Election Name: Pemilihan Ketua Koperasi 2026
- Period: 2024-2027
- Status: aktif/tidak aktif via `is_active`
- Method: 50%+1 ada di dokumentasi phase 1

**Untuk edit:**

```sql
UPDATE election_settings
SET
    election_name = 'Pemilihan Ketua Koperasi 2026',
    period = '2024-2027',
    start_date = '2026-04-04',
    end_date = '2026-04-05',
    end_time = '17:00:00',
    is_active = 1,
    is_finalized = 0
WHERE id = 1;
```

---

## 📋 Checklist Setup

- [ ] Import database dengan `insert_anggota_members_bulk.sql`
- [ ] Verify members ter-insert: `SELECT COUNT(*) FROM members;`
- [ ] Verify 4 users ter-insert: `SELECT * FROM users;`
- [ ] Login dengan username `nandang` / password `admin123`
- [ ] Akses dashboard admin
- [ ] Verify permission checks (panitia hanya bisa lihat menu tertentu)
- [ ] Setup candidates (belum ada template)
- [ ] Setup voter landing page state
- [ ] Run OTP flow test (email OTP)

---

## 🆘 Troubleshooting

### Error: "Foreign key constraint fails"

**Cause:** Site code yang dipakai di member belum ada di tabel `sites`

**Solution:**
```sql
-- Check sites exist
SELECT * FROM sites;

- If missing, re-run insert_anggota_members_bulk.sql
```

### Error: "Duplicate entry for key nik"

**Cause:** Member dengan NIK yang sama sudah ada

**Solution:**
```sql
-- Delete old data
DELETE FROM members WHERE nik = '190400122';

- Then re-run insert_anggota_members_bulk.sql
```

### Cannot login (password not recognized)

**Cause:** Password hash tidak cocok atau belum di-update

**Solution:**
```php
// Via Laravel tinker
php artisan tinker
>>> $user = User::where('username', 'nandang')->first();
>>> $user->password = Hash::make('admin123');
>>> $user->save();
```

---

## 📞 Need Help?

1. Check [SCHEMA.md](./SCHEMA.md) untuk struktur table lengkap
2. Check backend migrations: `backend/database/migrations/`
3. Check backend seeders: `backend/database/seeders/`
4. Ask in docs atau GitHub issues

---

**Last Updated:** April 9, 2026
**Status:** ✅ Ready for Development
