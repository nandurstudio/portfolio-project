<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Voucher extends Model
{
    protected $table = 'vouchers';

    protected $fillable = [
        'code',
        'claim_token',
        'claim_url',
        'claim_visits',
        'claim_expires_at',
        'vote_id',
        'member_nik',
        'member_name',
        'member_email',
        'department_id',
        'candidate_id',
        'candidate_name',
        'gopay_number',
        'gopay_owner_name',
        'gopay_is_owner_self',
        'gopay_submitted_at',
        'status',
        'claimed_at',
        'redeemed_at',
        'redeemed_by'
    ];

    protected $casts = [
        'gopay_is_owner_self' => 'boolean',
        'gopay_submitted_at' => 'datetime',
        'claim_expires_at' => 'datetime',
        'claim_visits' => 'integer',
        'claimed_at' => 'datetime',
        'redeemed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Relationships
    public function vote()
    {
        return $this->belongsTo(Vote::class);
    }

    public function member()
    {
        return $this->belongsTo(Member::class, 'member_nik', 'nik');
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function candidate()
    {
        return $this->belongsTo(Candidate::class);
    }

    public function redeemed_by_user()
    {
        return $this->belongsTo(User::class, 'redeemed_by', 'id');
    }

    // Scopes
    public function scopeGenerated($query)
    {
        return $query->where('status', 'GENERATED');
    }

    public function scopeClaimed($query)
    {
        return $query->where('status', 'CLAIMED');
    }

    public function scopeRedeemed($query)
    {
        return $query->where('status', 'REDEEMED');
    }

    public function scopeByDepartment($query, $departmentId)
    {
        return $query->where('department_id', $departmentId);
    }

    public function scopeByCandidate($query, $candidateId)
    {
        return $query->where('candidate_id', $candidateId);
    }

    // Mutators
    public function setStatusAttribute($value)
    {
        $this->attributes['status'] = strtoupper($value);
    }

    // Methods
    public function isRedeemed()
    {
        return $this->status === 'REDEEMED';
    }

    public function isClaimed()
    {
        return $this->status === 'CLAIMED';
    }

    public function canRedeem()
    {
        return in_array($this->status, ['GENERATED', 'CLAIMED']);
    }
}
