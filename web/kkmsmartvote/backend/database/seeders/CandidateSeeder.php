<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CandidateSeeder extends Seeder
{
    public function run(): void
    {
        $candidates = [
            [
                'name' => 'Candidate A',
                'position' => 'Ketua',
                'bio' => 'Experienced leader focused on transparent governance and operational discipline.',
                'photo_url' => '/images/cand_a.jpg',
                'is_active' => true
            ],
            [
                'name' => 'Candidate B',
                'position' => 'Ketua',
                'bio' => 'Passionate about member service, continuous improvement, and accountability.',
                'photo_url' => '/images/cand_b.jpg',
                'is_active' => true
            ],
        ];

        foreach ($candidates as $candidate) {
            DB::table('candidates')->updateOrInsert(
                ['name' => $candidate['name']],
                [
                    'position' => $candidate['position'],
                    'bio' => $candidate['bio'],
                    'photo_url' => $candidate['photo_url'],
                    'is_active' => $candidate['is_active'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
