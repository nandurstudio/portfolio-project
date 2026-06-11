<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$nik = '120900062';
$member = \App\Models\Member::where('nik', $nik)->first();
$otpRecord = \App\Models\EmailOtp::where('member_nik', $nik)->latest()->first();

$now = now();
$payload = [
    'iss' => (string) config('app.url', 'kkmsmartvote.local'),
    'iat' => $now->timestamp,
    'nbf' => $now->timestamp,
    'exp' => $now->copy()->addMinutes(30)->timestamp,
    'jti' => (string) \Illuminate\Support\Str::uuid(),
    'sub' => 'voter:' . $otpRecord->id,
    'email' => $otpRecord->email,
    'type' => 'voting',
    'otp_verified' => true,
];

$token = Tymon\JWTAuth\Facades\JWTAuth::getJWTProvider()->encode($payload);

$request = \Illuminate\Http\Request::create('/api/voting/member/' . $nik, 'GET');
$request->headers->set('Authorization', 'Bearer ' . $token);

$controller = $app->make(\App\Http\Controllers\VotingController::class);
$response = $controller->memberLookup($request, $nik);

echo $response->getContent();
