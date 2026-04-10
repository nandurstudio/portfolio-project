# 🗄️ Database Schema (Current MVP + Phase 1 Changes)

**Total Tables:** 6 (MVP) + 2 (Phase 1) = 8 tables
**Last Updated:** April 8, 2026

---

## 📊 **Database Overview**

### MVP Tables (Phase 0) ✅
1. **users** - Admin/Panitia accounts
2. **members** - Voter registration
3. **candidates** - Election candidates
4. **votes** - Recorded votes
5. **election_settings** - Election configuration
6. **audit_logs** - System activity tracking


### Phase 1 New Tables 🔴
7. **vouchers** - Voucher codes & management
8. **voter_vouchers** - Voucher allocation to voters

---

## 📝 **Table: users**

**Purpose:** Admin/Panitia authentication & authorization

**Columns:**

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | INT | PK, AI | Admin ID |
| name | VARCHAR(255) | NOT NULL | Full name |
| username | VARCHAR(100) | UNIQUE, NOT NULL | Login username |
| password | VARCHAR(255) | NOT NULL | Hashed (bcrypt) |
| **role** | ENUM | NEW, NOT NULL | 'super_admin', 'admin', 'panitia', 'saksi_forensik' |
| remember_token | VARCHAR(100) | NULLABLE | Session token |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes:**
```sql
UNIQUE KEY (username)
INDEX (role)
```

### Role Model (Operator + Voter)

- Operator login dashboard disimpan di tabel `users`.
- Voter/user biasa tidak wajib akun `users`; voter menggunakan identitas `members` + OTP/JWT flow.
- Admin/panitia/saksi_forensik juga bisa voting sebagai voter biasa, tetapi saat login dashboard tetap mengikuti role operator masing-masing.

| Role | Scope | Write Access | Read Access | Catatan |
|------|-------|-------------|------------|---------|
| super_admin | Kontrol sistem penuh | Ya (semua modul) | Ya (semua modul) | Hanya sedikit akun trusted |
| admin | Operasional inti | Ya (kandidat, member, voucher, setting inti) | Ya (audit penuh) | Tidak untuk konfigurasi super-kritis jika dipisah |
| panitia | Operasional terbatas | Ya (modul tertentu) | Ya (dashboard operasional) | Tanpa akses invalidasi sensitif level tinggi |
| saksi_forensik | Forensik digital (read-only) | Tidak | Ya (forensic views yang disanitasi) | Tidak boleh ubah data |
| voter | Akses publik voting | Tidak via dashboard operator | Hanya data diri sendiri (via OTP/JWT) | Berbasis tabel `members` |

### Akses Khusus Saksi Forensik

- Diizinkan:
  - Lihat timeline event: OTP requested, OTP verified, vote submitted, vote invalidated, voucher granted.
  - Lihat agregat integritas: total eligible, total voted, total invalid, distribusi per site.
  - Export laporan audit read-only (CSV/PDF) dengan watermark dan timestamp.
- Tidak diizinkan:
  - Mengubah data apapun.
  - Melihat relasi langsung voter -> candidate untuk menjaga kerahasiaan pilihan.
  - Melihat data payout sensitif full (misalnya nomor GoPay lengkap), kecuali masking.

---

**Sample Data:**
```
1, "Admin User", "admin", "\$2y\$10\$...", "super_admin", NULL, 2026-04-02, 2026-04-02
2, "Panitia 1", "panitia1", "\$2y\$10\$...", "panitia", NULL, 2026-04-02, 2026-04-02
3, "Saksi Forensik", "saksi_forensik1", "\$2y\$10\$...", "saksi_forensik", NULL, 2026-04-05, 2026-04-05
```

---

## 👥 **Table: members**

**Purpose:** Voter registration & eligibility tracking

