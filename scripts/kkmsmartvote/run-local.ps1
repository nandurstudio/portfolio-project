# Run KKM Smart Vote (koperasi-vote) locally on Laragon
#
# 🔴 CRITICAL WORKFLOW:
#    1. EDIT in: e:\Portfolio Nandur\folioflix\web\kkmsmartvote\ (source)
#    2. SYNC to: f:\laragon\www\koperasi-vote\ (testing)
#    3. TEST using this script
#    4. COMMIT changes from portfolio repo (git repo)
#
#    ❌ NEVER edit in Laragon directly - sync will overwrite!
#
# Usage: .\scripts\run-local.ps1              (test with migrations)
#        .\scripts\run-local.ps1 -Sync        (auto-sync files first)
#        .\scripts\run-local.ps1 -Fresh       (reset database)
#        .\scripts\run-local.ps1 -Mode backend (backend only)

param(
    [switch]$Sync = $false,
    [switch]$Fresh = $false,
    [string]$Mode = "all"  # all, backend, frontend
)

$BackendPath = "f:\laragon\www\koperasi-vote\backend"
$FrontendPath = "f:\laragon\www\koperasi-vote\frontend"
$PortfolioPath = "e:\Portfolio Nandur\folioflix-personal-portfolio-html-template-2023-11-27-05-37-14-utc\folioflix"

Write-Host @"
╔════════════════════════════════════════════════════╗
║   KKM Smart Vote - Local Testing on Laragon       ║
║   $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')                                 ║
╚════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# Step 1: Sync if requested
if ($Sync) {
    Write-Host "📦 Syncing files from portfolio repo..." -ForegroundColor Yellow
    & "$PortfolioPath\scripts\sync-to-laragon.ps1"
    Write-Host "✅ Sync complete!" -ForegroundColor Green
    Write-Host ""
}

# Step 2: Check Laragon directories
Write-Host "🔍 Checking directories..." -ForegroundColor Cyan
if (!(Test-Path $BackendPath)) {
    Write-Host "❌ Backend path not found: $BackendPath" -ForegroundColor Red
    exit 1
}
if (!(Test-Path $FrontendPath)) {
    Write-Host "❌ Frontend path not found: $FrontendPath" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Directories OK" -ForegroundColor Green
Write-Host ""

# Step 3: Check Laragon services
Write-Host "🚀 Checking Laragon services..." -ForegroundColor Cyan
$MySQL = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue
if (!$MySQL) {
    Write-Host "⚠️  MySQL not running! Start Laragon first (Click 'Start All')" -ForegroundColor Yellow
    Write-Host "📖 After starting Laragon, run this script again" -ForegroundColor Gray
    exit 1
}
Write-Host "✅ MySQL running" -ForegroundColor Green
Write-Host ""

# Step 4: Run migrations (if fresh)
if ($Fresh) {
    Write-Host "🗄️  Running database migrations (fresh)..." -ForegroundColor Yellow
    Push-Location $BackendPath
    php artisan migrate:fresh --seed
    Pop-Location
    Write-Host "✅ Migrations complete!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "🗄️  Running pending migrations..." -ForegroundColor Yellow
    Push-Location $BackendPath
    php artisan migrate
    Pop-Location
    Write-Host "✅ Migrations complete!" -ForegroundColor Green
    Write-Host ""
}

# Step 5: Start services based on mode
Write-Host "🎬 Starting services..." -ForegroundColor Cyan
Write-Host ""

if ($Mode -eq "all" -or $Mode -eq "backend") {
    Write-Host "📡 Starting Backend API (PHP Artisan Server)..." -ForegroundColor Green
    Write-Host "   Location: $BackendPath" -ForegroundColor Gray
    Write-Host "   URL: http://koperasi-vote.local/api/test" -ForegroundColor Cyan
    Write-Host "   Cmd: php artisan serve" -ForegroundColor Gray
    Write-Host ""

    Push-Location $BackendPath

    # Start backend in new terminal
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$BackendPath'; php artisan serve" `
        -WindowStyle Normal

    Pop-Location

    Start-Sleep -Seconds 2
}

if ($Mode -eq "all" -or $Mode -eq "frontend") {
    Write-Host "🎨 Starting Frontend Dev Server (Vite)..." -ForegroundColor Green
    Write-Host "   Location: $FrontendPath" -ForegroundColor Gray
    Write-Host "   URL: http://localhost:5173" -ForegroundColor Cyan
    Write-Host "   Cmd: npm run dev" -ForegroundColor Gray
    Write-Host ""

    Push-Location $FrontendPath

    # Start frontend in new terminal
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$FrontendPath'; npm run dev" `
        -WindowStyle Normal

    Pop-Location

    Start-Sleep -Seconds 2
}

# Step 6: Summary
Write-Host @"
╔════════════════════════════════════════════════════╗
║              ✅ ALL SERVICES STARTED               ║
╚════════════════════════════════════════════════════╝

📱 TESTING URLS:
  Backend API:     http://koperasi-vote.local/api/test
  Frontend UI:     http://localhost:5173
  Database Admin:  Via Laragon > Database > MySQL Admin

📝 DEFAULT CREDENTIALS:
  Admin:    username=admin,    password=koperasi_admin_password
  Panitia:  username=panitia1, password=koperasi_panitia_password

🧪 QUICK TESTS:
  1. GET http://koperasi-vote.local/api/test (should return JSON)
  2. GET http://koperasi-vote.local/api/candidates (should list candidates)
  3. Visit http://localhost:5173 in browser

📖 NEXT STEPS:
  1. Test API endpoints using curl or Postman
  2. Test frontend UI in browser
  3. Check database via Laragon MySQL Admin
  4. View logs: storage/logs/laravel.log

🔄 SYNC CHANGES:
  .\scripts\sync-to-laragon.ps1 (sync files)
  .\scripts\sync-to-laragon.ps1 -Watch (auto-sync on changes)

💡 TIPS:
  • Use -Sync flag to auto-sync before running
  • Use -Fresh to reset database with migrations
  • Use -Mode backend or -Mode frontend to run only one service

CTRL+C in each terminal to stop services.
"@ -ForegroundColor Green

Write-Host "Waiting for services to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 3

Write-Host @"
✨ Services running in separate terminals!
   Check the terminals for any errors.
   Press CTRL+C in each terminal to stop.

💬 Need help? Check docs/LARAGON-LOCAL-TESTING.md
"@ -ForegroundColor Cyan
