# Setup Laragon untuk koperasi-vote testing
# Jalankan sebagai Administrator!

param(
    [switch]$Quick = $false
)

Write-Host "🚀 Setting up Laragon for koperasi-vote testing..." -ForegroundColor Cyan

# Check admin privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (!$isAdmin) {
    Write-Host "❌ This script requires Administrator privileges!" -ForegroundColor Red
    exit 1
}

# 1. Add hosts entry
$HostsFile = "C:\Windows\System32\drivers\etc\hosts"
$Entry = "127.0.0.1`tkoperasi-vote.local"

if (!(Select-String -Path $HostsFile -Pattern "koperasi-vote.local" -Quiet)) {
    Add-Content -Path $HostsFile -Value "`n$Entry" -Encoding ASCII
    Write-Host "✅ Added hosts entry: koperasi-vote.local" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Hosts entry already exists" -ForegroundColor Gray
}

# 2. Create Laragon vhost config
$VhostDir = "C:\laragon\etc\apache2\sites-enabled"
$VhostFile = Join-Path $VhostDir "koperasi-vote.local.conf"

if (!(Test-Path $VhostDir)) {
    $VhostDir = "C:\laragon\etc\nginx\conf.d"
    $VhostFile = Join-Path $VhostDir "koperasi-vote.conf"
}

if ($VhostDir -like "*apache*") {
    # Apache vhost
    $VhostConfig = @"
<VirtualHost *:80>
    DocumentRoot "F:/laragon/www/koperasi-vote/public"
    ServerName koperasi-vote.local
    ServerAlias www.koperasi-vote.local
    
    <Directory "F:/laragon/www/koperasi-vote/public">
        Options Indexes FollowSymLinks MultiViews
        AllowOverride All
        Require all granted
        
        <IfModule mod_rewrite.c>
            RewriteEngine On
            RewriteCond %{REQUEST_FILENAME} !-f
            RewriteCond %{REQUEST_FILENAME} !-d
            RewriteRule ^ index.php [QSA,L]
        </IfModule>
    </Directory>
    
    <FilesMatch \.php$>
        SetHandler "proxy:unix:/run/php-fpm.sock|fcgi://localhost"
    </FilesMatch>
</VirtualHost>
"@
} else {
    # Nginx vhost
    $VhostConfig = @"
server {
    listen 80;
    server_name koperasi-vote.local www.koperasi-vote.local;
    
    root F:/laragon/www/koperasi-vote/public;
    index index.php index.html index.htm;
    
    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }
    
    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
    }
    
    location ~ /\.ht {
        deny all;
    }
}
"@
}

if (!(Test-Path $VhostFile)) {
    Set-Content -Path $VhostFile -Value $VhostConfig -Encoding UTF8
    Write-Host "✅ Created vhost config: $VhostFile" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Vhost already exists" -ForegroundColor Gray
}

# 3. Setup Database
Write-Host "`n📊 Setting up database..." -ForegroundColor Cyan

# Check if MySQL is running
$MySqlRunning = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue
if (!$MySqlRunning) {
    Write-Host "⚠️  MySQL not running. Start Laragon first!" -ForegroundColor Yellow
    Write-Host "   Click 'Start All' in Laragon" -ForegroundColor Gray
    exit 1
}

# Create database
$DbName = "koperasi_vote"
$DbCheck = mysql -u root -e "SHOW DATABASES LIKE '$DbName';" 2>$null

if ($DbCheck -notlike "*$DbName*") {
    mysql -u root -e "CREATE DATABASE $DbName CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    Write-Host "✅ Database created: $DbName" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Database already exists: $DbName" -ForegroundColor Gray
}

# 4. Summary
Write-Host "`n✨ Setup complete!" -ForegroundColor Green
Write-Host @"

Next steps:
1. Stop Laragon (click "Stop All")
2. Restart Laragon (click "Start All")
3. Access the application:
   - Backend API: http://koperasi-vote.local/api/test
   - Frontend dev: npm run dev (then http://localhost:5173)
   - Database: F:\laragon\www\koperasi-vote\backend\.env

Run migrations:
   cd F:\laragon\www\koperasi-vote\backend
   php artisan migrate

To sync changes from portfolio repo to Laragon:
   .\scripts\sync-to-laragon.ps1

To watch for changes automatically:
   .\scripts\sync-to-laragon.ps1 -Watch
"@ -ForegroundColor Gray

if (!$Quick) {
    Write-Host "`nPress any key to continue..." -ForegroundColor Yellow
    [Console]::ReadKey() | Out-Null
}