**Columns:**

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | INT | PK, AI | Member ID (auto) |
| nik | VARCHAR(20) | UNIQUE, NOT NULL | National ID (voter identifier) |
| name | VARCHAR(255) | NOT NULL | Full name |
| site | VARCHAR(100) | NOT NULL | Location/site code |
| department | VARCHAR(150) | NULLABLE | Departemen/divisi anggota (sumber import master) |
| email | VARCHAR(255) | NULLABLE | Email untuk OTP dan notifikasi |
| gopay_number | VARCHAR(20) | NULLABLE | Nomor GoPay voter |
| is_gopay_owner_self | BOOLEAN | DEFAULT true | Checkbox: "Apakah akun gopay milik anda sendiri?" |
| gopay_owner_number | VARCHAR(20) | NULLABLE | Nomor GoPay orang lain (wajib jika is_gopay_owner_self = false) |
| is_eligible | BOOLEAN | DEFAULT true | Can vote? |
| **has_voted** | BOOLEAN | DEFAULT false | Already voted? |
| created_at | TIMESTAMP | DEFAULT NOW() | Registration time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes:**
```sql
UNIQUE KEY (nik)
INDEX (site)
INDEX (department)
INDEX (email)
INDEX (gopay_owner_number)
INDEX (has_voted)
```

**Source Import Mapping (Sample NIK / Nama / Dept):**

| Source Column | Target Field | Notes |
|---------------|--------------|-------|
| NIK | nik | Wajib unique |
| Nama Anggota | name | Nama lengkap voter |
| Departemen | department | Dapat dipakai untuk segmentasi, filter, dan audit |
| Site/Lokasi | site | Jika ada, tetap dipakai sebagai lokasi/situs |
| Email | email | Dipakai untuk OTP dan status notifikasi |

**Sample Import Data:**
```
190400122, WINDY KHAIRUNNISA, CORPORATE QA - QUALITY & FOOD SAFETY, Site/Dept source
230700121, ENDANG SETYOWATI WIDYANINI, CRM - F A, Site/Dept source
220300148, LATIFAH, CRM - F A, Site/Dept source
220300150, YUNIAR IIS FAEROSI, CRM - F A, Site/Dept source
```

---

## 🗺️ **Table: sites** (Master Site)

**Purpose:** master referensi site/lokasi untuk dropdown searchable di form voter.

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | INT | PK, AI | Site ID |
| code | VARCHAR(100) | UNIQUE, NOT NULL | Kode site, dipakai sebagai referensi |
| name | VARCHAR(255) | NOT NULL | Nama site/lokasi |
| is_active | BOOLEAN | DEFAULT true | Site aktif untuk dipilih |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes:**
```sql
UNIQUE KEY (code)
INDEX (is_active)
INDEX (name)
```

**Relation:**
```text
members.site -> sites.code (lookup/master)
```

---

## 🔐 **Table: email_otps** (Phase 2 Draft)

**Purpose:** menyimpan request OTP login berbasis email untuk voter flow.

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | BIGINT | PK, AI | OTP record ID |
| email | VARCHAR(255) | NOT NULL | Email tujuan OTP |
| member_nik | VARCHAR(20) | NULLABLE | NIK yang sedang diverifikasi |
| otp_hash | VARCHAR(255) | NOT NULL | Hash OTP, jangan simpan plaintext |
| expires_at | DATETIME | NOT NULL | Masa berlaku OTP |
| attempts | INT | DEFAULT 0 | Jumlah percobaan input OTP |
| is_used | BOOLEAN | DEFAULT false | OTP sudah dipakai atau belum |
| requested_ip | VARCHAR(45) | NULLABLE | IP saat request OTP |
| user_agent | VARCHAR(255) | NULLABLE | Ringkasan perangkat/browser |
| created_at | TIMESTAMP | DEFAULT NOW() | Waktu request |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes:**
```sql
INDEX (email)
INDEX (member_nik)
INDEX (expires_at)
INDEX (is_used)
```

**Rules:**
```text
OTP dikirim ke email yang diinput user.
OTP wajib divalidasi sebelum NIK dan voting.
OTP expired harus ditolak cepat tanpa query berat.
```

**Sample Data:**
```
1, "190400122", "WINDY KHAIRUNNISA", "Site A", "CORPORATE QA - QUALITY & FOOD SAFETY", "windy@example.com", true, false, 2026-04-02, 2026-04-02
2, "230700121", "ENDANG SETYOWATI WIDYANINI", "Site B", "CRM - F A", "endang@example.com", true, false, 2026-04-02, 2026-04-02
3, "220300148", "LATIFAH", "Site A", "CRM - F A", "latifah@example.com", true, true, 2026-04-02, 2026-04-04 (voted)
```

