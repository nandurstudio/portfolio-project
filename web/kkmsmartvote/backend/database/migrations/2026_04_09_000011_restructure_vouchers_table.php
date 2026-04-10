<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            // Add voting-related fields if they don't exist
            if (!Schema::hasColumn('vouchers', 'vote_id')) {
                $table->foreignId('vote_id')->nullable()->after('id')->constrained('votes')->cascadeOnDelete();
            }

            if (!Schema::hasColumn('vouchers', 'member_nik')) {
                $table->string('member_nik', 20)->nullable()->after('vote_id');
            }

            if (!Schema::hasColumn('vouchers', 'member_name')) {
                $table->string('member_name', 255)->nullable()->after('member_nik');
            }

            if (!Schema::hasColumn('vouchers', 'member_email')) {
                $table->string('member_email', 255)->nullable()->after('member_name');
            }

            if (!Schema::hasColumn('vouchers', 'department_id')) {
                $table->foreignId('department_id')->nullable()->after('member_email')->constrained('departments')->cascadeOnDelete();
            }

            if (!Schema::hasColumn('vouchers', 'candidate_id')) {
                $table->foreignId('candidate_id')->nullable()->after('department_id')->constrained('candidates')->cascadeOnDelete();
            }

            if (!Schema::hasColumn('vouchers', 'candidate_name')) {
                $table->string('candidate_name', 255)->nullable()->after('candidate_id');
            }

            // Add Gopay fields if they don't exist
            if (!Schema::hasColumn('vouchers', 'gopay_number')) {
                $table->string('gopay_number', 20)->nullable()->after('candidate_name');
            }

            if (!Schema::hasColumn('vouchers', 'gopay_owner_name')) {
                $table->string('gopay_owner_name', 255)->nullable()->after('gopay_number');
            }

            if (!Schema::hasColumn('vouchers', 'gopay_is_owner_self')) {
                $table->boolean('gopay_is_owner_self')->default(true)->after('gopay_owner_name');
            }

            if (!Schema::hasColumn('vouchers', 'gopay_submitted_at')) {
                $table->timestamp('gopay_submitted_at')->nullable()->after('gopay_is_owner_self');
            }

            // Update status enum to include new statuses
            // Note: We can't directly modify enum, so we'll keep the existing status field
            // and manage the new statuses via the application logic

            if (!Schema::hasColumn('vouchers', 'claimed_at')) {
                $table->timestamp('claimed_at')->nullable()->after('expires_at');
            }

            if (!Schema::hasColumn('vouchers', 'redeemed_at')) {
                $table->timestamp('redeemed_at')->nullable()->after('claimed_at');
            }

            if (!Schema::hasColumn('vouchers', 'redeemed_by')) {
                $table->string('redeemed_by', 255)->nullable()->after('redeemed_at');
            }

            // Add indexes for common queries
            if (!Schema::hasColumn('vouchers', 'member_nik')) {
                // These indexes will be created by the foreign key constraints above
            } else {
                $table->index('member_nik');
                $table->index('candidate_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            // Drop foreign keys first
            if (Schema::hasColumn('vouchers', 'vote_id')) {
                $table->dropForeignKey(['vote_id']);
                $table->dropColumn('vote_id');
            }

            if (Schema::hasColumn('vouchers', 'department_id')) {
                $table->dropForeignKey(['department_id']);
                $table->dropColumn('department_id');
            }

            if (Schema::hasColumn('vouchers', 'candidate_id')) {
                $table->dropForeignKey(['candidate_id']);
                $table->dropColumn('candidate_id');
            }

            // Drop regular columns
            $columnsToDropColumnDrop = [
                'member_nik',
                'member_name',
                'member_email',
                'candidate_name',
                'gopay_number',
                'gopay_owner_name',
                'gopay_is_owner_self',
                'gopay_submitted_at',
                'claimed_at',
                'redeemed_at',
                'redeemed_by',
            ];

            foreach ($columnsToDropColumnDrop as $column) {
                if (Schema::hasColumn('vouchers', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
