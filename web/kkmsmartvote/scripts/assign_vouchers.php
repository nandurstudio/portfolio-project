<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$csvFile = '/var/www/html/kkmsmartvote/KOPKARMANDIRI_Gopay25K_020626.csv';
if (!file_exists($csvFile)) {
    echo "File CSV tidak ditemukan di $csvFile\n";
    exit;
}

$handle = fopen($csvFile, 'r');
$header = fgetcsv($handle); // Skip header

// Ambil semua data votes yang valid
$votes = DB::table('votes')
    ->where('is_valid', true)
    ->orderBy('created_at', 'asc')
    ->get();

echo "Total votes valid: " . count($votes) . "\n";

$assignedCount = 0;
$updatedCount = 0;

foreach ($votes as $vote) {
    // Cek apakah vote ini sudah punya voucher yang ada url_redeem nya
    $existingVoucher = DB::table('vouchers')
        ->where('vote_id', $vote->id)
        ->orWhere('member_nik', $vote->member_nik)
        ->first();

    // Kalau sudah ada tapi url_redeem kosong, kita bisa update
    // Kalau belum ada sama sekali, kita insert baru
    // Force update from new CSV, do not skip
    // if ($existingVoucher && !empty($existingVoucher->url_redeem)) {
    //     continue; 
    // }

    // Ambil baris CSV berikutnya
    $row = fgetcsv($handle);
    if (!$row) {
        echo "Peringatan: CSV habis sebelum semua voter dapat voucher!\n";
        break;
    }

    $voucherId = trim($row[0]);
    $urlRedeem = trim($row[1]);
    
    if ($existingVoucher) {
        // Update voucher yang sudah ada
        DB::table('vouchers')->where('id', $existingVoucher->id)->update([
            'code' => $voucherId,
            'url_redeem' => $urlRedeem,
            'status' => 'active',
        ]);
        $updatedCount++;
    } else {
        // Cek apakah voucher ini sudah ada di database tapi belum di-assign
        $unassignedVoucher = DB::table('vouchers')->where('code', $voucherId)->first();
        if ($unassignedVoucher) {
            DB::table('vouchers')->where('id', $unassignedVoucher->id)->update([
                'url_redeem' => $urlRedeem,
                'vote_id' => $vote->id,
                'member_nik' => $vote->member_nik,
                'member_name' => $vote->member_name,
                'candidate_id' => $vote->candidate_id,
                'status' => 'active',
                'updated_at' => now(),
            ]);
            $insertId = $unassignedVoucher->id;
        } else {
            // Insert voucher baru untuk voter ini
            $insertId = DB::table('vouchers')->insertGetId([
                'code' => $voucherId,
                'url_redeem' => $urlRedeem,
                'vote_id' => $vote->id,
                'member_nik' => $vote->member_nik,
                'member_name' => $vote->member_name,
                'candidate_id' => $vote->candidate_id,
                'status' => 'active',
                'value' => 25000,
                'created_by' => 1,
                'created_at' => $vote->created_at,
                'updated_at' => now(),
            ]);
        }
        
        // Coba insert ke legacy table juga buat jaga-jaga
        if (Illuminate\Support\Facades\Schema::hasTable('voter_vouchers')) {
            DB::table('voter_vouchers')->insertOrIgnore([
                'voter_nik' => $vote->member_nik,
                'voucher_id' => $insertId,
                'granted_at' => $vote->created_at,
                'created_at' => $vote->created_at,
            ]);
        }

        $assignedCount++;
    }
}

fclose($handle);
echo "Selesai! $assignedCount voucher baru diinsert, $updatedCount voucher diupdate.\n";