---

## 🏃 **Table: candidates**

**Purpose:** Election candidates & their details

**Columns:**

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | INT | PK, AI | Candidate ID |
| name | VARCHAR(255) | NOT NULL | Full name |
| position | VARCHAR(100) | NOT NULL | Role (Ketua, Wakil, etc) |
| bio | TEXT | NULLABLE | Biography/description |
| photo_url | VARCHAR(255) | NULLABLE | Avatar URL |
| is_active | BOOLEAN | DEFAULT true | Eligible to run? |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes:**
```sql
INDEX (is_active)
```

**Sample Data:**
```
1, "Candidate A", "Ketua", "Experienced...", "/images/cand_a.jpg", true, 2026-04-02, 2026-04-02
2, "Candidate B", "Ketua", "Passionate...", "/images/cand_b.jpg", true, 2026-04-02, 2026-04-02
```

---

## 🗳️ **Table: votes**

**Purpose:** Record individual votes (with anonymity for choice)

**Columns:**

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | INT | PK, AI | Vote ID |
| member_nik | VARCHAR(20) | FK (members.nik) | Who voted (voter identity) |
| member_name | VARCHAR(255) | NOT NULL | Voter name (for audit) |
| site | VARCHAR(100) | NOT NULL | Voting location |
| candidate_id | INT | FK (candidates.id) | Who they voted for (PRIVATE) |
| is_valid | BOOLEAN | DEFAULT true | Valid vote? |
| ip_address | VARCHAR(45) | NOT NULL | Voting IP |
| invalidated_at | TIMESTAMP | NULLABLE | When invalidated (if any) |
| invalidation_reason | TEXT | NULLABLE | Why invalidated |
| created_at | TIMESTAMP | DEFAULT NOW() | Vote timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes:**
```sql
UNIQUE KEY (member_nik, candidate_id)  ← Prevent duplicate voting
FK (member_nik) → members(nik)
FK (candidate_id) → candidates(id)
INDEX (is_valid)
INDEX (created_at)
```

**Sample Data:**
```
1, "123456789", "John Doe", "Site A", 1, true, "192.168.1.1", NULL, NULL, 2026-04-04 10:30, 2026-04-04
2, "987654321", "Jane Smith", "Site B", 2, true, "192.168.1.2", NULL, NULL, 2026-04-04 11:15, 2026-04-04
3, "111222333", "Bob Wilson", "Site A", 1, false, "192.168.1.3", 2026-04-04 12:00, "Duplicate voting", 2026-04-04, 2026-04-04
```

---

## ⚙️ **Table: election_settings**

**Purpose:** Election configuration & scheduling

**Columns:**

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | INT | PK (usually 1) | Config ID |
| election_name | VARCHAR(255) | NOT NULL | Event title |
| period | VARCHAR(100) | NOT NULL | Year range (2026-2029) |
| start_date | DATE | NOT NULL | Election start date |
| end_date | DATE | NOT NULL | Election end date |
| end_time | TIME | NOT NULL | Voting deadline time |
| is_active | BOOLEAN | DEFAULT true | Election ongoing? |
| is_finalized | BOOLEAN | DEFAULT false | Results locked? |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Sample Data:**
```
1, "Pemilihan Ketua Koperasi 2026", "2024-2027", "2026-04-04", "2026-04-05", "17:00:00", true, false, 2026-04-02, 2026-04-02
```

---

## 📋 **Table: audit_logs**

**Purpose:** Track all system activities for compliance & debugging

**Columns:**

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | INT | PK, AI | Log ID |
| actor | VARCHAR(255) | NOT NULL | Who did it (username or SYSTEM) |
| action | VARCHAR(100) | NOT NULL | What (LOGIN, CREATE, DELETE, etc) |
| detail | JSON | NOT NULL | Details (what changed) |
| ip_address | VARCHAR(45) | NOT NULL | Request IP |
| logged_at | TIMESTAMP | DEFAULT NOW() | Timestamp |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation |

