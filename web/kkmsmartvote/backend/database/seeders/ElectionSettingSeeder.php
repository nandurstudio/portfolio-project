<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ElectionSettingSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('election_settings')->updateOrInsert(
            ['id' => 1],
            [
                'election_name' => 'Pemilihan Ketua Koperasi 2026',
                'period' => '2026-2029',
                'start_date' => '2026-04-20',
                'end_date' => '2026-04-24',
                'end_time' => '17:00:00',
                'is_active' => true,
                'is_finalized' => false,
                'announcement_at' => '2026-04-28 04:00:00',
                'hero_title' => 'SUARAKAN ASPIRASIMU!',
                'hero_description' => 'Mari sukseskan Pemilihan Ketua Koperasi Karya Mandiri periode 2026-2029. Jangan sampai golput, karena arah koperasi kita ditentukan oleh suara seluruh anggota.',
                'cta_text' => 'Lanjut Verifikasi OTP',
                'agenda_title' => 'Pengumuman Ketua Koperasi Karya Mandiri 2026-2029',
                'agenda_description' => 'Pengumuman hasil rekapitulasi suara dan rewarding peserta yang sudah partisipasi',
                'agenda_location' => 'KNLC Lt.3 dan Online Zoom',
                'show_countdown' => true,
                'show_activity_log' => true,
                'reward_enabled' => true,
                'reward_text' => 'Hadiah Menarik Senilai Rp25.000',
                'seo_title' => 'Pemilihan Ketua Koperasi Karya Mandiri 2026-2029',
                'seo_description' => 'Pemilihan Ketua Koperasi Karya Mandiri periode 2026-2029',
                'og_title' => 'Pemilihan Ketua Koperasi Karya Mandiri 2026-2029',
                'og_description' => 'Pemilihan Ketua Koperasi Karya Mandiri periode 2026-2029',
                'og_image_url' => null,
                'canonical_url' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }
}
