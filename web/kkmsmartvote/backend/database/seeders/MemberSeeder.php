<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MemberSeeder extends Seeder
{
    public function run(): void
    {
        $members = [
            [
                'nik' => '190400122',
                'name' => 'WINDY KHAIRUNNISA',
                'site' => 'SITE_A',
                'department' => 'CORPORATE QA - QUALITY & FOOD SAFETY',
                'email' => 'windy@example.com',
                'gopay_number' => null,
                'is_gopay_owner_self' => true,
                'gopay_owner_number' => null,
                'is_eligible' => true,
                'has_voted' => false,
            ],
            [
                'nik' => '230700121',
                'name' => 'ENDANG SETYOWATI WIDYANINI',
                'site' => 'SITE_B',
                'department' => 'CRM - F A',
                'email' => 'endang@example.com',
                'gopay_number' => null,
                'is_gopay_owner_self' => true,
                'gopay_owner_number' => null,
                'is_eligible' => true,
                'has_voted' => false,
            ],
            [
                'nik' => '220300148',
                'name' => 'LATIFAH',
                'site' => 'SITE_A',
                'department' => 'CRM - F A',
                'email' => 'latifah@example.com',
                'gopay_number' => null,
                'is_gopay_owner_self' => true,
                'gopay_owner_number' => null,
                'is_eligible' => true,
                'has_voted' => false,
            ],
            [
                'nik' => '220300150',
                'name' => 'YUNIAR IIS FAEROSI',
                'site' => 'SITE_B',
                'department' => 'CRM - F A',
                'email' => 'yuniar@example.com',
                'gopay_number' => null,
                'is_gopay_owner_self' => true,
                'gopay_owner_number' => null,
                'is_eligible' => true,
                'has_voted' => false,
            ],
        ];

        foreach ($members as $member) {
            DB::table('members')->updateOrInsert(
                ['nik' => $member['nik']],
                [
                    'name' => $member['name'],
                    'site' => $member['site'],
                    'department' => $member['department'],
                    'email' => $member['email'],
                    'gopay_number' => $member['gopay_number'],
                    'is_gopay_owner_self' => $member['is_gopay_owner_self'],
                    'gopay_owner_number' => $member['gopay_owner_number'],
                    'is_eligible' => $member['is_eligible'],
                    'has_voted' => $member['has_voted'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
