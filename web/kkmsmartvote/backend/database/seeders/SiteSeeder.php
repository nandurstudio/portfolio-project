<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SiteSeeder extends Seeder
{
    public function run(): void
    {
        $sites = [
            [
                'code' => 'CABANG',
                'name' => 'Cabang',
                'is_active' => true
            ],
            [
                'code' => 'CAKUNG',
                'name' => 'Cakung',
                'is_active' => true
            ],
            [
                'code' => 'CIKAMPEK',
                'name' => 'Cikampek',
                'is_active' => true
            ],
            [
                'code' => 'KAMI',
                'name' => 'KAMI',
                'is_active' => true
            ],
            [
                'code' => 'KBIC',
                'name' => 'KBIC',
                'is_active' => true
            ],
            [
                'code' => 'PULOMAS',
                'name' => 'Pulomas',
                'is_active' => true
            ],
        ];

        foreach ($sites as $site) {
            DB::table('sites')->updateOrInsert(
                ['code' => $site['code']],
                $site
            );
        }
    }
}
