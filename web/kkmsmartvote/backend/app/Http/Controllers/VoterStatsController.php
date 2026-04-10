<?php

namespace App\Http\Controllers;

use App\Models\Vote;
use App\Models\Member;
use App\Models\Candidate;
use App\Models\ElectionSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{DB, Log};

class VoterStatsController extends Controller
{
    /**
     * Get Voting Progress Statistics
     * GET /api/stats/voting-progress
     */
    public function votingProgress(Request $request)
    {
        try {
            $election = ElectionSetting::current();

            // Get vote counts
            $totalMembers = Member::where('is_eligible', true)->count();
            $totalVotes = Vote::where('is_valid', true)->count();
            $totalSaksi = Vote::where('is_saksi', true)
                ->where('is_valid', true)
                ->count();

            $participationPct = $totalMembers > 0 ? round(($totalVotes / $totalMembers) * 100, 2) : 0;

            // Countdown: seconds remaining until election ends
            $secondsRemaining = $election ? $election->secondsRemaining() : 0;
            $electionClosed = $election && $election->hasExpired();

            // Votes by location (per site)
            $votesByLocation = Vote::where('is_valid', true)
                ->select('site', DB::raw('COUNT(*) as vote_count'))
                ->groupBy('site')
                ->get()
                ->map(function ($item) {
                    return [
                        'site' => $item->site,
                        'vote_count' => $item->vote_count
                    ];
                });

            // Votes by department
            $votesByDepartment = Vote::where('is_valid', true)
                ->join('members', 'votes.member_id', '=', 'members.id')
                ->select('members.department', DB::raw('COUNT(*) as vote_count'))
                ->groupBy('members.department')
                ->get()
                ->map(function ($item) {
                    return [
                        'department' => $item->department,
                        'vote_count' => $item->vote_count
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'total_eligible_members' => $totalMembers,
                    'total_votes' => $totalVotes,
                    'total_saksi_votes' => $totalSaksi,
                    'participation_percentage' => $participationPct,
                    'countdown_seconds_remaining' => max(0, $secondsRemaining),
                    'election_closed' => $electionClosed,
                    'election_status' => $election ? $election->election_status : 'NO_ELECTION',
                    'votes_by_location' => $votesByLocation,
                    'votes_by_department' => $votesByDepartment,
                    'timestamp' => now()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Get voting progress failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Candidate Vote Counts & Threshold Status
     * GET /api/stats/candidate-votes
     */
    public function candidateVotes(Request $request)
    {
        try {
            $election = ElectionSetting::current();

            if (!$election) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak ada pemilihan aktif',
                    'error' => 'NO_ELECTION'
                ], 404);
            }

            // Get total eligible members
            $totalEligible = Member::where('is_eligible', true)->count();
            $threshold = $election->calculateThreshold();

            // Get all candidates with vote counts
            $candidates = Candidate::where('is_active', true)
                ->leftJoin('votes', function ($join) {
                    $join->on('candidates.id', '=', 'votes.candidate_id')
                        ->where('votes.is_valid', true);
                })
                ->select(
                    'candidates.id',
                    'candidates.name',
                    'candidates.position',
                    'candidates.order_display',
                    'candidates.vision',
                    'candidates.mission',
                    DB::raw('COUNT(votes.id) as total_votes')
                )
                ->groupBy(
                    'candidates.id',
                    'candidates.name',
                    'candidates.position',
                    'candidates.order_display',
                    'candidates.vision',
                    'candidates.mission'
                )
                ->orderBy('candidates.order_display')
                ->get()
                ->map(function ($candidate) use ($totalEligible, $threshold) {
                    $voteCount = $candidate->total_votes;
                    $votePct = $totalEligible > 0 ? ($voteCount / $totalEligible) * 100 : 0;
                    $meetsThreshold = $votePct >= $threshold;

                    return [
                        'id' => $candidate->id,
                        'name' => $candidate->name,
                        'position' => $candidate->position,
                        'order_display' => $candidate->order_display,
                        'total_votes' => $voteCount,
                        'vote_percentage' => round($votePct, 2),
                        'threshold_percentage' => $threshold,
                        'meets_threshold' => $meetsThreshold,
                        'vision' => $candidate->vision,
                        'mission' => $candidate->mission
                    ];
                });

            // Find winners (meets threshold)
            $winners = $candidates->filter(function ($c) {
                return $c['meets_threshold'];
            })->values();

            // Voting method description
            $votingMethod = $election->voting_method ?? '50plus1';
            $methodDesc = [
                'simple_majority' => 'Suara Terbanyak',
                '50plus1' => '50% + 1 Suara',
                'consensus' => 'Konsensus'
            ][$votingMethod] ?? 'Tidak Diketahui';

            return response()->json([
                'success' => true,
                'data' => [
                    'total_eligible_members' => $totalEligible,
                    'threshold_percentage' => $threshold,
                    'voting_method' => $votingMethod,
                    'voting_method_description' => $methodDesc,
                    'candidates' => $candidates,
                    'winners' => $winners,
                    'timestamp' => now()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Get candidate votes failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Voting Statistics by Department
     * GET /api/stats/department-breakdown
     */
    public function departmentBreakdown(Request $request)
    {
        try {
            // Get department breakdown
            $departments = Member::where('is_eligible', true)
                ->select('department', DB::raw('COUNT(*) as total_members'))
                ->groupBy('department')
                ->get()
                ->map(function ($dept) {
                    $totalMembers = $dept->total_members;

                    // Count votes from this department
                    $votesFromDept = Vote::where('is_valid', true)
                        ->join('members', 'votes.member_id', '=', 'members.id')
                        ->where('members.department', $dept->department)
                        ->count();

                    $votePct = $totalMembers > 0 ? round(($votesFromDept / $totalMembers) * 100, 2) : 0;

                    // Votes by candidate from this department
                    $candidateVotes = Vote::where('is_valid', true)
                        ->join('members', 'votes.member_id', '=', 'members.id')
                        ->join('candidates', 'votes.candidate_id', '=', 'candidates.id')
                        ->where('members.department', $dept->department)
                        ->select(
                            'candidates.name as candidate_name',
                            'candidates.position',
                            DB::raw('COUNT(*) as vote_count')
                        )
                        ->groupBy('candidates.name', 'candidates.position')
                        ->orderByDesc('vote_count')
                        ->get();

                    return [
                        'department' => $dept->department,
                        'total_members' => $totalMembers,
                        'total_votes' => $votesFromDept,
                        'participation_percentage' => $votePct,
                        'votes_by_candidate' => $candidateVotes
                    ];
                })
                ->sortBy('department')
                ->values();

            // Site breakdown
            $sites = Vote::where('is_valid', true)
                ->select('site', DB::raw('COUNT(*) as total_votes'))
                ->groupBy('site')
                ->orderBy('site')
                ->get()
                ->map(function ($site) {
                    return [
                        'site' => $site->site,
                        'total_votes' => $site->total_votes
                    ];
                });

            // Overall summary
            $totalEligible = Member::where('is_eligible', true)->count();
            $totalVotes = Vote::where('is_valid', true)->count();
            $totalSites = $sites->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'summary' => [
                        'total_eligible_members' => $totalEligible,
                        'total_votes' => $totalVotes,
                        'overall_participation_pct' => $totalEligible > 0 ? round(($totalVotes / $totalEligible) * 100, 2) : 0,
                        'total_departments' => $departments->count(),
                        'total_sites' => $totalSites
                    ],
                    'departments' => $departments,
                    'sites' => $sites,
                    'timestamp' => now()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Get department breakdown failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
