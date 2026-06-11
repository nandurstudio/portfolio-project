<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$controller = $app->make(\App\Http\Controllers\VotingController::class);

// Create a mock request
$request = \Illuminate\Http\Request::create('/api/voting/member/120900062', 'GET');
$response = $controller->memberLookup($request, '120900062');

echo $response->getContent();
