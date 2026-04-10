<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('votes', function (Blueprint $table) {
            $table->id();
            $table->string('member_nik', 20);
            $table->string('member_name');
            $table->string('site', 100);
            $table->foreignId('candidate_id')->constrained()->restrictOnDelete();
            $table->boolean('is_valid')->default(true);
            $table->string('ip_address', 45);
            $table->timestamp('invalidated_at')->nullable();
            $table->text('invalidation_reason')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->unique(['member_nik', 'candidate_id']);
            $table->index('is_valid');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('votes');
    }
};
