<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$csvFile = '/var/www/html/kkmsmartvote/backend/KOPKARMANDIRI_Gopay25K_020626.csv';
if (!file_exists($csvFile)) {
    echo "File CSV tidak ditemukan di $csvFile\n";
    exit;
}
$handle = fopen($csvFile, 'r');
$header = fgetcsv($handle); // Skip header

// Cari semua voucher yang sudah di-assign ke member
$vouchers = DB::table('vouchers')
    ->whereNotNull('member_nik')
    ->orderBy('created_at', 'asc')
    ->select('id', 'code')
    ->get();

echo "Ditemukan " . count($vouchers) . " vouchers yang sudah ter-assign ke anggota.\n";

if (count($vouchers) === 0) {
    // Coba join voter_vouchers jika member_nik null
    $vouchers = DB::table('vouchers')
        ->join('voter_vouchers', 'vouchers.id', '=', 'voter_vouchers.voucher_id')
        ->orderBy('voter_vouchers.created_at', 'asc')
        ->select('vouchers.id', 'vouchers.code')
        ->get();
    echo "Ditemukan " . count($vouchers) . " vouchers via voter_vouchers.\n";
}

if (count($vouchers) === 0) {
    // Fallback: ambil semua voucher yang ada
    $vouchers = DB::table('vouchers')
        ->orderBy('created_at', 'asc')
        ->select('id', 'code')
        ->get();
    echo "Fallback: Ditemukan " . count($vouchers) . " vouchers di tabel vouchers.\n";
}

$count = 0;
foreach ($vouchers as $voucher) {
    $row = fgetcsv($handle);
    if (!$row) {
        echo "Peringatan: Baris CSV habis, tapi masih ada anggota yang sudah vote!\n";
        break; 
    }
    
    $voucherId = trim($row[0]);
    $urlRedeem = trim($row[1]);
    $expiredDate = trim($row[2]);
    if (!empty($expiredDate)) {
        $expiredDate = date('Y-m-d H:i:s', strtotime($expiredDate . ' 23:59:59'));
    } else {
        $expiredDate = null;
    }
    
    DB::table('vouchers')
        ->where('id', $voucher->id)
        ->update([
            'code' => $voucherId,
            'url_redeem' => $urlRedeem,
            // 'claim_expires_at' => $expiredDate ? $expiredDate . ' 23:59:59' : null
        ]);
        
    $count++;
}
fclose($handle);
echo "Berhasil update $count vouchers dengan URL dan Kode baru!\n";
