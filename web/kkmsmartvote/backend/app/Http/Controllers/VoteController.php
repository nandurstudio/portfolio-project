<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Candidate;
use App\Models\ElectionSetting;
use App\Models\Member;
use App\Models\Vote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VoteController extends Controller
{
    /**
     * Step 1 — Verify voter identity before showing ballot.
     */
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'nik'  => 'required|string|max:50',
            'site' => 'required|string|max:100',
        ]);

        $setting = ElectionSetting::current();

        if (!$setting->isVotingOpen()) {
            return response()->json(['message' => 'Periode pemilihan belum dibuka atau sudah ditutup.'], 403);
        }

        $member = Member::where('nik', $request->nik)
            ->whereRaw('LOWER(name) = ?', [strtolower($request->name)])
            ->where('site', $request->site)
            ->first();

        if (!$member) {
            AuditLog::record('Guest', 'Verifikasi Gagal', [
                'nik'  => $request->nik,
                'name' => $request->name,
                'site' => $request->site,
            ], $request->ip());

            return response()->json([
                'message' => 'Data tidak ditemukan. Pastikan Nama, NIK, dan Site sesuai data keanggotaan.',
            ], 404);
        }

        if (!$member->is_eligible) {
            return response()->json(['message' => 'Anggota ini tidak memiliki hak pilih.'], 403);
        }

        if ($member->has_voted) {
            return response()->json(['message' => 'Anda sudah menggunakan hak suara Anda. Terima kasih!'], 409);
        }

        // Issue a short-lived voter token (stored in session — simple approach)
        $voterToken = encrypt($member->nik . '|' . now()->timestamp);

        AuditLog::record($member->name, 'Verifikasi Berhasil', [
            'nik'  => $member->nik,
            'site' => $member->site,
        ], $request->ip());

        return response()->json([
            'message'     => 'Verifikasi berhasil.',
            'voter_token' => $voterToken,
            'member' => [
                'name' => $member->name,
                'nik'  => $member->nik,
                'site' => $member->site,
            ],
        ]);
    }

    /**
     * Step 2 — Cast the vote.
     */
    public function cast(Request $request): JsonResponse
    {
        $request->validate([
            'voter_token'  => 'required|string',
            'candidate_id' => 'required|integer|exists:candidates,id',
        ]);

        // Decrypt voter token
        try {
            [$nik, $ts] = explode('|', decrypt($request->voter_token));
        } catch (\Throwable) {
            return response()->json(['message' => 'Token tidak valid.'], 422);
        }

        // Token must be used within 30 minutes
        if (now()->timestamp - (int) $ts > 1800) {
            return response()->json(['message' => 'Sesi verifikasi kadaluarsa. Silakan verifikasi ulang.'], 422);
        }

        $setting = ElectionSetting::current();
        if (!$setting->isVotingOpen()) {
            return response()->json(['message' => 'Periode pemilihan sudah ditutup.'], 403);
        }

        $member = Member::where('nik', $nik)->lockForUpdate()->first();

        if (!$member || !$member->is_eligible) {
            return response()->json(['message' => 'Anggota tidak ditemukan atau tidak berhak memilih.'], 403);
        }

        if ($member->has_voted) {
            return response()->json(['message' => 'Anda sudah menggunakan hak suara Anda.'], 409);
        }

        $candidate = Candidate::where('id', $request->candidate_id)->where('is_active', true)->first();
        if (!$candidate) {
            return response()->json(['message' => 'Kandidat tidak valid.'], 422);
        }

        // Atomic transaction
        DB::transaction(function () use ($member, $candidate, $request) {
            Vote::create([
                'member_nik'  => $member->nik,
                'member_name' => $member->name,
                'site'        => $member->site,
                'candidate_id' => $candidate->id,
                'is_valid'    => true,
                'ip_address'  => $request->ip(),
            ]);

            $member->update(['has_voted' => true]);

            AuditLog::record($member->name, 'Suara Dicatat', [
                'nik'  => $member->nik,
                'site' => $member->site,
                'note' => 'Kandidat dirahasiakan',
            ], $request->ip());
        });

        return response()->json([
            'message' => 'Suara Anda berhasil dicatat. Terima kasih telah berpartisipasi!',
            'time'    => now('Asia/Jakarta')->toDateTimeString(),
        ], 201);
    }
}
