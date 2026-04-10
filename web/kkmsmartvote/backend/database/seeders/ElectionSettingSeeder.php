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
                'period' => '2024-2027',
                'start_date' => '2026-04-04',
                'end_date' => '2026-04-05',
                'end_time' => '17:00:00',
                'is_active' => true,
                'is_finalized' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }
}
