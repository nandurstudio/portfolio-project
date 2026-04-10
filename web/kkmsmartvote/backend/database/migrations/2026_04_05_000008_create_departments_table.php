<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Legacy migration retained for history only.
        // The current SCHEMA.md does not define a departments table.
    }

    public function down(): void
    {
        // No-op.
    }
};
