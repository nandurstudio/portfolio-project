<?php

namespace App\Http\Controllers;

use App\Models\ElectionSetting;
use App\Models\Member;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Log, Validator};

class ElectionSettingController extends Controller
{
    private function formatElection(ElectionSetting $election): array
    {
        $status = $election->election_status;
        $publicStatus = $status === 'OPEN' ? 'open' : ($status === 'CLOSED' ? 'closed' : 'coming_soon');

        return [
            'id' => $election->id,
            'election_name' => $election->election_name,
            'period' => $election->period,
            'start_date' => $election->start_date?->toDateString(),
            'end_date' => $election->end_date?->toDateString(),
            'end_time' => $election->end_time,
            'is_active' => (bool) $election->is_active,
            'is_finalized' => (bool) $election->is_finalized,
            'election_status' => $status,
            'status' => $publicStatus,
            'start_at' => optional($election->started_at)->toDateTimeString(),
            'end_at' => optional($election->ended_at)->toDateTimeString(),
            'announcement_at' => optional($election->announcement_at ?? $election->ended_at)->toDateTimeString(),
            'hero_title' => $election->hero_title ?: 'SUARAKAN ASPIRASIMU!',
            'hero_description' => $election->hero_description ?: 'Mari sukseskan Pemilihan Ketua Koperasi Karya Mandiri periode 2026-2029. Jangan sampai golput, karena arah koperasi kita ditentukan oleh suara seluruh anggota.',
            'cta_text' => $election->cta_text ?: 'Lanjut Verifikasi OTP',
            'agenda_title' => $election->agenda_title ?: $election->election_name,
            'agenda_description' => $election->agenda_description ?: ('Agenda pemilihan ketua koperasi periode ' . ($election->period ?: '-')),
            'agenda_location' => $election->agenda_location,
            'show_countdown' => (bool) ($election->show_countdown ?? true),
            'show_activity_log' => (bool) ($election->show_activity_log ?? true),
            'reward_enabled' => (bool) ($election->reward_enabled ?? true),
            'winners_revealed' => (bool) ($election->winners_revealed ?? false),
            'winners_animation_duration_ms' => (int) ($election->winners_animation_duration_ms ?? 1800),
            'reward_text' => $election->reward_text ?: 'Voucher GoPay senilai Rp25.000',
            'seo_title' => $election->seo_title,
            'seo_description' => $election->seo_description,
            'og_title' => $election->og_title,
            'og_description' => $election->og_description,
            'og_image_url' => $election->og_image_url,
            'canonical_url' => $election->canonical_url,
            'threshold_calculated' => $election->calculateThreshold(),
            'countdown_seconds' => $election->secondsRemaining(),
            'has_expired' => $election->hasExpired(),
            'created_at' => optional($election->created_at)->toDateTimeString(),
            'updated_at' => optional($election->updated_at)->toDateTimeString(),
        ];
    }

    private function isAdminUser(): bool
    {
        $user = auth('api')->user();
        if (!$user) {
            return false;
        }

        return in_array($user->role, ['super_admin', 'admin'], true);
    }