**Indexes:**
```sql
INDEX (actor)
INDEX (action)
INDEX (logged_at)
```

**Sample Data:**
```
1, "admin", "LOGIN", {"username": "admin"}, "192.168.1.1", 2026-04-02 08:00:00, 2026-04-02
2, "admin", "VOTE_INVALIDATED", {"vote_id": 3, "reason": "Duplicate"}, "192.168.1.1", 2026-04-04 12:01:00, 2026-04-04
3, "SYSTEM", "VOUCHER_GRANTED", {"voter_nik": "123456789", "voucher_id": 1}, "192.168.1.100", 2026-04-04 10:31:00, 2026-04-04
```

---

## 🎁 **Table: vouchers** (Phase 1 NEW)

**Purpose:** Manage reward vouchers for voters

**Columns:**

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | INT | PK, AI | Voucher ID |
| code | VARCHAR(100) | UNIQUE, NOT NULL | Encrypted voucher code |
| value | DECIMAL(10,2) | NOT NULL | Amount (Rp) |
| status | ENUM | DEFAULT 'active' | 'active', 'redeemed', 'expired', 'canceled' |
| expires_at | TIMESTAMP | NULLABLE | Expiration date |
| created_by | INT | FK (users.id) | Admin who created |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes:**
```sql
UNIQUE KEY (code)
FK (created_by) → users(id)
INDEX (status)
INDEX (expires_at)
```

**Sample Data:**
```
1, "VOUCHER001", "50000.00", "active", "2026-05-31", 1, 2026-04-02, 2026-04-02
2, "VOUCHER002", "50000.00", "redeemed", "2026-05-31", 1, 2026-04-02, 2026-04-04
3, "VOUCHER003", "50000.00", "active", "2026-05-31", 1, 2026-04-02, 2026-04-02
```

---

## 🎯 **Table: voter_vouchers** (Phase 1 NEW)

**Purpose:** Track which voter received/redeemed which voucher

**Columns:**

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | INT | PK, AI | Record ID |
| voter_nik | VARCHAR(20) | FK (members.nik) | Voter NIK |
| voucher_id | INT | FK (vouchers.id) | Voucher ID |
| granted_at | TIMESTAMP | NOT NULL | When voter got voucher |
| redeemed_at | TIMESTAMP | NULLABLE | When redeemed (NULL if not yet) |
| redeemed_by | VARCHAR(255) | NULLABLE | Merchant name |
| redemption_code | VARCHAR(100) | NULLABLE | Transaction reference |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation |

**Indexes:**
```sql
UNIQUE KEY (voter_nik, voucher_id)  ← One voucher per voter
FK (voter_nik) → members(nik)
FK (voucher_id) → vouchers(id)
INDEX (redeemed_at)
```

**Sample Data:**
```
1, "123456789", 1, "2026-04-04 10:31:00", NULL, NULL, NULL, 2026-04-04 10:31:00
2, "987654321", 2, "2026-04-04 11:16:00", "2026-04-04 14:30:00", "Merchant A", "TRX123", 2026-04-04 11:16:00
3, "111222333", 3, "2026-04-04 12:01:00", NULL, NULL, NULL, 2026-04-04 12:01:00
```

---

## 🔗 **Relationships (Entity Relationship Diagram)**

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ id (PK)         │
│ username (UQ)   │  ◄──┐
│ role (NEW)      │     │
└─────────────────┘     │
        │               │
        │ created_by    │ (1:N)
        │               │
        ▼               │
┌──────────────────┐    │
│    vouchers      │    │
├──────────────────┤    │
│ id (PK)          │    │
│ code (UQ, NEW)   │    │
│ status (NEW)     │    │
└──────────────────┘    │
        │               │
        │ (1:N)         │
        │               │
        ▼               │
┌─────────────────────┐ │
│  voter_vouchers     │ │
├─────────────────────┤ │
│ id (PK)             │ │
│ voter_nik (FK, UQ)  │ │
│ voucher_id (FK, UQ) │ │
│ granted_at (NEW)    │ │
│ redeemed_at (NEW)   │ │
└─────────────────────┘ │
        │               │ (foreign key to users.id)
        │               │
        │ (donor:members.nik)
        │               │
        ▼               └───────────► (assignment)
