<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Saving;
use App\Models\Withdrawal;
use App\Models\Loan;
use App\Models\Installment;
use Illuminate\Support\Facades\Hash;

class KoperasiController extends Controller
{
    // ==========================================
    // ANGGOTA (MEMBER) APIS
    // ==========================================

    public function getAnggotaDashboard()
    {
        $user = auth()->user();

        // Total Approved Savings
        $totalSavings = Saving::where('user_id', $user->id)
            ->where('status', 'approved')
            ->sum('amount');

        // Sisa Withdrawal (subtracted from savings)
        $totalWithdrawals = Withdrawal::where('user_id', $user->id)
            ->where('status', 'approved')
            ->sum('amount');

        $netSavings = max(0, $totalSavings - $totalWithdrawals);

        // Total active loan amount
        $activeLoan = Loan::where('user_id', $user->id)
            ->where('status', 'approved')
            ->where('remaining_amount', '>', 0)
            ->first();

        $totalLoanAmount = $activeLoan ? $activeLoan->amount : 0;
        $remainingLoanAmount = $activeLoan ? $activeLoan->remaining_amount : 0;
        $loanDuration = $activeLoan ? $activeLoan->duration_months . ' bulan' : '-';

        // Pending loans count
        $pendingLoansCount = Loan::where('user_id', $user->id)
            ->where('status', 'pending')
            ->count();

        $statusPengajuan = $pendingLoansCount > 0 ? "$pendingLoansCount Menunggu" : 'Tidak ada';

        return response()->json([
            'stats' => [
                ['title' => 'Total Simpanan', 'value' => 'Rp ' . number_format($netSavings, 0, ',', '.'), 'trend' => '+12%', 'color' => 'bg-blue-500'],
                ['title' => 'Total Pinjaman', 'value' => 'Rp ' . number_format($totalLoanAmount, 0, ',', '.'), 'trend' => $activeLoan ? 'Aktif' : '-', 'color' => 'bg-green-500'],
                ['title' => 'Sisa Angsuran', 'value' => 'Rp ' . number_format($remainingLoanAmount, 0, ',', '.'), 'trend' => $loanDuration, 'color' => 'bg-orange-500'],
                ['title' => 'Status Pengajuan', 'value' => $statusPengajuan, 'trend' => $pendingLoansCount > 0 ? 'Verifikasi' : '-', 'color' => 'bg-purple-500']
            ]
        ]);
    }

    public function getAnggotaTransactions()
    {
        $user = auth()->user();

        $savings = Saving::where('user_id', $user->id)->get()->map(function($item) {
            return [
                'id' => 'S-' . $item->id,
                'date' => $item->created_at->format('d M Y'),
                'type' => 'Simpanan ' . ucfirst($item->type),
                'amount' => 'Rp ' . number_format($item->amount, 0, ',', '.'),
                'status' => $item->status == 'approved' ? 'Berhasil' : ($item->status == 'pending' ? 'Diproses' : 'Ditolak')
            ];
        });

        $withdrawals = Withdrawal::where('user_id', $user->id)->get()->map(function($item) {
            return [
                'id' => 'W-' . $item->id,
                'date' => $item->created_at->format('d M Y'),
                'type' => 'Penarikan Simpanan',
                'amount' => 'Rp ' . number_format($item->amount, 0, ',', '.'),
                'status' => $item->status == 'approved' ? 'Berhasil' : ($item->status == 'pending' ? 'Diproses' : 'Ditolak')
            ];
        });

        $loans = Loan::where('user_id', $user->id)->get()->map(function($item) {
            return [
                'id' => 'L-' . $item->id,
                'date' => $item->created_at->format('d M Y'),
                'type' => 'Pencairan Pinjaman',
                'amount' => 'Rp ' . number_format($item->amount, 0, ',', '.'),
                'status' => $item->status == 'approved' ? 'Disetujui' : ($item->status == 'pending' ? 'Verifikasi' : 'Ditolak')
            ];
        });

        $installments = Installment::where('user_id', $user->id)->get()->map(function($item) {
            return [
                'id' => 'I-' . $item->id,
                'date' => $item->created_at->format('d M Y'),
                'type' => 'Angsuran Pinjaman',
                'amount' => 'Rp ' . number_format($item->amount, 0, ',', '.'),
                'status' => $item->status == 'approved' ? 'Berhasil' : ($item->status == 'pending' ? 'Diproses' : 'Ditolak')
            ];
        });

        $transactions = $savings->concat($withdrawals)->concat($loans)->concat($installments)
            ->sortByDesc(function($item) {
                return strtotime($item['date']);
            })->values()->take(10);

        return response()->json($transactions);
    }

    public function getSavingsList()
    {
        $user = auth()->user();
        $savings = Saving::where('user_id', $user->id)->orderBy('created_at', 'desc')->get();
        return response()->json($savings);
    }