    /**
     * Get Current Election Settings
     * GET /api/election/current
     */
    public function current(Request $request)
    {
        try {
            $election = ElectionSetting::current();

            if (!$election) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak ada pemilihan yang aktif',
                    'error' => 'NO_ACTIVE_ELECTION'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $this->formatElection($election)
            ]);
        } catch (\Exception $e) {
            Log::error('Get election settings failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Public info for landing page
     * GET /api/election/info
     */
    public function publicInfo(Request $request)
    {
        return $this->current($request);
    }

    /**
     * Public stats for landing page
     * GET /api/election/stats
     */
    public function publicStats(Request $request)
    {
        try {
            $election = ElectionSetting::current();

            if (!$election) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak ada pemilihan yang aktif',
                    'error' => 'NO_ACTIVE_ELECTION'
                ], 404);
            }

            $totalMembers = Member::where('is_eligible', true)->count();
            $totalVoters = Member::where('is_eligible', true)
                ->where('has_voted', true)
                ->count();
            $totalVoters = min($totalVoters, $totalMembers);
            $participationPercentage = $totalMembers > 0
                ? round(($totalVoters / $totalMembers) * 100, 2)
                : 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'status' => $election->election_status,
                    'countdown_seconds' => $election->secondsRemaining(),
                    'has_expired' => $election->hasExpired(),
                    'total_members' => $totalMembers,
                    'total_voters' => $totalVoters,
                    'participation_percentage' => $participationPercentage,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Get election stats failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Start Election (DRAFT → OPEN)
     * POST /api/election/start
     */
    public function start(Request $request)
    {
        try {
            if (!$this->isAdminUser()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya Admin yang bisa memulai pemilihan',
                    'error' => 'UNAUTHORIZED'
                ], 403);
            }

            $election = ElectionSetting::current();

            if (!$election) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak ada pemilihan yang disiapkan',
                    'error' => 'NO_ELECTION_FOUND'
                ], 404);
            }

            // Check: Already started?
            if ($election->election_status !== 'DRAFT') {
                return response()->json([
                    'success' => false,
                    'message' => 'Pemilihan sudah dalam status: ' . $election->election_status,
                    'error' => 'ELECTION_ALREADY_STARTED'
                ], 409);
            }

            $election->update([
                'is_active' => true,
                'is_finalized' => false,
                'start_date' => now()->toDateString()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Pemilihan berhasil dimulai',
                'data' => $this->formatElection($election)
            ]);
        } catch (\Exception $e) {
            Log::error('Start election failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Close Election (OPEN → CLOSED)
     * POST /api/election/close
     */
    public function close(Request $request)
    {
        try {
            if (!$this->isAdminUser()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya Admin yang bisa menutup pemilihan',
                    'error' => 'UNAUTHORIZED'
                ], 403);
            }

            $election = ElectionSetting::current();

            if (!$election) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak ada pemilihan yang aktif',
                    'error' => 'NO_ELECTION_FOUND'
                ], 404);
            }

            // Check: Must be OPEN
            if ($election->election_status !== 'OPEN') {
                return response()->json([
                    'success' => false,
                    'message' => 'Pemilihan harus dalam status OPEN untuk ditutup (status saat ini: ' . $election->election_status . ')',
                    'error' => 'INVALID_STATUS'
                ], 409);
            }

            $election->update([
                'is_active' => false,
                'is_finalized' => true,
                'end_date' => now()->toDateString(),
                'end_time' => now()->format('H:i:s')
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Pemilihan berhasil ditutup',
                'data' => $this->formatElection($election)
            ]);
        } catch (\Exception $e) {
            Log::error('Close election failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update Election Settings (Admin only)
     * PUT /api/election/update
     */
    public function update(Request $request)
    {
        try {
            if (!$this->isAdminUser()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya Admin yang bisa update pemilihan',
                    'error' => 'UNAUTHORIZED'
                ], 403);
            }

            $election = ElectionSetting::current();

            if (!$election) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak ada pemilihan untuk diupdate',
                    'error' => 'NO_ELECTION_FOUND'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'election_name' => 'nullable|string|max:255',
                'period' => 'nullable|string|max:100',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'end_time' => ['nullable', 'regex:/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/'],
                'announcement_at' => 'nullable|date',
                'is_active' => 'nullable|boolean',
                'is_finalized' => 'nullable|boolean',
                'hero_title' => 'nullable|string|max:255',
                'hero_description' => 'nullable|string',
                'cta_text' => 'nullable|string|max:150',
                'agenda_title' => 'nullable|string|max:255',
                'agenda_description' => 'nullable|string',
                'agenda_location' => 'nullable|string|max:255',
                'show_countdown' => 'nullable|boolean',
                'show_activity_log' => 'nullable|boolean',
                'reward_enabled' => 'nullable|boolean',
                'winners_revealed' => 'nullable|boolean',
                'winners_animation_duration_ms' => 'nullable|integer|min:300|max:10000',
                'reward_text' => 'nullable|string|max:255',
                'seo_title' => 'nullable|string|max:255',
                'seo_description' => 'nullable|string|max:255',
                'og_title' => 'nullable|string|max:255',
                'og_description' => 'nullable|string|max:255',
                'og_image_url' => 'nullable|url|max:255',
                'canonical_url' => 'nullable|url|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $payload = $request->only([
                'election_name',
                'period',
                'start_date',
                'end_date',
                'end_time',
                'announcement_at',
                'is_active',
                'is_finalized',
                'hero_title',
                'hero_description',
                'cta_text',
                'agenda_title',
                'agenda_description',
                'agenda_location',
                'show_countdown',
                'show_activity_log',
                'reward_enabled',
                'winners_revealed',
                'winners_animation_duration_ms',
                'reward_text',
                'seo_title',
                'seo_description',
                'og_title',
                'og_description',
                'og_image_url',
                'canonical_url',
            ]);

            if (!empty($payload['end_time']) && strlen($payload['end_time']) === 5) {
                $payload['end_time'] = $payload['end_time'] . ':00';
            }

            $election->update($payload);

            return response()->json([
                'success' => true,
                'message' => 'Pengaturan pemilihan berhasil diupdate',
                'data' => $this->formatElection($election)
            ]);
        } catch (\Exception $e) {
            Log::error('Update election failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
