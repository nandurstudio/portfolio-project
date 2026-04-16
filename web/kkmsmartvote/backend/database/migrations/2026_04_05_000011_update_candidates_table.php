<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('candidates', 'department_id')) {
            Schema::table('candidates', function (Blueprint $table) {
                $table->foreignId('department_id')->nullable()->after('position')->constrained('departments')->nullOnDelete();
                $table->index('department_id');
            });
        }

        DB::statement('
            UPDATE candidates c
            JOIN members m ON UPPER(TRIM(m.name)) = UPPER(TRIM(c.name))
            SET c.department_id = m.department_id
            WHERE c.department_id IS NULL
              AND m.department_id IS NOT NULL
        ');
    }

    public function down(): void
    {
        if (Schema::hasColumn('candidates', 'department_id')) {
            Schema::table('candidates', function (Blueprint $table) {
                $table->dropForeign(['department_id']);
                $table->dropIndex(['department_id']);
                $table->dropColumn('department_id');
            });
        }
    }
};
