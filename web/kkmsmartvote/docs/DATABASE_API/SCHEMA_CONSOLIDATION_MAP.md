# Schema Consolidation Map

> [!NOTE]
> Date: 2026-04-13
> Database: `koperasi_vote` (local)
> Tujuan: mapping visual + keputusan kolom `KEEP / REVIEW / DROP`.

## 1) Visual Map (Current)

```mermaid
erDiagram
	USERS ||--o{ VOUCHERS : created_by
	MEMBERS ||--o{ USERS : member_nik
	MEMBERS ||--o{ VOTES : member_nik
	CANDIDATES ||--o{ VOTES : candidate_id
	SITES ||--o{ VOTES : site_id
	SITES ||--o{ DEPARTMENTS : site_id
	DEPARTMENTS ||--o{ MEMBERS : department_id
	DEPARTMENTS ||--o{ CANDIDATES : department_id
	VOUCHERS ||--o{ VOTER_VOUCHERS : voucher_id
	MEMBERS ||--o{ VOTER_VOUCHERS : voter_nik

	USERS {
		int id PK
		string member_nik FK
		string username
		string role
		boolean is_active
	}

	MEMBERS {
		int id PK
		string nik UQ
		string name
		string site
		string department
		int department_id FK
		string email
		boolean is_eligible
		boolean has_voted
	}

	SITES {
		int id PK
		string code UQ
		string name
		boolean is_active
	}

	DEPARTMENTS {
		int id PK
		string code
		string name
		int site_id FK
		boolean is_active
	}

	CANDIDATES {
		int id PK
		string nik
		string name
		int department_id FK
		string department_name
		string site_name
		string vision
		string mission
		string vision_mission
	}

	VOTES {
		int id PK
		string member_nik FK
		string member_name
		string site
		int site_id FK
		int candidate_id FK
		boolean is_valid
	}

	VOUCHERS {
		int id PK
		int vote_id
		string member_nik
		string member_name
		string member_email
		int department_id
		int candidate_id
		string candidate_name
		string code
		string status
	}

	VOTER_VOUCHERS {
		int id PK
		string voter_nik FK
		int voucher_id FK
		datetime granted_at
		datetime redeemed_at
	}

	EMAIL_OTPS {
		int id PK
		string member_nik
		string email
		string otp_hash
		datetime expires_at
		boolean is_used
	}

	AUDIT_LOGS {
		int id PK
		string actor
		string action
		string detail
		datetime logged_at
	}
```

## 2) Reality Snapshot (Data-Driven)

| Metric | Value |
|---|---:|
| `members.total` | 1404 |
| `members.site` terisi | 0 |
| `members.department` terisi | 1404 |
| `members.department_id` terisi | 1365 |
| `members.email` terisi | 1 |
| `candidates.total` | 2 |
| `candidates.department_id` terisi | 0 |
| `candidates.department_name/site_name` terisi | 2 / 2 |
| `votes.total` | 1 |
| `votes.site` / `votes.site_id` terisi | 1 / 1 |
| `vouchers.total` | 1 |

> [!WARNING]
> Gap terbesar saat ini: model lokasi belum konsisten (`members.site`, `members.department_id`, `departments.site_id`, `sites`).

## 3) Column Decision Board

### Members

| Status | Columns | Catatan |
|---|---|---|
| KEEP | `id`, `nik`, `name`, `department_id`, `is_eligible`, `has_voted`, `created_at`, `updated_at` | Core identity + eligibility |
| REVIEW | `site`, `email`, `gopay_number`, `is_gopay_owner_self`, `gopay_owner_number` | Legacy text + feature-dependent |
| DROP (planned, deferred) | `department` | TO REMOVE: gunakan join `members.department_id -> departments.id/name`; eksekusi saat diminta |
| DROP (later) | `site` | Setelah model lokasi final benar-benar dikunci |

### Candidates

| Status | Columns | Catatan |
|---|---|---|
| KEEP | `id`, `name`, `position`, `is_active`, `order_display`, `vision`, `mission`, `photo_url`, `full_photo_url` | Dipakai langsung UI/admin |
| REVIEW | `nik`, `department_id`, `department_name`, `site_name` | Ada overlap text vs FK |
| DROP candidate | `vision_mission` | Redundan (`vision + mission`) |

### Votes

| Status | Columns | Catatan |
|---|---|---|
| KEEP | `id`, `member_nik`, `candidate_id`, `site_id`, `is_valid`, `created_at`, `updated_at` | Inti transaksi |
| REVIEW | `member_name`, `ip_address` | Snapshot audit vs normalisasi |
| DROP (planned, deferred) | `site` | TO REMOVE: redundant karena `votes.site_id` sudah ada; eksekusi saat diminta |

