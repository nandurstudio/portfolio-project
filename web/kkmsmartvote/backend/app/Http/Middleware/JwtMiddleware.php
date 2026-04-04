<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;

class JwtMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        try {
            JWTAuth::parseToken()->authenticate();
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Token tidak valid atau kadaluarsa.'], 401);
        }
        return $next($request);
    }
}
