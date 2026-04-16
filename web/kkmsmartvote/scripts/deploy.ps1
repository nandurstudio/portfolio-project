# ============================================================================
# KKMSmartVote PostgreSQL Setup & Deployment Script
# ============================================================================
# Target: VPS 146.190.87.175
# Database: PostgreSQL 16 - koperasi_vote
# User: koperasi / change_this_koperasi_db_password
# ============================================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$Step = "all",

    [Parameter(Mandatory=$false)]
    [string]$SSHHost = "root@146.190.87.175",

    [Parameter(Mandatory=$false)]
    [string]$SSHKey = "$env:USERPROFILE\.ssh\id_ed25519_portfolio"
)

# Colors
$Green = "`e[32m"
$Yellow = "`e[33m"
$Red = "`e[31m"
$Reset = "`e[0m"

function Write-Info { Write-Host "${Green}[INFO]${Reset} $args" }
function Write-Warn { Write-Host "${Yellow}[WARN]${Reset} $args" }
function Write-Error { Write-Host "${Red}[ERROR]${Reset} $args" }

# ============================================================================
# STEP 1: Create PostgreSQL User & Database
# ============================================================================
function Step-1-CreateDatabase {
    Write-Info "STEP 1: Creating PostgreSQL user 'koperasi' and database 'koperasi_vote'..."

    $sqlCommands = @(
        "CREATE USER koperasi WITH PASSWORD 'change_this_koperasi_db_password' CREATEDB;"
        "CREATE DATABASE koperasi_vote OWNER koperasi;"
        "GRANT ALL PRIVILEGES ON DATABASE koperasi_vote TO koperasi;"
        "\c koperasi_vote"
        "GRANT ALL PRIVILEGES ON SCHEMA public TO koperasi;"
        "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO koperasi;"
        "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO koperasi;"
    )

    $sqlScript = $sqlCommands -join "`n"

    # Use docker exec to run SQL
    $command = "cd /opt/stack && `"" + `
        "echo '$sqlScript' | sudo docker compose exec -T postgres psql -U n8n -d postgres" + `
        "`""

    Write-Info "Executing: ssh -i '$SSHKey' '$SSHHost' `"$command`""
    ssh -i $SSHKey $SSHHost $command

    if ($LASTEXITCODE -eq 0) {
        Write-Info "✓ Database created successfully"
    } else {
        Write-Error "Database creation failed"
        return $false
    }
    return $true
}

# ============================================================================
# STEP 2: Verify Database Connection
# ============================================================================
function Step-2-VerifyConnection {
    Write-Info "STEP 2: Verifying database connection..."

    $command = "cd /opt/stack && `"" + `
        "sudo docker compose exec -T postgres psql -U koperasi -d koperasi_vote -c 'SELECT version();'" + `
        "`""

    $result = ssh -i $SSHKey $SSHHost $command 2>&1
    if ($result -match "PostgreSQL") {
        Write-Info "✓ Database connection successful"
        return $true
    } else {
        Write-Error "Database connection failed"
        Write-Error $result
        return $false
    }
}

# ============================================================================
# STEP 3: Upload Application Code
# ============================================================================
function Step-3-UploadCode {
    Write-Info "STEP 3: Uploading application code to server..."

    $localPath = "E:\Portfolio Nandur\folioflix-personal-portfolio-html-template-2023-11-27-05-37-14-utc\folioflix\web\kkmsmartvote"
    $remotePath = "/opt/stack/web/kkmsmartvote"

    # Create remote directory if not exists
    ssh -i $SSHKey $SSHHost "mkdir -p $remotePath"

    # Upload backend
    Write-Info "Uploading backend code..."
    scp -r -i $SSHKey "$localPath\backend" "${SSHHost}:${remotePath}\"

    # Upload frontend
    Write-Info "Uploading frontend code..."
    scp -r -i $SSHKey "$localPath\frontend" "${SSHHost}:${remotePath}\"

    # Upload public
    Write-Info "Uploading public folder..."
    scp -r -i $SSHKey "$localPath\public" "${SSHHost}:${remotePath}\"

    # Set permissions
    Write-Info "Setting permissions..."
    ssh -i $SSHKey $SSHHost "chmod -R 755 $remotePath/backend $remotePath/public $remotePath/frontend && chown -R www-data:www-data $remotePath/backend/storage"

    if ($LASTEXITCODE -eq 0) {
        Write-Info "✓ Application code uploaded"
        return $true
    } else {
        Write-Error "Upload failed"
        return $false
    }
}

