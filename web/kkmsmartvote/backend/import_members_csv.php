<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$csvFile = 'E:/Portfolio Nandur/folioflix-personal-portfolio-html-template-2023-11-27-05-37-14-utc/folioflix/web/kkmsmartvote/master-members-lengkap-20260611-084213.csv';
if (!file_exists($csvFile)) {
    $csvFile = 'F:/laragon/www/koperasi-vote/master-members-lengkap-20260611-084213.csv';
}

if (!file_exists($csvFile)) {
    echo "File CSV tidak ditemukan di $csvFile\n";
    exit;
}

echo "Membaca file CSV dari: $csvFile\n";
$handle = fopen($csvFile, 'r');
$header = fgetcsv($handle); // Read headers

// Get some admin user ID for vouchers.created_by
$adminUser = DB::table('users')->first();
$adminId = $adminUser ? $adminUser->id : 1;

// Get candidate ID to use as fallback if we have to insert a vote
$fallbackCandidate = DB::table('candidates')->first();
$fallbackCandidateId = $fallbackCandidate ? $fallbackCandidate->id : 1;

DB::beginTransaction();

try {
    $insertedMembers = 0;
    $updatedMembers = 0;
    
    $insertedVouchers = 0;
    $updatedVouchers = 0;
    
    $insertedVotes = 0;
    $insertedVoterVouchers = 0;
    
    $insertedOtps = 0;
    $insertedAuditLogs = 0;
    
    $rowNum = 0;
    while (($row = fgetcsv($handle)) !== false) {
        $rowNum++;
        if (count($row) < 13) continue;
        
        $nik = trim($row[0]);
        if (empty($nik)) continue;
        
        $name = trim($row[1]);
        $email = trim($row[2]);
        $updatedAtStr = trim($row[3]);
        $site = trim($row[4]);
        $department = trim($row[5]);
        $gopayNumber = trim($row[6]);
        $gopaySelfOwner = trim($row[7]) === 'YA' ? 1 : 0;
        $gopayOwnerNumber = trim($row[8]);
        
        $voucherCode = trim($row[9]);
        $redeemLink = trim($row[10]);
        $eligible = trim($row[11]) === 'YA' ? 1 : 0;
        $hasVoted = trim($row[12]) === 'YA' ? 1 : 0;
        
        $totalValidVotes = isset($row[13]) ? (int)$row[13] : 0;
        $lastValidVoteAt = isset($row[16]) && !empty(trim($row[16])) ? trim($row[16]) : null;
        
        $registered = isset($row[17]) && trim($row[17]) === 'YA' ? 1 : 0;
        $otpRequested = isset($row[18]) && trim($row[18]) === 'YA' ? 1 : 0;
        $otpVerified = isset($row[19]) && trim($row[19]) === 'YA' ? 1 : 0;
        $loginActivity = isset($row[20]) && trim($row[20]) === 'YA' ? 1 : 0;
        $redeemed = isset($row[21]) && trim($row[21]) === 'YA' ? 1 : 0;
        $hasGopaySubmitted = isset($row[22]) && trim($row[22]) === 'YA' ? 1 : 0;
        
        $lastOtpRequestedAt = isset($row[23]) && !empty(trim($row[23])) ? trim($row[23]) : null;
        $lastOtpVerifiedAt = isset($row[24]) && !empty(trim($row[24])) ? trim($row[24]) : null;
        $lastRedeemedAt = isset($row[25]) && !empty(trim($row[25])) ? trim($row[25]) : null;

        $dbUpdatedAt = !empty($updatedAtStr) ? date('Y-m-d H:i:s', strtotime($updatedAtStr)) : now();

        // 1. Process Member (only essential fields)
        $member = DB::table('members')->where('nik', $nik)->first();
        if ($member) {
            DB::table('members')->where('nik', $nik)->update([
                'name' => $name,
                'email' => !empty($email) ? $email : null,
                'site' => !empty($site) ? $site : null,
                'department' => !empty($department) ? $department : null,
                'gopay_number' => !empty($gopayNumber) ? $gopayNumber : null,
                'is_eligible' => $eligible,
                'has_voted' => $hasVoted,
                'updated_at' => $dbUpdatedAt,
            ]);
            $updatedMembers++;
        } else {
            DB::table('members')->insert([
                'nik' => $nik,
                'name' => $name,
                'email' => !empty($email) ? $email : null,
                'site' => !empty($site) ? $site : null,
                'department' => !empty($department) ? $department : null,
                'gopay_number' => !empty($gopayNumber) ? $gopayNumber : null,
                'is_eligible' => $eligible,
                'has_voted' => $hasVoted,
                'created_at' => $dbUpdatedAt,
                'updated_at' => $dbUpdatedAt,
            ]);
            $insertedMembers++;
        }

        // 2. Process Voucher (only essential fields)
        $voucherId = null;
        if (!empty($voucherCode)) {
            $voucher = DB::table('vouchers')->where('code', $voucherCode)->first();
            
            $claimedAt = $hasVoted ? ($lastOtpVerifiedAt ?? $lastValidVoteAt ?? $dbUpdatedAt) : null;
            $redeemedAtVal = $redeemed ? ($lastRedeemedAt ?? $dbUpdatedAt) : null;
            $status = $redeemed ? 'redeemed' : 'active';
            
            if ($voucher) {
                DB::table('vouchers')->where('code', $voucherCode)->update([
                    'url_redeem' => !empty($redeemLink) ? $redeemLink : $voucher->url_redeem,
                    'status' => $status,
                    'gopay_number' => !empty($gopayNumber) ? $gopayNumber : $voucher->gopay_number,
                    'member_nik' => $nik,
                    'member_name' => $name,
                    'member_email' => !empty($email) ? $email : null,
                    'claimed_at' => $claimedAt,
                    'redeemed_at' => $redeemedAtVal,
                    'redeemed_by' => $redeemed ? $name : null,
                    'updated_at' => now(),
                ]);
                $updatedVouchers++;
                $voucherId = $voucher->id;
            } else {
                $voucherId = DB::table('vouchers')->insertGetId([
                    'code' => $voucherCode,
                    'url_redeem' => !empty($redeemLink) ? $redeemLink : null,
                    'value' => 25000.00,
                    'status' => $status,
                    'gopay_number' => !empty($gopayNumber) ? $gopayNumber : null,
                    'created_by' => $adminId,
                    'member_nik' => $nik,
                    'member_name' => $name,
                    'member_email' => !empty($email) ? $email : null,
                    'claimed_at' => $claimedAt,
                    'redeemed_at' => $redeemedAtVal,
                    'redeemed_by' => $redeemed ? $name : null,
                    'created_at' => $dbUpdatedAt,
                    'updated_at' => $dbUpdatedAt,
                ]);
                $insertedVouchers++;
            }

            // 3. Process Vote (if member has voted)
            if ($hasVoted) {
                $voteExists = DB::table('votes')->where('member_nik', $nik)->first();
                if (!$voteExists) {
                    $voteId = DB::table('votes')->insertGetId([
                        'member_nik' => $nik,
                        'member_name' => $name,
                        'site' => !empty($site) ? $site : 'Imported',
                        'candidate_id' => $fallbackCandidateId,
                        'is_valid' => 1,
                        'ip_address' => '127.0.0.1',
                        'created_at' => $lastValidVoteAt ?? $dbUpdatedAt,
                        'updated_at' => $lastValidVoteAt ?? $dbUpdatedAt,
                    ]);
                    $insertedVotes++;
                    
                    DB::table('vouchers')->where('id', $voucherId)->update([
                        'vote_id' => $voteId
                    ]);
                } else {
                    $voteId = $voteExists->id;
                    DB::table('vouchers')->where('id', $voucherId)->update([
                        'vote_id' => $voteId
                    ]);
                }

                // 4. Process voter_vouchers
                $voterVoucherExists = DB::table('voter_vouchers')
                    ->where('voter_nik', $nik)
                    ->where('voucher_id', $voucherId)
                    ->exists();
                if (!$voterVoucherExists) {
                    DB::table('voter_vouchers')->insert([
                        'voter_nik' => $nik,
                        'voucher_id' => $voucherId,
                        'granted_at' => $lastValidVoteAt ?? $dbUpdatedAt,
                        'redeemed_at' => $redeemedAtVal,
                        'redeemed_by' => $redeemed ? $name : null,
                        'redemption_code' => $voucherCode,
                        'created_at' => $lastValidVoteAt ?? $dbUpdatedAt,
                    ]);
                    $insertedVoterVouchers++;
                }
            }
        }

        // 5. Process OTP logs (`email_otps`)
        if ($otpRequested && !empty($lastOtpRequestedAt) && !empty($email)) {
            $otpTime = date('Y-m-d H:i:s', strtotime($lastOtpRequestedAt));
            $otpExists = DB::table('email_otps')
                ->where('member_nik', $nik)
                ->where('created_at', $otpTime)
                ->exists();
            if (!$otpExists) {
                DB::table('email_otps')->insert([
                    'email' => $email,
                    'member_nik' => $nik,
                    'otp_hash' => password_hash('000000', PASSWORD_DEFAULT),
                    'expires_at' => date('Y-m-d H:i:s', strtotime($otpTime . ' +5 minutes')),
                    'attempts' => 1,
                    'is_used' => $otpVerified ? 1 : 0,
                    'requested_ip' => '127.0.0.1',
                    'user_agent' => 'Imported',
                    'created_at' => $otpTime,
                    'updated_at' => !empty($lastOtpVerifiedAt) ? date('Y-m-d H:i:s', strtotime($lastOtpVerifiedAt)) : $otpTime,
                ]);
                $insertedOtps++;
            }
        }

        // 6. Process Audit Logs
        // OTP Request Log
        if ($otpRequested && !empty($lastOtpRequestedAt)) {
            $logTime = date('Y-m-d H:i:s', strtotime($lastOtpRequestedAt));
            $logExists = DB::table('audit_logs')
                ->where('actor', $name)
                ->where('action', 'Request OTP')
                ->where('logged_at', $logTime)
                ->exists();
            if (!$logExists) {
                DB::table('audit_logs')->insert([
                    'actor' => $name,
                    'action' => 'Request OTP',
                    'detail' => json_encode(['email' => $email, 'ip' => '127.0.0.1']),
                    'ip_address' => '127.0.0.1',
                    'logged_at' => $logTime,
                    'created_at' => $logTime,
                ]);
                $insertedAuditLogs++;
            }
        }
        
        // OTP Verification Log
        if ($otpVerified && !empty($lastOtpVerifiedAt)) {
            $logTime = date('Y-m-d H:i:s', strtotime($lastOtpVerifiedAt));
            $logExists = DB::table('audit_logs')
                ->where('actor', $name)
                ->where('action', 'Verify OTP Success')
                ->where('logged_at', $logTime)
                ->exists();
            if (!$logExists) {
                DB::table('audit_logs')->insert([
                    'actor' => $name,
                    'action' => 'Verify OTP Success',
                    'detail' => json_encode(['email' => $email, 'ip' => '127.0.0.1']),
                    'ip_address' => '127.0.0.1',
                    'logged_at' => $logTime,
                    'created_at' => $logTime,
                ]);
                $insertedAuditLogs++;
            }
        }

        // Login Activity Log
        if ($loginActivity && !empty($lastOtpVerifiedAt)) {
            $logTime = date('Y-m-d H:i:s', strtotime($lastOtpVerifiedAt));
            $logExists = DB::table('audit_logs')
                ->where('actor', $name)
                ->where('action', 'Login')
                ->where('logged_at', $logTime)
                ->exists();
            if (!$logExists) {
                DB::table('audit_logs')->insert([
                    'actor' => $name,
                    'action' => 'Login',
                    'detail' => json_encode(['role' => 'voter', 'ip' => '127.0.0.1']),
                    'ip_address' => '127.0.0.1',
                    'logged_at' => $logTime,
                    'created_at' => $logTime,
                ]);
                $insertedAuditLogs++;
            }
        }
    }
    
    DB::commit();
    fclose($handle);
    
    echo "IMPORT STATUS:\n";
    echo "- Members: Inserted $insertedMembers, Updated $updatedMembers\n";
    echo "- Vouchers: Inserted $insertedVouchers, Updated $updatedVouchers\n";
    echo "- Votes (Fallback Created): $insertedVotes\n";
    echo "- Voter Vouchers Linked: $insertedVoterVouchers\n";
    echo "- Email OTPs Created: $insertedOtps\n";
    echo "- Audit Logs Created: $insertedAuditLogs\n";
    
    // Backfill departments & member department ids
    echo "\nRunning departments backfill...\n";
    $tableExists = DB::table('information_schema.tables')
        ->where('table_schema', DB::raw('DATABASE()'))
        ->where('table_name', 'departments')
        ->exists();

    if ($tableExists) {
        DB::statement("
            INSERT INTO departments (code, name, created_at, updated_at)
            SELECT
                CONCAT('DEPT_', LPAD(ROW_NUMBER() OVER (ORDER BY source_departments.department_name), 4, '0')) AS code,
                source_departments.department_name,
                NOW(),
                NOW()
            FROM (
                SELECT DISTINCT TRIM(m.department) AS department_name
                FROM members m
                WHERE m.department IS NOT NULL
                  AND TRIM(m.department) <> ''
            ) source_departments
            LEFT JOIN departments d ON d.name = source_departments.department_name
            WHERE d.id IS NULL
        ");
        
        DB::statement('
            UPDATE members m
            JOIN departments d ON d.name = m.department
            SET m.department_id = d.id
            WHERE m.department_id IS NULL
              AND m.department IS NOT NULL
              AND TRIM(m.department) <> ""
        ');
        echo "✓ Departments backfilled successfully!\n";
    }
    
} catch (\Exception $e) {
    DB::rollBack();
    fclose($handle);
    echo "ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
