<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\KoperasiController;

// Public Auth routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Authenticated routes
Route::middleware('jwt.auth')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // ==========================================
    // ANGGOTA (MEMBER) ROUTES
    // ==========================================
    Route::get('/anggota/dashboard-stats', [KoperasiController::class, 'getAnggotaDashboard']);
    Route::get('/anggota/transactions', [KoperasiController::class, 'getAnggotaTransactions']);
    
    Route::get('/anggota/simpanan', [KoperasiController::class, 'getSavingsList']);
    Route::post('/anggota/simpanan', [KoperasiController::class, 'submitSaving']);
    
    Route::get('/anggota/tarik-simpanan', [KoperasiController::class, 'getWithdrawalsList']);
    Route::post('/anggota/tarik-simpanan', [KoperasiController::class, 'submitWithdrawal']);
    
    Route::get('/anggota/pinjaman', [KoperasiController::class, 'getLoansList']);
    Route::post('/anggota/pengajuan-pinjaman', [KoperasiController::class, 'submitLoan']);
    
    Route::post('/anggota/bayar-angsuran', [KoperasiController::class, 'payInstallment']);

    // ==========================================
    // ADMIN ROUTES
    // ==========================================
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/dashboard-stats', [KoperasiController::class, 'getAdminDashboard']);
        
        // Members CRUD
        Route::get('/admin/anggota', [KoperasiController::class, 'getMembers']);
        Route::post('/admin/anggota', [KoperasiController::class, 'createMember']);
        Route::put('/admin/anggota/{id}', [KoperasiController::class, 'updateMember']);
        
        // Savings Approval
        Route::get('/admin/simpanan', [KoperasiController::class, 'getAdminSavings']);
        Route::post('/admin/simpanan/{id}/action', [KoperasiController::class, 'verifySaving']);
        
        // Loans Approval
        Route::get('/admin/pinjaman', [KoperasiController::class, 'getAdminLoans']);
        Route::post('/admin/pinjaman/{id}/action', [KoperasiController::class, 'verifyLoan']);
        
        // Installments Approval
        Route::get('/admin/angsuran', [KoperasiController::class, 'getAdminInstallments']);
        Route::post('/admin/angsuran/{id}/action', [KoperasiController::class, 'verifyInstallment']);
        
        // Reports
        Route::get('/admin/laporan', [KoperasiController::class, 'getReports']);
    });
});
