# KKM Smart Vote - Sync, Backend & Frontend Dev Server (All-in-One)
# Syncs portfolio to Laragon, then starts both backend (8000) and frontend (5173)
#
# 🚀 USAGE:
#    .\run-and-sync.ps1                 # Sync + dev servers
#    .\run-and-sync.ps1 -NoInstall      # Skip npm install
#    .\run-and-sync.ps1 -NoSync         # Skip sync (local dev only)
#
# 🌐 URLS:
#    Frontend: http://localhost:5173
#    Backend:  http://localhost:8000
#    API:      http://localhost:8000/api

param([switch]$NoInstall, [switch]$NoSync)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📁 PATHS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

$portfolioDir = $PSScriptRoot
$laraconPath = "F:\laragon\www\koperasi-vote"
$laraconFrontend = Join-Path $laraconPath "frontend"
$laraconBackend = Join-Path $laraconPath "backend"
$laraconPhpExe = "F:\laragon\bin\php\php-8.5.4-nts-Win32-vs17-x64\php.exe"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🎨 DISPLAY
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write-Host ""
Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🗳️  KKM Smart Vote - Sync & Dev Server       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📤 STEP 1: SYNC Portfolio → Laragon
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if (-not $NoSync) {
    Write-Host "📤 STEP 1: Syncing portfolio → Laragon" -ForegroundColor Yellow
    Write-Host "────────────────────────────────────────" -ForegroundColor DarkGray

    Write-Host "Source: $portfolioDir" -ForegroundColor DarkGray
    Write-Host "Dest:   $laraconPath" -ForegroundColor DarkGray
    Write-Host ""

    try {
        robocopy "$portfolioDir" "$laraconPath" /E /PURGE /XD vendor node_modules .git storage bootstrap/cache /NFL /NDL /NC /NS /NP 2>&1 | Out-Null
        Write-Host "✅ Sync complete!" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Sync completed with warnings" -ForegroundColor Yellow
    }
    Write-Host ""
} else {
    Write-Host "⏭️  Skipping sync (-NoSync)" -ForegroundColor DarkGray
    Write-Host ""
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📦 STEP 2: Install Dependencies
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write-Host "📦 STEP 2: Checking dependencies" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────" -ForegroundColor DarkGray

if (-not $NoInstall) {
    # Install backend PHP dependencies
    if (-not (Test-Path "$laraconBackend\vendor\autoload.php")) {
        Write-Host "Installing Composer packages (backend)..." -ForegroundColor DarkGray
        Push-Location $laraconBackend
        composer install --ignore-platform-reqs 2>&1 | Out-Null
    } else {
        Write-Host "✓ Composer dependencies already installed" -ForegroundColor DarkGray
    }

    # Install frontend npm dependencies
    if (-not (Test-Path "$laraconFrontend\node_modules")) {
        Write-Host "Installing npm packages (frontend)..." -ForegroundColor DarkGray
        Push-Location $laraconFrontend
        npm install 2>&1 | Out-Null
        Pop-Location
        Write-Host "✅ npm dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "✓ npm dependencies already installed" -ForegroundColor DarkGray
    }
} else {
    Write-Host "⏭️  Skipping dependencies install (-NoInstall)" -ForegroundColor DarkGray
}
Write-Host ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ⚙️ STEP 3: Clear Laravel Config Cache
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write-Host "⚙️  STEP 3: Clearing Laravel cache" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────" -ForegroundColor DarkGray

Push-Location $laraconBackend
& $laraconPhpExe artisan config:clear 2>&1 | Out-Null
& $laraconPhpExe artisan cache:clear 2>&1 | Out-Null
Pop-Location

Write-Host "✅ Cache cleared" -ForegroundColor Green
Write-Host ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# �️  STEP 3b: Run Database Migrations
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write-Host "🗄️  STEP 3b: Running database migrations" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────" -ForegroundColor DarkGray

Push-Location $laraconBackend
$migrationOutput = & $laraconPhpExe artisan migrate --force 2>&1
Pop-Location

if ($?) {
    Write-Host "✅ Migrations completed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Migrations output:" -ForegroundColor Yellow
    Write-Host "$migrationOutput" -ForegroundColor DarkGray
}
Write-Host ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# �🚀 STEP 4: Start Backend Server
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write-Host "🚀 STEP 4: Starting Laravel backend" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "API:     http://localhost:8000/api" -ForegroundColor Cyan
Write-Host ""

$backendJob = Start-Job -ScriptBlock {
    param($exe, $path)
    Set-Location $path
    & $exe artisan serve --port=8000
} -ArgumentList $laraconPhpExe, $laraconBackend

Write-Host "✅ Backend started (Job: $($backendJob.Id))" -ForegroundColor Green
Write-Host ""

# Wait for backend to initialize
Start-Sleep -Seconds 3

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🎨 STEP 5: Start Frontend Dev Server
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write-Host "🎨 STEP 5: Starting Frontend dev server" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor DarkGray
Write-Host ""

Push-Location $laraconFrontend

try {
    npm run dev
} finally {
    # Cleanup on exit
    Write-Host ""
    Write-Host "🛑 Shutting down servers..." -ForegroundColor Yellow
    Stop-Job -Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $backendJob -ErrorAction SilentlyContinue
    Write-Host "✅ Done!" -ForegroundColor Green
    Pop-Location
}
