<?php
$host = '127.0.0.1';
$db   = 'koperasi_vote';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    
    // Check if column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM vouchers LIKE 'url_redeem'");
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE vouchers ADD COLUMN url_redeem TEXT NULL");
        echo "Column 'url_redeem' added successfully locally.\n";
    } else {
        echo "Column 'url_redeem' already exists locally.\n";
    }
} catch (\PDOException $e) {
    throw new \PDOException($e->getMessage(), (int)$e->getCode());
}
