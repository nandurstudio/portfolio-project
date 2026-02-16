#!/usr/bin/env bash
REPO="undangan"
if [ ! -d "$REPO" ]; then
  echo "Folder '$REPO' not found"
  exit 2
fi

echo "== $REPO: git status =="
git -C "$REPO" status -sb

BRANCH=$(git -C "$REPO" rev-parse --abbrev-ref HEAD 2>/dev/null || true)
echo "== Local commits not on remote (branch: ${BRANCH:-unknown}) =="
if git -C "$REPO" rev-parse --abbrev-ref --symbolic-full-name @{u} >/dev/null 2>&1; then
  git -C "$REPO" log --oneline @{u}..HEAD | head -n 50 || true
else
  echo "No upstream set for branch '$BRANCH'"
fi

# Extra checks: warn if vendor/ or .env* are tracked
if git -C "$REPO" ls-files --error-unmatch vendor >/dev/null 2>&1; then
  echo "WARNING: vendor/ is tracked in $REPO — consider removing and adding to .gitignore"
fi
if git -C "$REPO" ls-files | grep -E '^\.env(|\.|$)' >/dev/null 2>&1; then
  echo "WARNING: .env* file is tracked in $REPO — remove sensitive files from git"
fi

echo "== End of check =="
exit 0