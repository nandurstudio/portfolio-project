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

function Stop-ProcessOnPort {
    param(
        [Parameter(Mandatory = $true)]
        [int]$Port,
        [Parameter(Mandatory = $true)]
        [string]$Label
    )

    $pids = @()

    try {
        $pids = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop |
            Select-Object -ExpandProperty OwningProcess -Unique
    } catch {
        $pids = @()
    }

    foreach ($pid in $pids) {
        if ($pid -le 4) { continue }
        try {
            Stop-Process -Id $pid -Force -ErrorAction Stop
            Write-Host "🛑 Stopped existing $Label process on port $Port (PID: $pid)" -ForegroundColor Yellow
        } catch {
            Write-Host "⚠️  Failed to stop PID $pid on port $Port" -ForegroundColor Yellow
        }
    }
}

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
        $excludeDirs = @(
            "vendor",
            "node_modules",
            ".git",
            "storage",
            "bootstrap/cache",
            "backend/public/uploads"
        )

        # Do not use /PURGE here because runtime-generated uploads (candidate photos)
        # live only on Laragon and would be deleted on every sync.
        robocopy "$portfolioDir" "$laraconPath" /E /XD $excludeDirs /NFL /NDL /NC /NS /NP 2>&1 | Out-Null
        Write-Host "✅ Sync complete!" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Sync completed with warnings" -ForegroundColor Yellow
    }
    Write-Host ""
} else {
    Write-Host "⏭️  Skipping sync (-NoSync)" -ForegroundColor DarkGray
    Write-Host ""
}

# Ensure runtime upload folders always exist on Laragon.
$runtimeUploadDirs = @(
    "backend/public/uploads",
    "backend/public/uploads/candidates"
)

foreach ($relativeDir in $runtimeUploadDirs) {
    $absoluteDir = Join-Path $laraconPath $relativeDir
    if (-not (Test-Path $absoluteDir)) {
        New-Item -ItemType Directory -Path $absoluteDir -Force | Out-Null
        Write-Host "📁 Created runtime directory: $relativeDir" -ForegroundColor DarkGray
    }
}

Write-Host ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🧹 PRE-FLIGHT: Cleanup Previous Run
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write-Host "🧹 PRE-FLIGHT: Cleaning old jobs & ports" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────" -ForegroundColor DarkGray

Get-Job -Name "FrontendServer", "BackendServer" -ErrorAction SilentlyContinue |
    Stop-Job -ErrorAction SilentlyContinue
Get-Job -Name "FrontendServer", "BackendServer" -ErrorAction SilentlyContinue |
    Remove-Job -Force -ErrorAction SilentlyContinue

Stop-ProcessOnPort -Port 5173 -Label "frontend"
Stop-ProcessOnPort -Port 8000 -Label "backend"

Write-Host "✅ Pre-flight cleanup complete" -ForegroundColor Green
Write-Host ""

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

$backendJob = Start-Job -Name "BackendServer" -ScriptBlock {
    param($exe, $path)
    Set-Location $path
    & $exe artisan serve --port=8000
} -ArgumentList $laraconPhpExe, $laraconBackend

Write-Host "✅ Backend started (Job: $($backendJob.Id))" -ForegroundColor Green
Write-Host ""

# Wait for backend to initialize
Start-Sleep -Seconds 3

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🎨 STEP 5: Start Frontend Dev Server (same PowerShell session)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write-Host "🎨 STEP 5: Starting Frontend dev server" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""

$frontendJob = Start-Job -Name "FrontendServer" -ScriptBlock {
    param($path)
    Set-Location $path
    npm run dev
} -ArgumentList $laraconFrontend

Write-Host ""
Write-Host "✅ Frontend started (Job: $($frontendJob.Id))" -ForegroundColor Green
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  🎉 BOTH SERVERS RUNNING!                                     ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Access Points:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "   API:      http://localhost:8000/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Test Voting Flow:" -ForegroundColor Yellow
Write-Host "   1. Open http://localhost:5173 in browser" -ForegroundColor Yellow
Write-Host "   2. Enter email: test@example.com" -ForegroundColor Yellow
Write-Host "   3. Enter OTP: 000000" -ForegroundColor Yellow
Write-Host "   4. Enter NIK: 1001000001" -ForegroundColor Yellow
Write-Host "   5. Select candidate → Vote!" -ForegroundColor Yellow
Write-Host ""
Write-Host "⏸️  To stop both servers, close this window or press Ctrl+C" -ForegroundColor DarkGray
Write-Host ""

# Keep script running
Write-Host "Waiting for servers to run..." -ForegroundColor DarkGray
try {
    Get-Job -Name "BackendServer" -ErrorAction SilentlyContinue | Wait-Job -ErrorAction SilentlyContinue
} finally {
    Get-Job -Name "FrontendServer", "BackendServer" -ErrorAction SilentlyContinue | Stop-Job -ErrorAction SilentlyContinue
    Get-Job -Name "FrontendServer", "BackendServer" -ErrorAction SilentlyContinue | Remove-Job -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "🛑 Dev servers stopped" -ForegroundColor Yellow
