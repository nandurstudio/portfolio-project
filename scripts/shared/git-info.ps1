<#
PowerShell helper: git-info.ps1
Usage: .\scripts\git-info.ps1 -Repo undangan
Prints branch, remote, status, recent commits and unpushed commits in a PowerShell-safe way.
#>
param(
  [string]$Repo = 'undangan'
)
if (-not (Test-Path $Repo)) {
  Write-Error "Repository folder '$Repo' not found."
  exit 2
}
Write-Host "== Git info for '$Repo' ==" -ForegroundColor Cyan
# current branch
$branch = git -C $Repo rev-parse --abbrev-ref HEAD 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "(cannot determine branch)" -ForegroundColor Yellow } else { Write-Host "Branch: $branch" }
# remote
$remote = git -C $Repo remote -v 2>$null
if ($remote) { Write-Host "Remote:"; $remote | ForEach-Object { Write-Host "  $_" } } else { Write-Host "(no remote)" -ForegroundColor Yellow }
# status
Write-Host "`nStatus:" -ForegroundColor Cyan
git -C $Repo status -sb
# fetch remote (safe)
Write-Host "`nFetching from remote..." -ForegroundColor Cyan
git -C $Repo fetch --all --prune --quiet
if ($LASTEXITCODE -ne 0) { Write-Host "(fetch failed)" -ForegroundColor Yellow }
# branches
Write-Host "`nBranches (local + remote):" -ForegroundColor Cyan
git -C $Repo branch -avv
# recent commits
Write-Host "`nRecent commits:`n" -ForegroundColor Cyan
git -C $Repo log --oneline -n 6
# unpushed commits
Write-Host "`nLocal commits not on remote:`n" -ForegroundColor Cyan
try {
  git -C $Repo rev-parse --abbrev-ref --symbolic-full-name '@{u}' > $null 2>&1
  if ($LASTEXITCODE -eq 0) {
    git -C $Repo log --oneline '@{u}'..HEAD | Select-Object -First 50
  } else {
    Write-Host "No upstream set for branch '$branch'." -ForegroundColor Yellow
  }
} catch {
  Write-Host "Unable to determine unpushed commits." -ForegroundColor Yellow
}
Write-Host "`n== End of git info ==" -ForegroundColor Cyan
