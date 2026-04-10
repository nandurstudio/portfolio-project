#!/usr/bin/env pwsh
<#
  KKM Smart Vote - Laragon Testing & Deployment Script
  Purpose: Automate database setup, migrations, seeding, and API testing
  Author: GitHub Copilot
  Date: April 6, 2026
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$Action = "help",

    [Parameter(Mandatory=$false)]
    [string]$BackendPath = ".\backend",

    [Parameter(Mandatory=$false)]
    [string]$Port = "8000"
)

function Show-Help {
    Write-Host @"
╔════════════════════════════════════════════════════════════════════╗
║        KKM Smart Vote - Laragon Testing Script                     ║
╚════════════════════════════════════════════════════════════════════╝

USAGE:
  .\test-kkmsmartvote.ps1 -Action <action> [-BackendPath <path>] [-Port <port>]

ACTIONS:
  setup           - Setup environment & install dependencies
  migrate         - Run fresh migrations
  seed            - Seed database with test data
  serve           - Start Laravel dev server
  test-health     - Test API health endpoint
  test-election   - Test election endpoints
  test-candidates - Test candidate endpoints
  test-voting     - Test voting endpoints (OTP flow)
  test-stats      - Test statistics endpoints
  test-all        - Run all API tests
  clean           - Clean cache and temporary files
  reset           - Fresh start (migrate:fresh --seed)
  help            - Show this help message

EXAMPLES:
  # Full setup
  .\test-kkmsmartvote.ps1 -Action setup
  .\test-kkmsmartvote.ps1 -Action migrate
  .\test-kkmsmartvote.ps1 -Action seed

  # Run testing
  .\test-kkmsmartvote.ps1 -Action test-all

  # Start server
  .\test-kkmsmartvote.ps1 -Action serve -Port 8000

"@
}

function Test-Prerequisites {
    Write-Host "✓ Checking prerequisites..." -ForegroundColor Cyan

    # Check PHP
    $php = php -v 2>&1 | Select-Object -First 1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ PHP: $php" -ForegroundColor Green
    } else {
        Write-Host "  ❌ PHP not found" -ForegroundColor Red
        exit 1
    }

    # Check Composer
    $composer = composer --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Composer: $composer" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Composer not found" -ForegroundColor Red
        exit 1
    }

    # Check Laravel
    if (Test-Path "$BackendPath/artisan") {
        Write-Host "  ✅ Laravel: Found" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Laravel not found at $BackendPath" -ForegroundColor Red
        exit 1
    }
}

function Setup-Environment {
    Write-Host "`n╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║ SETUP: Installing Dependencies & Generating App Key                ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow

    Push-Location $BackendPath

    # Copy .env if not exists
    if (-not (Test-Path ".env")) {
        if (Test-Path ".env.example") {
            Write-Host "📋 Creating .env from .env.example..." -ForegroundColor Cyan
            Copy-Item ".env.example" ".env"
        } else {
            Write-Host "⚠️  No .env.example found, creating minimal .env..." -ForegroundColor Yellow
            @"
APP_NAME="KKM Smart Vote"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:$Port

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=kkmsmartvote
DB_USERNAME=root
DB_PASSWORD=

JWT_SECRET=your_jwt_secret_here
"@ | Out-File ".env" -Encoding UTF8
        }
    }

    # Generate App Key
    Write-Host "🔑 Generating APP_KEY..." -ForegroundColor Cyan
    php artisan key:generate --force

    # Composer install
    Write-Host "📦 Installing Composer dependencies..." -ForegroundColor Cyan
    composer install --no-interaction

    Pop-Location
    Write-Host "✅ Setup completed!" -ForegroundColor Green
}

function Run-Migrations {
    Write-Host "`n╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║ DATABASE: Running Migrations                                       ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow

    Push-Location $BackendPath

    Write-Host "🗄️  Running migrate:fresh..." -ForegroundColor Cyan
    php artisan migrate:fresh --force --no-interaction

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migrations completed!" -ForegroundColor Green
    } else {
        Write-Host "❌ Migration failed!" -ForegroundColor Red
        Pop-Location
        exit 1
    }

    Pop-Location
}

function Seed-Database {
    Write-Host "`n╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║ DATABASE: Seeding Test Data                                        ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow

    Push-Location $BackendPath

    Write-Host "🌱 Seeding database..." -ForegroundColor Cyan
    php artisan db:seed --class=DatabaseSeeder --force --no-interaction

    Write-Host "`n📊 Test Data Created:" -ForegroundColor Green
    Write-Host "  • 2 Sites (SITE_A, SITE_B)" -ForegroundColor Green
    Write-Host "  • 4 Users (super_admin, 2x panitia, saksi_forensik)" -ForegroundColor Green
    Write-Host "  • 1 Election setting" -ForegroundColor Green
    Write-Host "  • 2 Candidates" -ForegroundColor Green
    Write-Host "  • 4 Members (eligible voters)" -ForegroundColor Green

    Pop-Location
}

function Start-Server {
    Write-Host "`n╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║ SERVER: Starting Laravel Development Server                        ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow

    Push-Location $BackendPath

    Write-Host "🚀 Starting server on http://localhost:$Port" -ForegroundColor Cyan
    Write-Host "⏱️  Press Ctrl+C to stop`n" -ForegroundColor Yellow

    php artisan serve --host=localhost --port=$Port

    Pop-Location
}

