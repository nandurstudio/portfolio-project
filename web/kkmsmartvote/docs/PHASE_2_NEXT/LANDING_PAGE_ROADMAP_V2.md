# Landing Page Roadmap V2 (Hasil Diskusi)

## Tujuan
Menyusun urutan implementasi terbaik untuk halaman utama KKM Smart Vote dengan 3 state utama (`coming_soon`, `open`, `closed`), semua dikendalikan dari admin, aman di sisi server, dan nyaman di multi-device (responsive).

## Urutan Implementasi Terbaik
1. Finalkan kontrak data backend sebagai single source of truth.
2. Implement pengaturan admin untuk state pemilihan, jadwal, agenda, kandidat, dan undangan.
3. Implement landing page publik berbasis state (`coming_soon`, `open`, `closed`).
4. Implement mini activity log publik (top 10, collapsible, pagination sederhana).
5. Kunci keamanan endpoint vote dan gate validasi di backend.
6. Uji skenario waktu, akses paksa, dan responsive lintas device.

## Struktur Halaman Utama
1. Header nama aplikasi.
2. Hero text kampanye.
3. Countdown + info agenda.
4. Daftar kandidat.
5. Vote button (enabled/disabled sesuai state dan validasi server).
6. Info reward voter (dinamis dari setting).
7. Mini activity log publik.
8. Footer informasi panitia/kontak.

## Copy Hero (Dirapikan)
### Judul
**SUARAKAN ASPIRASIMU!**

### Teks
Mari sukseskan Pemilihan Ketua Koperasi Karya Mandiri periode 2026-2029.
Jangan sampai golput, karena arah koperasi kita ditentukan oleh suara seluruh anggota.
Kami menunggu partisipasi dan suara terbaik Anda semua.

## State & Behavior

### 1) `coming_soon`
- Vote button: disabled.
- Countdown: menuju `start_at`.
- Tampil agenda awal: nama kegiatan, tanggal, jam, lokasi (jika sudah ada).
- Kandidat sudah bisa ditampilkan sebagai preview.

### 2) `open` (Revisi)
- Vote button: enabled.
- Countdown: **periode pemilihan selama 2 hari** dari setting admin.
  - Contoh: `voting_duration_days = 2`.
  - Sistem menghitung `end_at = start_at + 2 hari` (atau nilai dari setting yang bisa diubah admin).
- Tambahan fitur publik: **mini activity log**.
  - Menampilkan aktivitas terbuka, contoh: "Budi Santoso sudah memilih".
  - Default hanya **Top 10 terbaru**.
  - Komponen **collapsible** (bisa expand/collapse).
  - **Pagination sederhana** untuk load aktivitas berikutnya.
  - Format ringkas (mini activity) agar ringan di mobile.

### 3) `closed` (Revisi)
- Vote button: disabled.
- Tampilkan **progress persentase total pemilih** (turnout) terhadap total eligible voters.
- Countdown aktif lagi, kali ini menuju acara **Pengumuman (Acara Inti)**.
- Blok acara inti menampilkan:
  - nama acara,
  - tanggal dan jam,
  - tempat,
  - detail singkat agenda.
- Highlight undangan besar:
  - **ANDA DI UNDANG OFFLINE** untuk user yang ditandai invited oleh admin/komite.
  - **ANDA DI UNDANG ONLINE** untuk semua user saat masa undangan online dibuka.

## Data Kandidat (Final Mapping)

### Dari master employee/user (FK)
- Nama Lengkap
- NIK
- Department (via master dept)

### Dari form setting kandidat (manual admin)
- Site
- Visi
- Misi
- Motto/Quotes
- Foto kandidat (upload)
- Nomor urut tampil
- Status aktif/nonaktif

## Pengaturan Admin yang Diperlukan

### A. Election Settings
- `status`: `coming_soon | open | closed`
- `start_at`
- `voting_duration_days` (default 2)
- `end_at` (auto-calc atau override manual jika diperlukan)
- `announcement_at`
- `agenda_title`, `agenda_description`, `agenda_location`

### B. Landing Content
- Header text
- Hero title & hero description
- Toggle tampilkan countdown
- Toggle tampilkan activity log publik
- Toggle reward voter (check/uncheck)
- Reward text (contoh: Voucher GoPay senilai Rp25.000)

### C. Candidate Settings
- CRUD kandidat
- Mapping kandidat ke employee
- Upload foto
- Nomor urut
- Aktif/nonaktif

### D. Invitation Settings
- Mode undangan: `offline`, `online`, `hybrid`
- Penanda invited user (oleh admin/komite)
- Segmen user yang diundang offline

## Security Wajib (Server-Side)
1. Frontend disabled button hanya visual, bukan kontrol utama.
2. Endpoint vote wajib cek status election = `open`.
3. Endpoint vote wajib cek now berada dalam window voting (`start_at` s/d `end_at`).
4. Endpoint vote wajib cek token OTP/JWT valid.
5. Endpoint vote wajib cek eligible + belum pernah vote.
6. Semua percobaan bypass via inspect element tetap ditolak backend.

## Spesifikasi Mini Activity Log Publik
- Sumber data: tabel aktivitas vote yang sudah disanitasi (tanpa data sensitif).
- Item contoh: "Budi Santoso sudah memilih".
- Menampilkan max 10 item awal.
- Collapsible panel: ringkas saat collapse, daftar saat expand.
- Pagination sederhana:
  - next/prev, atau
  - tombol "Lihat lebih banyak" (cursor/page).
- Urutan terbaru ke lama.
- Responsif untuk mobile (font ringkas, card padat, scroll aman).

