<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\Vote;
use App\Models\EmailOtp;
use App\Models\Voucher;
use App\Models\Candidate;
use App\Models\Site;
use App\Models\Department;
use App\Models\AuditLog;
use App\Mail\VotingOtpMail;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\{DB, Hash, Mail, Log};
use Tymon\JWTAuth\Facades\JWTAuth;

class VotingController extends Controller
{
    /**
     * LAYER 1: Request OTP
     * POST /api/voting/request-otp
     * Check if member NIK is valid and email matches the member record when present
     */
    public function requestOtp(Request $request)
    {
        $request->validate([
            'member_nik' => 'required|string',
            'email' => 'required|email',
            'site_id' => 'nullable|integer|exists:sites,id',
        ]);

        try {
            $memberNik = trim((string) $request->member_nik);
            $email = strtolower((string) $request->email);

            $member = Member::query()->where('nik', $memberNik)->first();

            if (!$member) {
                AuditLog::record('Guest', 'OTP Request Ditolak', [
                    'reason' => 'MEMBER_NOT_FOUND',
                    'member_nik' => $memberNik,
                    'email' => $email,
                ], $request->ip());
                return response()->json([
                    'success' => false,
                    'message' => 'NIK tidak terdaftar di sistem',
                    'error' => 'MEMBER_NOT_FOUND'
                ], 404);
            }

            if (!$member->is_eligible) {
                AuditLog::record($member->name ?? 'Guest', 'OTP Request Ditolak', [
                    'reason' => 'NOT_ELIGIBLE',
                    'member_nik' => $memberNik,
                    'email' => $email,
                ], $request->ip());
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak eligible untuk vote',
                    'error' => 'NOT_ELIGIBLE'
                ], 403);
            }

            $hasVotedBefore = (bool) $member->has_voted;
            $existingVote = $hasVotedBefore ? $this->buildExistingVoteSummary($member) : null;

            if (!empty($member->email) && strtolower((string) $member->email) !== $email) {
                AuditLog::record($member->name, 'OTP Request Ditolak', [
                    'reason' => 'EMAIL_MISMATCH',
                    'member_nik' => $memberNik,
                    'email' => $email,
                ], $request->ip());
                return response()->json([
                    'success' => false,
                    'message' => 'Email tidak sesuai dengan data registrasi. Jika ini kesalahan, hubungi admin.',
                    'error' => 'EMAIL_MISMATCH',
                    'voter_status' => [
                        'has_voted_before' => $hasVotedBefore,
                        'masked_email' => $this->maskEmail((string) $member->email),
                        'message' => '❌ Email tidak cocok dengan data terdaftar'
                    ]
                ], 409);
            }

            $emailOwner = Member::where('email', $email)
                ->where('nik', '!=', $memberNik)
                ->first();

            if ($emailOwner) {
                AuditLog::record($member->name, 'OTP Request Ditolak', [
                    'reason' => 'EMAIL_ALREADY_REGISTERED',
                    'member_nik' => $memberNik,
                    'email' => $email,
                    'owner_nik' => $emailOwner->nik,
                ], $request->ip());
                return response()->json([
                    'success' => false,
                    'message' => 'Email ini sudah terdaftar untuk anggota lain. Jika ini kesalahan, hubungi admin.',
                    'error' => 'EMAIL_ALREADY_REGISTERED'
                ], 409);
            }

            $sentToday = EmailOtp::whereDate('created_at', today())->count();
            if ($sentToday >= 300) {
                AuditLog::record($member->name, 'OTP Request Ditolak', [
                    'reason' => 'QUOTA_EXCEEDED',
                    'member_nik' => $memberNik,
                    'email' => $email,
                ], $request->ip());
                return response()->json([
                    'success' => false,
                    'message' => 'Kuota OTP harian sudah tercapai. Coba lagi besok.',
                    'error' => 'QUOTA_EXCEEDED'
                ], 429);
            }

            $recentRequests = EmailOtp::where('email', $email)
                ->where('created_at', '>=', now()->subMinutes(10))
                ->count();

            if ($recentRequests >= 3) {
                AuditLog::record($member->name, 'OTP Request Ditolak', [
                    'reason' => 'RATE_LIMIT_EXCEEDED',
                    'member_nik' => $memberNik,
                    'email' => $email,
                    'recent_requests' => $recentRequests,
                ], $request->ip());
                return response()->json([
                    'success' => false,
                    'message' => 'Terlalu banyak percobaan. Coba lagi dalam 10 menit.',
                    'error' => 'RATE_LIMIT_EXCEEDED'
                ], 429);
            }

