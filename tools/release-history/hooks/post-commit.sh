#!/usr/bin/env bash
# Release History — post-commit auto-refresh hook.
#
# To install:
#   ln -s ../../tools/release-history/hooks/post-commit.sh .git/hooks/post-commit
#   chmod +x tools/release-history/hooks/post-commit.sh
#
# Only runs the pipeline if the just-committed changes touch docs/release-notes/
# or docs/RELEASE-HISTORY.md. Otherwise it's a no-op — cheap to leave installed.
#
# Runs in background so it never blocks interactive git work. Output goes to
# .local/release-history-refresh.log.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
LOG_DIR="$REPO_ROOT/.local"
LOG_FILE="$LOG_DIR/release-history-refresh.log"
mkdir -p "$LOG_DIR"

# Check whether the last commit touched release notes
CHANGED=$(git diff-tree --no-commit-id --name-only -r HEAD)
if ! echo "$CHANGED" | grep -qE "^docs/release-notes/|^docs/RELEASE-HISTORY\.md$"; then
  exit 0
fi

# Load env (database creds)
if [ -f "$REPO_ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$REPO_ROOT/.env"
  set +a
fi

# Run pipeline in background so the commit returns immediately
(
  cd "$REPO_ROOT"
  {
    echo "=== $(date -Iseconds) — post-commit refresh ==="
    echo "Triggering commit touched:"
    echo "$CHANGED" | grep -E "^docs/release-notes/|^docs/RELEASE-HISTORY\.md$"
    echo
    node tools/release-history/refresh.mjs --fast --quiet
    echo "=== end ==="
  } >> "$LOG_FILE" 2>&1
) </dev/null >/dev/null 2>&1 &

echo "[release-history] refresh queued in background — tail $LOG_FILE"
exit 0