    public function submitSaving(Request $request)
    {
        $request->validate([
            'type' => 'required|string|in:pokok,wajib,sukarela',
            'amount' => 'required|numeric|min:1000',
            'description' => 'nullable|string'
        ]);

        $saving = Saving::create([
            'user_id' => auth()->id(),
            'type' => $request->type,
            'amount' => $request->amount,
            'description' => $request->description,
            'status' => 'pending'
        ]);

        return response()->json(['message' => 'Simpanan berhasil diajukan, menunggu verifikasi admin', 'data' => $saving]);
    }

    public function getWithdrawalsList()
    {
        $user = auth()->user();
        $withdrawals = Withdrawal::where('user_id', $user->id)->orderBy('created_at', 'desc')->get();
        return response()->json($withdrawals);
    }

    public function submitWithdrawal(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1000',
            'description' => 'nullable|string'
        ]);

        $user = auth()->user();
        $totalSavings = Saving::where('user_id', $user->id)->where('status', 'approved')->sum('amount');
        $totalWithdrawals = Withdrawal::where('user_id', $user->id)->where('status', 'approved')->sum('amount');
        $available = max(0, $totalSavings - $totalWithdrawals);

        if ($request->amount > $available) {
            return response()->json(['error' => 'Saldo simpanan tidak mencukupi untuk melakukan penarikan.'], 422);
        }

        $withdrawal = Withdrawal::create([
            'user_id' => $user->id,
            'amount' => $request->amount,
            'description' => $request->description,
            'status' => 'pending'
        ]);

        return response()->json(['message' => 'Penarikan berhasil diajukan, menunggu verifikasi admin', 'data' => $withdrawal]);
    }

    public function getLoansList()
    {
        $user = auth()->user();
        $loans = Loan::where('user_id', $user->id)->orderBy('created_at', 'desc')->get();
        return response()->json($loans);
    }

    public function submitLoan(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:100000',
            'duration_months' => 'required|integer|min:1',
            'description' => 'nullable|string'
        ]);

        $user = auth()->user();
        // Check if there is already an active loan
        $activeLoan = Loan::where('user_id', $user->id)
            ->where('status', 'approved')
            ->where('remaining_amount', '>', 0)
            ->exists();

        if ($activeLoan) {
            return response()->json(['error' => 'Anda masih memiliki pinjaman aktif yang belum lunas.'], 422);
        }

        $monthlyInstallment = round(($request->amount / $request->duration_months) * 1.02); // 2% interest simple logic

        $loan = Loan::create([
            'user_id' => $user->id,
            'amount' => $request->amount,
            'duration_months' => $request->duration_months,
            'monthly_installment' => $monthlyInstallment,
            'remaining_amount' => $request->amount,
            'description' => $request->description,
            'status' => 'pending'
        ]);

        return response()->json(['message' => 'Pengajuan pinjaman berhasil diajukan, menunggu verifikasi admin', 'data' => $loan]);
    }

    public function payInstallment(Request $request)
    {
        $request->validate([
            'loan_id' => 'required|exists:loans,id',
            'amount' => 'required|numeric|min:1000'
        ]);

        $loan = Loan::find($request->loan_id);
        if ($loan->user_id !== auth()->id()) {
            return response()->json(['error' => 'Akses ditolak.'], 403);
        }

        $installment = Installment::create([
            'loan_id' => $loan->id,
            'user_id' => auth()->id(),
            'amount' => $request->amount,
            'status' => 'pending'
        ]);

        return response()->json(['message' => 'Pembayaran angsuran berhasil dikirim, menunggu verifikasi admin', 'data' => $installment]);
    }

    // ==========================================
    // ADMIN APIS
    // ==========================================

    public function getAdminDashboard()
    {
        $totalMembers = User::where('role', 'anggota')->count();
        
        $totalSavings = Saving::where('status', 'approved')->sum('amount') - Withdrawal::where('status', 'approved')->sum('amount');
        $totalSavings = max(0, $totalSavings);

        $pendingLoans = Loan::where('status', 'pending')->count();
        $totalTransactions = Saving::count() + Withdrawal::count() + Loan::count() + Installment::count();

        // Recent requests/activities
        $recentActivities = collect();

        Saving::with('user')->orderBy('created_at', 'desc')->take(3)->get()->each(function($item) use ($recentActivities) {
            $recentActivities->push([
                'id' => 'S-' . $item->id,
                'user' => $item->user->name ?? 'Anggota',
                'type' => 'Simpanan ' . ucfirst($item->type),
                'amount' => 'Rp ' . number_format($item->amount, 0, ',', '.'),
                'status' => $item->status,
                'date' => $item->created_at->format('d M Y')
            ]);
        });

        Loan::with('user')->orderBy('created_at', 'desc')->take(3)->get()->each(function($item) use ($recentActivities) {
            $recentActivities->push([
                'id' => 'L-' . $item->id,
                'user' => $item->user->name ?? 'Anggota',
                'type' => 'Pinjaman',
                'amount' => 'Rp ' . number_format($item->amount, 0, ',', '.'),
                'status' => $item->status,
                'date' => $item->created_at->format('d M Y')
            ]);
        });

        return response()->json([
            'stats' => [
                ['title' => 'Total Anggota', 'value' => $totalMembers, 'trend' => 'Aktif', 'color' => 'bg-blue-500'],
                ['title' => 'Total Simpanan', 'value' => 'Rp ' . number_format($totalSavings, 0, ',', '.'), 'trend' => 'Kas Koperasi', 'color' => 'bg-green-500'],
                ['title' => 'Menunggu Verifikasi', 'value' => $pendingLoans, 'trend' => 'Pinjaman', 'color' => 'bg-orange-500'],
                ['title' => 'Total Transaksi', 'value' => $totalTransactions, 'trend' => 'Semua', 'color' => 'bg-purple-500']
            ],
            'recent' => $recentActivities->sortByDesc('date')->values()->take(5)
        ]);
    }

    // Member Management CRUD
    public function getMembers()
    {
        $members = User::where('role', 'anggota')->orderBy('id', 'desc')->get();
        return response()->json($members);
    }

    public function createMember(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users',
            'password' => 'required|string|min:6'
        ]);

        $member = User::create([
            'name' => $request->name,
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'role' => 'anggota',
            'status' => 'aktif'
        ]);

        return response()->json(['message' => 'Anggota berhasil dibuat', 'data' => $member]);
    }

    public function updateMember(Request $request, int $id)
    {
        $member = User::findOrFail($id);
        
        $request->validate([
            'name' => 'required|string|max:255',
            'status' => 'required|string|in:aktif,nonaktif',
            'password' => 'nullable|string|min:6'
        ]);

        $member->name = $request->name;
        $member->status = $request->status;

        if ($request->filled('password')) {
            $member->password = Hash::make($request->password);
        }

        $member->save();

        return response()->json(['message' => 'Anggota berhasil diupdate', 'data' => $member]);
    }

    // Savings Verification
    public function getAdminSavings()
    {
        $savings = Saving::with('user')->orderBy('created_at', 'desc')->get();
        return response()->json($savings);
    }

    public function verifySaving(Request $request, int $id)
    {
        $request->validate([
            'status' => 'required|string|in:approved,rejected'
        ]);

        $saving = Saving::findOrFail($id);
        $saving->status = $request->status;
        $saving->save();

        return response()->json(['message' => 'Status simpanan berhasil diubah', 'data' => $saving]);
    }

    // Loans Verification
    public function getAdminLoans()
    {
        $loans = Loan::with('user')->orderBy('created_at', 'desc')->get();
        return response()->json($loans);
    }

    public function verifyLoan(Request $request, int $id)
    {
        $request->validate([
            'status' => 'required|string|in:approved,rejected'
        ]);

        $loan = Loan::findOrFail($id);
        $loan->status = $request->status;
        $loan->save();

        return response()->json(['message' => 'Status pinjaman berhasil diubah', 'data' => $loan]);
    }

    // Installment Verification
    public function getAdminInstallments()
    {
        $installments = Installment::with(['user', 'loan'])->orderBy('created_at', 'desc')->get();
        return response()->json($installments);
    }

    public function verifyInstallment(Request $request, int $id)
    {
        $request->validate([
            'status' => 'required|string|in:approved,rejected'
        ]);

        $installment = Installment::findOrFail($id);
        $installment->status = $request->status;
        $installment->save();

        if ($request->status == 'approved') {
            // Deduct from remaining loan amount
            $loan = Loan::find($installment->loan_id);
            if ($loan) {
                $loan->remaining_amount = max(0, $loan->remaining_amount - $installment->amount);
                $loan->save();
            }
        }

        return response()->json(['message' => 'Status angsuran berhasil diubah', 'data' => $installment]);
    }

    // Financial Reports
    public function getReports()
    {
        // Simple balance report
        $totalSavings = Saving::where('status', 'approved')->sum('amount');
        $totalWithdrawals = Withdrawal::where('status', 'approved')->sum('amount');
        
        $totalLoansDisbursed = Loan::where('status', 'approved')->sum('amount');
        $totalInstallmentsReceived = Installment::where('status', 'approved')->sum('amount');

        $income = $totalSavings + $totalInstallmentsReceived;
        $expense = $totalWithdrawals + $totalLoansDisbursed;
        $balance = $income - $expense;

        return response()->json([
            'total_savings' => $totalSavings,
            'total_withdrawals' => $totalWithdrawals,
            'total_loans' => $totalLoansDisbursed,
            'total_installments' => $totalInstallmentsReceived,
            'income' => $income,
            'expense' => $expense,
            'balance' => $balance,
            'chart_data' => [
                ['name' => 'Simpanan', 'value' => (float)$totalSavings],
                ['name' => 'Penarikan', 'value' => (float)$totalWithdrawals],
                ['name' => 'Pinjaman', 'value' => (float)$totalLoansDisbursed],
                ['name' => 'Angsuran', 'value' => (float)$totalInstallmentsReceived],
            ]
        ]);
    }
}