            $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            $otpRecord = EmailOtp::create([
                'member_nik' => $memberNik,
                'email' => $email,
                'otp_hash' => Hash::make($otp),
                'expires_at' => now()->addMinutes(15),
                'attempts' => 0,
                'is_used' => false,
                'requested_ip' => $request->ip(),
                'user_agent' => substr((string) $request->userAgent(), 0, 255),
            ]);

            try {
                Mail::send(new VotingOtpMail($email, $otp));
                Log::info("OTP sent to {$email}");
            } catch (\Exception $e) {
                AuditLog::record($member->name, 'OTP Kirim Gagal', [
                    'member_nik' => $memberNik,
                    'email' => $email,
                    'reason' => 'EMAIL_SEND_FAILED',
                ], $request->ip());
                Log::error("Failed to send OTP to {$email}: " . $e->getMessage());
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal mengirim OTP. Cek email address dan coba lagi.',
                    'error' => 'EMAIL_SEND_FAILED'
                ], 500);
            }

            AuditLog::record($member->name, 'OTP Diminta', [
                'member_nik' => $memberNik,
                'email' => $email,
                'otp_id' => $otpRecord->id,
                'expires_at' => optional($otpRecord->expires_at)->toDateTimeString(),
            ], $request->ip());

            return response()->json([
                'success' => true,
                'message' => 'OTP dikirim ke email',
                'data' => [
                    'otp_id' => $otpRecord->id,
                    'member_nik' => $memberNik,
                    'masked_email' => $this->maskEmail($email),
                    'member' => [
                        'id' => $member->id,
                        'nik' => $member->nik,
                        'name' => $member->name,
                        'email_masked' => !empty($member->email) ? $this->maskEmail((string) $member->email) : null,
                        'department' => (string) ($member->department ?? '-'),
                        'site' => (string) ($member->site ?? '-'),
                    ],
                    'expires_in' => 900,
                    'quota' => [
                        'sent_today' => $sentToday + 1,
                        'limit' => 300,
                        'available' => 300 - ($sentToday + 1),
                        'percentage' => intval((($sentToday + 1) / 300) * 100)
                    ],
                    'voter_status' => [
                        'has_voted_before' => $hasVotedBefore,
                        'message' => $hasVotedBefore
                            ? 'ℹ️ NIK ini sudah pernah vote. OTP hanya untuk login/lihat bukti.'
                            : '✅ Email ini belum pernah vote'
                    ],
                    'existing_vote' => $existingVote,
                    'can_vote' => !$hasVotedBefore
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Request OTP failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Public list of active sites for dropdown selection
     * GET /api/voting/sites
     */
    public function sites(Request $request)
    {
        try {
            $sites = Site::query()
                ->where('is_active', true)
                ->orderByRaw('LOWER(name) ASC')
                ->get(['id', 'code', 'name'])
                ->map(fn($site) => [
                    'id' => $site->id,
                    'code' => $site->code,
                    'name' => $site->name,
                ]);

            return response()->json([
                'success' => true,
                'data' => $sites,
            ]);
        } catch (\Exception $e) {
            Log::error('Get sites failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Verify OTP & Get JWT Token
     * POST /api/voting/verify-otp
     */
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'otp_id' => 'required|integer|exists:email_otps,id',
            'otp_code' => 'required|string|size:6'
        ]);

        try {
            $otpRecord = EmailOtp::find($request->otp_id);

            // Check: OTP expired?
            if ($otpRecord->isExpired()) {
                AuditLog::record('Guest', 'OTP Verifikasi Ditolak', [
                    'reason' => 'OTP_EXPIRED',
                    'otp_id' => (int) $request->otp_id,
                ], $request->ip());
                return response()->json([
                    'success' => false,
                    'message' => 'OTP sudah expired. Minta OTP baru.',
                    'error' => 'OTP_EXPIRED'
                ], 410);
            }

            // Check: OTP already used?
            if ($otpRecord->is_used) {
                AuditLog::record('Guest', 'OTP Verifikasi Ditolak', [
                    'reason' => 'OTP_ALREADY_USED',
                    'otp_id' => (int) $request->otp_id,
                ], $request->ip());
                return response()->json([
                    'success' => false,
                    'message' => 'OTP ini sudah digunakan',
                    'error' => 'OTP_ALREADY_USED'
                ], 410);
            }

            // Check: Max attempts exceeded?
            if ($otpRecord->isMaxAttemptsExceeded()) {
                AuditLog::record('Guest', 'OTP Verifikasi Ditolak', [
                    'reason' => 'MAX_ATTEMPTS_EXCEEDED',
                    'otp_id' => (int) $request->otp_id,
                    'attempts' => $otpRecord->attempts,
                ], $request->ip());
                return response()->json([
                    'success' => false,
                    'message' => 'Terlalu banyak percobaan salah. Minta OTP baru.',
                    'error' => 'MAX_ATTEMPTS_EXCEEDED'
                ], 429);
            }

            // Verify OTP
            if (!Hash::check($request->otp_code, $otpRecord->otp_hash)) {
                $otpRecord->increment('attempts');
                $otpRecord->refresh();
                AuditLog::record('Guest', 'OTP Verifikasi Ditolak', [
                    'reason' => 'INVALID_OTP',
                    'otp_id' => (int) $request->otp_id,
                    'member_nik' => $otpRecord->member_nik,
                    'attempts' => $otpRecord->attempts,
                ], $request->ip());
                return response()->json([
                    'success' => false,
                    'message' => 'OTP salah',
                    'error' => 'INVALID_OTP',
                    'attempts_remaining' => max(0, EmailOtp::MAX_ATTEMPTS - $otpRecord->attempts)
                ], 401);
            }

            // OTP valid! Mark as used
            $otpRecord->update(['is_used' => true]);

            $member = Member::query()->where('nik', $otpRecord->member_nik)->first();
            if ($member && empty($member->email)) {
                $member->update(['email' => $otpRecord->email]);
            }

            // Generate JWT-like voting token without binding to admin user subject.
            $now = now();
            $payload = [
                'iss' => (string) config('app.url', 'kkmsmartvote.local'),
                'iat' => $now->timestamp,
                'nbf' => $now->timestamp,
                'exp' => $now->copy()->addMinutes(30)->timestamp,
                'jti' => (string) Str::uuid(),
                'sub' => 'voter:' . $otpRecord->id,
                'email' => $otpRecord->email,
                'type' => 'voting',
                'otp_verified' => true,
            ];

            $token = JWTAuth::getJWTProvider()->encode($payload);

            $memberStatus = null;
            if ($member) {
                $memberStatus = [
                    'nik' => $member->nik,
                    'has_voted' => (bool) $member->has_voted,
                    'can_vote' => !$member->has_voted,
                    'existing_vote' => $member->has_voted ? $this->buildExistingVoteSummary($member) : null,
                ];
            }

            AuditLog::record($member?->name ?? 'Guest', 'OTP Terverifikasi', [
                'otp_id' => $otpRecord->id,
                'member_nik' => $otpRecord->member_nik,
                'email' => $otpRecord->email,
            ], $request->ip());

            return response()->json([
                'success' => true,
                'message' => 'OTP terverifikasi',
                'data' => [
                    'voting_token' => $token,
                    'expires_in' => 1800,  // 30 minutes
                    'voter_email' => $otpRecord->email,
                    'member_status' => $memberStatus,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Verify OTP failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * LAYER 2: Member Lookup by NIK
     * GET /api/voting/member-lookup/{nik}
     * Check: exists, has_voted, is_eligible
     */
    public function memberLookup(Request $request, $nik)
    {
        try {
            $member = Member::query()
                ->where('nik', $nik)
                ->first();

            if (!$member) {
                return response()->json([
                    'success' => false,
                    'message' => 'NIK tidak terdaftar di sistem',
                    'error' => 'MEMBER_NOT_FOUND'
                ], 404);
            }

            // Check: Eligible?
            if (!$member->is_eligible) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak eligible untuk vote',
                    'error' => 'NOT_ELIGIBLE',
                    'data' => ['reason' => 'Account not eligible or suspended']
                ], 403);
            }

            $departmentModel = null;
            if (!empty($member->department_id)) {
                $departmentModel = Department::with('site')->find($member->department_id);
            }

            $siteModel = $departmentModel?->site;
            $departmentName = $departmentModel?->name ?: ((string) ($member->department ?? '-'));
            $siteName = $siteModel?->name ?: ((string) ($member->site ?? '-'));

            // OK: Return member data
            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $member->id,
                    'nik' => $member->nik,
                    'name' => $member->name,
                    'email' => $member->email,
                    'email_masked' => !empty($member->email) ? $this->maskEmail((string) $member->email) : null,
                    'is_eligible' => $member->is_eligible,
                    'has_voted' => $member->has_voted,
                    'can_vote' => !$member->has_voted,
                    'existing_vote' => $member->has_voted ? $this->buildExistingVoteSummary($member) : null,
                    'department' => [
                        'id' => $departmentModel?->id,
                        'code' => $departmentModel?->code,
                        'name' => $departmentName
                    ],
                    'site' => [
                        'id' => $siteModel?->id,
                        'code' => $siteModel?->code,
                        'name' => $siteName
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            Log::error("Member lookup failed for NIK {$nik}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Candidates with Details
     * GET /api/voting/candidates-with-details
     */
    public function candidatesWithDetails(Request $request)
    {
        try {
            $query = Candidate::with('department')
                ->where('is_active', true);

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
                        'department_name' => $candidate->department_name,
                        'site_name' => $candidate->site_name,
                        'vision' => $candidate->vision ?? null,
                        'mission' => $candidate->mission ?? null,
                        'department' => [
                            'id' => $candidate->department?->id,
                            'name' => $candidate->department?->name
                        ],
                        'bio' => $candidate->bio,
                        'vision_mission' => $candidate->vision_mission ?? null,
                        'motto' => $candidate->motto ?? null,
                        'photo_url' => $candidate->photo_url,
                        'full_photo_url' => $this->resolveCandidatePhotoUrl($candidate),
                        'order_display' => $candidate->order_display ?? null
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

    private function resolveCandidatePhotoUrl(Candidate $candidate): ?string
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

    /**
     * Get Election Status & Countdown
     * GET /api/voting/election-status
     */
    public function electionStatus(Request $request)
    {
        try {
            $election = \App\Models\ElectionSetting::current();

            if (!$election) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak ada pemilihan yang aktif',
                    'error' => 'NO_ACTIVE_ELECTION'
                ], 404);
            }

            $totalVotes = Vote::where('is_valid', true)->count();
            $totalMembers = Member::where('is_eligible', true)->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'election_name' => $election->election_name,
                    'election_year' => $election->election_year,
                    'election_status' => $election->election_status,
                    'countdown_seconds' => $election->secondsRemaining(),
                    'started_at' => $election->started_at,
                    'ended_at' => $election->ended_at,
                    'total_eligible' => $totalMembers,
                    'total_votes' => $totalVotes,
                    'vote_percentage' => $totalMembers > 0 ? intval(($totalVotes / $totalMembers) * 100) : 0,
                    'threshold' => $election->calculateThreshold(),
                    'has_expired' => $election->hasExpired()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Get election status failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Submit Vote (Final Layer - Triple Check)
     * POST /api/voting/submit
     */
    public function submitVote(Request $request)
    {
        $request->validate([
            'member_nik' => 'required|string',
            'candidate_id' => 'required|integer|exists:candidates,id',
            'site_id' => 'nullable|integer'
        ]);

        DB::beginTransaction();
        try {
            // Get member with lock
            $member = Member::where('nik', $request->member_nik)
                ->with(['votes'])
                ->lockForUpdate()
                ->first();

            if (!$member) {
                DB::rollBack();
                AuditLog::record('Guest', 'Vote Ditolak', [
                    'reason' => 'MEMBER_NOT_FOUND',
                    'member_nik' => (string) $request->member_nik,
                ], $request->ip());
                return response()->json([
                    'success' => false,
                    'message' => 'Member tidak ditemukan',
                    'error' => 'MEMBER_NOT_FOUND'
                ], 404);
            }

            // TRIPLE CHECK 1: Has voted?
            if ($member->has_voted || $member->votes()->exists()) {
                DB::rollBack();
                AuditLog::record($member->name, 'Vote Ditolak', [
                    'reason' => 'ALREADY_VOTED',
                    'member_nik' => $member->nik,
                ], $request->ip());
                return response()->json([
                    'success' => false,
                    'message' => 'Anda sudah pernah vote di pemilihan ini',
                    'error' => 'ALREADY_VOTED'
                ], 409);
            }

            // TRIPLE CHECK 2: Eligible?
            if (!$member->is_eligible) {
                DB::rollBack();
                AuditLog::record($member->name, 'Vote Ditolak', [
                    'reason' => 'NOT_ELIGIBLE',
                    'member_nik' => $member->nik,
                ], $request->ip());
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak eligible untuk vote',
                    'error' => 'NOT_ELIGIBLE'
                ], 403);
            }

            // TRIPLE CHECK 3: Duplicate vote record?
            $existingVote = Vote::where('member_nik', $member->nik)
                ->where('is_valid', true)
                ->exists();

            if ($existingVote) {
                DB::rollBack();
                AuditLog::record($member->name, 'Vote Ditolak', [
                    'reason' => 'VOTE_EXISTS',
                    'member_nik' => $member->nik,
                ], $request->ip());
                return response()->json([
                    'success' => false,
                    'message' => 'Vote sudah tercatat untuk Member ini',
                    'error' => 'VOTE_EXISTS'
                ], 409);
            }

            // Insert vote with schema compatibility (legacy votes.site vs newer votes.site_id)
            $votePayload = [
                'member_nik' => $member->nik,
                'member_name' => $member->name,
                'candidate_id' => $request->candidate_id,
                'is_valid' => true,
                'ip_address' => $request->ip(),
            ];

            if (Schema::hasColumn('votes', 'site_id')) {
                $votePayload['site_id'] = $request->site_id;
            }

            if (Schema::hasColumn('votes', 'site')) {
                $votePayload['site'] = (string) ($member->site ?? '-');
            }

            $vote = Vote::create($votePayload);

            // Generate voucher
            $voucher = $this->generateVoucher($member, $vote);
            if (!empty($voucher['id']) && Schema::hasColumn('votes', 'voucher_id')) {
                $vote->update(['voucher_id' => $voucher['id']]);
            }

            // Update member.has_voted
            $member->update(['has_voted' => true]);

            // Also mark email as voted (for Layer 1 check)
            if ($member->email) {
                Member::where('email', $member->email)
                    ->update(['has_voted' => true]);
            }

            DB::commit();

            // Get candidate info
            $candidate = Candidate::find($request->candidate_id);

            AuditLog::record($member->name, 'Vote Dikirim', [
                'vote_id' => $vote->id,
                'member_nik' => $member->nik,
                'candidate_id' => $request->candidate_id,
                'site_id' => $request->site_id,
                'voucher_code' => $voucher['code'] ?? null,
            ], $request->ip());

            return response()->json([
                'success' => true,
                'message' => 'Vote berhasil disimpan!',
                'data' => [
                    'vote_id' => $vote->id,
                    'member_nik' => $member->nik,
                    'member_name' => $member->name,
                    'candidate' => [
                        'id' => $candidate->id,
                        'name' => $candidate->name,
                        'position' => $candidate->position
                    ],
                    'voted_at' => $vote->created_at,
                    'voucher' => [
                        'code' => $voucher['code'],
                        'vote_id' => $vote->id,
                        'member_nik' => $member->nik,
                        'candidate_name' => $voucher['candidate_name'] ?? $candidate->name,
                        'created_at' => $voucher['created_at'],
                        'status' => $voucher['status'] ?? 'available'
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Vote submission failed: ' . $e->getMessage(), [
                'member_nik' => $request->member_nik,
                'exception' => $e
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menyimpan vote',
                'error' => 'INTERNAL_ERROR'
            ], 500);
        }
    }

    /**
     * Save or update voucher Gopay details for the logged-in voter.
     * POST /api/voting/voucher/gopay
     */
    public function updateVoucherGopay(Request $request)
    {
        $request->validate([
            'code' => 'nullable|string|max:100',
            'member_nik' => 'required|string|max:20',
            'gopay_number' => 'required|string|max:20',
            'gopay_is_owner_self' => 'required|boolean',
            'gopay_owner_name' => 'nullable|string|max:255',
        ]);

        try {
            $voucher = $this->findVoucherForGopay(
                (string) $request->input('code', ''),
                (string) $request->member_nik
            );

            if (!$voucher) {
                AuditLog::record('Guest', 'Klaim Voucher Ditolak', [
                    'reason' => 'VOUCHER_NOT_FOUND',
                    'member_nik' => (string) $request->member_nik,
                    'code' => (string) $request->input('code', ''),
                ], $request->ip());
                return response()->json([
                    'success' => false,
                    'message' => 'Voucher tidak ditemukan',
                    'error' => 'VOUCHER_NOT_FOUND',
                ], 404);
            }

            if ($voucher->status === 'REDEEMED') {
                AuditLog::record($voucher->member_name ?? 'Guest', 'Klaim Voucher Ditolak', [
                    'reason' => 'VOUCHER_LOCKED',
                    'member_nik' => (string) $request->member_nik,
                    'code' => $voucher->code ?? $voucher->voucher_code,
                ], $request->ip());
                return response()->json([
                    'success' => false,
                    'message' => 'Voucher sudah diredeem. Data Gopay dikunci.',
                    'error' => 'VOUCHER_LOCKED',
                ], 409);
            }

            $isOwnerSelf = (bool) $request->boolean('gopay_is_owner_self');
            $ownerName = trim((string) $request->input('gopay_owner_name', ''));

            if (!$isOwnerSelf && $ownerName === '') {
                AuditLog::record($voucher->member_name ?? 'Guest', 'Klaim Voucher Ditolak', [
                    'reason' => 'GOPAY_OWNER_NAME_REQUIRED',
                    'member_nik' => (string) $request->member_nik,
                    'code' => $voucher->code ?? $voucher->voucher_code,
                ], $request->ip());
                return response()->json([
                    'success' => false,
                    'message' => 'Nama pemilik GoPay wajib diisi jika bukan nama sendiri.',
                    'error' => 'GOPAY_OWNER_NAME_REQUIRED',
                ], 422);
            }

            $voucher->update([
                'gopay_number' => trim((string) $request->gopay_number),
                'gopay_owner_name' => $isOwnerSelf ? $voucher->member_name : $ownerName,
                'gopay_is_owner_self' => $isOwnerSelf,
                'gopay_submitted_at' => now(),
                'status' => 'CLAIMED',
                'claimed_at' => $voucher->claimed_at ?? now(),
            ]);

            AuditLog::record($voucher->member_name ?? 'Guest', 'Klaim Voucher Berhasil', [
                'member_nik' => $voucher->member_nik,
                'code' => $voucher->code ?? $voucher->voucher_code,
                'status' => $voucher->status,
                'gopay_is_owner_self' => (bool) $voucher->gopay_is_owner_self,
            ], $request->ip());

            return response()->json([
                'success' => true,
                'message' => 'Data GoPay berhasil disimpan',
                'data' => [
                    'code' => $voucher->code ?? $voucher->voucher_code,
                    'member_nik' => $voucher->member_nik,
                    'member_name' => $voucher->member_name,
                    'status' => $voucher->status,
                    'gopay_number' => $voucher->gopay_number,
                    'gopay_owner_name' => $voucher->gopay_owner_name,
                    'gopay_is_owner_self' => $voucher->gopay_is_owner_self,
                    'gopay_submitted_at' => $voucher->gopay_submitted_at,
                    'can_edit' => $voucher->status !== 'REDEEMED',
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Save Gopay voucher failed: ' . $e->getMessage(), [
                'member_nik' => $request->member_nik,
                'code' => $request->code,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menyimpan data GoPay',
                'error' => 'INTERNAL_ERROR',
            ], 500);
        }
    }

    /**
     * Resolve a voucher row across modern and legacy schemas.
     */
    private function findVoucherForGopay(string $code, string $memberNik): ?Voucher
    {
        $normalizedCode = trim($code);
        $normalizedMemberNik = trim($memberNik);

        if ($normalizedCode === '') {
            if (Schema::hasColumn('vouchers', 'vote_id')) {
                $vote = Vote::query()
                    ->where('member_nik', $normalizedMemberNik)
                    ->where('is_valid', true)
                    ->orderByDesc('id')
                    ->first();

                if ($vote) {
                    $voucherByVote = Voucher::query()
                        ->where('vote_id', $vote->id)
                        ->orderByDesc('id')
                        ->first();

                    if ($voucherByVote && $this->voucherMatchesMember($voucherByVote, $normalizedMemberNik)) {
                        return $voucherByVote;
                    }
                }
            }

            if (Schema::hasColumn('vouchers', 'member_nik')) {
                $voucherByMember = Voucher::query()
                    ->where('member_nik', $normalizedMemberNik)
                    ->orderByDesc('id')
                    ->first();

                if ($voucherByMember && $this->voucherMatchesMember($voucherByMember, $normalizedMemberNik)) {
                    return $voucherByMember;
                }
            }

            return null;
        }

        foreach (['code', 'voucher_code'] as $codeColumn) {
            if (!Schema::hasColumn('vouchers', $codeColumn)) {
                continue;
            }

            $voucher = Voucher::query()
                ->where($codeColumn, $normalizedCode)
                ->first();

            if ($voucher && $this->voucherMatchesMember($voucher, $normalizedMemberNik)) {
                return $voucher;
            }
        }

        if (Schema::hasColumn('vouchers', 'vote_id')) {
            $vote = Vote::query()
                ->where('member_nik', $normalizedMemberNik)
                ->where('is_valid', true)
                ->orderByDesc('id')
                ->first();

            if ($vote) {
                foreach (['code', 'voucher_code'] as $codeColumn) {
                    if (!Schema::hasColumn('vouchers', $codeColumn)) {
                        continue;
                    }

                    $voucher = Voucher::query()
                        ->where('vote_id', $vote->id)
                        ->where($codeColumn, $normalizedCode)
                        ->first();

                    if ($voucher && $this->voucherMatchesMember($voucher, $normalizedMemberNik)) {
                        return $voucher;
                    }
                }
            }
        }

        return null;
    }

    /**
     * Keep old rows working even when member_nik was not stored yet.
     */
    private function voucherMatchesMember(Voucher $voucher, string $memberNik): bool
    {
        if (!Schema::hasColumn('vouchers', 'member_nik')) {
            return true;
        }

        $voucherMemberNik = trim((string) ($voucher->member_nik ?? ''));

        if ($voucherMemberNik === '') {
            return true;
        }

        return $voucherMemberNik === $memberNik;
    }

    /**
     * Generate unique voucher code
     */
    private function generateVoucher(Member $member, Vote $vote): array
    {
        $election = \App\Models\ElectionSetting::current();
        $electionId = $election?->id ?? 0;
        $electionCode = str_pad((string) $electionId, 3, '0', STR_PAD_LEFT);

        // Format: VCH-2026-{election}-{nik_last4}-{random6}
        $random = strtoupper(substr(str_shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), 0, 6));
        $code = "VCH-2026-{$electionCode}-" . substr($member->nik, -4) . "-{$random}";
        $candidateName = Candidate::find($vote->candidate_id)?->name;
        $createdAt = now();

        $voucherId = null;

        try {
            // Try modern schema first: vouchers with vote_id/member_nik/... columns
            $voucher = Voucher::create([
                'code' => $code,
                'vote_id' => $vote->id,
                'member_nik' => $member->nik,
                'member_name' => $member->name,
                'member_email' => $member->email,
                'department_id' => $member->department_id,
                'candidate_id' => $vote->candidate_id,
                'candidate_name' => $candidateName,
                'status' => 'GENERATED',
                'value' => 25000,
            ]);
            $voucherId = $voucher->id;
            $createdAt = $voucher->created_at ?? $createdAt;

            Log::debug('Voucher created with vote_id', [
                'code' => $code,
                'vote_id' => $vote->id,
                'member_nik' => $member->nik,
            ]);
        } catch (\Exception $e) {
            // Fallback: Old schema using voter_vouchers bridge table
            Log::debug('Eloquent create failed, trying legacy schema', ['error' => $e->getMessage()]);

            $createdBy = DB::table('users')->min('id');

            if (!empty($createdBy)) {
                $insertPayload = [
                    'code' => $code,
                    'value' => 25000,
                    'status' => 'active',
                    'expires_at' => now()->addMonths(6),
                    'created_by' => $createdBy,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ];

                try {
                    $voucherId = DB::table('vouchers')->insertGetId($insertPayload);

                    if ($voucherId && Schema::hasTable('voter_vouchers')) {
                        DB::table('voter_vouchers')->insert([
                            'voter_nik' => $member->nik,
                            'voucher_id' => $voucherId,
                            'granted_at' => $createdAt,
                            'created_at' => $createdAt,
                        ]);
                    }
                } catch (\Exception $e2) {
                    Log::error('Failed to create voucher via legacy schema', ['error' => $e2->getMessage()]);
                }
            } else {
                Log::warning('Voucher not persisted because users table has no records', [
                    'member_nik' => $member->nik,
                    'vote_id' => $vote->id,
                ]);
            }
        }

        return [
            'id' => $voucherId,
            'code' => $code,
            'candidate_name' => $candidateName,
            'created_at' => $createdAt,
            'status' => 'available',
        ];
    }

    /**
     * Build an existing-vote payload that can be consumed by frontend when ALREADY_VOTED.
     */
    private function buildExistingVoteSummary(Member $member): ?array
    {
        $vote = Vote::query()
            ->with('candidate')
            ->where('member_nik', $member->nik)
            ->where('is_valid', true)
            ->orderByDesc('id')
            ->first();

        if (!$vote) {
            return null;
        }

        $voucherCode = null;
        $voucherStatus = 'available';
        $voucherCreatedAt = null;
        $gopayNumber = $member->gopay_number ?? null;
        $gopayOwnerName = null;
        $gopayIsOwnerSelf = $member->is_gopay_owner_self ?? true;
        $gopaySubmittedAt = null;
        $voucherRow = null;

        if (Schema::hasTable('vouchers')) {
            $voucherQuery = DB::table('vouchers');

            if (Schema::hasColumn('vouchers', 'vote_id')) {
                $voucherQuery->where('vote_id', $vote->id);
            } elseif (Schema::hasColumn('vouchers', 'member_nik')) {
                $voucherQuery->where('member_nik', $member->nik);
            }

            $voucherRow = $voucherQuery
                ->orderByDesc('id')
                ->first();

            if ($voucherRow) {
                $voucherCode = $voucherRow->voucher_code ?? $voucherRow->code ?? null;
                $voucherStatus = (string) ($voucherRow->status ?? 'available');
                $voucherCreatedAt = $voucherRow->created_at ?? $vote->created_at;
                $gopayNumber = $voucherRow->gopay_number ?? $gopayNumber;
                $gopayOwnerName = $voucherRow->gopay_owner_name ?? null;
                $gopayIsOwnerSelf = isset($voucherRow->gopay_is_owner_self)
                    ? (bool) $voucherRow->gopay_is_owner_self
                    : $gopayIsOwnerSelf;
                $gopaySubmittedAt = $voucherRow->gopay_submitted_at ?? null;
            }

            if (!$voucherRow && Schema::hasTable('voter_vouchers')) {
                $legacyVoucherRow = DB::table('voter_vouchers as vv')
                    ->join('vouchers as v', 'v.id', '=', 'vv.voucher_id')
                    ->where('vv.voter_nik', $member->nik)
                    ->orderByDesc('vv.id')
                    ->select('v.*', 'vv.granted_at as legacy_granted_at')
                    ->first();

                if ($legacyVoucherRow) {
                    $voucherCode = $legacyVoucherRow->voucher_code ?? $legacyVoucherRow->code ?? null;
                    $voucherStatus = (string) ($legacyVoucherRow->status ?? 'available');
                    $voucherCreatedAt = $legacyVoucherRow->created_at
                        ?? $legacyVoucherRow->legacy_granted_at
                        ?? $vote->created_at;
                    $gopayNumber = $legacyVoucherRow->gopay_number ?? $gopayNumber;
                    $gopayOwnerName = $legacyVoucherRow->gopay_owner_name ?? null;
                    $gopayIsOwnerSelf = isset($legacyVoucherRow->gopay_is_owner_self)
                        ? (bool) $legacyVoucherRow->gopay_is_owner_self
                        : $gopayIsOwnerSelf;
                    $gopaySubmittedAt = $legacyVoucherRow->gopay_submitted_at ?? null;
                }
            }
        }

        return [
            'vote_id' => $vote->id,
            'member_nik' => $member->nik,
            'member_name' => $vote->member_name ?: $member->name,
            'candidate' => [
                'id' => $vote->candidate?->id,
                'name' => $vote->candidate?->name,
                'position' => $vote->candidate?->position,
            ],
            'voted_at' => $vote->created_at,
            'voucher' => [
                'code' => $voucherCode,
                'vote_id' => $vote->id,
                'member_nik' => $member->nik,
                'candidate_name' => $vote->candidate?->name,
                'created_at' => $voucherCreatedAt ?: $vote->created_at,
                'status' => $voucherStatus,
                'gopay_number' => $gopayNumber,
                'gopay_owner_name' => $gopayOwnerName,
                'gopay_is_owner_self' => $gopayIsOwnerSelf,
                'gopay_submitted_at' => $gopaySubmittedAt,
            ],
        ];
    }

    /**
     * Mask email for display
     */
    private function maskEmail(string $email): string
    {
        $parts = explode('@', $email);
        $local = $parts[0];
        $domain = $parts[1];

        $masked = substr($local, 0, 3) . str_repeat('*', max(0, strlen($local) - 3)) . '@' . $domain;
        return $masked;
    }
}
