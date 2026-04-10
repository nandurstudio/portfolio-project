<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Vote extends Model
{
    use HasFactory;

    protected $fillable = ['member_nik', 'member_name', 'site', 'site_id', 'candidate_id', 'is_saksi', 'is_valid', 'ip_address', 'voucher_id', 'invalidated_by', 'invalidated_at', 'invalidation_reason'];

    protected $casts = ['is_saksi' => 'boolean', 'is_valid' => 'boolean', 'invalidated_at' => 'datetime', 'created_at' => 'datetime', 'updated_at' => 'datetime'];

    protected $hidden = ['candidate_id']; // hidden by default for secrecy

    // Relationships
    public function candidate()
    {
        return $this->belongsTo(Candidate::class);
    }

    public function member()
    {
        return $this->belongsTo(Member::class, 'member_nik', 'nik');
    }

    public function site()
    {
        return $this->belongsTo(Site::class);
    }

    public function voucher()
    {
        return $this->hasOne(Voucher::class);
    }

    // Scopes
    public function scopeValid($query)
    {
        return $query->where('is_valid', true);
    }

    public function scopeInvalid($query)
    {
        return $query->where('is_valid', false);
    }

    public function scopeSaksi($query)
    {
        return $query->where('is_saksi', true);
    }
}
