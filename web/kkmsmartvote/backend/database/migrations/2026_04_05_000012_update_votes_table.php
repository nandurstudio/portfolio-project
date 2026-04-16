<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('votes', 'site_id')) {
            Schema::table('votes', function (Blueprint $table) {
                $table->foreignId('site_id')->nullable()->after('site')->constrained('sites')->nullOnDelete();
                $table->index('site_id');
            });
        }

        DB::statement('
            UPDATE votes v
            LEFT JOIN sites s_name ON LOWER(TRIM(v.site)) = LOWER(TRIM(s_name.name))
            LEFT JOIN sites s_code ON UPPER(TRIM(v.site)) = UPPER(TRIM(s_code.code))
            SET v.site_id = COALESCE(s_name.id, s_code.id)
            WHERE v.site_id IS NULL
              AND v.site IS NOT NULL
              AND TRIM(v.site) <> ""
        ');

        if (!Schema::hasColumn('votes', 'member_nik')) {
            return;
        }

        Schema::table('votes', function (Blueprint $table) {
            try {
                $table->foreign('member_nik')->references('nik')->on('members')->cascadeOnUpdate()->restrictOnDelete();
            } catch (\Throwable $e) {
                // Ignore if the FK already exists or the database is not ready yet.
            }
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('votes', 'site_id')) {
            Schema::table('votes', function (Blueprint $table) {
                $table->dropForeign(['site_id']);
                $table->dropIndex(['site_id']);
                $table->dropColumn('site_id');
            });
        }
    }
};
