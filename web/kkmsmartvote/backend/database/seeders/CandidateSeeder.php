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
                'name' => 'ANDREAS KURNIJANTO EKO R',
                'nik' => '170100032',
                'position' => 'Ketua',
                'department_name' => 'GVN - PPIC AND PROCUREMENT',
                'site_name' => 'Cakung',
                'vision' => 'Mewujudkan Koperasi Karya Mandiri yang transparan, profesional, dan memberikan manfaat nyata bagi seluruh anggota.',
                'mission' => "1. Meningkatkan kesejahteraan anggota melalui program koperasi yang produktif.\n2. Mengembangkan layanan koperasi yang cepat, mudah, dan transparan.\n3. Memperkuat partisipasi anggota dalam setiap kegiatan koperasi.\n4. Mengelola koperasi secara akuntabel dan berorientasi pada keberlanjutan.",
                'vision_mission' => "Mewujudkan Koperasi Karya Mandiri yang transparan, profesional, dan memberikan manfaat nyata bagi seluruh anggota.\n\n1. Meningkatkan kesejahteraan anggota melalui program koperasi yang produktif.\n2. Mengembangkan layanan koperasi yang cepat, mudah, dan transparan.\n3. Memperkuat partisipasi anggota dalam setiap kegiatan koperasi.\n4. Mengelola koperasi secara akuntabel dan berorientasi pada keberlanjutan.",
                'motto' => '“Bersama Anggota, Koperasi Lebih Kuat dan Sejahtera.”',
                'photo_url' => 'http://localhost:8000/uploads/candidates/candidate_1_1776325857.jpg',
                'full_photo_url' => 'http://localhost:8000/uploads/candidates/candidate_1_1776325857.jpg',
                'order_display' => 1,
                'is_active' => true,
            ],
            [
                'name' => 'TIA HANDAYANI',
                'nik' => '120300021',
                'position' => 'Ketua',
                'department_name' => 'SHP - SCM - EXTERNAL PLANT CONTRACT MANUFACTURING',
                'site_name' => 'Cikampek',
                'vision' => 'Mewujudkan Koperasi Karya Mandiri yang adaptif, inovatif, dan relevan dengan kebutuhan seluruh anggota.',
                'mission' => "1. Menghadirkan layanan koperasi yang cepat, transparan, dan berbasis teknologi.\n2. Membuka peluang usaha yang kreatif dan mengikuti perkembangan zaman.\n3. Membangun koperasi yang bermanfaat untuk kesejahteraan anggota.",
                'vision_mission' => "Mewujudkan Koperasi Karya Mandiri yang adaptif, inovatif, dan relevan dengan kebutuhan seluruh anggota.\n\n1. Menghadirkan layanan koperasi yang cepat, transparan, dan berbasis teknologi.\n2. Membuka peluang usaha yang kreatif dan mengikuti perkembangan zaman.\n3. Membangun koperasi yang bermanfaat untuk kesejahteraan anggota.",
                'motto' => '“Inovasi Menuju Kesejahteraan Bersama”',
                'photo_url' => 'http://localhost:8000/uploads/candidates/candidate_2_1776325885.png',
                'full_photo_url' => 'http://localhost:8000/uploads/candidates/candidate_2_1776325885.png',
                'order_display' => 2,
                'is_active' => true,
            ],
        ];

        foreach ($candidates as $candidate) {
            DB::table('candidates')->updateOrInsert(
                ['name' => $candidate['name']],
                array_merge($candidate, [
                    'bio' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }
}
