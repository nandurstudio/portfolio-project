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

echo "== End of check =="
exit 0