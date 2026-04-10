<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class ElectionSetting extends Model
{
    protected $table = 'election_settings';

    protected $fillable = [
        'election_name',
        'period',
        'start_date',
        'end_date',
        'end_time',
        'announcement_at',
        'is_active',
        'is_finalized',
        'hero_title',
        'hero_description',
        'cta_text',
        'agenda_title',
        'agenda_description',
        'agenda_location',
        'show_countdown',
        'show_activity_log',
        'reward_enabled',
        'reward_text',
        'seo_title',
        'seo_description',
        'og_title',
        'og_description',
        'og_image_url',
        'canonical_url',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'announcement_at' => 'datetime',
        'is_active' => 'boolean',
        'is_finalized' => 'boolean',
        'show_countdown' => 'boolean',
        'show_activity_log' => 'boolean',
        'reward_enabled' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Get current active election
    public static function current()
    {
        return static::query()
            ->orderByRaw('CASE WHEN is_active = 1 THEN 0 ELSE 1 END')
            ->orderBy('created_at', 'desc')
            ->first();
    }

    // Backward compatibility for legacy controller fields
    public function getElectionStatusAttribute(): string
    {
        if ($this->is_finalized) {
            return 'CLOSED';
        }

        if ($this->is_active && !$this->hasExpired()) {
            return 'OPEN';
        }

        return 'DRAFT';
    }

    public function getStartedAtAttribute()
    {
        if (empty($this->start_date)) {
            return null;
        }

        return Carbon::parse($this->start_date)->startOfDay();
    }

    public function getEndedAtAttribute()
    {
        if (empty($this->end_date)) {
            return null;
        }

        $date = Carbon::parse($this->end_date)->toDateString();
        $time = !empty($this->end_time) ? Carbon::parse($this->end_time)->format('H:i:s') : '23:59:59';

        return Carbon::parse($date . ' ' . $time);
    }

    // Methods
    public function secondsRemaining(): int
    {
        if (!$this->ended_at) {
            return 0;
        }

        $remaining = $this->ended_at->diffInSeconds(now(), false);
        return max(0, $remaining);
    }

    public function hasExpired(): bool
    {
        if (!$this->ended_at) {
            return false;
        }

        return now()->isAfter($this->ended_at);
    }

    public function calculateThreshold(): float
    {
        $totalEligible = \App\Models\Member::where('is_eligible', true)->count();

        if ($totalEligible === 0) {
            return 0;
        }

        // Default threshold for MVP: 50% + 1 vote.
        return (50 / 100) * $totalEligible + 1;
    }

    public function isVotingOpen(): bool
    {
        return $this->election_status === 'OPEN' && !$this->hasExpired();
    }

    public function isDraft(): bool
    {
        return $this->election_status === 'DRAFT';
    }

    public function isClosed(): bool
    {
        return $this->election_status === 'CLOSED' || $this->hasExpired();
    }
}