## Spesifikasi Reward Voter (Tambahan)
- Sumber pengaturan dari admin (landing/election settings).
- Mekanisme:
  - Jika `reward_enabled = true` -> tampilkan teks hadiah.
  - Jika `reward_enabled = false` -> tampilkan teks alternatif "tidak ada hadiah".
- Contoh teks hadiah: "Voucher GoPay senilai Rp25.000".
- Tetap tampil ringkas dan jelas di mobile.
- Catatan: saat ini boleh menggunakan dummy default, namun struktur data sudah disiapkan untuk dinamis dari backend.

## Catatan Responsive (Multi Device)
- Mobile-first layout.
- Card kandidat 1 kolom di ponsel, 2-3 kolom di tablet/desktop.
- Countdown tetap terbaca pada lebar kecil.
- Tombol aksi memiliki area klik cukup besar.
- Activity log tetap ringan, tidak memaksa render panjang.

## Footer Watermark / Branding (Tambahan)
- Tambahkan watermark ringan di footer landing page.
- Tujuan: branding halus tanpa mengganggu fokus event.
- Contoh teks:
  - "Supported with love by Nandur Studio"
  - "Created with love by Nandur Studio"
  - "©2026 Nandur Studio"
- Sertakan link: `https://nandurstudio.com`.
- Rekomendasi UX:
  - tampil kecil, kontras cukup, tidak dominan,
  - posisi di footer paling bawah,
  - tetap terbaca di mobile.

## SEO & Metadata Landing Page (Wajib)

### Target
Landing page harus SEO-friendly agar saat diindeks Google dan saat dibagikan ke WhatsApp/Facebook/LinkedIn menampilkan informasi event yang benar (judul, deskripsi, tanggal, dan gambar acara).

### Meta Utama
- `<title>`: dinamis mengikuti event (contoh: Pemilihan Ketua Koperasi Karya Mandiri 2026-2029 | KKM Smart Vote).
- `meta name="description"`: ringkas, maksimal sekitar 150-160 karakter, berisi konteks acara dan ajakan partisipasi.
- `meta name="robots"`: `index,follow` untuk halaman publik.
- `link rel="canonical"`: URL utama landing page untuk mencegah duplikasi indeks.

### Open Graph (Social Preview)
- `meta property="og:type" content="website"`
- `meta property="og:title"` (dinamis dari setting event)
- `meta property="og:description"` (dinamis dari setting event)
- `meta property="og:url"` (URL landing page)
- `meta property="og:image"` (gambar event/og image)
- `meta property="og:image:width" content="1200"`
- `meta property="og:image:height" content="630"`
- `meta property="og:site_name" content="KKM Smart Vote"`

### Twitter Card
- `meta name="twitter:card" content="summary_large_image"`
- `meta name="twitter:title"`
- `meta name="twitter:description"`
- `meta name="twitter:image"`

### Data yang Harus Bisa Diatur dari Admin
- SEO title
- SEO description
- OG title (optional override)
- OG description (optional override)
- OG image upload (fallback ke default image jika kosong)
- Canonical URL (opsional, auto-generate dari domain + path jika kosong)

### Behavior Dinamis per State
- `coming_soon`: title/description menekankan jadwal mulai dan countdown menuju pemilihan.
- `open`: title/description menekankan periode voting aktif dan durasi tersisa.
- `closed`: title/description menekankan voting ditutup dan countdown menuju pengumuman/acara inti.

### Saran Konten OG Image
- Ukuran standar 1200x630.
- Menampilkan: nama event, periode, tanggal penting, dan branding KKM Smart Vote.
- Gunakan gambar terpisah per event agar preview share selalu relevan.

### Structured Data (Schema.org) - Disarankan
- Tambahkan JSON-LD tipe `Event` pada landing page:
  - `name`, `startDate`, `endDate`, `eventStatus`, `eventAttendanceMode`, `location`, `description`, `image`.
- Untuk fase pengumuman, update field event agar merepresentasikan acara inti.

### Validasi SEO Setelah Implementasi
1. Uji dengan Google Rich Results Test.
2. Uji preview dengan Open Graph debugger (Meta/LinkedIn).
3. Uji share WhatsApp untuk memastikan title/description/image terbaca.
4. Pastikan og:image bisa diakses publik (HTTP 200, bukan protected route).
5. Pastikan tidak ada title/description kosong pada tiap state.

## Rencana Eksekusi Setelah Disetujui
1. Finalisasi schema + endpoint baru untuk election settings, announcement, invitation, activity log.
2. Tambahkan admin UI untuk setting status/jadwal/agenda/undangan.
3. Tambahkan modul SEO setting (title/description/og image) di admin.
4. Bangun landing page state-driven sesuai dokumen ini + metadata dinamis.
5. Kunci validasi server-side vote gate.
6. UAT lintas state waktu + lintas device + validasi SEO/share preview.

---

## Implementasi Delta (April 8, 2026)

### Sudah Diimplementasikan
- Route landing publik aktif di `/`.
- OTP flow dipindahkan ke `/otp` sebelum lanjut ke `/vote`.
- Status badge di landing dibuat lebih jelas (COMING SOON / OPEN / CLOSED).
- Footer landing disederhanakan menjadi single link branding.
- Kandidat hero dummy 2 orang ditampilkan untuk visualisasi awal.
- Foto kandidat hero diset portrait + center.
- Tombol "Lanjut Verifikasi OTP" diposisikan di bawah section Kandidat Hero.
- Blok reward voter sudah ditambahkan dengan mode siap setting admin (`reward_enabled`, `reward_text`) + fallback dummy.

### Menunggu Integrasi Backend/Admin
- Replace kandidat hero dummy dengan data kandidat dari database/settings.
- Mapping final field setting reward dari admin panel.
- Aktivasi mini activity log publik (top 10 + collapsible + pagination).
