<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Member;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemberController extends Controller
{
    public function findByNik(string $nik): JsonResponse
    {
        $normalizedNik = strtoupper(trim($nik));

        $member = Member::query()
            ->where('nik', $normalizedNik)
            ->first();

        if (!$member) {
            return response()->json([
                'success' => false,
                'message' => 'NIK tidak ditemukan',
                'error' => 'MEMBER_NOT_FOUND',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'nik' => $member->nik,
                'name' => $member->name,
                'department' => $member->department,
                'site' => $member->site,
                'email' => $member->email,
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Member::query();

        if ($request->filled('site')) {
            $query->where('site', $request->site);
        }
        if ($request->filled('has_voted')) {
            $query->where('has_voted', filter_var($request->has_voted, FILTER_VALIDATE_BOOLEAN));
        }
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'ilike', '%' . $request->search . '%')
                    ->orWhere('nik', 'ilike', '%' . $request->search . '%');
            });
        }

        $members = $query->orderBy('name')->paginate(50);

        return response()->json($members);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'nik'  => 'required|string|max:50|unique:members,nik',
            'name' => 'required|string|max:255',
            'site' => 'required|string|max:100',
        ]);

        $member = Member::create([
            'nik'         => strtoupper($request->nik),
            'name'        => $request->name,
            'site'        => $request->site,
            'is_eligible' => true,
            'has_voted'   => false,
        ]);

        AuditLog::record(auth('api')->user()->name, 'Anggota Ditambah', [
            'nik'  => $member->nik,
            'name' => $member->name,
        ]);

        return response()->json($member, 201);
    }
}
