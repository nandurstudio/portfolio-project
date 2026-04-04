<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Vote extends Model
{
    use HasFactory;

    protected $fillable = ['member_nik', 'member_name', 'site', 'candidate_id', 'is_valid', 'ip_address', 'invalidated_by', 'invalidated_at', 'invalidation_reason'];

    protected $casts = ['is_valid' => 'boolean', 'invalidated_at' => 'datetime'];

    protected $hidden = ['candidate_id']; // hidden by default for secrecy

    public function candidate()
    {
        return $this->belongsTo(Candidate::class);
    }
}
