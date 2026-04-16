<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('email_otps', function (Blueprint $table) {
            $table->id();
            $table->string('email');
            $table->string('member_nik', 20)->nullable();
            $table->string('otp_hash');
            $table->dateTime('expires_at');
            $table->integer('attempts')->default(0);
            $table->boolean('is_used')->default(false);
            $table->string('requested_ip', 45)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->index('email');
            $table->index('member_nik');
            $table->index('expires_at');
            $table->index('is_used');
        });

        $foreignKeyExists = DB::table('information_schema.referential_constraints')
            ->where('constraint_schema', DB::raw('DATABASE()'))
            ->where('table_name', 'email_otps')
            ->where('constraint_name', 'fk_email_otps_member_nik')
            ->exists();

        if (!$foreignKeyExists) {
            DB::statement('
                ALTER TABLE email_otps
                ADD CONSTRAINT fk_email_otps_member_nik
                FOREIGN KEY (member_nik) REFERENCES members(nik)
                ON UPDATE CASCADE
                ON DELETE SET NULL
            ');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('email_otps');
    }
};
