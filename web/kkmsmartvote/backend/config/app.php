<?php

return [
    'name' => env('APP_NAME', 'Koperasi Karya Mandiri'),
    'env' => env('APP_ENV', 'production'),
    'debug' => (bool) env('APP_DEBUG', false),
    'url' => env('APP_URL', 'http://localhost'),
    'mail_otp_daily_quota' => (int) env('MAIL_OTP_DAILY_QUOTA', 300),
    'timezone' => 'Asia/Jakarta',
    'locale' => 'id',
    'fallback_locale' => 'en',
    'faker_locale' => 'id_ID',
    'key' => env('APP_KEY'),
    'cipher' => 'AES-256-CBC',
    'providers' => \Illuminate\Support\ServiceProvider::defaultProviders()->merge([
        \Tymon\JWTAuth\Providers\LaravelServiceProvider::class,
    ])->toArray(),
    'aliases' => \Illuminate\Support\Facades\Facade::defaultAliases()->merge([
        'JWTAuth' => \Tymon\JWTAuth\Facades\JWTAuth::class,
        'JWTFactory' => \Tymon\JWTAuth\Facades\JWTFactory::class,
    ])->toArray(),
];
