<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Candidate extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'position', 'bio', 'photo_url', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function votes()
    {
        return $this->hasMany(Vote::class);
    }

    public function validVotesCount(): int
    {
        return $this->votes()->where('is_valid', true)->count();
    }
}
