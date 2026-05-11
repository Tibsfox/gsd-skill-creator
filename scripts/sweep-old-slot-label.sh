#!/usr/bin/env bash
# scripts/sweep-old-slot-label.sh (v1.49.636 C8 / T14 gating)
#
# Closes the v1.49.650 slot-correction cosmetic residue. Sweeps
# "v1.49.650" → "v1.49.636" and "v1-49-650" → "v1-49-636" across
# code/test/build/release-notes paths, honoring an allowlist for
# legitimate audit-trail surfaces.
#
# Uses Lesson #10186 safe pattern (grep -l ... | while IFS= read -r f)
# to handle paths with whitespace + special characters; verifies zero
# residuals after sweep via final grep.
#
# Usage:
#   bash scripts/sweep-old-slot-label.sh         # apply sweep
#   bash scripts/sweep-old-slot-label.sh --dry   # preview only
#
# Exit codes:
#   0  sweep applied (or dry-run completed) AND zero residuals remain
#      outside the allowlist
#   1  residuals remain after sweep (manual review required)

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "[sweep] FATAL: not in a git repo" >&2
  exit 1
}
cd "$REPO_ROOT"

DRY_RUN=0
if [ "${1:-}" = "--dry" ] || [ "${1:-}" = "--dry-run" ]; then
  DRY_RUN=1
fi

OLD_DOT="v1.49.650"
NEW_DOT="v1.49.636"
OLD_DASH="v1-49-650"
NEW_DASH="v1-49-636"

# Allowlist: paths whose v1.49.650 references are legitimate audit
# trail (predecessor handoffs, run-time event logs, release-notes for
# v1.49.635 and v1.49.636 itself, the v1.49.636 mission package, the
# sweep tool's own constants, predecessor-milestone meta-tests).
ALLOWLIST=(
  ".planning/HANDOFF-v1.49.634-COMPLETE.md"
  ".planning/HANDOFF-v1.49.635-COMPLETE.md"
  ".planning/sessions/current.tool-trace.jsonl"
  ".planning/release-cache/_lessons-report.json"
  ".planning/patterns/sessions.jsonl"
  "docs/release-notes/v1.49.635/"
  "docs/release-notes/v1.49.636/"
  ".planning/missions/v1-49-636-housekeeping-cluster-3/"
  # The sweep tool's own constants must not be swept (would break the tool).
  "scripts/sweep-old-slot-label.sh"
  # check-version-sequence.mjs documents the slot-pinning incident in
  # design comments — substrate citation.
  "scripts/check-version-sequence.mjs"
  # Predecessor meta-tests reference v1.49.650 as part of their own
  # audit trail (where the slot-correction incident surfaced).
  "tests/integration/v1-49-634-meta-test.test.ts"
  # Release-history tooling references v1.49.650 as a known version it
  # has processed; sweeping would corrupt historical lookup keys.
  "tools/release-history/score-completeness.mjs"
  "tools/release-history/delete-orphan-version.mjs"
  "tools/release-history/__tests__/score-completeness-c5.test.mjs"
  # state-md-normalizer test fixtures reference v1.49.650 as part of
  # the v1.49.635 audit trail it normalizes.
  "tools/__tests__/state-md-normalizer.test.mjs"
)

# Path-globs we scan. Limited to source/test/tools/scripts/docs trees;
# excludes node_modules + dist + .git automatically.
SCAN_ROOTS=(
  "src"
  "desktop"
  "src-tauri"
  "scripts"
  "tests"
  "tools"
)

# Build a single -name filter so the allowlist comparison is path-prefix.
is_allowed() {
  local path="$1"
  for allow in "${ALLOWLIST[@]}"; do
    case "$path" in
      "$allow"*) return 0 ;;
    esac
  done
  return 1
}

echo "[sweep] scanning ${SCAN_ROOTS[*]} for v1.49.650 / v1-49-650 references..."

# Stage 1: enumerate candidates via grep -l. Suppress allowlisted paths.
# Lesson #10186: read with IFS= -r to handle whitespace in paths.
CANDIDATES=()
while IFS= read -r f; do
  if is_allowed "$f"; then
    continue
  fi
  CANDIDATES+=("$f")
done < <(
  grep -rln -e "$OLD_DOT" -e "$OLD_DASH" "${SCAN_ROOTS[@]}" 2>/dev/null \
    --include='*.ts' --include='*.tsx' --include='*.rs' --include='*.mjs' \
    --include='*.sh' --include='*.toml' --include='*.md' --include='*.json' \
    || true
)

echo "[sweep] ${#CANDIDATES[@]} candidate file(s) outside allowlist"

if [ "${#CANDIDATES[@]}" -eq 0 ]; then
  echo "[sweep] nothing to do"
  exit 0
fi

# Stage 2: apply the sweep (or report under --dry).
if [ "$DRY_RUN" = "1" ]; then
  echo "[sweep] DRY-RUN — would sweep the following files:"
  for f in "${CANDIDATES[@]}"; do
    echo "  $f"
  done
else
  for f in "${CANDIDATES[@]}"; do
    sed -i -e "s|$OLD_DOT|$NEW_DOT|g" -e "s|$OLD_DASH|$NEW_DASH|g" "$f"
    echo "[sweep] applied $f"
  done
fi

# Stage 3: verification — final grep should return empty outside allowlist.
echo "[sweep] verifying zero residuals outside allowlist..."
RESIDUAL=$(
  grep -rln -e "$OLD_DOT" -e "$OLD_DASH" "${SCAN_ROOTS[@]}" 2>/dev/null \
    --include='*.ts' --include='*.tsx' --include='*.rs' --include='*.mjs' \
    --include='*.sh' --include='*.toml' --include='*.md' --include='*.json' \
    || true
)

NON_ALLOWED=""
while IFS= read -r f; do
  [ -z "$f" ] && continue
  if is_allowed "$f"; then
    continue
  fi
  NON_ALLOWED="${NON_ALLOWED}${f}"$'\n'
done <<< "$RESIDUAL"

if [ -n "$NON_ALLOWED" ]; then
  echo "[sweep] STILL HAS RESIDUALS outside allowlist:" >&2
  echo "$NON_ALLOWED" >&2
  exit 1
fi

echo "[sweep] verified: zero residuals outside allowlist"
exit 0
