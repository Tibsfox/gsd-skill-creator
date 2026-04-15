#!/bin/bash
# worktree-cleanup.sh — periodic cleanup of stale git worktrees.
#
# Removes worktrees >24h old that have NO uncommitted changes.
# Preserves worktrees with uncommitted changes regardless of age.
# Uses `git worktree remove --force`, never `rm -rf`.
#
# Not wired to any hook. Run manually or via cron.

set -eu

WORKTREE_DIR="${WORKTREE_DIR:-.claude/worktrees}"
MAX_AGE_HOURS="${MAX_AGE_HOURS:-24}"

if [ ! -d "$WORKTREE_DIR" ]; then
  exit 0
fi

for wt in "$WORKTREE_DIR"/*/; do
  [ -d "$wt" ] || continue

  # Preserve any worktree with uncommitted changes.
  if git -C "$wt" status --short 2>/dev/null | grep -q '^'; then
    echo "WARN: $wt has uncommitted changes — skipping"
    continue
  fi

  # Age-check: only remove if >MAX_AGE_HOURS old.
  if find "$wt" -maxdepth 0 -mmin +$((MAX_AGE_HOURS * 60)) 2>/dev/null | grep -q .; then
    echo "Cleaning: $wt"
    git worktree remove "$wt" --force 2>/dev/null || true
  fi
done
