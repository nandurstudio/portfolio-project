<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('election_settings', function (Blueprint $table) {
            $table->timestamp('announcement_at')->nullable()->after('end_time');

            $table->string('hero_title')->nullable()->after('is_finalized');
            $table->text('hero_description')->nullable()->after('hero_title');
            $table->string('cta_text', 150)->nullable()->after('hero_description');

            $table->string('agenda_title')->nullable()->after('cta_text');
            $table->text('agenda_description')->nullable()->after('agenda_title');
            $table->string('agenda_location')->nullable()->after('agenda_description');

            $table->boolean('show_countdown')->default(true)->after('agenda_location');
            $table->boolean('show_activity_log')->default(true)->after('show_countdown');

            $table->boolean('reward_enabled')->default(true)->after('show_activity_log');
            $table->string('reward_text')->nullable()->after('reward_enabled');

            $table->string('seo_title')->nullable()->after('reward_text');
            $table->string('seo_description', 255)->nullable()->after('seo_title');
            $table->string('og_title')->nullable()->after('seo_description');
            $table->string('og_description', 255)->nullable()->after('og_title');
            $table->string('og_image_url')->nullable()->after('og_description');
            $table->string('canonical_url')->nullable()->after('og_image_url');
        });
    }

    public function down(): void
    {
        Schema::table('election_settings', function (Blueprint $table) {
            $table->dropColumn([
                'announcement_at',
                'hero_title',
                'hero_description',
                'cta_text',
                'agenda_title',
                'agenda_description',
                'agenda_location',
                'show_countdown',
                'show_activity_log',
                'reward_enabled',
                'reward_text',
                'seo_title',
                'seo_description',
                'og_title',
                'og_description',
                'og_image_url',
                'canonical_url',
            ]);
        });
    }
};
