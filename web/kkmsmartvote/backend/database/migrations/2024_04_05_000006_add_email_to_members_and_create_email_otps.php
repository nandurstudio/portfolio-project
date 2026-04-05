<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Add email to members table
        Schema::table('members', function (Blueprint $table) {
            $table->string('email')->nullable()->after('name');
            $table->index('email');
        });

        // Create email_otps table for OTP storage
        Schema::create('email_otps', function (Blueprint $table) {
            $table->id();
            $table->string('email');
            $table->unsignedBigInteger('member_id')->nullable();
            $table->string('otp_code');  // hashed
            $table->boolean('is_used')->default(false);
            $table->timestamp('sent_at')->useCurrent();
            $table->timestamp('expires_at');
            $table->timestamp('verified_at')->nullable();
            $table->integer('attempts')->default(0);
            $table->integer('max_attempts')->default(3);
            $table->timestamps();

            $table->foreign('member_id')->references('id')->on('members')->onDelete('set null');
            $table->index('email');
            $table->index('member_id');
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_otps');

        Schema::table('members', function (Blueprint $table) {
            $table->dropIndex(['email']);
            $table->dropColumn('email');
        });
    }
};
