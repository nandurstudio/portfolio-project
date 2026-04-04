<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\ElectionSetting;
use App\Models\Member;
use App\Models\Vote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ElectionSettingController extends Controller
{
    public function publicInfo(): JsonResponse
    {
        $s = ElectionSetting::current();
        $total = Member::where('is_eligible', true)->count();
        $voted = Vote::where('is_valid', true)->count();
        return response()->json([
            'election_name' => $s->election_name,
            'period'        => $s->period,
            'start_date'    => $s->start_date,
            'end_date'      => $s->end_date,
            'end_time'      => $s->end_time,
            'is_active'     => $s->is_active,
            'is_finalized'  => $s->is_finalized,
            'voting_open'   => $s->isVotingOpen(),
        ]);
    }

    public function publicStats(): JsonResponse
    {
        $total = Member::where('is_eligible', true)->count();
        $voted = Vote::where('is_valid', true)->count();
        return response()->json([
            'total_members'     => $total,
            'total_votes'       => $voted,
            'participation_pct' => $total > 0 ? round($voted / $total * 100, 1) : 0,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'election_name' => 'sometimes|string|max:255',
            'period'        => 'sometimes|string|max:50',
            'start_date'    => 'sometimes|date',
            'end_date'      => 'sometimes|date',
            'end_time'      => 'sometimes|date_format:H:i',
            'is_active'     => 'sometimes|boolean',
        ]);

        $setting = ElectionSetting::current();
        $setting->update($request->only(['election_name','period','start_date','end_date','end_time','is_active']));

        AuditLog::record(auth('api')->user()->name, 'Pengaturan Diperbarui', $request->all());

        return response()->json($setting);
    }
}
