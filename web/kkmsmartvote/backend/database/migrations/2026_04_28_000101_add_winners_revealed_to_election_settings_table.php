<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('election_settings') || Schema::hasColumn('election_settings', 'winners_revealed')) {
            return;
        }

        Schema::table('election_settings', function (Blueprint $table) {
            $table->boolean('winners_revealed')->default(false)->after('reward_enabled');
            $table->unsignedInteger('winners_animation_duration_ms')->default(1800)->after('winners_revealed');
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('election_settings') || !Schema::hasColumn('election_settings', 'winners_revealed')) {
            return;
        }

        Schema::table('election_settings', function (Blueprint $table) {
            if (Schema::hasColumn('election_settings', 'winners_animation_duration_ms')) {
                $table->dropColumn('winners_animation_duration_ms');
            }
            $table->dropColumn('winners_revealed');
        });
    }
};