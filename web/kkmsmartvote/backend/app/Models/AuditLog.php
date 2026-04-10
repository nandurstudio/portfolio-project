<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class AuditLog extends Model
{
    public $timestamps = false;

    protected $fillable = ['actor', 'action', 'detail', 'ip_address', 'logged_at'];

    protected $casts = ['detail' => 'array', 'logged_at' => 'datetime'];

    public static function record(string $actor, string $action, array|string $detail = [], ?string $ip = null): void
    {
        $normalizedDetail = is_array($detail) ? $detail : ['note' => $detail];
        $ipAddress = $ip ?? request()?->ip() ?? '0.0.0.0';
        $loggedAt = now();

        $previous = static::query()->select(['id', 'detail'])->orderByDesc('id')->first();
        $prevHash = null;
        if (is_array($previous?->detail)) {
            $prevHash = $previous->detail['_forensic']['chain_hash'] ?? null;
        }

        $eventId = (string) Str::uuid();
        $signatureBase = json_encode([
            'event_id' => $eventId,
            'actor' => $actor,
            'action' => $action,
            'detail' => $normalizedDetail,
            'ip_address' => $ipAddress,
            'logged_at' => $loggedAt->toIso8601String(),
            'prev_hash' => $prevHash,
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        $secret = (string) config('app.key', 'audit-fallback-key');
        $chainHash = hash_hmac('sha256', (string) $signatureBase, $secret);

        $normalizedDetail['_forensic'] = [
            'event_id' => $eventId,
            'prev_hash' => $prevHash,
            'chain_hash' => $chainHash,
            'signature_alg' => 'HMAC-SHA256',
            'user_agent' => substr((string) request()?->userAgent(), 0, 255),
            'server_time' => $loggedAt->toIso8601String(),
        ];

        static::create([
            'actor'      => $actor,
            'action'     => $action,
            'detail'     => $normalizedDetail,
            'ip_address' => $ipAddress,
            'logged_at'  => $loggedAt,
        ]);
    }
}
