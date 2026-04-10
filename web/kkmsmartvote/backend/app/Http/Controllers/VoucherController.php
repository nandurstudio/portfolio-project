<?php

namespace App\Http\Controllers;

use App\Models\Voucher;
use App\Models\Vote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{DB, Log, Auth};

class VoucherController extends Controller
{
    /**
     * Redeem Voucher (Panitia/Admin only)
     * POST /api/admin/voucher/redeem
     */
    public function redeem(Request $request)
    {
        $request->validate([
            'code' => 'required|string|size:21'  // VCH-2026-XXX-XXXX-XXXXXX
        ]);

        try {
            // Ensure user is PANITIA or ADMIN
            $user = auth()->user();
            if (!$user || !in_array($user->role->code, ['PANITIA', 'ADMIN'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya Panitia/Admin yang bisa redeem voucher',
                    'error' => 'UNAUTHORIZED'
                ], 403);
            }

            $voucher = Voucher::where('code', $request->code)->first();

            if (!$voucher) {
                return response()->json([
                    'success' => false,
                    'message' => 'Voucher tidak ditemukan',
                    'error' => 'VOUCHER_NOT_FOUND'
                ], 404);
            }

            // Check: Voucher already redeemed?
            if ($voucher->status === 'REDEEMED') {
                return response()->json([
                    'success' => false,
                    'message' => 'Voucher ini sudah di-redeem',
                    'error' => 'VOUCHER_ALREADY_REDEEMED',
                    'data' => [
                        'redeemed_at' => $voucher->redeemed_at,
                        'redeemed_by' => $voucher->redeemed_by_user?->name ?? 'Unknown'
                    ]
                ], 409);
            }

            // Check: Voucher in valid status (GENERATED or CLAIMED)?
            if (!in_array($voucher->status, ['GENERATED', 'CLAIMED'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Voucher tidak valid (status: ' . $voucher->status . ')',
                    'error' => 'INVALID_VOUCHER_STATUS'
                ], 400);
            }

            // Mark as REDEEMED
            $voucher->update([
                'status' => 'REDEEMED',
                'redeemed_at' => now(),
                'redeemed_by' => $user->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Voucher berhasil di-redeem',
                'data' => [
                    'code' => $voucher->code,
                    'member_nik' => $voucher->member_nik,
                    'member_name' => $voucher->member_name,
                    'candidate_name' => $voucher->candidate_name,
                    'status' => 'REDEEMED',
                    'redeemed_at' => $voucher->redeemed_at,
                    'redeemed_by' => $user->name
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Voucher redeem failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verify Voucher (Check without redeeming)
     * GET /api/admin/voucher/verify/{code}
     */
    public function verify(Request $request, $code)
    {
        try {
            $voucher = Voucher::where('code', $code)->first();

            if (!$voucher) {
                return response()->json([
                    'success' => false,
                    'message' => 'Voucher tidak ditemukan',
                    'error' => 'VOUCHER_NOT_FOUND'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'code' => $voucher->code,
                    'status' => $voucher->status,
                    'member_nik' => $voucher->member_nik,
                    'member_name' => $voucher->member_name,
                    'member_email' => $voucher->member_email,
                    'candidate_name' => $voucher->candidate_name,
                    'department' => $voucher->department?->name ?? 'N/A',
                    'created_at' => $voucher->created_at,
                    'claimed_at' => $voucher->claimed_at,
                    'redeemed_at' => $voucher->redeemed_at,
                    'redeemed_by' => $voucher->redeemed_by_user?->name ?? null,
                    'can_redeem' => in_array($voucher->status, ['GENERATED', 'CLAIMED'])
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Voucher verify failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Voucher Statistics (Admin only)
     * GET /api/admin/voucher/stats
     */
    public function stats(Request $request)
    {
        try {
            // Ensure user is ADMIN
            $user = auth()->user();
            if (!$user || $user->role->code !== 'ADMIN') {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya Admin yang bisa melihat statistik',
                    'error' => 'UNAUTHORIZED'
                ], 403);
            }

            $total = Voucher::count();
            $generated = Voucher::where('status', 'GENERATED')->count();
            $claimed = Voucher::where('status', 'CLAIMED')->count();
            $redeemed = Voucher::where('status', 'REDEEMED')->count();

            // Stats by department
            $byDepartment = Voucher::with('department')
                ->groupBy('department_id')
                ->selectRaw('department_id, COUNT(*) as total, SUM(CASE WHEN status = "GENERATED" THEN 1 ELSE 0 END) as generated, SUM(CASE WHEN status = "CLAIMED" THEN 1 ELSE 0 END) as claimed, SUM(CASE WHEN status = "REDEEMED" THEN 1 ELSE 0 END) as redeemed')
                ->get()
                ->map(function ($item) {
                    return [
                        'department_id' => $item->department_id,
                        'department_name' => $item->department?->name ?? 'Unknown',
                        'total' => $item->total ?? 0,
                        'generated' => $item->generated ?? 0,
                        'claimed' => $item->claimed ?? 0,
                        'redeemed' => $item->redeemed ?? 0
                    ];
                });

            // Stats by candidate
            $byCandidate = Voucher::groupBy('candidate_id')
                ->selectRaw('candidate_name, COUNT(*) as total, SUM(CASE WHEN status = "REDEEMED" THEN 1 ELSE 0 END) as redeemed')
                ->get()
                ->map(function ($item) {
                    return [
                        'candidate_name' => $item->candidate_name,
                        'total_votes' => $item->total ?? 0,
                        'redeemed_count' => $item->redeemed ?? 0,
                        'redemption_rate' => $item->total > 0 ? intval(($item->redeemed / $item->total) * 100) : 0
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'overview' => [
                        'total_vouchers' => $total,
                        'generated' => $generated,
                        'claimed' => $claimed,
                        'redeemed' => $redeemed,
                        'pending_redemption' => $generated + $claimed,
                        'redemption_rate' => $total > 0 ? intval(($redeemed / $total) * 100) : 0
                    ],
                    'by_department' => $byDepartment,
                    'by_candidate' => $byCandidate,
                    'generated_at' => Voucher::orderBy('created_at', 'asc')->first()?->created_at,
                    'last_redeemed_at' => Voucher::where('status', 'REDEEMED')->orderBy('redeemed_at', 'desc')->first()?->redeemed_at
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Voucher stats failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * List Vouchers with Filters & Pagination (Admin only)
     * GET /api/admin/voucher/list?status=GENERATED&department_id=1&page=1&limit=50
     */
    public function list(Request $request)
    {
        try {
            // Ensure user is ADMIN
            $user = auth()->user();
            if (!$user || $user->role->code !== 'ADMIN') {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya Admin yang bisa melihat daftar voucher',
                    'error' => 'UNAUTHORIZED'
                ], 403);
            }

            $query = Voucher::with(['department', 'redeemed_by_user'])
                ->orderBy('created_at', 'desc');

            // Filter by status
            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }

            // Filter by department
            if ($request->has('department_id') && $request->department_id) {
                $query->where('department_id', $request->department_id);
            }

            // Filter by candidate
            if ($request->has('candidate_name') && $request->candidate_name) {
                $query->where('candidate_name', 'like', '%' . $request->candidate_name . '%');
            }

            // Filter by date range
            if ($request->has('start_date') && $request->start_date) {
                $query->whereDate('created_at', '>=', $request->start_date);
            }
            if ($request->has('end_date') && $request->end_date) {
                $query->whereDate('created_at', '<=', $request->end_date);
            }

            // Pagination
            $page = intval($request->input('page', 1));
            $limit = intval($request->input('limit', 50));
            $offset = ($page - 1) * $limit;

            $total = $query->count();
            $vouchers = $query->skip($offset)
                ->take($limit)
                ->get()
                ->map(function ($voucher) {
                    return [
                        'code' => $voucher->code,
                        'status' => $voucher->status,
                        'member_nik' => $voucher->member_nik,
                        'member_name' => $voucher->member_name,
                        'candidate_name' => $voucher->candidate_name,
                        'department_name' => $voucher->department?->name ?? 'Unknown',
                        'created_at' => $voucher->created_at,
                        'claimed_at' => $voucher->claimed_at,
                        'redeemed_at' => $voucher->redeemed_at,
                        'redeemed_by' => $voucher->redeemed_by_user?->name ?? null
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $vouchers,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => intval(ceil($total / $limit)),
                    'has_more' => ($page * $limit) < $total
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Voucher list failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
