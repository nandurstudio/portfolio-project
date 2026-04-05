# DEPRECATED: Create junctions for Laragon and update hosts (legacy helper)
# Modern workspace uses a real 'undangan/' git repository — junctions are usually not required.
$ErrorActionPreference = 'Stop'

$workspace = 'E:\Portfolio Nandur\folioflix-personal-portfolio-html-template-2023-11-27-05-37-14-utc\folioflix'
# If 'undangan' is a git repo, skip (legacy junction not necessary)
if (Test-Path (Join-Path $workspace 'undangan\.git')) {
    Write-Output "Detected 'undangan' is a git repository — junction creation is deprecated. Exiting."; exit 0
}

$folio_src = Join-Path $workspace 'web'
$undangan_src = Join-Path $workspace 'undangan'
$target_root = 'F:\laragon\www'
$folio_target = Join-Path $target_root 'folioflix'
$undangan_target = Join-Path $target_root 'undangan'
$hostsPath = 'C:\Windows\System32\drivers\etc\hosts'
$log = Join-Path $workspace 'undangan-junction-log.txt'

function Log { param($msg) $time = Get-Date -Format 'u'; "$time`t$msg" | Out-File -FilePath $log -Append -Encoding UTF8; Write-Output $msg }

Log "Script started (requires Administrator)"

# Validate source folders
if (-not (Test-Path $folio_src)) { Log "ERROR: folio source not found: $folio_src"; exit 1 }
if (-not (Test-Path $undangan_src)) { Log "ERROR: undangan source not found: $undangan_src"; exit 1 }

# Ensure target root exists
if (-not (Test-Path $target_root)) { New-Item -Path $target_root -ItemType Directory -Force | Out-Null; Log "Created target root: $target_root" } else { Log "Target root exists: $target_root" }

function Ensure-Junction($target, $source) {
    if (Test-Path $target) {
        $item = Get-Item $target -ErrorAction SilentlyContinue
        if ($item -and $item.Attributes.ToString().Contains('ReparsePoint')) {
            Log "Exists (junction): $target -> $($item.Target)"
        } else {
            Log "Exists (not junction): $target (left as-is)"
        }
    } else {
        New-Item -Path $target -ItemType Junction -Value $source -Force | Out-Null
        Log "Created junction: $target -> $source"
    }
}

Ensure-Junction -target $folio_target -source $folio_src
Ensure-Junction -target $undangan_target -source $undangan_src

# Update hosts entries if missing
$entries = @('127.0.0.1 folioflix.test','127.0.0.1 undangan.test')
foreach ($e in $entries) {
    if (-not (Select-String -Path $hostsPath -Pattern ([regex]::Escape($e)) -Quiet)) {
        Add-Content -Path $hostsPath -Value $e
        Log "Appended hosts entry: $e"
    } else {
        Log "Hosts entry exists: $e"
    }
}

# Restart Laragon if present
$laragonExe = 'C:\laragon\laragon.exe'
if (Test-Path $laragonExe) {
    $proc = Get-Process -Name laragon -ErrorAction SilentlyContinue
    if ($proc) { Stop-Process -Name laragon -Force -ErrorAction SilentlyContinue; Start-Sleep -Milliseconds 500 }
    Start-Process $laragonExe
    Log "Laragon restarted (if installed)."
} else {
    Log "Laragon not found at $laragonExe — please restart Laragon manually."
}

Log "Script completed"
Write-Output "Done (log: $log)"