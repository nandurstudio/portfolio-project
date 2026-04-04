<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\Candidate;
use App\Models\ElectionSetting;
use App\Models\Member;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Users ──────────────────────────────────────────────
        User::firstOrCreate(['username' => 'admin'], [
            'name'     => 'Budi Santoso',
            'password' => Hash::make('admin123'),
            'role'     => 'admin',
        ]);

        User::firstOrCreate(['username' => 'panitia1'], [
            'name'     => 'Siti Rahayu',
            'password' => Hash::make('panitia123'),
            'role'     => 'panitia',
        ]);

        // ── Election Setting ───────────────────────────────────
        ElectionSetting::firstOrCreate([], [
            'election_name' => 'Pemilihan Ketua Koperasi Karya Mandiri',
            'period'        => '2026-2029',
            'start_date'    => '2026-04-13',
            'end_date'      => '2026-04-17',
            'end_time'      => '15:00:00',
            'is_active'     => true,
            'is_finalized'  => false,
        ]);

        // ── Candidates ─────────────────────────────────────────
        $candidates = [
            ['name' => 'Drs. Agus Supriadi',      'position' => 'Kandidat No. 1', 'bio' => 'Pengalaman 15 tahun di bidang koperasi dan manajemen SDM.'],
            ['name' => 'Ir. Sri Wahyuni, M.M.',   'position' => 'Kandidat No. 2', 'bio' => 'Berpengalaman dalam manajemen keuangan dan pengembangan usaha koperasi.'],
        ];

        foreach ($candidates as $c) {
            Candidate::firstOrCreate(['name' => $c['name']], array_merge($c, ['is_active' => true]));
        }

        // ── Members ────────────────────────────────────────────
        $members = [
            ['nik' => 'KRY001', 'name' => 'Ahmad Fauzi',      'site' => 'Site A'],
            ['nik' => 'KRY002', 'name' => 'Dewi Susanti',     'site' => 'Site B'],
            ['nik' => 'KRY003', 'name' => 'Hendra Wijaya',    'site' => 'Site A'],
            ['nik' => 'KRY004', 'name' => 'Rina Marlina',     'site' => 'Site C'],
            ['nik' => 'KRY005', 'name' => 'Bambang Sumarto',  'site' => 'Site B'],
            ['nik' => 'KRY006', 'name' => 'Fitri Handayani',  'site' => 'Site C'],
            ['nik' => 'KRY007', 'name' => 'Dodi Prasetyo',    'site' => 'Site A'],
            ['nik' => 'KRY008', 'name' => 'Lestari Wulandari','site' => 'Site B'],
        ];

        foreach ($members as $m) {
            Member::firstOrCreate(['nik' => $m['nik']], array_merge($m, [
                'is_eligible' => true,
                'has_voted'   => false,
            ]));
        }

        AuditLog::record('System', 'Database Seeded', ['env' => app()->environment()]);
    }
}
