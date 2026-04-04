# Sync koperasi-vote dari portfolio repo ke Laragon
# Usage: .\scripts\sync-to-laragon.ps1

param(
    [switch]$Full = $false,
    [switch]$Watch = $false
)

$Source = "e:\Portfolio Nandur\folioflix-personal-portfolio-html-template-2023-11-27-05-37-14-utc\folioflix\web\kkmsmartvote"
$Dest = "f:\laragon\www\koperasi-vote"

if (!(Test-Path $Source)) {
    Write-Host "❌ Source not found: $Source" -ForegroundColor Red
    exit 1
}

Write-Host "🔄 Syncing $Source -> $Dest" -ForegroundColor Cyan

# Exclude patterns
$Excludes = @("/E", "/XD", "node_modules", "vendor", ".git", ".env", "*.lock", "dist", "build")

# Full sync (dengan dependencies)
if ($Full) {
    Write-Host "📦 Full sync (with dependencies)..." -ForegroundColor Yellow
    robocopy $Source $Dest /E /MT:16
} else {
    # Regular sync (exclude node_modules & vendor)
    robocopy $Source $Dest /E /XD node_modules vendor .git /XF *.lock .env | Select-Object -Last 10
}

Write-Host "✅ Sync complete!" -ForegroundColor Green

# Optional: Watch mode
if ($Watch) {
    Write-Host "👀 Watching for changes..." -ForegroundColor Blue
    $Watcher = New-Object System.IO.FileSystemWatcher
    $Watcher.Path = $Source
    $Watcher.Filter = "*.*"
    $Watcher.IncludeSubdirectories = $true
    $Watcher.NotifyFilter = [System.IO.NotifyFilters]::LastWrite
    
    $Action = {
        if ($Event.SourceEventArgs.FullPath -notmatch '(node_modules|vendor|.git|\.lock|\.env)') {
            Write-Host "📝 Changed: $($Event.SourceEventArgs.Name)" -ForegroundColor Gray
            $RelPath = $Event.SourceEventArgs.FullPath.Replace($Source, '')
            $DestPath = Join-Path $Dest $RelPath
            
            if ((Get-Item $Event.SourceEventArgs.FullPath).PSIsContainer) {
                New-Item -ItemType Directory -Path $DestPath -Force | Out-Null
            } else {
                Copy-Item $Event.SourceEventArgs.FullPath $DestPath -Force
                Write-Host "✅ Synced: $RelPath" -ForegroundColor Green
            }
        }
    }
    
    Register-ObjectEvent $Watcher "Changed" -Action $Action | Out-Null
    Write-Host "🛑 Press Ctrl+C to stop watching" -ForegroundColor Yellow
    
    while ($true) {
        Start-Sleep -Seconds 1
    }
}
