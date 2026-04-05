<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class EmailOtp extends Model
{
    use HasFactory;

    protected $fillable = [
        'email',
        'member_id',
        'otp_code',
        'is_used',
        'sent_at',
        'expires_at',
        'verified_at',
        'attempts',
        'max_attempts'
    ];

    protected $casts = [
        'is_used' => 'boolean',
        'sent_at' => 'datetime',
        'expires_at' => 'datetime',
        'verified_at' => 'datetime'
    ];

    public function member()
    {
        return $this->belongsTo(Member::class);
    }

    /**
     * Scope: Get valid (non-expired, non-used) OTPs
     */
    public function scopeValid($query)
    {
        return $query->where('is_used', false)
            ->where('expires_at', '>', now());
    }

    /**
     * Check if OTP is expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at < now();
    }

    /**
     * Check if max attempts exceeded
     */
    public function isMaxAttemptsExceeded(): bool
    {
        return $this->attempts >= $this->max_attempts;
    }

    /**
     * Mark OTP as verified
     */
    public function markVerified(): void
    {
        $this->update([
            'is_used' => true,
            'verified_at' => now()
        ]);
    }
}
