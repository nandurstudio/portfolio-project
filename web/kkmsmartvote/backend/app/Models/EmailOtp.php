<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class EmailOtp extends Model
{
    use HasFactory;

    public const MAX_ATTEMPTS = 3;

    protected $fillable = [
        'email',
        'member_nik',
        'otp_hash',
        'is_used',
        'expires_at',
        'attempts',
        'requested_ip',
        'user_agent',
    ];

    protected $casts = [
        'is_used' => 'boolean',
        'expires_at' => 'datetime',
    ];

    public function member()
    {
        return $this->belongsTo(Member::class, 'member_nik', 'nik');
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
        return $this->attempts >= self::MAX_ATTEMPTS;
    }

    /**
     * Mark OTP as verified
     */
    public function markVerified(): void
    {
        $this->update([
            'is_used' => true,
        ]);
    }
}
