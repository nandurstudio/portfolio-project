<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('actor');
            $table->string('action');
            $table->json('detail');
            $table->string('ip_address', 45);
            $table->timestamp('logged_at')->useCurrent();
            $table->timestamp('created_at')->useCurrent();

            $table->index('logged_at');
            $table->index('actor');
            $table->index('action');
        });

        Schema::create('election_settings', function (Blueprint $table) {
            $table->id();
            $table->string('election_name');
            $table->string('period', 100);
            $table->date('start_date');
            $table->date('end_date');
            $table->time('end_time');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_finalized')->default(false);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('election_settings');
    }
};
