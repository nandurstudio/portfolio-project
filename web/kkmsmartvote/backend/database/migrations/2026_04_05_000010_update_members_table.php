<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('members', 'department_id')) {
            Schema::table('members', function (Blueprint $table) {
                $table->foreignId('department_id')->nullable()->after('department')->constrained('departments')->nullOnDelete();
                $table->index('department_id');
            });
        }

        DB::statement('
            UPDATE members m
            JOIN departments d ON d.name = m.department
            SET m.department_id = d.id
            WHERE m.department_id IS NULL
              AND m.department IS NOT NULL
              AND TRIM(m.department) <> ""
        ');
    }

    public function down(): void
    {
        if (Schema::hasColumn('members', 'department_id')) {
            Schema::table('members', function (Blueprint $table) {
                $table->dropForeign(['department_id']);
                $table->dropIndex(['department_id']);
                $table->dropColumn('department_id');
            });
        }
    }
};
