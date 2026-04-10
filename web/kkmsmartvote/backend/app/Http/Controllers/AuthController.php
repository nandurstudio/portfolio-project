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
            AuditLog::record('Guest', 'Login Gagal', [
                'username' => (string) $request->username,
                'reason' => 'INVALID_CREDENTIALS',
            ], $request->ip());
            return response()->json(['message' => 'Username atau password salah.'], 401);
        }

        $user = auth('api')->user();

        if (isset($user->is_active) && !$user->is_active) {
            AuditLog::record($user->name, 'Login Ditolak', [
                'reason' => 'USER_INACTIVE',
                'username' => $user->username,
            ], $request->ip());
            auth('api')->logout();
            return response()->json(['message' => 'Akun dinonaktifkan. Hubungi administrator.'], 403);
        }

        AuditLog::record($user->name, 'Login', ['role' => $user->role], $request->ip());

        return response()->json([
            'token'      => $token,
            'token_type' => 'bearer',
            'expires_in' => config('jwt.ttl') * 60,
            'user' => [
                'id'       => $user->id,
                'member_nik' => $user->member_nik,
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
            'member_nik' => $user->member_nik,
            'name'     => $user->name,
            'username' => $user->username,
            'role'     => $user->role,
        ]);
    }
}
