<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$vouchers = Illuminate\Support\Facades\DB::table('vouchers')
    ->select('id', 'code', 'url_redeem')
    ->limit(5)
    ->get();

foreach ($vouchers as $v) {
    echo "ID: {$v->id} | Code: {$v->code} | URL: {$v->url_redeem}\n";
}
