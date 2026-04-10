<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('candidates', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('position', 100);
            $table->text('bio')->nullable();
            $table->string('photo_url', 255)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidates');
    }
};
