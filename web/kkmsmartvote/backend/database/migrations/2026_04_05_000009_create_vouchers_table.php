<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();
            $table->string('code', 100)->unique();
            $table->decimal('value', 10, 2);
            $table->enum('status', ['active', 'redeemed', 'expired', 'canceled'])->default('active');
            $table->timestamp('expires_at')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->index('status');
            $table->index('expires_at');
        });

        Schema::create('voter_vouchers', function (Blueprint $table) {
            $table->id();
            $table->string('voter_nik', 20);
            $table->foreignId('voucher_id')->constrained('vouchers')->cascadeOnDelete();
            $table->timestamp('granted_at');
            $table->timestamp('redeemed_at')->nullable();
            $table->string('redeemed_by')->nullable();
            $table->string('redemption_code', 100)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['voter_nik', 'voucher_id']);
            $table->index('redeemed_at');
            $table->foreign('voter_nik')->references('nik')->on('members')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('voter_vouchers');
        Schema::dropIfExists('vouchers');
    }
};
