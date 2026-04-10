<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            SiteSeeder::class,
            MemberSeeder::class,
            UserSeeder::class,
            CandidateSeeder::class,
            ElectionSettingSeeder::class,
        ]);
    }
}