┌─────────────────┐
│    members      │
├─────────────────┤
│ id (PK)         │
│ nik (UQ)        │
│ has_voted       │
└─────────────────┘
        │
        │ (voter in vote)
        │
        ▼
┌─────────────────┐
│     votes       │
├─────────────────┤
│ id (PK)         │
│ member_nik (FK) │
│ candidate_id(FK)│
│ is_valid        │
└─────────────────┘
        │
        │
        ▼
┌──────────────────┐
│   candidates     │
├──────────────────┤
│ id (PK)          │
│ name             │
│ is_active        │
└──────────────────┘


┌───────────────────────┐
│ election_settings     │
├───────────────────────┤
│ id (usually 1)        │
│ election_name         │
│ is_active             │
│ is_finalized          │
└───────────────────────┘


┌─────────────────┐
│  audit_logs     │
├─────────────────┤
│ id (PK)         │
│ actor           │
│ action          │
│ detail (JSON)   │
│ logged_at       │
└─────────────────┘
```

---

## 🔑 **Foreign Key Constraints**

```sql
ALTER TABLE vouchers
  ADD CONSTRAINT fk_vouchers_created_by
  FOREIGN KEY (created_by) REFERENCES users(id);

ALTER TABLE voter_vouchers
  ADD CONSTRAINT fk_voter_vouchers_voter
  FOREIGN KEY (voter_nik) REFERENCES members(nik),
  ADD CONSTRAINT fk_voter_vouchers_voucher
  FOREIGN KEY (voucher_id) REFERENCES vouchers(id);

ALTER TABLE votes
  ADD CONSTRAINT fk_votes_member
  FOREIGN KEY (member_nik) REFERENCES members(nik),
  ADD CONSTRAINT fk_votes_candidate
  FOREIGN KEY (candidate_id) REFERENCES candidates(id);
```

---

## 📊 **Pivot/Junction Tables**

```
voter_vouchers
├─ Single responsibility: track voucher allocation
├─ Unique constraint: (voter_nik, voucher_id)
├─ Can add timestamps: granted_at, redeemed_at
└─ Can add metadata: redemption_code, redeemed_by
```

---

## 🔍 **Query Examples**

### Count Total Votes
```sql
SELECT COUNT(*) as total_votes
FROM votes
WHERE is_valid = true;
```

### Calculate Results (50%+1)
```sql
SELECT
  c.id,
  c.name,
  COUNT(v.id) as vote_count,
  ROUND(100.0 * COUNT(v.id) / (SELECT COUNT(*) FROM votes WHERE is_valid = true), 2) as percentage
FROM candidates c
LEFT JOIN votes v ON c.id = v.candidate_id AND v.is_valid = true
GROUP BY c.id
ORDER BY vote_count DESC;
```

### Get Voted Members (For Saksi)
```sql
SELECT DISTINCT m.id, m.nik, m.name, m.site, v.created_at as voted_at
FROM members m
INNER JOIN votes v ON m.nik = v.member_nik AND v.is_valid = true
ORDER BY v.created_at DESC;
```

### Check Voucher Status
```sql
SELECT
  v.code,
  v.value,
  COALESCE(vv.redeemed_at, 'Not Redeemed') as status,
  CASE
    WHEN vv.redeemed_at IS NOT NULL THEN 'Redeemed'
    WHEN NOW() > v.expires_at THEN 'Expired'
    ELSE 'Active'
  END as current_status
