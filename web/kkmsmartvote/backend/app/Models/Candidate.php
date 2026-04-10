<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Candidate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'nik',
        'position',
        'department_id',
        'department_name',
        'site_name',
        'bio',
        'vision',
        'mission',
        'vision_mission',
        'motto',
        'photo_url',
        'full_photo_url',
        'order_display',
        'is_active',
    ];

    protected $casts = ['is_active' => 'boolean', 'created_at' => 'datetime', 'updated_at' => 'datetime'];

    // Relationships
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function votes()
    {
        return $this->hasMany(Vote::class);
    }

    public function vouchers()
    {
        return $this->hasMany(Voucher::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('order_display', 'asc');
    }

    // Methods
    public function validVotesCount(): int
    {
        return $this->votes()->where('is_valid', true)->count();
    }

    public function getPhotoUrl()
    {
        return $this->full_photo_url ?? $this->photo_url ?? null;
    }
}
