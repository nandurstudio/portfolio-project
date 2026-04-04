<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Member extends Model
{
    use HasFactory;

    protected $fillable = ['nik', 'name', 'site', 'is_eligible', 'has_voted'];

    protected $casts = ['is_eligible' => 'boolean', 'has_voted' => 'boolean'];

    public function vote()
    {
        return $this->hasOne(Vote::class, 'member_nik', 'nik');
    }
}
