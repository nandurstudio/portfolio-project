<?php
// generate_claim_tokens.php
// Run: php generate_claim_tokens.php

$dbHost = '127.0.0.1';
$dbName = 'koperasi_vote';
$dbUser = 'root';
$dbPass = '';
$baseUrl = 'http://localhost:5173/v/'; // local claim route
$expiryDays = 30;
$limit = 0; // 0 means no limit

try {
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8", $dbUser, $dbPass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    // Select vouchers needing tokens
    $sql = "SELECT id, code, member_nik, member_email FROM vouchers WHERE (claim_token IS NULL OR claim_token = '') AND status = 'active'";
    if ($limit > 0) $sql .= " LIMIT " . intval($limit);
    $stmt = $pdo->query($sql);

    $update = $pdo->prepare("UPDATE vouchers SET claim_token = ?, claim_url = ?, claim_expires_at = ? WHERE id = ?");

    $outCsv = __DIR__ . '/../backups/claim_links_local.csv';
    $fh = fopen($outCsv, 'w');
    fputcsv($fh, ['id','code','member_nik','member_email','claim_token','claim_url','claim_expires_at']);

    $count = 0;
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $token = bin2hex(random_bytes(24));
        $expires = (new DateTime())->modify("+{$expiryDays} days")->format('Y-m-d H:i:s');
        $url = $baseUrl . $token;

        $update->execute([$token, $url, $expires, $row['id']]);

        fputcsv($fh, [$row['id'],$row['code'],$row['member_nik'],$row['member_email'],$token,$url,$expires]);
        $count++;
    }

    fclose($fh);
    echo "Generated tokens for {$count} vouchers. CSV: {$outCsv}\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . PHP_EOL;
    exit(1);
}
