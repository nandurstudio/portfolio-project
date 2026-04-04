<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Candidate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CandidateController extends Controller
{
    /** Public — no auth required */
    public function publicIndex(): JsonResponse
    {
        $candidates = Candidate::where('is_active', true)
            ->select('id', 'name', 'position', 'bio', 'photo_url')
            ->orderBy('id')
            ->get();

        return response()->json($candidates);
    }

    /** Admin/Panitia — includes vote counts */
    public function index(): JsonResponse
    {
        $candidates = Candidate::withCount(['votes as valid_votes_count' => function ($q) {
            $q->where('is_valid', true);
        }])->orderBy('id')->get();

        return response()->json($candidates);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'      => 'required|string|max:255',
            'position'  => 'required|string|max:100',
            'bio'       => 'nullable|string|max:1000',
            'photo_url' => 'nullable|url|max:500',
        ]);

        $candidate = Candidate::create([
            'name'      => $request->name,
            'position'  => $request->position,
            'bio'       => $request->bio,
            'photo_url' => $request->photo_url,
            'is_active' => true,
        ]);

        AuditLog::record(auth('api')->user()->name, 'Kandidat Ditambah', ['name' => $candidate->name]);

        return response()->json($candidate, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $candidate = Candidate::findOrFail($id);

        $request->validate([
            'name'      => 'sometimes|string|max:255',
            'position'  => 'sometimes|string|max:100',
            'bio'       => 'nullable|string|max:1000',
            'photo_url' => 'nullable|url|max:500',
            'is_active' => 'sometimes|boolean',
        ]);

        $candidate->update($request->only(['name', 'position', 'bio', 'photo_url', 'is_active']));

        AuditLog::record(auth('api')->user()->name, 'Kandidat Diperbarui', ['name' => $candidate->name]);

        return response()->json($candidate);
    }

    public function destroy(int $id): JsonResponse
    {
        $candidate = Candidate::findOrFail($id);

        if ($candidate->votes()->exists()) {
            return response()->json(['message' => 'Kandidat tidak dapat dihapus karena sudah memiliki suara.'], 409);
        }

        AuditLog::record(auth('api')->user()->name, 'Kandidat Dihapus', ['name' => $candidate->name]);
        $candidate->delete();

        return response()->json(['message' => 'Kandidat berhasil dihapus.']);
    }
}
