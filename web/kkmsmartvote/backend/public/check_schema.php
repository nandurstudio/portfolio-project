<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
echo json_encode([
    'vouchers' => \Illuminate\Support\Facades\Schema::getColumnListing('vouchers'),
    'voter_vouchers' => \Illuminate\Support\Facades\Schema::getColumnListing('voter_vouchers')
], JSON_PRETTY_PRINT);
