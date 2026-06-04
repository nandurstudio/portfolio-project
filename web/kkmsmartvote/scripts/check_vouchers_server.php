<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

use Illuminate\Support\Facades\DB;

$voters = DB::table('votes')
    ->select('member_nik')
    ->limit(10)
    ->get();

$vv = DB::table('voter_vouchers')->get();
$vouchers = DB::table('vouchers')->get();

echo "Total Votes: " . DB::table('votes')->count() . "\n";
echo "Total Voter Vouchers: " . DB::table('voter_vouchers')->count() . "\n";
echo "Total Vouchers: " . DB::table('vouchers')->count() . "\n";
echo "Voter Vouchers sample:\n";
print_r(DB::table('voter_vouchers')->limit(5)->get()->toArray());
echo "Vouchers sample:\n";
print_r(DB::table('vouchers')->limit(5)->get()->toArray());
