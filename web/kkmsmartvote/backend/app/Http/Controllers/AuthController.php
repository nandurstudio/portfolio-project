<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function adminLogin(Request $request): JsonResponse
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $credentials = [
            'username' => $request->username,
            'password' => $request->password,
        ];

        if (!$token = auth('api')->attempt($credentials)) {
            return response()->json(['message' => 'Username atau password salah.'], 401);
        }

        $user = auth('api')->user();

        AuditLog::record($user->name, 'Login', ['role' => $user->role], $request->ip());

        return response()->json([
            'token'      => $token,
            'token_type' => 'bearer',
            'expires_in' => config('jwt.ttl') * 60,
            'user' => [
                'id'       => $user->id,
                'name'     => $user->name,
                'username' => $user->username,
                'role'     => $user->role,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = auth('api')->user();
        AuditLog::record($user->name, 'Logout', [], $request->ip());
        auth('api')->logout();
        return response()->json(['message' => 'Berhasil logout.']);
    }

    public function me(): JsonResponse
    {
        $user = auth('api')->user();
        return response()->json([
            'id'       => $user->id,
            'name'     => $user->name,
            'username' => $user->username,
            'role'     => $user->role,
        ]);
    }
}