# ============================================================================
# STEP 4: Setup Environment File
# ============================================================================
function Step-4-SetupEnv {
    Write-Info "STEP 4: Creating backend .env file on server..."

    $envContent = @"
APP_NAME="Koperasi Karya Mandiri"
APP_ENV=production
APP_DEBUG=false
APP_KEY=change_this_app_key
APP_URL=https://kkmsmartvote.web.id

LOG_CHANNEL=single
LOG_LEVEL=info

DB_CONNECTION=pgsql
DB_HOST=portfolio_postgres
DB_PORT=5432
DB_DATABASE=koperasi_vote
DB_USERNAME=koperasi
DB_PASSWORD=change_this_koperasi_db_password

JWT_SECRET=change_this_jwt_secret
JWT_TTL=60
JWT_REFRESH_TTL=20160

CACHE_DRIVER=file
QUEUE_CONNECTION=sync
SESSION_DRIVER=file

CORS_ALLOWED_ORIGINS=https://kkmsmartvote.web.id

MAIL_MAILER=smtp
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_USERNAME=a729fa001@smtp-brevo.com
MAIL_PASSWORD=REMOVED_FOR_SECURITY
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=nandang.dhe@gmail.com
MAIL_FROM_NAME="KKM Voting Admin"
"@

    # Create .env on server
    $envPath = "/opt/stack/web/kkmsmartvote/backend/.env"
    $command = "cat > $envPath << 'ENVEOF'" + "`n" + $envContent + "`n" + "ENVEOF"

    ssh -i $SSHKey $SSHHost $command

    if ($LASTEXITCODE -eq 0) {
        Write-Info "✓ .env file created"
        return $true
    } else {
        Write-Error ".env creation failed"
        return $false
    }
}

# ============================================================================
# STEP 5: Run Laravel Migrations
# ============================================================================
function Step-5-RunMigrations {
    Write-Info "STEP 5: Running Laravel migrations..."

    $command = "cd /opt/stack/web/kkmsmartvote/backend && " + `
        "php artisan config:cache && " + `
        "php artisan migrate --force"

    ssh -i $SSHKey $SSHHost $command

    if ($LASTEXITCODE -eq 0) {
        Write-Info "✓ Migrations completed"
        return $true
    } else {
        Write-Error "Migrations failed"
        return $false
    }
}

# ============================================================================
# Main Execution
# ============================================================================
function Main {
    Write-Info "=========================================="
    Write-Info "KKMSmartVote Deployment Script"
    Write-Info "=========================================="
    Write-Info ""

    $success = $true

    if ($Step -eq "all" -or $Step -eq "1") {
        if (-not (Step-1-CreateDatabase)) { $success = $false; return }
    }

    if ($Step -eq "all" -or $Step -eq "2") {
        if (-not (Step-2-VerifyConnection)) { $success = $false; return }
    }

    if ($Step -eq "all" -or $Step -eq "3") {
        if (-not (Step-3-UploadCode)) { $success = $false; return }
    }

    if ($Step -eq "all" -or $Step -eq "4") {
        if (-not (Step-4-SetupEnv)) { $success = $false; return }
    }

    if ($Step -eq "all" -or $Step -eq "5") {
        if (-not (Step-5-RunMigrations)) { $success = $false; return }
    }

    if ($success) {
        Write-Info ""
        Write-Info "✓ Deployment completed successfully!"
    } else {
        Write-Error "Deployment failed"
        exit 1
    }
}

Main
