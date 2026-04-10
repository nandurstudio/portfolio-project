<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('users', 'member_nik')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('member_nik', 20)->nullable()->after('id');
            });
        }

        // Keep migration safe for environments where indexes/constraints already exist.
        try {
            DB::statement('ALTER TABLE users ADD CONSTRAINT uq_users_member_nik UNIQUE (member_nik)');
        } catch (\Throwable $e) {
            // Ignore duplicate/exists errors.
        }

        try {
            DB::statement('ALTER TABLE users ADD CONSTRAINT fk_users_member_nik FOREIGN KEY (member_nik) REFERENCES members(nik) ON UPDATE CASCADE ON DELETE SET NULL');
        } catch (\Throwable $e) {
            // Ignore duplicate/exists errors.
        }

        // Backfill using exact name match to keep legacy accounts linked where possible.
        DB::statement('UPDATE users u JOIN members m ON m.name = u.name SET u.member_nik = m.nik WHERE u.member_nik IS NULL');
    }

    public function down(): void
    {
        if (!Schema::hasColumn('users', 'member_nik')) {
            return;
        }

        try {
            Schema::table('users', function (Blueprint $table) {
                $table->dropForeign('fk_users_member_nik');
            });
        } catch (\Throwable $e) {
            // Ignore missing-constraint errors.
        }

        try {
            Schema::table('users', function (Blueprint $table) {
                $table->dropUnique('uq_users_member_nik');
            });
        } catch (\Throwable $e) {
            // Ignore missing-index errors.
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('member_nik');
        });
    }
};
