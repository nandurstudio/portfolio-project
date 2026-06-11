<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Saving;
use App\Models\Withdrawal;
use App\Models\Loan;
use App\Models\Installment;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Admins
        $admin = User::create([
            'name' => 'Administrator Koperasi',
            'username' => 'admin',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'status' => 'aktif'
        ]);

        // 2. Create Members
        $budi = User::create([
            'name' => 'Budi Santoso',
            'username' => 'anggota',
            'password' => Hash::make('anggota123'),
            'role' => 'anggota',
            'status' => 'aktif'
        ]);

        $ani = User::create([
            'name' => 'Ani Wijaya',
            'username' => 'ani',
            'password' => Hash::make('anggota123'),
            'role' => 'anggota',
            'status' => 'aktif'
        ]);

        $dedi = User::create([
            'name' => 'Dedi Kurniawan',
            'username' => 'dedi',
            'password' => Hash::make('anggota123'),
            'role' => 'anggota',
            'status' => 'aktif'
        ]);

        $citra = User::create([
            'name' => 'Citra Lestari',
            'username' => 'citra',
            'password' => Hash::make('anggota123'),
            'role' => 'anggota',
            'status' => 'nonaktif' // Inactive example
        ]);

        // 3. Seed Savings (Simpanan)
        // Budi
        Saving::create(['user_id' => $budi->id, 'type' => 'pokok', 'amount' => 1000000, 'description' => 'Simpanan Pokok Awal', 'status' => 'approved']);
        Saving::create(['user_id' => $budi->id, 'type' => 'wajib', 'amount' => 250000, 'description' => 'Simpanan Wajib Mei', 'status' => 'approved']);
        Saving::create(['user_id' => $budi->id, 'type' => 'sukarela', 'amount' => 500000, 'description' => 'Tabungan Sukarela', 'status' => 'approved']);
        Saving::create(['user_id' => $budi->id, 'type' => 'wajib', 'amount' => 250000, 'description' => 'Simpanan Wajib Juni (Pending Approval)', 'status' => 'pending']);
        // Ani
        Saving::create(['user_id' => $ani->id, 'type' => 'pokok', 'amount' => 1000000, 'description' => 'Simpanan Pokok Awal', 'status' => 'approved']);
        Saving::create(['user_id' => $ani->id, 'type' => 'wajib', 'amount' => 2000000, 'description' => 'Simpanan Wajib Bulanan', 'status' => 'approved']);
        Saving::create(['user_id' => $ani->id, 'type' => 'sukarela', 'amount' => 5000000, 'description' => 'Simpanan Sukarela Terencana', 'status' => 'approved']);
        // Dedi
        Saving::create(['user_id' => $dedi->id, 'type' => 'pokok', 'amount' => 1000000, 'description' => 'Simpanan Pokok Awal', 'status' => 'approved']);
        Saving::create(['user_id' => $dedi->id, 'type' => 'wajib', 'amount' => 3000000, 'description' => 'Simpanan Wajib Akumulasi', 'status' => 'approved']);
        Saving::create(['user_id' => $dedi->id, 'type' => 'sukarela', 'amount' => 8000000, 'description' => 'Simpanan Sukarela Berjangka', 'status' => 'approved']);
        // Citra
        Saving::create(['user_id' => $citra->id, 'type' => 'pokok', 'amount' => 1000000, 'description' => 'Simpanan Pokok Awal', 'status' => 'approved']);
        Saving::create(['user_id' => $citra->id, 'type' => 'wajib', 'amount' => 4000000, 'description' => 'Simpanan Wajib Terkumpul', 'status' => 'approved']);
        Saving::create(['user_id' => $citra->id, 'type' => 'sukarela', 'amount' => 10000000, 'description' => 'Simpanan Sukarela Hari Raya', 'status' => 'approved']);

        // 4. Seed Withdrawals (Penarikan)
        Withdrawal::create(['user_id' => $budi->id, 'amount' => 200000, 'description' => 'Tarik tunai kebutuhan darurat', 'status' => 'approved']);
        Withdrawal::create(['user_id' => $ani->id, 'amount' => 100000, 'description' => 'Tarik tunai', 'status' => 'pending']);

        // 5. Seed Loans (Pinjaman)
        // Budi's active loan
        $loanBudi = Loan::create([
            'user_id' => $budi->id,
            'amount' => 25000000,
            'duration_months' => 12,
            'monthly_installment' => 2200000, // 25M / 12 + interest
            'remaining_amount' => 20600000, // outstanding balance (25M - 2 * 2.2M paid = 20.6M)
            'description' => 'Modal Usaha Sembako',
            'status' => 'approved'
        ]);

        // Seed installments for Budi
        Installment::create(['loan_id' => $loanBudi->id, 'user_id' => $budi->id, 'amount' => 2200000, 'status' => 'approved']);
        Installment::create(['loan_id' => $loanBudi->id, 'user_id' => $budi->id, 'amount' => 2200000, 'status' => 'approved']);
        Installment::create(['loan_id' => $loanBudi->id, 'user_id' => $budi->id, 'amount' => 2200000, 'status' => 'pending']); // Pending verification

        // Ani's pending loan
        Loan::create([
            'user_id' => $ani->id,
            'amount' => 10000000,
            'duration_months' => 6,
            'monthly_installment' => 1700000,
            'remaining_amount' => 10000000,
            'description' => 'Biaya Renovasi Rumah',
            'status' => 'pending'
        ]);

        // Dedi's rejected loan
        Loan::create([
            'user_id' => $dedi->id,
            'amount' => 5000000,
            'duration_months' => 6,
            'monthly_installment' => 880000,
            'remaining_amount' => 5000000,
            'description' => 'Beli Handphone Baru',
            'status' => 'rejected'
        ]);
    }
}
