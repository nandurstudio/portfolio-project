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
                $table->string('nik', 20)->nullable();
            }
            if (!Schema::hasColumn('candidates', 'department_name')) {
                $table->string('department_name', 150)->nullable();
            }
            if (!Schema::hasColumn('candidates', 'site_name')) {
                $table->string('site_name', 120)->nullable();
            }
            if (!Schema::hasColumn('candidates', 'vision')) {
                $table->text('vision')->nullable();
            }
            if (!Schema::hasColumn('candidates', 'mission')) {
                $table->text('mission')->nullable();
            }
            if (!Schema::hasColumn('candidates', 'vision_mission')) {
                $table->text('vision_mission')->nullable();
            }
            if (!Schema::hasColumn('candidates', 'motto')) {
                $table->string('motto', 255)->nullable();
            }
            if (!Schema::hasColumn('candidates', 'full_photo_url')) {
                $table->string('full_photo_url', 255)->nullable();
            }
            if (!Schema::hasColumn('candidates', 'order_display')) {
                $table->unsignedInteger('order_display')->default(0);
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
