# KKM Smart Vote - Database Normalization Plan V1

Tanggal: 2026-04-09
Target DB: `koperasi_vote`
Strategi: additive migration (tanpa drop kolom legacy), agar API lama tetap kompatibel.

## 1) Visual Mapping (As-Is -> To-Be)

As-Is (saat ini):

```text
members(nik, name, site_text, department_text, ...)
users(member_nik FK->members.nik, username, role)
votes(member_nik, member_name_snapshot, site_text_snapshot, candidate_id FK)
email_otps(member_nik nullable, email, otp_hash)
voter_vouchers(voter_nik FK->members.nik, voucher_id FK->vouchers.id)
```

To-Be V1 (normalisasi bertahap):

```text
sites(id, code, name, is_active)
departments(id, code, name, site_id FK->sites.id, is_active)

members(
  nik, name,
  site_text_legacy,
  department_text_legacy,
  department_id FK->departments.id,
  ...
)

users(
  member_nik FK->members.nik (unique),
  username, password, role
)

votes(
  member_nik FK->members.nik,
  candidate_id FK->candidates.id,
  site_id FK->sites.id,
  member_name_snapshot,
  site_text_snapshot,
  ...
)

email_otps(
  member_nik FK->members.nik (nullable),
  email, otp_hash, ...
)
```

Catatan:
- `member_name` di `votes` dipertahankan sebagai snapshot audit.
- `site` text di `votes` dipertahankan sementara untuk backward compatibility.
- `members.department` text dipertahankan sementara sampai semua endpoint pindah ke `department_id`.

## 2) Eksekusi V1 (yang dieksekusi sekarang)

Perubahan inti:
1. Tambah master table `departments`.
2. Backfill departments dari `members.department` (distinct, non-empty).
3. Tambah `members.department_id` + FK ke `departments.id`.
4. Tambah `candidates.department_id` + FK ke `departments.id`.
5. Tambah `votes.site_id` + FK ke `sites.id`.
6. Backfill `votes.site_id` dari `votes.site` (match by `sites.name`/`sites.code`).
7. Tambah FK `votes.member_nik -> members.nik`.
8. Tambah FK `email_otps.member_nik -> members.nik`.

Semua perubahan additive dan idempotent via script:
- `docs/DATABASE_API/normalize_v1.sql`

## 3) Langkah Lanjutan (V2)

Setelah aplikasi stabil di V1:
1. Ubah seluruh query membaca `department_id` + join `departments` (bukan text).
2. Ubah seluruh query membaca `votes.site_id` + join `sites`.
3. Baru setelah itu, pertimbangkan deprecate kolom text legacy:
   - `members.department`
   - `votes.site`
4. Opsional: pindah role ke master table `roles` jika butuh role dinamis.

## 4) Risk Notes

1. Jika ada data baru yang tidak punya mapping site/dept, FK tetap aman karena kolom nullable.
2. Backfill `votes.site_id` bisa null jika text site tidak match master site.
3. V1 tidak memutus API lama karena kolom text tidak dihapus.

## 5) Execution Snapshot (2026-04-09)

Status eksekusi lokal (`koperasi_vote`):
- `departments` berhasil dibuat dan terisi `283` data.
- `members.department_id` berhasil terisi `1365` data.
- FK baru aktif:
  - `members.department_id -> departments.id`
  - `candidates.department_id -> departments.id`
  - `departments.site_id -> sites.id`
  - `votes.member_nik -> members.nik`
  - `votes.site_id -> sites.id`
  - `email_otps.member_nik -> members.nik`

Catatan real data saat ini:
- `candidates.department_id` masih `NULL` karena kandidat masih placeholder (`Candidate A/B`) dan tidak match ke `members.name`.
- `votes.site_id` belum terisi karena saat ini tabel `votes` belum punya data transaksi (`total_votes=0`).
- `email_otps.member_nik` masih `NULL` untuk row lama karena email belum bisa dipetakan unik ke member.
