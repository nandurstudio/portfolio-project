<?php

namespace App\Http\Controllers;

use App\Models\Voucher;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;

class VoucherClaimController extends Controller
{
    public function visit(string $token): JsonResponse
    {
        $voucher = null;

        DB::transaction(function() use ($token, &$voucher) {
            $voucher = Voucher::where('claim_token', $token)->lockForUpdate()->first();
            if (!$voucher) {
                abort(404, 'Voucher not found');
            }

            // increment visits
            $voucher->claim_visits = ($voucher->claim_visits ?? 0) + 1;

            // mark claimed on first visit
            if (is_null($voucher->claimed_at)) {
                $voucher->claimed_at = now();
            }

                if (empty($voucher->claim_url)) {
                    $voucher->claim_url = rtrim(config('app.url'), '/') . '/v/' . $voucher->claim_token;
                }

            $voucher->save();
        });

        return response()->json([
            'success' => true,
            'message' => 'Voucher claim berhasil dibuka',
            'data' => [
                'id' => $voucher->id,
                'code' => $voucher->code,
                'claim_token' => $voucher->claim_token,
                'claim_url' => $voucher->claim_url,
                'claim_visits' => (int) ($voucher->claim_visits ?? 0),
                'claimed_at' => $voucher->claimed_at,
                'redeemed_at' => $voucher->redeemed_at,
                'status' => $voucher->status,
                'member_nik' => $voucher->member_nik,
                'member_name' => $voucher->member_name,
                'member_email' => $voucher->member_email,
                'candidate_name' => $voucher->candidate_name,
            ],
        ]);
    }
}