### Vouchers

| Status | Columns | Catatan |
|---|---|---|
| KEEP | `id`, `code`, `value`, `status`, `expires_at`, `claimed_at`, `redeemed_at`, `redeemed_by`, `created_at`, `updated_at` | Inti lifecycle voucher |
| KEEP (transition) | `vote_id`, `member_nik`, `candidate_id` | Dipakai aktif untuk lookup/linking di alur vote + voucher; evaluasi drop setelah read path sepenuhnya pindah ke relasi final |
| DROP (planned, deferred) | `department_id` | TO REMOVE: tidak jadi source of truth; eksekusi saat diminta |
| DROP (planned, deferred) | `member_name`, `member_email`, `candidate_name` | TO REMOVE: snapshot denormalized; drop setelah API list/stats tidak lagi baca kolom snapshot |

### Voter Vouchers

| Status | Columns | Catatan |
|---|---|---|
| KEEP | `id`, `voucher_id`, `voter_nik`, `granted_at`, `redeemed_at`, `redemption_code` | Relasi + status redeem |
| REVIEW | `redeemed_by` | Cek pemakaian aktual |

### Email OTPs

| Status | Columns | Catatan |
|---|---|---|
| KEEP | `id`, `member_nik`, `email`, `otp_hash`, `expires_at`, `attempts`, `is_used`, `requested_ip`, `user_agent`, `created_at` | Wajib untuk OTP + security |

### Users

| Status | Columns | Catatan |
|---|---|---|
| KEEP | `id`, `member_nik`, `username`, `password`, `role`, `is_active`, `created_at`, `updated_at` | Auth + RBAC |
| REVIEW | `name` | Bisa redundant, tapi sering berguna sebagai snapshot |

### Audit Logs

| Status | Columns | Catatan |
|---|---|---|
| KEEP | Semua kolom | Forensik, jangan dibuang sekarang |

## 4) Endpoint Impact Remapping (Drop Safety)

| Table.Column | Endpoint aktif pakai? | Dipakai di mana | Remap source | Safe drop now? |
|---|---|---|---|---|
| `vouchers.department_id` | Ya | dipopulasi saat submit vote (`/api/voting/submit`) | join `vouchers.member_nik -> members.nik -> members.department_id` | Tidak, deferred |
| `vouchers.member_name` | Ya | response submit vote + existing vote summary + gopay/audit (`/api/voting/submit`, `/api/voting/request-otp`, `/api/voting/voucher/gopay`) | `members.name` via `member_nik` | Tidak, deferred |
| `vouchers.member_email` | Ya | dipopulasi saat submit vote (`/api/voting/submit`) | `members.email` via `member_nik` | Tidak, deferred |
| `vouchers.candidate_name` | Ya | response submit vote + existing vote summary (`/api/voting/submit`, `/api/voting/request-otp`) | join `vouchers.candidate_id -> candidates.id -> candidates.name` | Tidak, deferred |
| `votes.site` | Ya | fallback filter + payload admin votes (`/api/admin/votes`) dan insert compatibility (`/api/voting/submit`) | `votes.site_id -> sites.id -> sites.name/code` | Tidak, deferred |
| `members.department` | Ya | payload OTP/member lookup (`/api/voting/request-otp`, `/api/voting/member-lookup/{nik}`) | `members.department_id -> departments.id -> departments.name` | Tidak, deferred |

> [!NOTE]
> Controller `VoucherController`, `VoteController`, dan `VoterStatsController` saat ini tidak terdaftar di route aktif `backend/routes/api.php`, jadi bukan blocker endpoint publik saat ini.

## 5) Slow Migration Roadmap

1. Lock model lokasi final:
- Opsi A: `members.site` (text code)
- Opsi B: `members.site_id` (FK to `sites.id`)

2. Backfill + audit mismatch:
- Isi data target
- Buat daftar baris tidak match

3. Refactor read path:
- `/otp`, `/vote`, admin pages pakai source tunggal

4. Drop kolom bertahap:
- Tahap 1: `candidates.vision_mission`
- Tahap 2: `votes.site` (PLANNED DROP, deferred by request)
- Tahap 3: `candidates.department_name` + `candidates.site_name` (jika FK stabil)
- Tahap 4: `members.department` (PLANNED DROP, deferred by request)
- Tahap 5: `vouchers.department_id` (PLANNED DROP, deferred by request)
- Tahap 6: `members.site` (jika model final sudah terkunci)

5. Update dokumen + constraint:
- sinkronkan `SCHEMA.md` dengan real DB
- pasang `NOT NULL`/FK ketat setelah data benar-benar clean

