#!/usr/bin/env bash
# tools/install-git-hooks.sh — installs tracked hooks from tools/git-hooks/ into .git/hooks/
#
# Idempotent. Uses 4-case algorithm:
#   1. Target missing  → install (cp + chmod +x)
#   2. Target identical to source → no-op (preserve mtime; no log message either)
#   3. Target divergent from source → warn-and-skip (preserve operator changes; do NOT overwrite)
#   4. Source missing → fatal (script self-defends — should never happen)
#
# Authored 2026-04-28 in v1.49.585 component C05.
# Run automatically via npm postinstall script entry; also can be run manually.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "[install-git-hooks] FATAL: not in a git repo" >&2
  exit 1
}
cd "$REPO_ROOT"

SOURCE_DIR="tools/git-hooks"
TARGET_DIR=".git/hooks"

if [ ! -d "$SOURCE_DIR" ]; then
  echo "[install-git-hooks] FATAL: source directory $SOURCE_DIR missing" >&2
  exit 2
fi

if [ ! -d "$TARGET_DIR" ]; then
  # .git/hooks should always exist; if not, create it
  mkdir -p "$TARGET_DIR"
fi

INSTALLED=0
SKIPPED_IDENTICAL=0
SKIPPED_DIVERGENT=0

for src in "$SOURCE_DIR"/*; do
  [ -f "$src" ] || continue
  name="$(basename "$src")"
  target="$TARGET_DIR/$name"

  if [ ! -f "$target" ]; then
    # Case 1: missing
    cp "$src" "$target"
    chmod +x "$target"
    echo "[install-git-hooks] installed: $target"
    INSTALLED=$((INSTALLED+1))
    continue
  fi

  if cmp -s "$src" "$target"; then
    # Case 2: identical
    SKIPPED_IDENTICAL=$((SKIPPED_IDENTICAL+1))
    continue
  fi

  # Case 3: divergent
  echo "[install-git-hooks] WARN: $target differs from tracked source $src" >&2
  echo "[install-git-hooks]       Preserving existing target. To re-install, manually delete it." >&2
  SKIPPED_DIVERGENT=$((SKIPPED_DIVERGENT+1))
done

echo "[install-git-hooks] done — $INSTALLED installed, $SKIPPED_IDENTICAL identical (no-op), $SKIPPED_DIVERGENT divergent (skipped)"