FROM vouchers v
LEFT JOIN voter_vouchers vv ON v.id = vv.voucher_id;
```

### Audit Trail
```sql
SELECT * FROM audit_logs
WHERE actor = 'admin' OR action = 'VOUCHER_REDEEMED'
ORDER BY logged_at DESC
LIMIT 100;
```

---

## 🔐 **Data Privacy Notes**

| Data | Private? | Who Can See | Notes |
|------|----------|-----------|-------|
| Vote Choice | ✅ YES | Admin only | Member's nik + candidate_id = hidden |
| Member List | ⚠️ PARTIAL | Admin/Panitia | Saksi sees only voted members |
| Audit Logs | ✅ YES | Admin only | Who did what when |
| Voucher Codes | ✅ YES | Encrypted | Store encrypted in DB |
| IP Addresses | ✅ YES | Admin only | For security audit trail |

---

## 📈 **Performance Considerations**

**Indexes for common queries:**
```sql
-- Voting results calculation
INDEX votes (is_valid, candidate_id)
INDEX members (has_voted, site)

-- Saksi member view
INDEX members (has_voted)
INDEX votes (member_nik, is_valid)

-- Voucher redemption
INDEX voter_vouchers (voter_nik, voucher_id)
INDEX vouchers (status, expires_at)

