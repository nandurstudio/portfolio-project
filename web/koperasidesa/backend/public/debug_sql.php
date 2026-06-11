<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

header('Content-Type: application/json');

$query = $_GET['q'] ?? '';
if (!$query) { echo json_encode(['error' => 'No query']); exit; }

try {
    $results = \Illuminate\Support\Facades\DB::select($query);
    echo json_encode($results, JSON_PRETTY_PRINT);
} catch (\Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
