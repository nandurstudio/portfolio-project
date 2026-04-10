<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::query();

        if ($request->filled('action')) {
            $query->where('action', (string) $request->input('action'));
        }

        if ($request->filled('actor')) {
            $query->where('actor', 'like', '%' . trim((string) $request->input('actor')) . '%');
        }

        if ($request->filled('q')) {
            $keyword = trim((string) $request->input('q'));
            $query->where(function ($inner) use ($keyword) {
                $inner->where('actor', 'like', "%{$keyword}%")
                    ->orWhere('action', 'like', "%{$keyword}%");
            });
        }

        if ($request->filled('from')) {
            $query->where('logged_at', '>=', $request->date('from')->startOfDay());
        }

        if ($request->filled('to')) {
            $query->where('logged_at', '<=', $request->date('to')->endOfDay());
        }

        $summaryQuery = clone $query;

        $perPage = max(10, min((int) $request->input('per_page', 50), 200));
        $logs = $query
            ->orderByDesc('logged_at')
            ->paginate($perPage);

        $summaryRows = $summaryQuery
            ->selectRaw('action, COUNT(*) as total')
            ->groupBy('action')
            ->orderByDesc('total')
            ->get();

        $firstHash = null;
        $lastHash = null;
        if ($logs->count() > 0) {
            $last = $logs->first();
            $first = $logs->last();
            $lastHash = is_array($last?->detail) ? ($last->detail['_forensic']['chain_hash'] ?? null) : null;
            $firstHash = is_array($first?->detail) ? ($first->detail['_forensic']['chain_hash'] ?? null) : null;
        }

        return response()->json([
            'data' => $logs->items(),
            'current_page' => $logs->currentPage(),
            'last_page' => $logs->lastPage(),
            'per_page' => $logs->perPage(),
            'total' => $logs->total(),
            'summary' => [
                'actions' => $summaryRows,
                'forensic' => [
                    'window_first_hash' => $firstHash,
                    'window_last_hash' => $lastHash,
                ],
            ],
        ]);
    }
}
