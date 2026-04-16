<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            if (!Schema::hasColumn('vouchers', 'gopay_number')) {
                $table->string('gopay_number', 20)->nullable();
            }

            if (!Schema::hasColumn('vouchers', 'gopay_owner_name')) {
                $table->string('gopay_owner_name', 255)->nullable();
            }

            if (!Schema::hasColumn('vouchers', 'gopay_is_owner_self')) {
                $table->boolean('gopay_is_owner_self')->default(true);
            }

            if (!Schema::hasColumn('vouchers', 'gopay_submitted_at')) {
                $table->timestamp('gopay_submitted_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            if (Schema::hasColumn('vouchers', 'gopay_submitted_at')) {
                $table->dropColumn('gopay_submitted_at');
            }

            if (Schema::hasColumn('vouchers', 'gopay_is_owner_self')) {
                $table->dropColumn('gopay_is_owner_self');
            }

            if (Schema::hasColumn('vouchers', 'gopay_owner_name')) {
                $table->dropColumn('gopay_owner_name');
            }

            if (Schema::hasColumn('vouchers', 'gopay_number')) {
                $table->dropColumn('gopay_number');
            }
        });
    }
};
