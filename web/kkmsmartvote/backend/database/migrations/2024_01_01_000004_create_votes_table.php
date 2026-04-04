<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('votes', function (Blueprint $table) {
            $table->id();
            $table->string('member_nik', 50);
            $table->string('member_name');
            $table->string('site', 100);
            $table->foreignId('candidate_id')->constrained()->restrictOnDelete();
            $table->boolean('is_valid')->default(true);
            $table->string('ip_address', 50)->nullable();
            $table->string('invalidated_by')->nullable();
            $table->timestamp('invalidated_at')->nullable();
            $table->string('invalidation_reason')->nullable();
            $table->timestamps();

            // One vote per member — enforced at DB level
            $table->unique('member_nik');
            $table->index('is_valid');
            $table->index('site');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('votes');
    }
};
