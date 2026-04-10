<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Member;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    private const CREATABLE_ROLES = ['admin', 'panitia', 'saksi_forensik'];
    private const DEFAULT_PASSWORD = 'Kkm12345!';

    public function meta(Request $request): JsonResponse
    {
        $keyword = trim((string) $request->input('q', ''));

        $membersQuery = Member::query()
            ->leftJoin('users', 'users.member_nik', '=', 'members.nik')
            ->whereNull('users.id');

        if ($keyword !== '') {
            $membersQuery->where(function ($q) use ($keyword) {
                $q->where('members.nik', 'like', '%' . $keyword . '%')
                    ->orWhere('members.name', 'like', '%' . $keyword . '%');
            });
        }

        $members = $membersQuery
            ->orderBy('members.name')
            ->limit($keyword !== '' ? 30 : 15)
            ->get([
                'members.nik',
                'members.name',
                'members.department',
                'members.site',
                'members.email',
                'members.is_eligible',
                'members.has_voted',
            ]);

        $roles = collect(self::CREATABLE_ROLES)
            ->map(fn($value) => [
                'value' => $value,
                'label' => ucwords(str_replace('_', ' ', $value)),
            ])
            ->values();

        return response()->json([
            'roles' => $roles,
            'available_members' => $members,
            'default_password' => self::DEFAULT_PASSWORD,
        ]);
    }

    public function index(): JsonResponse
    {
        $select = ['id', 'member_nik', 'name', 'username', 'role', 'created_at'];
        if (Schema::hasColumn('users', 'is_active')) {
            $select[] = 'is_active';
        }

        return response()->json(
            User::select($select)
                ->with('member:nik,department,site')
                ->orderBy('id')
                ->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'member_nik' => 'required|string|max:20|exists:members,nik|unique:users,member_nik',
            'username' => 'required|string|max:100|unique:users,username',
            'password' => 'nullable|string|min:8',
            'role'     => ['required', Rule::in(self::CREATABLE_ROLES)],
        ]);

        $member = Member::where('nik', $request->member_nik)->firstOrFail();

        $rawPassword = trim((string) $request->input('password', ''));
        $passwordToUse = $rawPassword !== '' ? $rawPassword : self::DEFAULT_PASSWORD;

        $payload = [
            'member_nik' => $member->nik,
            'name'     => $member->name,
            'username' => $request->username,
            'password' => Hash::make($passwordToUse),
            'role'     => $request->role,
        ];

        if (Schema::hasColumn('users', 'is_active')) {
            $payload['is_active'] = true;
        }

        $user = User::create($payload);

        AuditLog::record(auth('api')->user()->name, 'User Ditambah', ['username' => $user->username, 'role' => $user->role, 'member_nik' => $user->member_nik]);

        return response()->json([
            'id' => $user->id,
            'member_nik' => $user->member_nik,
            'name' => $user->name,
            'username' => $user->username,
            'role' => $user->role,
            'is_active' => (bool) $user->is_active,
            'default_password_applied' => $rawPassword === '',
            'default_password' => $rawPassword === '' ? self::DEFAULT_PASSWORD : null,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $request->validate([
            'member_nik' => [
                'sometimes',
                'string',
                'max:20',
                'exists:members,nik',
                Rule::unique('users', 'member_nik')->ignore($user->id),
            ],
            'password' => 'sometimes|string|min:8',
            'role'     => ['sometimes', Rule::in(self::CREATABLE_ROLES)],
            'is_active' => 'sometimes|boolean',
        ]);

        $payload = $request->only(['member_nik', 'password', 'role']);
        if (Schema::hasColumn('users', 'is_active')) {
            $payload = array_merge($payload, $request->only(['is_active']));
        }

        if ($request->filled('member_nik')) {
            $member = Member::where('nik', $request->member_nik)->firstOrFail();
            $payload['name'] = $member->name;
        }

        if ($request->filled('password')) {
            $payload['password'] = Hash::make($request->password);
        }

        $user->update($payload);

        AuditLog::record(auth('api')->user()->name, 'User Diperbarui', [
            'username' => $user->username,
            'is_active' => (bool) $user->is_active,
        ]);

        return response()->json($user->only(['id', 'member_nik', 'name', 'username', 'role', 'is_active']));
    }

    public function destroy(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        if ($user->id === auth('api')->id()) {
            return response()->json(['message' => 'Tidak dapat menonaktifkan akun sendiri.'], 403);
        }

        if (Schema::hasColumn('users', 'is_active')) {
            $user->update(['is_active' => false]);
            AuditLog::record(auth('api')->user()->name, 'User Dinonaktifkan', ['username' => $user->username]);
            return response()->json(['message' => 'User berhasil dinonaktifkan.']);
        }

        AuditLog::record(auth('api')->user()->name, 'User Dihapus', ['username' => $user->username]);
        $user->delete();
        return response()->json(['message' => 'User berhasil dihapus.']);
    }
}
