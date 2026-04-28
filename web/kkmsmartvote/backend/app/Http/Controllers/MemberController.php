<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Member;
use App\Models\Voucher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MemberController extends Controller
{
    public function findByNik(string $nik): JsonResponse
    {
        $normalizedNik = strtoupper(trim($nik));

        $member = Member::query()
            ->where('nik', $normalizedNik)
            ->first();

        if (!$member) {
            return response()->json([
                'success' => false,
                'message' => 'NIK tidak ditemukan',
                'error' => 'MEMBER_NOT_FOUND',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'nik' => $member->nik,
                'name' => $member->name,
                'department' => $member->department,
                'site' => $member->site,
                'email' => $member->email,
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Member::query();

        if ($request->filled('site')) {
            $query->where('site', $request->site);
        }
        if ($request->filled('has_voted')) {
            $query->where('has_voted', filter_var($request->has_voted, FILTER_VALIDATE_BOOLEAN));
        }
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $keyword = trim((string) $request->search);
                $q->where('name', 'like', '%' . $keyword . '%')
                    ->orWhere('nik', 'like', '%' . $keyword . '%');
            });
        }

        $members = $query->orderBy('name')->paginate(50);

        return response()->json($members);
    }

    public function masterIndex(Request $request): JsonResponse
    {
        $perPage = max(1, min(100, (int) $request->input('per_page', 20)));

        $totalKaryawan = (int) Member::query()->count();
        $totalEligible = (int) Member::query()->where('is_eligible', true)->count();

        $query = Member::query()
            ->leftJoin('departments', 'departments.id', '=', 'members.department_id')
            ->select([
                'members.id',
                'members.nik',
                'members.name',
                'members.department',
                'members.department_id',
                'departments.name as department_master_name',
                'members.email',
                'members.is_eligible',
                'members.has_voted',
                'members.created_at',
                'members.updated_at',
            ])
            ->selectRaw('EXISTS(SELECT 1 FROM users u WHERE u.member_nik = members.nik) as is_registered')
            ->selectRaw('EXISTS(SELECT 1 FROM email_otps o WHERE (o.member_nik = members.nik OR (members.email IS NOT NULL AND members.email <> "" AND o.email = members.email))) as has_otp_requested')
            ->selectRaw('EXISTS(SELECT 1 FROM email_otps o2 WHERE (o2.member_nik = members.nik OR (members.email IS NOT NULL AND members.email <> "" AND o2.email = members.email)) AND o2.is_used = 1) as has_otp_verified')
            ->selectRaw('EXISTS(SELECT 1 FROM voter_vouchers vv JOIN vouchers v ON v.id = vv.voucher_id WHERE vv.voter_nik = members.nik AND (UPPER(COALESCE(v.status, "")) = "REDEEMED" OR vv.redeemed_at IS NOT NULL OR v.redeemed_at IS NOT NULL)) as has_redeemed')
            ->selectRaw('EXISTS(SELECT 1 FROM voter_vouchers vv2 JOIN vouchers v3 ON v3.id = vv2.voucher_id WHERE vv2.voter_nik = members.nik AND COALESCE(v3.gopay_number, "") <> "") as has_gopay_submitted')
            ->selectRaw('EXISTS(SELECT 1 FROM audit_logs al WHERE (JSON_UNQUOTE(JSON_EXTRACT(al.detail, "$.member_nik")) = members.nik OR al.actor = members.name) AND LOWER(al.action) like "%login%") as has_login_activity')
            ->selectRaw('(SELECT MAX(o3.created_at) FROM email_otps o3 WHERE (o3.member_nik = members.nik OR (members.email IS NOT NULL AND members.email <> "" AND o3.email = members.email))) as last_otp_requested_at')
            ->selectRaw('(SELECT MAX(o4.updated_at) FROM email_otps o4 WHERE (o4.member_nik = members.nik OR (members.email IS NOT NULL AND members.email <> "" AND o4.email = members.email)) AND o4.is_used = 1) as last_otp_verified_at')
            ->selectRaw('(SELECT MAX(COALESCE(v2.redeemed_at, vv3.redeemed_at)) FROM voter_vouchers vv3 JOIN vouchers v2 ON v2.id = vv3.voucher_id WHERE vv3.voter_nik = members.nik) as last_redeemed_at')
            ->selectRaw('(SELECT v.code FROM voter_vouchers vv4 JOIN vouchers v ON v.id = vv4.voucher_id WHERE vv4.voter_nik = members.nik ORDER BY vv4.id DESC LIMIT 1) as voucher_code')
            ->selectRaw('(SELECT COUNT(*) FROM votes vv WHERE vv.member_nik = members.nik AND vv.is_valid = 1) as total_valid_votes')
            ->selectRaw('(SELECT s.name FROM votes vsite LEFT JOIN sites s ON s.id = vsite.site_id WHERE vsite.member_nik = members.nik AND vsite.site_id IS NOT NULL ORDER BY vsite.id DESC LIMIT 1) as voted_site_name')
            ->selectRaw('(SELECT vgp.gopay_number FROM voter_vouchers vvx JOIN vouchers vgp ON vgp.id = vvx.voucher_id WHERE vvx.voter_nik = members.nik ORDER BY vvx.id DESC LIMIT 1) as voucher_gopay_number')
            ->selectRaw('(SELECT vgo.gopay_is_owner_self FROM voter_vouchers vvy JOIN vouchers vgo ON vgo.id = vvy.voucher_id WHERE vvy.voter_nik = members.nik ORDER BY vvy.id DESC LIMIT 1) as voucher_gopay_is_owner_self')
            ->selectRaw('(SELECT vgn.gopay_owner_name FROM voter_vouchers vvz JOIN vouchers vgn ON vgn.id = vvz.voucher_id WHERE vvz.voter_nik = members.nik ORDER BY vvz.id DESC LIMIT 1) as voucher_gopay_owner_name');

        if ($request->filled('search')) {
            $keyword = trim((string) $request->search);
            $query->where(function ($q) use ($keyword) {
                $q->where('members.nik', 'like', '%' . $keyword . '%')
                    ->orWhere('members.name', 'like', '%' . $keyword . '%')
                    ->orWhere('members.email', 'like', '%' . $keyword . '%')
                    ->orWhere('members.department', 'like', '%' . $keyword . '%')
                    ->orWhereRaw('EXISTS(SELECT 1 FROM votes sv LEFT JOIN sites ss ON ss.id = sv.site_id WHERE sv.member_nik = members.nik AND LOWER(COALESCE(ss.name, "")) LIKE ?)', ['%' . strtolower($keyword) . '%']);
            });
        }

        if ($request->filled('is_eligible')) {
            $query->where('members.is_eligible', filter_var($request->is_eligible, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('has_voted')) {
            $query->where('members.has_voted', filter_var($request->has_voted, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('is_registered')) {
            $isRegistered = filter_var($request->is_registered, FILTER_VALIDATE_BOOLEAN);
            $query->whereRaw('EXISTS(SELECT 1 FROM users u WHERE u.member_nik = members.nik) = ?', [$isRegistered ? 1 : 0]);
        }

        if ($request->filled('has_redeemed')) {
            $hasRedeemed = filter_var($request->has_redeemed, FILTER_VALIDATE_BOOLEAN);
            $query->whereRaw('EXISTS(SELECT 1 FROM voter_vouchers vv JOIN vouchers v ON v.id = vv.voucher_id WHERE vv.voter_nik = members.nik AND (UPPER(COALESCE(v.status, "")) = "REDEEMED" OR vv.redeemed_at IS NOT NULL OR v.redeemed_at IS NOT NULL)) = ?', [$hasRedeemed ? 1 : 0]);
        }

        if ($request->filled('has_gopay')) {
            $hasGopay = filter_var($request->has_gopay, FILTER_VALIDATE_BOOLEAN);
            if ($hasGopay) {
                $query->whereRaw('EXISTS(SELECT 1 FROM voter_vouchers vv2 JOIN vouchers v3 ON v3.id = vv2.voucher_id WHERE vv2.voter_nik = members.nik AND COALESCE(v3.gopay_number, "") <> "") = 1');
            } else {
                $query->whereRaw('EXISTS(SELECT 1 FROM voter_vouchers vv2 JOIN vouchers v3 ON v3.id = vv2.voucher_id WHERE vv2.voter_nik = members.nik AND COALESCE(v3.gopay_number, "") <> "") = 0');
            }
        }

        $members = $query
            ->orderBy('members.name')
            ->paginate($perPage)
            ->through(function ($row) {
                return [
                    'id' => (int) $row->id,
                    'nik' => $row->nik,
                    'name' => $row->name,
                    'site' => $row->voted_site_name,
                    'department' => $row->department_master_name ?: $row->department,
                    'department_id' => $row->department_id,
                    'department_master_name' => $row->department_master_name,
                    'email' => $row->email,
                    'gopay_number' => $row->voucher_gopay_number,
                    'voucher_code' => $row->voucher_code,
                    'is_gopay_owner_self' => isset($row->voucher_gopay_is_owner_self) ? (bool) $row->voucher_gopay_is_owner_self : true,
                    'gopay_owner_number' => $row->voucher_gopay_owner_name,
                    'is_eligible' => (bool) $row->is_eligible,
                    'has_voted' => (bool) $row->has_voted,
                    'status' => [
                        'is_registered' => (bool) $row->is_registered,
                        'has_otp_requested' => (bool) $row->has_otp_requested,
                        'has_otp_verified' => (bool) $row->has_otp_verified,
                        'has_login_activity' => (bool) $row->has_login_activity,
                        'has_redeemed' => (bool) $row->has_redeemed,
                        'has_gopay_submitted' => (bool) $row->has_gopay_submitted || !empty($row->gopay_number),
                        'total_valid_votes' => (int) $row->total_valid_votes,
                        'last_otp_requested_at' => $row->last_otp_requested_at,
                        'last_otp_verified_at' => $row->last_otp_verified_at,
                        'last_redeemed_at' => $row->last_redeemed_at,
                    ],
                    'created_at' => $row->created_at,
                    'updated_at' => $row->updated_at,
                ];
            });

        $payload = $members->toArray();
        $payload['meta'] = [
            'total_karyawan' => $totalKaryawan,
            'total_eligible' => $totalEligible,
        ];

        return response()->json($payload);
    }

    public function masterExportComparison(Request $request): StreamedResponse
    {
        $query = Member::query()
            ->leftJoin('departments', 'departments.id', '=', 'members.department_id')
            ->select([
                'members.nik',
                'members.name',
                'members.email',
                'members.site',
                'members.department',
                'departments.name as department_master_name',
                'members.is_eligible',
                'members.has_voted',
            ])
            ->selectRaw('(SELECT COUNT(*) FROM votes vv WHERE vv.member_nik = members.nik AND vv.is_valid = 1) as total_valid_votes')
            ->selectRaw('(SELECT MAX(vv2.created_at) FROM votes vv2 WHERE vv2.member_nik = members.nik AND vv2.is_valid = 1) as last_valid_vote_at');

        if ($request->filled('search')) {
            $keyword = trim((string) $request->search);
            $query->where(function ($q) use ($keyword) {
                $q->where('members.nik', 'like', '%' . $keyword . '%')
                    ->orWhere('members.name', 'like', '%' . $keyword . '%')
                    ->orWhere('members.email', 'like', '%' . $keyword . '%')
                    ->orWhere('members.department', 'like', '%' . $keyword . '%')
                    ->orWhere('members.site', 'like', '%' . $keyword . '%');
            });
        }

        if ($request->filled('is_eligible')) {
            $query->where('members.is_eligible', filter_var($request->is_eligible, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('has_voted')) {
            $query->where('members.has_voted', filter_var($request->has_voted, FILTER_VALIDATE_BOOLEAN));
        }

        $query->orderBy('members.name');

        $fileName = 'master-members-komparasi-vote-' . now()->format('Ymd-His') . '.csv';

        return response()->streamDownload(function () use ($query) {
            $out = fopen('php://output', 'w');
            if ($out === false) {
                return;
            }

            // UTF-8 BOM so Excel opens UTF-8 text correctly.
            fwrite($out, "\xEF\xBB\xBF");

            fputcsv($out, [
                'NIK',
                'Nama',
                'Email',
                'Site',
                'Department',
                'Eligible',
                'Flag Has Voted (members.has_voted)',
                'Total Valid Vote (table votes)',
                'Komparasi Status Vote',
                'Konsistensi Flag vs Vote',
                'Last Valid Vote At',
            ]);

            $query->chunk(500, function ($rows) use ($out) {
                foreach ($rows as $row) {
                    $totalValidVotes = (int) ($row->total_valid_votes ?? 0);
                    $realHasVoted = $totalValidVotes > 0;
                    $flagHasVoted = (bool) $row->has_voted;
                    $comparisonStatus = $realHasVoted ? 'SUDAH_VOTE' : 'BELUM_VOTE';
                    $consistency = ($flagHasVoted === $realHasVoted) ? 'MATCH' : 'MISMATCH';

                    fputcsv($out, [
                        (string) $row->nik,
                        (string) $row->name,
                        (string) ($row->email ?? ''),
                        (string) ($row->site ?? ''),
                        (string) ($row->department_master_name ?: $row->department ?: ''),
                        $row->is_eligible ? 'YA' : 'TIDAK',
                        $flagHasVoted ? 'YA' : 'TIDAK',
                        $totalValidVotes,
                        $comparisonStatus,
                        $consistency,
                        (string) ($row->last_valid_vote_at ?? ''),
                    ]);
                }
            });

            fclose($out);
        }, $fileName, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'nik'  => 'required|string|max:50|unique:members,nik',
            'name' => 'required|string|max:255',
            'site' => 'required|string|max:100',
        ]);

        $member = Member::create([
            'nik'         => strtoupper($request->nik),
            'name'        => $request->name,
            'site'        => $request->site,
            'is_eligible' => true,
            'has_voted'   => false,
        ]);

        AuditLog::record(auth('api')->user()->name, 'Anggota Ditambah', [
            'nik'  => $member->nik,
            'name' => $member->name,
        ]);

        return response()->json($member, 201);
    }

    public function masterStore(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'nik' => 'required|string|max:20|unique:members,nik',
            'name' => 'required|string|max:255',
            'site' => 'nullable|string|max:100',
            'department' => 'nullable|string|max:150',
            'department_id' => 'nullable|integer|exists:departments,id',
            'email' => 'nullable|email|max:255',
            'gopay_number' => 'nullable|string|max:20',
            'is_gopay_owner_self' => 'nullable|boolean',
            'gopay_owner_number' => 'nullable|string|max:20',
            'is_eligible' => 'nullable|boolean',
            'has_voted' => 'nullable|boolean',
        ]);

        $payload['nik'] = strtoupper(trim((string) $payload['nik']));
        $payload['is_gopay_owner_self'] = array_key_exists('is_gopay_owner_self', $payload) ? (bool) $payload['is_gopay_owner_self'] : true;
        $payload['is_eligible'] = array_key_exists('is_eligible', $payload) ? (bool) $payload['is_eligible'] : true;
        $payload['has_voted'] = array_key_exists('has_voted', $payload) ? (bool) $payload['has_voted'] : false;

        $member = Member::create($payload);

        AuditLog::record(auth('api')->user()->name, 'Master Member Ditambah', [
            'member_id' => $member->id,
            'nik' => $member->nik,
            'name' => $member->name,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Member berhasil ditambahkan',
            'data' => $member,
        ], 201);
    }

    public function masterUpdate(Request $request, int $id): JsonResponse
    {
        $member = Member::query()->findOrFail($id);

        $payload = $request->validate([
            'nik' => 'sometimes|required|string|max:20|unique:members,nik,' . $member->id,
            'name' => 'sometimes|required|string|max:255',
            'site' => 'nullable|string|max:100',
            'department' => 'nullable|string|max:150',
            'department_id' => 'nullable|integer|exists:departments,id',
            'email' => 'nullable|email|max:255',
            'gopay_number' => 'nullable|string|max:20',
            'is_gopay_owner_self' => 'nullable|boolean',
            'gopay_owner_number' => 'nullable|string|max:20',
            'is_eligible' => 'nullable|boolean',
            'has_voted' => 'nullable|boolean',
            'has_redeemed' => 'nullable|boolean',
        ]);

        if (array_key_exists('nik', $payload)) {
            $payload['nik'] = strtoupper(trim((string) $payload['nik']));
        }

        if (array_key_exists('is_gopay_owner_self', $payload)) {
            $payload['is_gopay_owner_self'] = (bool) $payload['is_gopay_owner_self'];
        }

        if (array_key_exists('is_eligible', $payload)) {
            $payload['is_eligible'] = (bool) $payload['is_eligible'];
        }

        if (array_key_exists('has_voted', $payload)) {
            $payload['has_voted'] = (bool) $payload['has_voted'];
        }

        $redeemedRequested = array_key_exists('has_redeemed', $payload);
        $redeemedTarget = $redeemedRequested ? (bool) $payload['has_redeemed'] : null;
        unset($payload['has_redeemed']);

        $before = [
            'nik' => $member->nik,
            'name' => $member->name,
            'is_eligible' => $member->is_eligible,
            'has_voted' => $member->has_voted,
            'email' => $member->email,
            'gopay_number' => $member->gopay_number,
            'department_id' => $member->department_id,
            'site' => $member->site,
        ];

        $voucherBefore = null;
        $voucherAfter = null;

        DB::transaction(function () use ($member, $payload, $redeemedRequested, $redeemedTarget, &$voucherBefore, &$voucherAfter) {
            $member->update($payload);

            if (!$redeemedRequested) {
                return;
            }

            $voucher = Voucher::query()
                ->where('member_nik', $member->nik)
                ->orderByDesc('id')
                ->first();

            if (!$voucher) {
                throw new HttpResponseException(response()->json([
                    'success' => false,
                    'message' => 'Voucher member tidak ditemukan',
                    'error' => 'VOUCHER_NOT_FOUND',
                ], 404));
            }

            $voucherBefore = [
                'code' => $voucher->code,
                'status' => $voucher->status,
                'redeemed_at' => $voucher->redeemed_at,
                'redeemed_by' => $voucher->redeemed_by,
            ];

            if ($redeemedTarget) {
                if (strtoupper((string) $voucher->status) !== 'REDEEMED') {
                    $voucher->update([
                        'status' => 'REDEEMED',
                        'redeemed_at' => now(),
                        'redeemed_by' => auth('api')->id(),
                    ]);
                }
            } else {
                if (strtoupper((string) $voucher->status) === 'REDEEMED') {
                    $voucher->update([
                        'status' => 'CLAIMED',
                        'redeemed_at' => null,
                        'redeemed_by' => null,
                    ]);
                }
            }

            $voucher->refresh();
            $voucherAfter = [
                'code' => $voucher->code,
                'status' => $voucher->status,
                'redeemed_at' => $voucher->redeemed_at,
                'redeemed_by' => $voucher->redeemed_by,
            ];
        });

        AuditLog::record(auth('api')->user()->name, 'Master Member Diupdate', [
            'member_id' => $member->id,
            'before' => $before,
            'after' => [
                'nik' => $member->nik,
                'name' => $member->name,
                'is_eligible' => $member->is_eligible,
                'has_voted' => $member->has_voted,
                'email' => $member->email,
                'gopay_number' => $member->gopay_number,
                'department_id' => $member->department_id,
                'site' => $member->site,
            ],
            'voucher_before' => $voucherBefore,
            'voucher_after' => $voucherAfter,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Member berhasil diupdate',
            'data' => $member,
            'voucher' => $voucherAfter,
        ]);
    }
}
