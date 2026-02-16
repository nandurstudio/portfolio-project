#!/usr/bin/env pwsh
# Check undangan repo: uncommitted changes and unpushed commits
$repo = "undangan"
if (-not (Test-Path $repo)) {
  Write-Error "Folder '$repo' not found in workspace."
  exit 2
}
Write-Output "== $($repo): git status =="
git -C $repo status -sb

$branch = git -C $repo rev-parse --abbrev-ref HEAD 2>$null
if ($LASTEXITCODE -ne 0) { Write-Output "Cannot determine branch"; exit 0 }
Write-Output "== Local commits not on remote (branch: $($branch)) =="
# show commits local-only (requires upstream configured)
try {
  git -C $repo rev-parse --abbrev-ref --symbolic-full-name '@{u}' > $null 2>&1
  if ($LASTEXITCODE -eq 0) {
    git -C $repo log --oneline '@{u}'..HEAD | Select-Object -First 50
  } else {
    Write-Output "No upstream set for branch '$branch'. Cannot determine unpushed commits."
  }
} catch {
  Write-Output "Unable to determine unpushed commits."
}

# Extra checks: warn if sensitive or large files are tracked
$trackedVendor = (git -C $repo ls-files vendor 2>$null).Trim()
if ($trackedVendor) { Write-Warning "vendor/ is tracked in $repo — consider removing from git and add to .gitignore" }
$trackedEnv = git -C $repo ls-files | Select-String -Pattern '^\.env(|\.|$)' -Quiet
if ($trackedEnv) { Write-Warning "One or more .env* files are tracked in $repo — remove sensitive files from git" }

Write-Output "== End of check =="