<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->string('nik', 20)->unique();
            $table->string('name');
            $table->string('site', 100)->nullable();
            $table->string('department', 150)->nullable();
            $table->string('email')->nullable();
            $table->string('gopay_number', 20)->nullable();
            $table->boolean('is_gopay_owner_self')->default(true);
            $table->string('gopay_owner_number', 20)->nullable();
            $table->boolean('is_eligible')->default(true);
            $table->boolean('has_voted')->default(false);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->index('site');
            $table->index('department');
            $table->index('email');
            $table->index('gopay_owner_number');
            $table->index('has_voted');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('members');
    }
};
