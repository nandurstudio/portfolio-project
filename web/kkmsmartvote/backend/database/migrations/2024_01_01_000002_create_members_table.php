<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->string('nik', 50)->unique();
            $table->string('name');
            $table->string('site', 100);
            $table->boolean('is_eligible')->default(true);
            $table->boolean('has_voted')->default(false);
            $table->timestamps();

            $table->index('site');
            $table->index('has_voted');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('members');
    }
};
