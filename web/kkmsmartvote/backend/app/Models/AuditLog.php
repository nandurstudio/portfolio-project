<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    public $timestamps = false;

    protected $fillable = ['actor', 'action', 'detail', 'ip_address', 'logged_at'];

    protected $casts = ['detail' => 'array', 'logged_at' => 'datetime'];

    public static function record(string $actor, string $action, array|string $detail = [], ?string $ip = null): void
    {
        static::create([
            'actor'      => $actor,
            'action'     => $action,
            'detail'     => is_array($detail) ? $detail : ['note' => $detail],
            'ip_address' => $ip ?? request()?->ip(),
            'logged_at'  => now(),
        ]);
    }
}
