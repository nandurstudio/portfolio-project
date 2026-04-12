<?php

namespace App\Http\Controllers;

use App\Models\Candidate;
use App\Models\Member;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\{Log, Auth, Validator};

class CandidateController extends Controller
{
    /**
     * Public alias for candidate listing.
     * GET /api/candidates
     */
    public function publicIndex(Request $request)
    {
        return $this->index($request);
    }

    /**
     * Get All Active Candidates
     * GET /api/candidates
     */
    public function index(Request $request)
    {
        try {
            $query = Candidate::with('department');

            $isAdminRoute = $request->is('api/admin/candidates*');
            if (!$isAdminRoute) {
                $query->where('is_active', true);
            }

            if (Schema::hasColumn('candidates', 'order_display')) {
                $query->orderBy('order_display', 'asc');
            } else {
                $query->orderBy('id', 'asc');
            }

            $candidates = $query->get()
                ->map(function ($candidate) {
                    return [
                        'id' => $candidate->id,
                        'name' => $candidate->name,
                        'nik' => $candidate->nik,
                        'position' => $candidate->position,
                        'bio' => $candidate->bio,
                        'vision' => $candidate->vision ?? null,
                        'mission' => $candidate->mission ?? null,
                        'vision_mission' => $candidate->vision_mission ?? null,
                        'motto' => $candidate->motto ?? null,
                        'photo_url' => $candidate->photo_url,
                        'full_photo_url' => $this->resolvePhotoUrl($candidate),
                        'order_display' => $candidate->order_display ?? null,
                        'department_name' => $candidate->department_name ?? null,
                        'site_name' => $candidate->site_name ?? null,
                        'is_active' => (bool) $candidate->is_active,
                        'department' => [
                            'id' => $candidate->department?->id,
                            'name' => $candidate->department?->name,
                            'code' => $candidate->department?->code
                        ],
                        'vote_count' => $candidate->validVotesCount(),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $candidates
            ]);
        } catch (\Exception $e) {
            Log::error('Get candidates failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create New Candidate (Admin only)
     * POST /api/candidates
     */
    public function store(Request $request)
    {
        try {
            // Ensure user is ADMIN
            $user = auth()->user();
            if (!$user || !in_array($user->role, ['super_admin', 'admin'], true)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya Admin yang bisa membuat kandidat baru',
                    'error' => 'UNAUTHORIZED'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'nullable|string|max:255|unique:candidates',
                'nik' => 'required|string|max:20|unique:candidates,nik',
                'position' => 'required|string|max:255',
                'department_id' => 'nullable|integer|exists:departments,id',
                'department_name' => 'nullable|string|max:150',
                'site_name' => 'nullable|string|max:120',
                'bio' => 'nullable|string',
                'vision' => 'nullable|string',
                'mission' => 'nullable|string',
                'vision_mission' => 'nullable|string',
                'motto' => 'nullable|string|max:255',
                'photo_url' => 'nullable|string|max:255',
                'full_photo_url' => 'nullable|string|max:255',
                'order_display' => 'nullable|integer|min:0',
                'is_active' => 'nullable|boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $nik = strtoupper(trim((string) $request->nik));
            $member = Member::query()->where('nik', $nik)->first();

            if (!$member) {
                return response()->json([
                    'success' => false,
                    'message' => 'NIK tidak ditemukan di data anggota. Silakan cek NIK terlebih dahulu.',
                    'error' => 'MEMBER_NOT_FOUND'
                ], 422);
            }

            $autoName = $member->name;
            $inputDepartment = trim((string) $request->department_name);
            $inputSite = trim((string) $request->site_name);
            $resolvedDepartment = $inputDepartment !== '' ? $inputDepartment : (string) $member->department;
            $resolvedSite = $inputSite !== '' ? $inputSite : (string) $member->site;

            $candidate = Candidate::create([
                'name' => $autoName,
                'nik' => $nik,
                'position' => $request->position,
                'department_id' => $request->department_id,
                'department_name' => $resolvedDepartment,
                'site_name' => $resolvedSite,
                'bio' => $request->bio,
                'vision' => $request->vision,
                'mission' => $request->mission,
                'vision_mission' => $request->vision_mission,
                'motto' => $request->motto,
                'photo_url' => $request->photo_url,
                'full_photo_url' => $request->full_photo_url,
                'order_display' => $request->order_display ?? 0,
                'is_active' => $request->boolean('is_active', true)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Kandidat berhasil dibuat',
                'data' => [
                    'id' => $candidate->id,
                    'name' => $candidate->name,
                    'nik' => $candidate->nik,
                    'position' => $candidate->position,
                    'department_id' => $candidate->department_id,
                    'department_name' => $candidate->department_name,
                    'site_name' => $candidate->site_name,
                    'photo_url' => $candidate->photo_url,
                    'full_photo_url' => $this->resolvePhotoUrl($candidate),
                ]
            ], 201);
        } catch (\Exception $e) {
            Log::error('Create candidate failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update Candidate (Admin only)
     * PUT /api/candidates/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            // Ensure user is ADMIN
            $user = auth()->user();
            if (!$user || !in_array($user->role, ['super_admin', 'admin'], true)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya Admin yang bisa update kandidat',
                    'error' => 'UNAUTHORIZED'
                ], 403);
            }

            $candidate = Candidate::find($id);

            if (!$candidate) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kandidat tidak ditemukan',
                    'error' => 'CANDIDATE_NOT_FOUND'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'nullable|string|max:255|unique:candidates,name,' . $id,
                'nik' => 'required|string|max:20|unique:candidates,nik,' . $id,
                'position' => 'nullable|string|max:255',
                'department_id' => 'nullable|integer|exists:departments,id',
                'department_name' => 'nullable|string|max:150',
                'site_name' => 'nullable|string|max:120',
                'bio' => 'nullable|string',
                'vision' => 'nullable|string',
                'mission' => 'nullable|string',
                'vision_mission' => 'nullable|string',
                'motto' => 'nullable|string|max:255',
                'photo_url' => 'nullable|string|max:255',
                'full_photo_url' => 'nullable|string|max:255',
                'order_display' => 'nullable|integer|min:0',
                'is_active' => 'nullable|boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $nik = strtoupper(trim((string) $request->nik));
            $member = Member::query()->where('nik', $nik)->first();
            if (!$member) {
                return response()->json([
                    'success' => false,
                    'message' => 'NIK tidak ditemukan di data anggota. Silakan cek NIK terlebih dahulu.',
                    'error' => 'MEMBER_NOT_FOUND'
                ], 422);
            }

            $autoName = $member->name;
            $inputDepartment = trim((string) $request->department_name);
            $inputSite = trim((string) $request->site_name);
            $resolvedDepartment = $inputDepartment !== '' ? $inputDepartment : (string) $member->department;
            $resolvedSite = $inputSite !== '' ? $inputSite : (string) $member->site;

            $candidate->update([
                'name' => $autoName,
                'nik' => $nik,
                'position' => $request->position ?? $candidate->position,
                'department_id' => $request->department_id,
                'department_name' => $resolvedDepartment,
                'site_name' => $resolvedSite,
                'bio' => $request->bio,
                'vision' => $request->vision,
                'mission' => $request->mission,
                'vision_mission' => $request->vision_mission,
                'motto' => $request->motto,
                'photo_url' => $request->photo_url,
                'full_photo_url' => $request->full_photo_url,
                'order_display' => $request->order_display,
                'is_active' => $request->has('is_active') ? $request->boolean('is_active') : $candidate->is_active,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Kandidat berhasil diupdate',
                'data' => [
                    'id' => $candidate->id,
                    'name' => $candidate->name,
                    'nik' => $candidate->nik,
                    'position' => $candidate->position,
                    'department_id' => $candidate->department_id,
                    'department_name' => $candidate->department_name,
                    'site_name' => $candidate->site_name,
                    'vision_mission' => $candidate->vision_mission ?? null,
                    'motto' => $candidate->motto ?? null,
                    'order_display' => $candidate->order_display ?? null,
                    'is_active' => $candidate->is_active,
                    'photo_url' => $candidate->photo_url,
                    'full_photo_url' => $this->resolvePhotoUrl($candidate),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Update candidate failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Soft Delete Candidate (Admin only)
     * DELETE /api/candidates/{id}
     */
    public function destroy(Request $request, $id)
    {
        try {
            // Ensure user is ADMIN
            $user = auth()->user();
            if (!$user || !in_array($user->role, ['super_admin', 'admin'], true)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya Admin yang bisa delete kandidat',
                    'error' => 'UNAUTHORIZED'
                ], 403);
            }

            $candidate = Candidate::find($id);

            if (!$candidate) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kandidat tidak ditemukan',
                    'error' => 'CANDIDATE_NOT_FOUND'
                ], 404);
            }

            // Check if candidate has votes
            $voteCount = $candidate->votes()->count();
            if ($voteCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak bisa delete kandidat yang sudah punya votes (' . $voteCount . ')',
                    'error' => 'CANDIDATE_HAS_VOTES'
                ], 409);
            }

            // Soft delete (set is_active = false)
            $candidate->update(['is_active' => false]);

            return response()->json([
                'success' => true,
                'message' => 'Kandidat berhasil dihapus'
            ]);
        } catch (\Exception $e) {
            Log::error('Delete candidate failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload Candidate Photo (Admin only)
     * POST /api/candidates/{id}/upload-photo
     */
    public function uploadPhoto(Request $request, $id)
    {
        try {
            // Ensure user is ADMIN
            $user = auth()->user();
            if (!$user || !in_array($user->role, ['super_admin', 'admin'], true)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya Admin yang bisa upload foto',
                    'error' => 'UNAUTHORIZED'
                ], 403);
            }

            $candidate = Candidate::find($id);

            if (!$candidate) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kandidat tidak ditemukan',
                    'error' => 'CANDIDATE_NOT_FOUND'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $oldPhotoPaths = array_filter([
                $this->resolveLocalPhotoPath($candidate->photo_url),
                $this->resolveLocalPhotoPath($candidate->full_photo_url),
            ]);

            // Store new photo in public/uploads so URL is directly accessible without storage symlink.
            $file = $request->file('photo');
            $uploadDir = public_path('uploads/candidates');
            if (!is_dir($uploadDir)) {
                $created = @mkdir($uploadDir, 0755, true);
                if (!$created && !is_dir($uploadDir)) {
                    throw new \RuntimeException('Gagal membuat folder upload: ' . $uploadDir);
                }
            }

            $filename = 'candidate_' . $candidate->id . '_' . time() . '.' . strtolower($file->getClientOriginalExtension());
            $movedFile = $file->move($uploadDir, $filename);
            if (!$movedFile || !file_exists($movedFile->getPathname())) {
                throw new \RuntimeException('File upload tidak berhasil dipindahkan ke folder tujuan.');
            }

            $relativePath = 'uploads/candidates/' . $filename;
            $absoluteUrl = url($relativePath);

            Log::info('Candidate photo uploaded', [
                'candidate_id' => $candidate->id,
                'relative_path' => $relativePath,
                'absolute_url' => $absoluteUrl,
            ]);

            // Update candidate first, then delete old file to avoid broken records when upload fails.
            $candidate->update([
                'photo_url' => $relativePath,
                'full_photo_url' => $absoluteUrl,
            ]);

            foreach ($oldPhotoPaths as $oldPath) {
                if ($oldPath !== public_path($relativePath) && file_exists($oldPath)) {
                    @unlink($oldPath);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Foto berhasil diupload',
                'data' => [
                    'id' => $candidate->id,
                    'photo_url' => $candidate->photo_url,
                    'full_photo_url' => $this->resolvePhotoUrl($candidate)
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Upload photo failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function resolvePhotoUrl(Candidate $candidate): ?string
    {
        $full = $candidate->full_photo_url;
        if (is_string($full) && trim($full) !== '') {
            if (str_starts_with($full, 'http://') || str_starts_with($full, 'https://')) {
                return $full;
            }
            return url(ltrim($full, '/'));
        }

        $photo = $candidate->photo_url;
        if (!is_string($photo) || trim($photo) === '') {
            return null;
        }

        if (str_starts_with($photo, 'http://') || str_starts_with($photo, 'https://')) {
            return $photo;
        }

        if (str_starts_with($photo, 'public/')) {
            return url('storage/' . ltrim(substr($photo, 7), '/'));
        }

        if (str_starts_with($photo, 'candidates/')) {
            return url('storage/' . ltrim($photo, '/'));
        }

        return url(ltrim($photo, '/'));
    }

    private function resolveLocalPhotoPath(?string $photo): ?string
    {
        if (!is_string($photo) || trim($photo) === '') {
            return null;
        }

        $path = $photo;
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            $parsed = parse_url($path, PHP_URL_PATH);
            if (!is_string($parsed) || trim($parsed) === '') {
                return null;
            }
            $path = ltrim($parsed, '/');
        }

        $path = ltrim($path, '/');

        if (str_starts_with($path, 'uploads/')) {
            return public_path($path);
        }

        if (str_starts_with($path, 'storage/')) {
            return public_path($path);
        }

        if (str_starts_with($path, 'public/')) {
            return storage_path('app/' . $path);
        }

        if (str_starts_with($path, 'candidates/')) {
            return storage_path('app/public/' . $path);
        }

        return public_path($path);
    }
}
