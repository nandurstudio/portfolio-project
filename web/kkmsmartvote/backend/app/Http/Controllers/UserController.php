<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(User::select('id','name','username','role','created_at')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'username' => 'required|string|max:100|unique:users,username',
            'password' => 'required|string|min:8',
            'role'     => 'required|in:admin,panitia',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'role'     => $request->role,
        ]);

        AuditLog::record(auth('api')->user()->name, 'User Ditambah', ['username' => $user->username, 'role' => $user->role]);

        return response()->json($user->only(['id','name','username','role']), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name'     => 'sometimes|string|max:255',
            'password' => 'sometimes|string|min:8',
            'role'     => 'sometimes|in:admin,panitia',
        ]);

        if ($request->filled('password')) {
            $request->merge(['password' => Hash::make($request->password)]);
        }

        $user->update($request->only(['name','password','role']));

        AuditLog::record(auth('api')->user()->name, 'User Diperbarui', ['username' => $user->username]);

        return response()->json($user->only(['id','name','username','role']));
    }

    public function destroy(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        if ($user->id === auth('api')->id()) {
            return response()->json(['message' => 'Tidak dapat menghapus akun sendiri.'], 403);
        }
        AuditLog::record(auth('api')->user()->name, 'User Dihapus', ['username' => $user->username]);
        $user->delete();
        return response()->json(['message' => 'User berhasil dihapus.']);
    }
}
