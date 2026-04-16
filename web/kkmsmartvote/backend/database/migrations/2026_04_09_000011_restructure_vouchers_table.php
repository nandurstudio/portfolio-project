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
                $table->foreignId('vote_id')->nullable()->constrained('votes')->cascadeOnDelete();
            }

            if (!Schema::hasColumn('vouchers', 'member_nik')) {
                $table->string('member_nik', 20)->nullable();
            }

            if (!Schema::hasColumn('vouchers', 'member_name')) {
                $table->string('member_name', 255)->nullable();
            }

            if (!Schema::hasColumn('vouchers', 'member_email')) {
                $table->string('member_email', 255)->nullable();
            }

            if (!Schema::hasColumn('vouchers', 'department_id')) {
                $table->integer('department_id')->nullable();
            }

            if (!Schema::hasColumn('vouchers', 'candidate_id')) {
                $table->integer('candidate_id')->nullable();
            }

            if (!Schema::hasColumn('vouchers', 'candidate_name')) {
                $table->string('candidate_name', 255)->nullable();
            }

            if (!Schema::hasColumn('vouchers', 'claimed_at')) {
                $table->timestamp('claimed_at')->nullable();
            }

            if (!Schema::hasColumn('vouchers', 'redeemed_at')) {
                $table->timestamp('redeemed_at')->nullable();
            }

            if (!Schema::hasColumn('vouchers', 'redeemed_by')) {
                $table->string('redeemed_by', 255)->nullable();
            }

            // Add indexes for common queries
            $table->index('member_nik');
            $table->index('candidate_id');
            $table->index('department_id');
        });
    }

    public function down(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            if (Schema::hasColumn('vouchers', 'vote_id')) {
                $table->dropForeignKey(['vote_id']);
                $table->dropColumn('vote_id');
            }

            $columnsToDropColumnDrop = [
                'member_nik',
                'member_name',
                'member_email',
                'department_id',
                'candidate_id',
                'candidate_name',
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
