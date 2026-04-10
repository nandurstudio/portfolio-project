<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('candidates')) {
            return;
        }

        Schema::table('candidates', function (Blueprint $table) {
            if (!Schema::hasColumn('candidates', 'nik')) {
                $table->string('nik', 20)->nullable()->after('name');
            }
            if (!Schema::hasColumn('candidates', 'department_name')) {
                $table->string('department_name', 150)->nullable()->after('department_id');
            }
            if (!Schema::hasColumn('candidates', 'site_name')) {
                $table->string('site_name', 120)->nullable()->after('department_name');
            }
            if (!Schema::hasColumn('candidates', 'vision')) {
                $table->text('vision')->nullable()->after('bio');
            }
            if (!Schema::hasColumn('candidates', 'mission')) {
                $table->text('mission')->nullable()->after('vision');
            }
            if (!Schema::hasColumn('candidates', 'vision_mission')) {
                $table->text('vision_mission')->nullable()->after('mission');
            }
            if (!Schema::hasColumn('candidates', 'motto')) {
                $table->string('motto', 255)->nullable()->after('vision_mission');
            }
            if (!Schema::hasColumn('candidates', 'full_photo_url')) {
                $table->string('full_photo_url', 255)->nullable()->after('photo_url');
            }
            if (!Schema::hasColumn('candidates', 'order_display')) {
                $table->unsignedInteger('order_display')->default(0)->after('full_photo_url');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('candidates')) {
            return;
        }

        Schema::table('candidates', function (Blueprint $table) {
            foreach (['order_display', 'full_photo_url', 'motto', 'vision_mission', 'mission', 'vision', 'site_name', 'department_name', 'nik'] as $column) {
                if (Schema::hasColumn('candidates', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
