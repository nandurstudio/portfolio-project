<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('election_settings')) {
            return;
        }

        Schema::table('election_settings', function (Blueprint $table) {
            if (!Schema::hasColumn('election_settings', 'announcement_at')) {
                $table->timestamp('announcement_at')->nullable();
            }

            if (!Schema::hasColumn('election_settings', 'hero_title')) {
                $table->string('hero_title')->nullable();
            }

            if (!Schema::hasColumn('election_settings', 'hero_description')) {
                $table->text('hero_description')->nullable();
            }

            if (!Schema::hasColumn('election_settings', 'cta_text')) {
                $table->string('cta_text', 150)->nullable();
            }

            if (!Schema::hasColumn('election_settings', 'agenda_title')) {
                $table->string('agenda_title')->nullable();
            }

            if (!Schema::hasColumn('election_settings', 'agenda_description')) {
                $table->text('agenda_description')->nullable();
            }

            if (!Schema::hasColumn('election_settings', 'agenda_location')) {
                $table->string('agenda_location')->nullable();
            }

            if (!Schema::hasColumn('election_settings', 'show_countdown')) {
                $table->boolean('show_countdown')->default(true);
            }

            if (!Schema::hasColumn('election_settings', 'show_activity_log')) {
                $table->boolean('show_activity_log')->default(true);
            }

            if (!Schema::hasColumn('election_settings', 'reward_enabled')) {
                $table->boolean('reward_enabled')->default(true);
            }

            if (!Schema::hasColumn('election_settings', 'reward_text')) {
                $table->string('reward_text')->nullable();
            }

            if (!Schema::hasColumn('election_settings', 'seo_title')) {
                $table->string('seo_title')->nullable();
            }

            if (!Schema::hasColumn('election_settings', 'seo_description')) {
                $table->string('seo_description', 255)->nullable();
            }

            if (!Schema::hasColumn('election_settings', 'og_title')) {
                $table->string('og_title')->nullable();
            }

            if (!Schema::hasColumn('election_settings', 'og_description')) {
                $table->string('og_description', 255)->nullable();
            }

            if (!Schema::hasColumn('election_settings', 'og_image_url')) {
                $table->string('og_image_url')->nullable();
            }

            if (!Schema::hasColumn('election_settings', 'canonical_url')) {
                $table->string('canonical_url')->nullable();
            }
        });
    }

    public function down(): void
    {
        // No-op on rollback to avoid accidental deletion of production content columns.
    }
};
