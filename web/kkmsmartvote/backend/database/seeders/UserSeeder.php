<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $memberNikByName = DB::table('members')
            ->select('name', 'nik')
            ->pluck('nik', 'name');

        $users = [
            [
                'name' => 'Nandang Duryat',
                'username' => 'nandang',
                'password' => Hash::make('admin123'),
                'role' => 'super_admin',
                'member_nik' => $memberNikByName['Nandang Duryat'] ?? null,
            ],
            [
                'name' => 'Beny Santoso',
                'username' => 'beny.santoso',
                'password' => Hash::make('panitia123'),
                'role' => 'panitia',
                'member_nik' => $memberNikByName['Beny Santoso'] ?? null,
            ],
            [
                'name' => 'Ibnu Setiawan',
                'username' => 'ibnu.setiawan',
                'password' => Hash::make('saksi123'),
                'role' => 'saksi_forensik',
                'member_nik' => $memberNikByName['Ibnu Setiawan'] ?? null,
            ],
            [
                'name' => 'Abdul Halim',
                'username' => 'abdul.halim',
                'password' => Hash::make('panitia123'),
                'role' => 'panitia',
                'member_nik' => $memberNikByName['Abdul Halim'] ?? null,
            ],
        ];

        foreach ($users as $user) {
            DB::table('users')->updateOrInsert(
                ['username' => $user['username']],
                [
                    'name' => $user['name'],
                    'member_nik' => $user['member_nik'],
                    'password' => $user['password'],
                    'role' => $user['role'],
                    'remember_token' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
