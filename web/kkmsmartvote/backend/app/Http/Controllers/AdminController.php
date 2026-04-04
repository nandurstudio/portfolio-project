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

class AdminController extends Controller
{
    public function dashboard(): JsonResponse
    {
        $totalMembers  = Member::where('is_eligible', true)->count();
        $totalValid    = Vote::where('is_valid', true)->count();
        $totalInvalid  = Vote::where('is_valid', false)->count();
        $participation = $totalMembers > 0 ? round($totalValid / $totalMembers * 100, 1) : 0;

        $candidateStats = Candidate::withCount(['votes as valid_votes' => fn($q) => $q->where('is_valid', true)])
            ->orderByDesc('valid_votes')
            ->get(['id', 'name', 'position', 'is_active']);

        $setting = ElectionSetting::current();

        return response()->json([
            'total_members'    => $totalMembers,
            'total_valid'      => $totalValid,
            'total_invalid'    => $totalInvalid,
            'participation_pct'=> $participation,
            'candidate_stats'  => $candidateStats,
            'election'         => $setting,
        ]);
    }

    public function votes(Request $request): JsonResponse
    {
        $query = Vote::query();

        if ($request->filled('is_valid')) {
            $query->where('is_valid', filter_var($request->is_valid, FILTER_VALIDATE_BOOLEAN));
        }
        if ($request->filled('site')) {
            $query->where('site', $request->site);
        }

        // Admin sees candidate_id; panitia does not
        $isAdmin = auth('api')->user()->role === 'admin';
        $columns = $isAdmin
            ? ['id', 'member_nik', 'member_name', 'site', 'candidate_id', 'is_valid', 'ip_address', 'created_at', 'invalidated_at', 'invalidation_reason']
            : ['id', 'member_nik', 'member_name', 'site', 'is_valid', 'created_at'];

        $votes = $query->select($columns)->orderByDesc('created_at')->paginate(50);

        return response()->json($votes);
    }

    public function results(): JsonResponse
    {
        $totalValid = Vote::where('is_valid', true)->count();

        $candidates = Candidate::withCount(['votes as vote_count' => fn($q) => $q->where('is_valid', true)])
            ->orderByDesc('vote_count')
            ->get();

        $results = $candidates->map(function ($c) use ($totalValid) {
            $pct = $totalValid > 0 ? round($c->vote_count / $totalValid * 100, 2) : 0;
            return [
                'id'         => $c->id,
                'name'       => $c->name,
                'position'   => $c->position,
                'vote_count' => $c->vote_count,
                'percentage' => $pct,
                'is_winner'  => $pct >= 50,
            ];
        });

        $winners = $results->filter(fn($r) => $r['is_winner']);
        $status  = match(true) {
            $winners->count() === 1 => 'WINNER',
            $winners->count() > 1  => 'TIE',
            default                => 'NO_MAJORITY',
        };

        return response()->json([
            'total_valid' => $totalValid,
            'results'     => $results->values(),
            'status'      => $status,
            'winner'      => $status === 'WINNER' ? $winners->first() : null,
        ]);
    }

    public function invalidateVote(Request $request, int $id): JsonResponse
    {
        $request->validate(['reason' => 'nullable|string|max:500']);

        $vote = Vote::findOrFail($id);

        if (!$vote->is_valid) {
            return response()->json(['message' => 'Suara ini sudah diinvalidasi.'], 409);
        }

        DB::transaction(function () use ($vote, $request) {
            $vote->update([
                'is_valid'             => false,
                'invalidated_by'       => auth('api')->user()->name,
                'invalidated_at'       => now(),
                'invalidation_reason'  => $request->reason ?? 'Diinvalidasi oleh admin',
            ]);

            // Allow member to re-vote if needed
            Member::where('nik', $vote->member_nik)->update(['has_voted' => false]);

            AuditLog::record(auth('api')->user()->name, 'Suara Diinvalidasi', [
                'nik'    => $vote->member_nik,
                'reason' => $request->reason,
            ]);
        });

        return response()->json(['message' => 'Suara berhasil diinvalidasi.']);
    }

    public function finalize(Request $request): JsonResponse
    {
        $setting = ElectionSetting::current();

        if ($setting->is_finalized) {
            return response()->json(['message' => 'Pemilihan sudah difinalisasi.'], 409);
        }

        $setting->update(['is_finalized' => true, 'is_active' => false]);

        AuditLog::record(auth('api')->user()->name, 'Pemilihan Difinalisasi', [
            'finalized_by' => auth('api')->user()->name,
            'total_valid'  => Vote::where('is_valid', true)->count(),
        ]);

        return response()->json(['message' => 'Hasil pemilihan berhasil difinalisasi.']);
    }

    public function publicResults(): JsonResponse
    {
        $setting = ElectionSetting::current();

        if (!$setting->is_finalized) {
            return response()->json(['message' => 'Hasil belum diumumkan.'], 403);
        }

        return $this->results();
    }
}
