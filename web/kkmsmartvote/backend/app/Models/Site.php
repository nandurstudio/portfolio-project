<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Site extends Model
{
    use HasFactory;

    protected $table = 'sites';

    protected $fillable = [
        'code',
        'name',
        'location',
        'latitude',
        'longitude',
        'contact_person',
        'contact_phone',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Relationships
    public function departments()
    {
        return $this->hasMany(Department::class);
    }

    public function votes()
    {
        return $this->hasMany(Vote::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByCode($query, $code)
    {
        return $query->where('code', $code);
    }

    // Methods
    public function getTotalDepartments()
    {
        return $this->departments()->count();
    }

    public function getTotalVotes()
    {
        return $this->votes()->where('is_valid', true)->count();
    }
}
