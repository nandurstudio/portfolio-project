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
            $table->jsonb('detail')->nullable();
            $table->string('ip_address', 50)->nullable();
            $table->timestamp('logged_at')->useCurrent();

            $table->index('logged_at');
            $table->index('actor');
        });

        Schema::create('election_settings', function (Blueprint $table) {
            $table->id();
            $table->string('election_name');
            $table->string('period', 50);
            $table->date('start_date');
            $table->date('end_date');
            $table->time('end_time')->default('15:00:00');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_finalized')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('election_settings');
    }
};
