<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Member extends Model
{
    use HasFactory;

    protected $fillable = [
        'nik',
        'name',
        'site',
        'department',
        'department_id',
        'email',
        'gopay_number',
        'is_gopay_owner_self',
        'gopay_owner_number',
        'is_eligible',
        'has_voted',
    ];

    protected $casts = ['is_eligible' => 'boolean', 'has_voted' => 'boolean', 'created_at' => 'datetime', 'updated_at' => 'datetime'];

    // Relationships
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function votes()
    {
        return $this->hasMany(Vote::class, 'member_nik', 'nik');
    }

    public function emailOtps()
    {
        return $this->hasMany(EmailOtp::class, 'member_nik', 'nik');
    }

    // Scopes
    public function scopeEligible($query)
    {
        return $query->where('is_eligible', true);
    }

    public function scopeIneligible($query)
    {
        return $query->where('is_eligible', false);
    }

    public function scopeHasVoted($query)
    {
        return $query->where('has_voted', true);
    }

    public function scopeNotVoted($query)
    {
        return $query->where('has_voted', false);
    }
}