function Test-Health {
    Write-Host "`n╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║ TEST: API Health Check                                             ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow

    $url = "http://localhost:$Port/api/test"
    Write-Host "GET $url" -ForegroundColor Cyan

    try {
        $response = Invoke-RestMethod -Uri $url -Method GET
        Write-Host "✅ Response:" -ForegroundColor Green
        Write-Host ($response | ConvertTo-Json | Out-String)
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Test-Election {
    Write-Host "`n╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║ TEST: Election Endpoints                                           ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow

    # Get current election
    $url = "http://localhost:$Port/api/election/current"
    Write-Host "`n1️⃣  GET $url" -ForegroundColor Cyan

    try {
        $response = Invoke-RestMethod -Uri $url -Method GET
        Write-Host "✅ Response:" -ForegroundColor Green
        Write-Host ($response | ConvertTo-Json | Out-String)
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Test-Candidates {
    Write-Host "`n╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║ TEST: Candidate Endpoints                                          ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow

    $url = "http://localhost:$Port/api/voting/candidates-with-details"
    Write-Host "`n1️⃣  GET $url" -ForegroundColor Cyan

    try {
        $response = Invoke-RestMethod -Uri $url -Method GET
        Write-Host "✅ Candidates Found: $($response.data.Count)" -ForegroundColor Green
        $response.data | ForEach-Object {
            Write-Host "  - #$($_.order_display) $($_.name) ($($_.position))" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Test-Stats {
    Write-Host "`n╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║ TEST: Statistics Endpoints                                         ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow

    # Voting progress
    $url = "http://localhost:$Port/api/stats/voting-progress"
    Write-Host "`n1️⃣  GET $url" -ForegroundColor Cyan

    try {
        $response = Invoke-RestMethod -Uri $url -Method GET
        Write-Host "✅ Response:" -ForegroundColor Green
        Write-Host ($response.data | ConvertTo-Json | Out-String)
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }

    # Candidate votes
    $url = "http://localhost:$Port/api/stats/candidate-votes"
    Write-Host "`n2️⃣  GET $url" -ForegroundColor Cyan

    try {
        $response = Invoke-RestMethod -Uri $url -Method GET
        Write-Host "✅ Candidates: $($response.data.candidates.Count)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Test-Voting {
    Write-Host "`n╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║ TEST: Voting Flow (OTP + Member Lookup)                            ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow

    # Request OTP
    $url = "http://localhost:$Port/api/voting/request-otp"
    $body = @{email="test@example.com"} | ConvertTo-Json

    Write-Host "`n1️⃣  POST $url" -ForegroundColor Cyan
    Write-Host "Body: $body" -ForegroundColor Gray

    try {
        $response = Invoke-RestMethod -Uri $url -Method POST `
            -Headers @{"Content-Type"="application/json"} `
            -Body $body
        Write-Host "✅ OTP Requested" -ForegroundColor Green
        Write-Host "   Email: $($response.data.masked_email)" -ForegroundColor Green
        Write-Host "   Expires in: $($response.data.expires_in)s" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }

    # Member lookup
    $nik = "190400122"
    $url = "http://localhost:$Port/api/voting/member-lookup/$nik"

    Write-Host "`n2️⃣  GET $url" -ForegroundColor Cyan

    try {
        $response = Invoke-RestMethod -Uri $url -Method GET
        Write-Host "✅ Member Found:" -ForegroundColor Green
        Write-Host "   Name: $($response.data.name)" -ForegroundColor Green
        Write-Host "   Department: $($response.data.department)" -ForegroundColor Green
        Write-Host "   Site: $($response.data.site)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Test-All {
    Test-Health
    Test-Election
    Test-Candidates
    Test-Stats
    Test-Voting
}

function Clean-Cache {
    Write-Host "`n╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║ CLEANUP: Clearing Cache & Temporary Files                          ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow

    Push-Location $BackendPath

    Write-Host "🗑️  Clearing caches..." -ForegroundColor Cyan
    php artisan config:clear
    php artisan route:clear
    php artisan view:clear
    php artisan cache:clear

    Write-Host "✅ Cache cleared!" -ForegroundColor Green

    Pop-Location
}

function Reset-Database {
    Write-Host "`n⚠️  WARNING: This will reset the database!" -ForegroundColor Yellow
    $confirm = Read-Host "Continue? (yes/no)"

    if ($confirm -eq "yes") {
        Run-Migrations
        Seed-Database
        Write-Host "`n✅ Database reset completed!" -ForegroundColor Green
    } else {
        Write-Host "❌ Cancelled." -ForegroundColor Red
    }
}

# Main execution
switch ($Action.ToLower()) {
    "setup" { Test-Prerequisites; Setup-Environment }
    "migrate" { Run-Migrations }
    "seed" { Seed-Database }
    "serve" { Start-Server }
    "test-health" { Test-Health }
    "test-election" { Test-Election }
    "test-candidates" { Test-Candidates }
    "test-stats" { Test-Stats }
    "test-voting" { Test-Voting }
    "test-all" { Test-All }
    "clean" { Clean-Cache }
    "reset" { Reset-Database }
    "help" { Show-Help }
    default { Show-Help }
}
