<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Candidate;
use App\Models\ElectionSetting;
use App\Models\Member;
use App\Models\Site;
use App\Models\Vote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    private function buildResultsPayload(): array
    {
        $totalValid = Vote::where('is_valid', true)->count();

        $candidates = Candidate::withCount(['votes as vote_count' => fn($q) => $q->where('is_valid', true)])
            ->orderByDesc('vote_count')
            ->orderBy('order_display', 'asc')
            ->get();

        $results = $candidates->values()->map(function ($c, $index) use ($totalValid) {
            $pct = $totalValid > 0 ? round($c->vote_count / $totalValid * 100, 2) : 0;
            return [
                'id'         => $c->id,
                'name'       => $c->name,
                'position'   => $c->position ?: 'Kandidat Ketua',
                'candidate_number' => (int) ($c->order_display ?: ($index + 1)),
                'photo_url'  => $c->getPhotoUrl(),
                'vote_count' => (int) $c->vote_count,
                'percentage' => $pct,
                'is_winner'  => $pct >= 50,
            ];
        });

        $winners = $results->filter(fn($r) => $r['is_winner']);
        $status  = match (true) {
            $winners->count() === 1 => 'WINNER',
            $winners->count() > 1  => 'TIE',
            default                => 'NO_MAJORITY',
        };

        return [
            'total_valid' => $totalValid,
            'results'     => $results->values(),
            'status'      => $status,
            'winner'      => $status === 'WINNER' ? $winners->first() : null,
        ];
    }

    public function dashboard(): JsonResponse
    {
        $totalMembers  = Member::where('is_eligible', true)->count();
        $totalValid    = Vote::where('is_valid', true)->count();
        $totalInvalid  = Vote::where('is_valid', false)->count();
        $participation = $totalMembers > 0 ? round($totalValid / $totalMembers * 100, 1) : 0;

        $siteVoteChart = Site::query()
            ->leftJoin('votes', function ($join) {
                $join->on('votes.site_id', '=', 'sites.id')
                    ->where('votes.is_valid', true);
            })
            ->groupBy('sites.id', 'sites.code', 'sites.name')
            ->orderByRaw('LOWER(sites.name) ASC')
            ->selectRaw('sites.id as site_id, sites.code as site_code, sites.name as site_name, COUNT(votes.id) as total_votes')
            ->get()
            ->map(function ($row) {
                $totalVotes = (int) ($row->total_votes ?? 0);
                return [
                    'site_id' => (int) $row->site_id,
                    'site_code' => (string) $row->site_code,
                    'site_name' => (string) $row->site_name,
                    'total_votes' => $totalVotes,
                    'has_votes' => $totalVotes > 0,
                ];
            })
            ->values();

        $totalSites = $siteVoteChart->count();
        $sitesWithVotes = $siteVoteChart->filter(fn($row) => $row['has_votes'])->count();
        $sitesWithoutVotes = $totalSites - $sitesWithVotes;

        $candidateStats = Candidate::withCount(['votes as valid_votes' => fn($q) => $q->where('is_valid', true)])
            ->orderByDesc('valid_votes')
            ->get(['id', 'name', 'position', 'is_active']);

        $setting = ElectionSetting::current();

        return response()->json([
            'total_members'    => $totalMembers,
            'total_valid'      => $totalValid,
            'total_invalid'    => $totalInvalid,
            'participation_pct' => $participation,
            'site_vote_overview' => [
                'total_sites' => $totalSites,
                'sites_with_votes' => $sitesWithVotes,
                'sites_without_votes' => $sitesWithoutVotes,
            ],
            'site_vote_chart' => $siteVoteChart,
            'candidate_stats'  => $candidateStats,
            'election'         => $setting,
        ]);
    }

    public function votes(Request $request): JsonResponse
    {
        $query = Vote::query()->with('site:id,name,code');

        if ($request->filled('is_valid')) {
            $query->where('is_valid', filter_var($request->is_valid, FILTER_VALIDATE_BOOLEAN));
        }
        if ($request->filled('site_id')) {
            $query->where('site_id', (int) $request->site_id);
        } elseif ($request->filled('site')) {
            $query->where('site', $request->site);
        }

        $isAdmin = in_array(auth('api')->user()->role, ['super_admin', 'admin'], true);
        $rows = $query
            ->orderByDesc('created_at')
            ->paginate(50)
            ->through(function (Vote $vote) use ($isAdmin) {
                $payload = [
                    'id' => $vote->id,
                    'member_nik' => $vote->member_nik,
                    'member_name' => $vote->member_name,
                    'site_id' => $vote->site_id,
                    'site' => $vote->site?->name ?? $vote->site,
                    'is_valid' => $vote->is_valid,
                    'created_at' => $vote->created_at,
                ];

                if ($isAdmin) {
                    $payload['candidate_id'] = $vote->candidate_id;
                    $payload['ip_address'] = $vote->ip_address;
                    $payload['invalidated_at'] = $vote->invalidated_at;
                    $payload['invalidation_reason'] = $vote->invalidation_reason;
                }

                return $payload;
            });

        return response()->json($rows);
    }

    public function results(): JsonResponse
    {
        return response()->json([
            ...$this->buildResultsPayload(),
        ]);
    }

    public function winners(): JsonResponse
    {
        $setting = ElectionSetting::current();

        return response()->json([
            ...$this->buildResultsPayload(),
            'election' => $setting,
            'winners_revealed' => (bool) ($setting?->winners_revealed ?? false),
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
