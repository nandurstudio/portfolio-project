<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Department extends Model
{
    use HasFactory;

    protected $table = 'departments';

    protected $fillable = [
        'code',
        'name',
        'site_id',
        'description',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Relationships
    public function site()
    {
        return $this->belongsTo(Site::class);
    }

    public function members()
    {
        return $this->hasMany(Member::class);
    }

    public function candidates()
    {
        return $this->hasMany(Candidate::class);
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

    public function scopeByCode($query, $code)
    {
        return $query->where('code', $code);
    }
}
