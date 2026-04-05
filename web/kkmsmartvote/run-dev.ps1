# KKM Smart Vote - Sync & Dev
# Usage: .\run-dev.ps1  or  .\run-dev.ps1 -Dev

param([switch]$Dev, [switch]$NoInstall, [switch]$LaunchBrowser)

$ScriptDir = $PSScriptRoot
$FrontendPath = Join-Path $ScriptDir "frontend"
$LaraconPath = "f:\laragon\www\koperasi-vote"

Write-Host "`n📱 KKM Vote Sync`n" -ForegroundColor Cyan

# Install if needed
if (-not $NoInstall) {
    if (Test-Path $FrontendPath) {
        $nm = Join-Path $FrontendPath "node_modules"
        if (-not (Test-Path $nm)) {
            Write-Host "Installing npm..." -ForegroundColor Yellow
            Push-Location $FrontendPath
            npm install 2>&1 | Out-Null
            Pop-Location
        }
    }
}

# Sync
Write-Host "Syncing..." -ForegroundColor Yellow
robocopy "$ScriptDir" "$LaraconPath" /E /PURGE /NFL /NDL /NC /NS /NP 2>&1 | Out-Null
Write-Host "Done!`n" -ForegroundColor Green

# Dev server
if ($Dev) {
    Write-Host "Starting dev on http://localhost:5173`n" -ForegroundColor Cyan
    Push-Location $FrontendPath
    npm run dev
    Pop-Location
}
