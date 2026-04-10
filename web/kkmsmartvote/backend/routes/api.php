<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\VotingController;
use App\Http\Controllers\CandidateController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ElectionSettingController;
use Illuminate\Support\Facades\Route;

// ── Public routes ──────────────────────────────────────────────────────────

// Auth
Route::post('/auth/admin/login', [AuthController::class, 'adminLogin']);

// Voting with Email OTP (no login required)
Route::post('/voting/request-otp', [VotingController::class, 'requestOtp']);
Route::post('/voting/verify-otp', [VotingController::class, 'verifyOtp']);
Route::get('/voting/member-lookup/{nik}', [VotingController::class, 'memberLookup']);
Route::get('/voting/sites', [VotingController::class, 'sites']);
Route::get('/voting/candidates-with-details', [VotingController::class, 'candidatesWithDetails']);
Route::get('/voting/election-status', [VotingController::class, 'electionStatus']);
Route::post('/voting/submit', [VotingController::class, 'submitVote']);
Route::post('/voting/voucher/gopay', [VotingController::class, 'updateVoucherGopay']);

// Public data
Route::get('/candidates', [CandidateController::class, 'publicIndex']);
Route::get('/election/info', [ElectionSettingController::class, 'publicInfo']);
Route::get('/election/stats', [ElectionSettingController::class, 'publicStats']);
Route::get('/results/public', [AdminController::class, 'publicResults']);

// ── Authenticated routes ───────────────────────────────────────────────────
Route::middleware('jwt.auth')->group(function () {

    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Admin + Panitia
    Route::middleware('role:super_admin,admin,panitia')->group(function () {
        Route::get('/admin/dashboard', [AdminController::class, 'dashboard']);

        // Candidates
        Route::get('/admin/candidates', [CandidateController::class, 'index']);
        Route::post('/admin/candidates', [CandidateController::class, 'store']);
        Route::put('/admin/candidates/{id}', [CandidateController::class, 'update']);

        // Members
        Route::get('/admin/members', [MemberController::class, 'index']);
        Route::get('/admin/members/by-nik/{nik}', [MemberController::class, 'findByNik']);
        Route::post('/admin/members', [MemberController::class, 'store']);

        // Votes
        Route::get('/admin/votes', [AdminController::class, 'votes']);
        Route::get('/admin/results', [AdminController::class, 'results']);

        // Audit
        Route::get('/admin/audit-log', [AuditLogController::class, 'index']);
    });

    // Admin only
    Route::middleware('role:super_admin,admin')->group(function () {
        Route::delete('/admin/candidates/{id}', [CandidateController::class, 'destroy']);
        Route::post('/admin/candidates/{id}/upload-photo', [CandidateController::class, 'uploadPhoto']);
        Route::post('/admin/votes/{id}/invalidate', [AdminController::class, 'invalidateVote']);
        Route::post('/admin/election/finalize', [AdminController::class, 'finalize']);
        Route::put('/admin/election/settings', [ElectionSettingController::class, 'update']);

        // Users
        Route::get('/admin/users/meta', [UserController::class, 'meta']);
        Route::get('/admin/users', [UserController::class, 'index']);
        Route::post('/admin/users', [UserController::class, 'store']);
        Route::put('/admin/users/{id}', [UserController::class, 'update']);
        Route::delete('/admin/users/{id}', [UserController::class, 'destroy']);
    });
});
