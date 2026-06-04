<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

if (!Schema::hasColumn('vouchers', 'url_redeem')) {
    Schema::table('vouchers', function (Blueprint $table) {
        $table->text('url_redeem')->nullable();
    });
    echo "Column url_redeem added successfully.\n";
} else {
    echo "Column url_redeem already exists.\n";
}
