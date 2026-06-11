<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$vouchers = \Illuminate\Support\Facades\DB::table('vouchers')
    ->where('code', 'VIAGOPAY25-20260529-000466')
    ->orWhere('member_nik', '120900062')
    ->get();

$voterVouchers = \Illuminate\Support\Facades\DB::table('voter_vouchers')
    ->where('voter_nik', '120900062')
    ->get();

echo json_encode(['vouchers' => $vouchers, 'voter_vouchers' => $voterVouchers], JSON_PRETTY_PRINT);
