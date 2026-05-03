#!/usr/bin/env bash
# tools/ship-sync.sh — fast-forward dev to include main's tip merge commit
# after each `git push origin main` during a ship pipeline.
#
# Idempotent: no-op when dev is already in sync with main.
#
# Why this exists (closes Lesson #10221 candidate from v1.49.594):
#   `git merge --no-ff dev` on main creates a merge commit that lives only
#   on main. Across N ships, main accumulates 2N merge commits dev doesn't
#   have, causing "dev is N commits behind main" drift in the GitHub UI.
#   The fast-forward is cheap (no rebase, no conflicts possible since dev's
#   tip is one parent of the merge commit) and zeroes the drift.
#   v1.49.591 + v1.49.592 + v1.49.593 each accumulated 2 such commits;
#   by v1.49.593 close dev was 6 commits behind main.
#
# Insertion points in the ship pipeline:
#   AFTER each of the two `git push origin main` calls — once after the
#   initial ship merge (post-tag), once after the post-ship RH refresh
#   merge.
#
# Usage:
#   bash tools/ship-sync.sh
#   npm run ship-sync
#
# Exit codes:
#   0  dev synced (or already in sync)
#   1  not in a git repo, or dev..main delta cannot be computed
#   2  fast-forward refused (dev has divergent commits) or push failed
#
# Authored 2026-05-02 in the post-v1.49.596 CLAUDE.md compaction phase
# (Tier 2 of the four-tier promotion plan).

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "[ship-sync] FATAL: not in a git repo" >&2
  exit 1
}
cd "$REPO_ROOT"

ORIGINAL_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
trap 'git checkout "$ORIGINAL_BRANCH" --quiet 2>/dev/null || true' EXIT

# Compare local dev vs local main (the operator just pushed main, so local
# main is authoritative; no fetch needed for the FF target).
if ! BEHIND="$(git rev-list --count dev..main 2>/dev/null)"; then
  echo "[ship-sync] FATAL: cannot compute dev..main delta — missing branches?" >&2
  exit 1
fi

if [ "$BEHIND" = "0" ]; then
  echo "[ship-sync] dev already in sync with main (0 commits behind)"
  exit 0
fi

echo "[ship-sync] dev is $BEHIND commit(s) behind main; fast-forwarding + pushing"

git checkout dev --quiet
if ! git merge --ff-only main; then
  echo "[ship-sync] FATAL: fast-forward refused — dev has commits not on main" >&2
  echo "[ship-sync]   Investigate: git log main..dev" >&2
  exit 2
fi

if ! git push origin dev; then
  echo "[ship-sync] FATAL: git push origin dev failed" >&2
  exit 2
fi

echo "[ship-sync] dev synced with main and pushed to origin"
