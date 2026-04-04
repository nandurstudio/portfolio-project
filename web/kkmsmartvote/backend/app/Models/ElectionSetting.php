<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ElectionSetting extends Model
{
    protected $fillable = [
        'election_name', 'period', 'start_date', 'end_date',
        'end_time', 'is_active', 'is_finalized'
    ];

    protected $casts = [
        'start_date'   => 'date',
        'end_date'     => 'date',
        'is_active'    => 'boolean',
        'is_finalized' => 'boolean',
    ];

    public static function current(): self
    {
        return static::firstOrCreate([], [
            'election_name' => 'Pemilihan Ketua Koperasi Karya Mandiri',
            'period'        => '2026-2029',
            'start_date'    => '2026-04-13',
            'end_date'      => '2026-04-17',
            'end_time'      => '15:00:00',
            'is_active'     => true,
            'is_finalized'  => false,
        ]);
    }

    public function isVotingOpen(): bool
    {
        if (!$this->is_active || $this->is_finalized) return false;
        $now  = now('Asia/Jakarta');
        $end  = \Carbon\Carbon::parse($this->end_date->format('Y-m-d') . ' ' . $this->end_time, 'Asia/Jakarta');
        $start = \Carbon\Carbon::parse($this->start_date->format('Y-m-d'), 'Asia/Jakarta')->startOfDay();
        return $now->between($start, $end);
    }
}
