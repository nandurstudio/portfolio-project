<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\EmailOtp;
use App\Models\Vote;
use App\Mail\VotingOtpMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Crypt;

class VotingController extends Controller
{
    /**
     * POST /api/voting/request-otp
     *
     * Request OTP to email address
     */
    public function requestOtp(Request $request)
    {
        // Validate email format
        $request->validate([
            'email' => 'required|email'
        ]);

        $email = strtolower($request->input('email'));

        // QUOTA CHECK: Daily OTP limit (Brevo 300/day max)
        $dailyQuota = (int) env('MAIL_OTP_DAILY_QUOTA', 300);
        $today = now()->toDateString();
        $otpSentToday = EmailOtp::whereDate('created_at', $today)->count();

        if ($otpSentToday >= $dailyQuota) {
            return response()->json([
                'error' => 'Daily voting quota reached',
                'message' => "Voting quota untuk hari ini sudah penuh ({$otpSentToday}/{$dailyQuota}). Coba lagi besok!",
                'sent_today' => $otpSentToday,
                'quota_limit' => $dailyQuota,
                'quota_percentage' => 100
            ], 429);
        }

        // Rate limiting: max 3 OTP requests per email per 10 minutes
        $rateLimitKey = 'otp-request:' . $email;
        if (RateLimiter::tooManyAttempts($rateLimitKey, 3)) {
            return response()->json([
                'error' => 'Too many OTP requests. Please try again in 10 minutes.',
                'retry_after' => RateLimiter::availableIn($rateLimitKey)
            ], 429);
        }

        // For now: Skip member eligibility check (testing mode)
        // Members table doesn't have email column, so we'll validate email during OTP verification
        // NOTE: In production, implement proper email-to-member mapping

        // Generate 6-digit OTP
        $otp = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);

        try {
            // Delete old unused OTPs for this email
            EmailOtp::where('email', $email)
                ->where('is_used', false)
                ->delete();

            // Create new OTP record (member_id will be null for now - testing mode)
            $emailOtp = EmailOtp::create([
                'email' => $email,
                'member_id' => null,  // TODO: Map email to member_id in production
                'otp_code' => Hash::make($otp),
                'expires_at' => now()->addMinutes(15),
                'attempts' => 0,
                'is_used' => false
            ]);

            // Send OTP via email with error handling
            try {
                Mail::send(new VotingOtpMail($email, $otp));
                Log::info("OTP email sent successfully to {$email}");
            } catch (\Exception $e) {
                Log::error("Failed to send OTP email to {$email}: " . $e->getMessage(), [
                    'exception' => $e,
                    'email' => $email,
                    'error_code' => $e->getCode()
                ]);
                // Still create OTP record but note that email failed
                // User can try again
            }

            // Log OTP for debugging
            Log::info("OTP generated for {$email}: {$otp}");

            // Record rate limit attempt
            RateLimiter::hit($rateLimitKey, 600); // 10 minutes

            // Calculate updated quota
            $otpSentAfter = EmailOtp::whereDate('created_at', $today)->count();
            $quotaPercentage = round(($otpSentAfter / $dailyQuota) * 100);

            return response()->json([
                'message' => 'OTP sent to your email',
                'masked_email' => $this->maskEmail($email),
                'expires_in' => 900, // 15 minutes in seconds
                'otp_id' => $emailOtp->id,
                'quota' => [
                    'sent_today' => $otpSentAfter,
                    'limit' => $dailyQuota,
                    'percentage' => $quotaPercentage,
                    'available' => $dailyQuota - $otpSentAfter
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('OTP Request Error', [
                'email' => $email,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Failed to send OTP. Please try again or contact support.',
                'message' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * POST /api/voting/verify-otp
     *
     * Verify OTP and get voting token
     */
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|digits:6'
        ]);

        $email = strtolower($request->input('email'));
        $otp = $request->input('otp');
        $ipAddress = $request->ip();

        // Rate limiting: max 5 attempts per email per 10 minutes
        $rateLimitKey = 'otp-verify:' . $email;
        if (RateLimiter::tooManyAttempts($rateLimitKey, 5)) {
            return response()->json([
                'error' => 'Too many verification attempts. Please request a new OTP.',
                'retry_after' => RateLimiter::availableIn($rateLimitKey)
            ], 429);
        }

        // Get latest OTP for this email
        $emailOtp = EmailOtp::where('email', $email)
            ->where('is_used', false)
            ->latest()
            ->first();

        if (!$emailOtp) {
            RateLimiter::hit($rateLimitKey, 600);
            return response()->json(['error' => 'OTP not found. Request a new OTP.'], 404);
        }

        // Check if expired
        if ($emailOtp->isExpired()) {
            RateLimiter::hit($rateLimitKey, 600);
            return response()->json([
                'error' => 'OTP expired (valid for 15 minutes). Request a new OTP.'
            ], 401);
        }

        // Check if already used
        if ($emailOtp->is_used) {
            RateLimiter::hit($rateLimitKey, 600);
            return response()->json(['error' => 'OTP already used'], 400);
        }

        // Check if max attempts exceeded
        if ($emailOtp->isMaxAttemptsExceeded()) {
            RateLimiter::hit($rateLimitKey, 600);
            return response()->json([
                'error' => 'Too many wrong attempts. Request a new OTP.'
            ], 403);
        }

        // Verify OTP
        if (!Hash::check($otp, $emailOtp->otp_code)) {
            $emailOtp->increment('attempts');
            RateLimiter::hit($rateLimitKey, 600);

            return response()->json([
                'error' => 'Invalid OTP',
                'attempts_left' => $emailOtp->max_attempts - $emailOtp->attempts
            ], 401);
        }

        // Mark OTP as verified
        $emailOtp->markVerified();

        // Find or create member based on email (if member_id set)
        $member = null;
        if ($emailOtp->member_id) {
            $member = Member::findOrFail($emailOtp->member_id);

            if (!$member->is_eligible) {
                return response()->json(['error' => 'Your account is not eligible to vote'], 403);
            }

            if ($member->has_voted) {
                return response()->json(['error' => 'You have already voted'], 400);
            }
        }

        // Create voting token (encrypted, valid for 30 minutes)
        $votingToken = Crypt::encryptString(json_encode([
            'member_id' => $emailOtp->member_id ?? null,
            'email' => $email,
            'type' => 'voting',
            'iat' => now()->timestamp,
            'exp' => now()->addMinutes(30)->timestamp
        ]));

        // Clear rate limit
        RateLimiter::clear($rateLimitKey);

        return response()->json([
            'message' => 'OTP verified. You can now vote.',
            'voting_token' => $votingToken,
            'member' => $member ? [
                'id' => $member->id,
                'name' => $member->name
            ] : null,
            'expires_in' => 1800 // 30 minutes
        ]);
    }

    /**
     * Mask email for display (privacy)
     *
     * user@example.com → use***@example.com
     */
    private function maskEmail(string $email): string
    {
        $parts = explode('@', $email);
        $localPart = $parts[0];
        $domain = $parts[1] ?? '';

        if (strlen($localPart) > 3) {
            $masked = substr($localPart, 0, 3) . str_repeat('*', strlen($localPart) - 3);
        } else {
            $masked = str_repeat('*', strlen($localPart));
        }

        return $masked . '@' . $domain;
    }
}