-- Audit logs
INDEX audit_logs (logged_at, action)
INDEX audit_logs (actor)
```

---

## 🚀 **Migration Order (Phase 1)**

```
1. Add role='saksi' to users.role ENUM
2. Create vouchers table
3. Create voter_vouchers table
4. Add status & threshold columns to results (logic)
5. Run locally first, then on staging, then production
```

---

## ✅ **Validation Rules**

```
users.role: IN ('super_admin', 'admin', 'panitia', 'saksi_forensik')
members.nik: NOT NULL, UNIQUE, LENGTH(20)
members.site: NOT NULL, VARCHAR(100)
members.gopay_number: NULLABLE, jika diisi format nomor Indonesia (08xx atau 62xx)
members.is_gopay_owner_self: BOOLEAN, default true
members.gopay_owner_number: REQUIRED jika is_gopay_owner_self = false
members.gopay_owner_number: MUST be NULL jika is_gopay_owner_self = true
candidates.name: NOT NULL, UNIQUE
vouchers.code: NOT NULL, UNIQUE, LENGTH(100)
vouchers.value: DECIMAL(10,2), >= 0
vouchers.expires_at: Can be NULL (never expires) or DATE > TODAY
votes.is_valid: BOOLEAN, cannot change after invalidated_at is set
```

Tambahan aturan auth:
```text
Voter role berjalan via members + OTP/JWT (bukan login users dashboard)
saksi_forensik: seluruh endpoint wajib read-only
aksi sensitif (invalidate vote, ubah setting election, ubah role) hanya super_admin/admin
```

---

## 💡 **Brainstorming Schema Lanjutan (Diskusi April 8, 2026)**

### 1) Candidate addition for payout clarity
- Tambahkan `members.gopay_display_name` (nullable) agar admin bisa verifikasi nama pemilik rekening saat transfer reward.

### 2) Better normalization (opsional, jika scale membesar)
- Pisahkan data payout ke tabel baru `member_payout_profiles`:
  - `member_id`, `is_owner_self`, `owner_number`, `owner_name`, `verification_status`, `verified_at`.
- Cocok untuk multi-metode pembayaran ke depan (GoPay, OVO, Dana, bank).

### 3) Audit compliance for payout edits
- Setiap perubahan nomor GoPay (utama atau pemilik lain) wajib masuk `audit_logs` dengan action:
  - `GOPAY_PROFILE_UPDATED`
  - `GOPAY_OWNER_CHANGED`

### 4) UX/API consistency
- API payload yang disarankan:
  - `gopay_number`
  - `is_gopay_owner_self`
  - `gopay_owner_number`
- Frontend rule:
  - Jika checkbox dicentang: field `gopay_owner_number` hidden + auto null.
  - Jika checkbox tidak dicentang: field `gopay_owner_number` wajib diisi.

### 5) Risk control
- Tambahkan throttle update nomor GoPay (misalnya maksimal 2x perubahan/hari per member) untuk mencegah penyalahgunaan setelah vote.
- Kunci perubahan nomor setelah status tertentu (contoh: voucher sudah dibagikan).

---

## 🌐 **Landing Page Schema (Phase 2 Draft)**

Catatan: section ini adalah rancangan untuk kebutuhan landing page state-driven. Belum dihitung sebagai tabel aktif MVP/Phase 1.

### A) Extend `election_settings` (disarankan)

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| status | ENUM | NOT NULL, DEFAULT 'coming_soon' | `coming_soon`, `open`, `closed` |
| start_at | DATETIME | NULLABLE | Waktu mulai voting |
| voting_duration_days | INT | NOT NULL, DEFAULT 2 | Durasi voting (hari) |
| end_at | DATETIME | NULLABLE | Auto-calc dari `start_at + voting_duration_days` (bisa override admin) |
| announcement_at | DATETIME | NULLABLE | Waktu acara pengumuman/acara inti |
| agenda_title | VARCHAR(255) | NULLABLE | Judul agenda landing |
| agenda_description | TEXT | NULLABLE | Deskripsi agenda landing |
| agenda_location | VARCHAR(255) | NULLABLE | Lokasi agenda |
| show_countdown | BOOLEAN | DEFAULT true | Toggle countdown |
| show_public_activity_log | BOOLEAN | DEFAULT true | Toggle mini activity log |
| reward_enabled | BOOLEAN | DEFAULT false | Toggle reward voter |
| reward_text | VARCHAR(255) | NULLABLE | Contoh: Voucher GoPay senilai Rp25.000 |
| invitation_mode | ENUM | DEFAULT 'online' | `offline`, `online`, `hybrid` |
| seo_title | VARCHAR(255) | NULLABLE | SEO title landing |
| seo_description | VARCHAR(320) | NULLABLE | SEO description landing |
| og_title | VARCHAR(255) | NULLABLE | Optional override OG title |
| og_description | VARCHAR(320) | NULLABLE | Optional override OG description |
| og_image_url | VARCHAR(255) | NULLABLE | URL gambar OG 1200x630 |
| canonical_url | VARCHAR(255) | NULLABLE | Canonical landing |

**Indexes (tambahan):**
```sql
INDEX (status)
INDEX (start_at)
INDEX (end_at)
INDEX (announcement_at)
```

### B) New table `public_vote_activities` (disarankan)

Purpose: sumber mini activity log publik (top 10, collapsible, pagination) tanpa menampilkan data sensitif.

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | BIGINT | PK, AI | Activity ID |
| member_nik | VARCHAR(20) | NULLABLE | Untuk korelasi internal (opsional tampil publik) |
| display_name | VARCHAR(255) | NOT NULL | Nama yang ditampilkan, bisa dimasking |
| site | VARCHAR(100) | NULLABLE | Site asal voter |
| event_type | VARCHAR(50) | NOT NULL | Default `VOTED` |
| occurred_at | DATETIME | NOT NULL | Waktu aktivitas |
| created_at | TIMESTAMP | DEFAULT NOW() | Waktu create |

**Indexes:**
```sql
INDEX (occurred_at)
INDEX (event_type, occurred_at)
INDEX (site, occurred_at)
```

### C) New table `member_invitations` (disarankan)

Purpose: dukung logic undangan OFFLINE/ONLINE/HYBRID per member saat status `closed` atau event pengumuman.

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | BIGINT | PK, AI | Invitation ID |
| member_nik | VARCHAR(20) | FK (members.nik), NOT NULL | Voter target |
| invitation_type | ENUM | NOT NULL | `offline`, `online` |
| is_invited | BOOLEAN | DEFAULT false | Penanda user diundang |
| invited_by | INT | FK (users.id), NULLABLE | Admin/panitia yang menetapkan |
| invited_at | DATETIME | NULLABLE | Waktu undangan aktif |
| note | VARCHAR(255) | NULLABLE | Catatan tambahan |
| created_at | TIMESTAMP | DEFAULT NOW() | Waktu create |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes:**
```sql
UNIQUE KEY (member_nik, invitation_type)
INDEX (is_invited, invitation_type)
INDEX (invited_at)
```

### D) Validasi penting (Landing)

```text
election_settings.status: IN ('coming_soon', 'open', 'closed')
Jika status = 'open': start_at wajib, voting_duration_days >= 1
Jika end_at null dan start_at ada: end_at dihitung otomatis
reward_enabled = true -> reward_text wajib
show_public_activity_log = false -> endpoint activity log tetap aman tapi bisa return empty pada landing
```

### E) Keamanan dan Kecepatan (Aman + Cepat)

```text
Gunakan cursor pagination untuk activity log (lebih cepat dari offset untuk data besar)
Tambahkan response cache 15-30 detik untuk endpoint landing publik
Semua endpoint operator wajib RBAC middleware berbasis users.role
Semua endpoint voting wajib validasi server-side state + time window + eligibility
Simpan jejak audit untuk semua perubahan critical setting
Masking default untuk data sensitif di endpoint saksi_forensik
```

---

## 🧭 **UI/UX Flow (High-Level, Selaras Schema)**

### 1) Public Voter Flow
1. User buka landing `/` dan lihat state election (coming_soon/open/closed).
2. User klik lanjut OTP ke `/otp`.
3. User input email untuk request OTP.
4. User verifikasi OTP.
5. User input NIK; sistem tarik otomatis `name`, `department`, dan data profil terkait.
6. User pilih site dari dropdown searchable yang bersumber dari master `sites`.
7. User masuk halaman vote dan pilih kandidat.
8. Submit vote.
9. User input nomor GoPay untuk reward, atau centang checkbox jika GoPay milik sendiri/otomatis sesuai setting.
10. Flow selesai dan user kembali ke landing dengan status sudah vote dan progress total voter terlihat.

### 2) Voter Reward Flow (GoPay Self / Non-Self)
1. Form menampilkan checkbox: "Apakah akun GoPay milik anda sendiri?".
2. Jika centang aktif:
  - `is_gopay_owner_self = true`
  - `gopay_owner_number = null`
3. Jika centang dimatikan:
  - `is_gopay_owner_self = false`
  - field `gopay_owner_number` wajib diisi.
4. Backend validasi kondisional, lalu simpan ke `members`.

### 3) Operator Admin/Panitia Flow
1. Login dashboard operator (`users`) sesuai role.
2. Lihat menu yang diizinkan role masing-masing.
3. Kelola election settings, kandidat, voucher, invitation, dan access control jika role cukup tinggi.
4. Monitor agregat vote dan log operasional.
5. Jika user juga merupakan voter, dia tetap bisa mengikuti flow voting publik dengan jalur yang sama.
6. Semua aksi perubahan tersimpan ke `audit_logs`.

### 4) Saksi Forensik Flow
1. Login role `saksi_forensik`.
2. Akses dashboard forensic read-only:
  - timeline event,
  - agregat integritas,
  - export laporan.
3. Tidak ada tombol aksi mutasi data.

### 5) Menu Access Flow
1. Admin/super_admin menentukan role dan permission.
2. Backend mengembalikan menu yang sudah tersaring per role.
3. Frontend hanya menampilkan menu tersebut.
4. Jika URL diakses langsung, backend tetap memeriksa permission.

### 6) Landing State UX Flow
1. `coming_soon`: countdown ke start, kandidat preview, CTA vote nonaktif.
2. `open`: CTA vote aktif, countdown ke end, mini activity log tampil (jika toggle aktif).
3. `closed`: CTA nonaktif, turnout tampil, countdown ke announcement, info undangan online/offline/hybrid.

---

## 📝 **Capacity Planning**

**Estimated size for 500 voters:**
```
members:          500 rows * 0.5 KB = 250 KB
candidates:       2 rows * 0.2 KB = 0.4 KB
votes:            400 rows * 0.8 KB = 320 KB
vouchers:         500 rows * 0.4 KB = 200 KB
voter_vouchers:   500 rows * 0.3 KB = 150 KB
audit_logs:       5000 rows * 0.3 KB = 1.5 MB
users:            3 rows * 0.3 KB = 0.9 KB
───────────────────────────────────────────
Total:            ~2.5 MB (easily fits in MySQL)
```

**Growth trajectory:**
- 1000 voters → 5 MB
- 5000 voters → 25 MB
- 10,000 voters → 50 MB (still comfortable)

No optimization needed unless > 100,000 voters

---

**Last Updated:** April 9, 2026
**Next Review:** After Phase 1 completion
