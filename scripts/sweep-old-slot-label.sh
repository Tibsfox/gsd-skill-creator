#!/usr/bin/env bash
# scripts/sweep-old-slot-label.sh (v1.49.636 C8 / T14 gating — Option B rebuild)
#
# Line-level cosmetic sweep of v1.49.650 → v1.49.636. The original
# file-level allowlist over-swept substrate citations inside otherwise-
# cosmetic files (lab-director-2 FAIL verdict on 8f11cf40a). This
# rebuild uses LINE-LEVEL PATTERN MATCHING — lines that match the
# substrate-citation regex set are preserved verbatim regardless of
# which file they live in.
#
# Substrate-citation patterns (PRESERVE — no sweep):
#   - phase-(g) Option 2          v1.49.650 phase-decomposition era
#   - Renamed from <X> at v1.49.650   explicit rename lineage
#   - at v1.49.650 pre-tag-gate   historical pre-tag-gate observation
#   - v1.49.650 C<digit>           C-component lineage
#   - legacy format from before v1.49.650   pre-existing-substrate era
#   - generalized by C3 at v1.49.650        precedent reference
#   - Bumped <N>× → <N>× at v1.49.650 ship-time   historical bump
#   - Pattern follows v1.49.650 C3   precedent reference
#   - Closes the v1.49.650 phase    deferral-closure verb
#   - flipped this from the v1.49.650 phase   provenance source
#   - v1.49.650 encrypted keystore   user-facing CLI message
#   - v1.49.650 migration CLI        test assertion message
#   - Extended at v1.49.650          architectural-introduction
#
# Cosmetic patterns (SWEEP — apply v1.49.650 → v1.49.636):
#   - File-header titles ("v1.49.650 unified keystore" as current-state)
#   - Section markers ("// v1.49.650 — Unified Keystore API")
#   - Path-marker comments ("pre-v1.49.650 / v1.49.650+ Path 2")
#   - Other refs not matched by the preserve patterns above
#
# Uses Lesson #10186 safe pattern (grep -l | while IFS= read -r f) for
# file iteration; per-line awk-style filter inside each file for the
# line-level preserve check.
#
# Usage:
#   bash scripts/sweep-old-slot-label.sh         # apply sweep
#   bash scripts/sweep-old-slot-label.sh --dry   # preview only
#   bash scripts/sweep-old-slot-label.sh --diff  # diff what would be swept
#
# Exit codes:
#   0  sweep applied (or dry-run/diff completed) AND zero candidates
#      remain outside the preserve-pattern set
#   1  candidates remain after sweep (manual review required)

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "[sweep] FATAL: not in a git repo" >&2
  exit 1
}
cd "$REPO_ROOT"

MODE="apply"
case "${1:-}" in
  --dry|--dry-run) MODE="dry" ;;
  --diff) MODE="diff" ;;
  "") MODE="apply" ;;
  *) echo "[sweep] unknown arg: $1" >&2; exit 1 ;;
esac

OLD_DOT="v1.49.650"
NEW_DOT="v1.49.636"
OLD_DASH="v1-49-650"
NEW_DASH="v1-49-636"

# File-level allowlist: paths whose ALL v1.49.650 references are
# audit-trail by file purpose (predecessor handoffs, runtime event
# logs, release-notes for v1.49.635 + v1.49.636, the v1.49.636
# mission package, the sweep tool itself, predecessor meta-tests,
# release-history tooling that references v1.49.650 as a processed-
# version lookup key).
ALLOWLIST_FILES=(
  ".planning/HANDOFF-v1.49.634-COMPLETE.md"
  ".planning/HANDOFF-v1.49.635-COMPLETE.md"
  ".planning/sessions/current.tool-trace.jsonl"
  ".planning/release-cache/_lessons-report.json"
  ".planning/patterns/sessions.jsonl"
  "docs/release-notes/v1.49.635/"
  "docs/release-notes/v1.49.636/"
  ".planning/missions/v1-49-636-housekeeping-cluster-3/"
  "scripts/sweep-old-slot-label.sh"
  "scripts/check-version-sequence.mjs"
  "tests/integration/v1-49-634-meta-test.test.ts"
  "tools/release-history/score-completeness.mjs"
  "tools/release-history/delete-orphan-version.mjs"
  "tools/release-history/__tests__/score-completeness-c5.test.mjs"
  "tools/__tests__/state-md-normalizer.test.mjs"
  # The sweep tool's own test file contains v1.49.650 in fixture strings
  # by design — fixtures exercise the sweep behavior. Sweeping the
  # fixtures would break the tests.
  "scripts/__tests__/sweep-old-slot-label.test.mjs"
)

# Line-level substrate-citation preserve patterns. Each pattern is a
# POSIX ERE; if any pattern matches a line, that line is NOT swept.
# The patterns capture the historical/architectural lineage uses of
# v1.49.650 (past-tense facts, provenance, era markers) that must
# remain v1.49.650 to preserve audit trail.
SUBSTRATE_PATTERNS=(
  'phase-\([a-h]\) [Oo]ption[ -]?[12]'
  'phase-\([a-h]\) stub'
  '[Rr]enamed (from )?.*at v1\.49\.650'
  'at v1\.49\.650 pre-tag-gate'
  'at v1\.49\.650$'
  'v1\.49\.650 C[0-9]'
  'v1\.49\.650 phase-\([a-h]\)'
  'legacy format from before v1\.49\.650'
  'generalized by C[0-9] at v1\.49\.650'
  'Bumped .* at v1\.49\.650 ship-time'
  'Pattern follows v1\.49\.650'
  '[Cc]loses (the )?v1\.49\.650'
  'flipped (this )?from the v1\.49\.650'
  'v1\.49\.650 encrypted keystore'
  'v1\.49\.650 migration CLI'
  'Extended at v1\.49\.650'
  'v1\.49\.650 — '
  'v1\.49\.650 ([Pp]ath [0-9]|introduced|added|landed|shipped|tagged)'
  'pre-v1\.49\.650'
  'v1\.49\.650\+ [Pp]ath'
  '\(stub at v1\.49\.650\)'
  'v1\.49\.650:'
  '\(v1\.49\.650 phase'
  '→ v1\.49\.650'
  'renamed v1\.49\.650 from'
  # File-header titles for files authored AT v1.49.650 substrate-phase
  # (passphrase-flow + migration-banner state machines were shipped at
  # v1.49.650 phase-(g); their file-header attribution is provenance).
  'for the v1\.49\.650 keystore'
  'Tests for the v1\.49\.650 keystore'
)

# Build the combined preserve regex (OR all substrate patterns).
SUBSTRATE_RE="$(printf '%s|' "${SUBSTRATE_PATTERNS[@]}")"
SUBSTRATE_RE="${SUBSTRATE_RE%|}"

is_file_allowed() {
  local path="$1"
  for allow in "${ALLOWLIST_FILES[@]}"; do
    case "$path" in
      "$allow"*) return 0 ;;
    esac
  done
  return 1
}

# Returns 0 (true) if the line matches a substrate-citation pattern
# and should be PRESERVED. 1 (false) otherwise.
is_substrate_line() {
  local line="$1"
  echo "$line" | grep -qE "$SUBSTRATE_RE"
}

SCAN_ROOTS=(
  "src"
  "desktop"
  "src-tauri"
  "scripts"
  "tests"
  "tools"
)

echo "[sweep] scanning ${SCAN_ROOTS[*]} for v1.49.650 / v1-49-650 references..."

CANDIDATES=()
while IFS= read -r f; do
  if is_file_allowed "$f"; then
    continue
  fi
  CANDIDATES+=("$f")
done < <(
  grep -rln -e "$OLD_DOT" -e "$OLD_DASH" "${SCAN_ROOTS[@]}" 2>/dev/null \
    --include='*.ts' --include='*.tsx' --include='*.rs' --include='*.mjs' \
    --include='*.sh' --include='*.toml' --include='*.md' --include='*.json' \
    || true
)

echo "[sweep] ${#CANDIDATES[@]} file(s) contain v1.49.650 references outside file-allowlist"

TOTAL_SWEPT_LINES=0
TOTAL_PRESERVED_LINES=0
DIFF_OUTPUT=""

# Per-file line-level processing.
for f in "${CANDIDATES[@]}"; do
  swept_lines=0
  preserved_lines=0
  tmpfile="$(mktemp)"
  while IFS= read -r line || [ -n "$line" ]; do
    if echo "$line" | grep -qE "$OLD_DOT|$OLD_DASH"; then
      if is_substrate_line "$line"; then
        preserved_lines=$((preserved_lines + 1))
        printf '%s\n' "$line" >> "$tmpfile"
      else
        # Escape the dots in OLD_DOT for sed BRE (where . matches any
        # char). Without escaping, "v1.49.650" would match "v1-49-650"
        # too and corrupt dash-form replacements.
        OLD_DOT_ESC='v1\.49\.650'
        OLD_DASH_ESC='v1-49-650'
        swept=$(echo "$line" | sed -e "s|$OLD_DOT_ESC|$NEW_DOT|g" -e "s|$OLD_DASH_ESC|$NEW_DASH|g")
        swept_lines=$((swept_lines + 1))
        if [ "$MODE" = "diff" ]; then
          DIFF_OUTPUT="${DIFF_OUTPUT}--- $f"$'\n'"-$line"$'\n'"+$swept"$'\n'
        fi
        printf '%s\n' "$swept" >> "$tmpfile"
      fi
    else
      printf '%s\n' "$line" >> "$tmpfile"
    fi
  done < "$f"

  if [ "$swept_lines" -gt 0 ] || [ "$preserved_lines" -gt 0 ]; then
    echo "[sweep] $f: swept=$swept_lines preserved=$preserved_lines"
  fi

  case "$MODE" in
    apply)
      if [ "$swept_lines" -gt 0 ]; then
        mv "$tmpfile" "$f"
      else
        rm "$tmpfile"
      fi
      ;;
    dry|diff)
      rm "$tmpfile"
      ;;
  esac

  TOTAL_SWEPT_LINES=$((TOTAL_SWEPT_LINES + swept_lines))
  TOTAL_PRESERVED_LINES=$((TOTAL_PRESERVED_LINES + preserved_lines))
done

echo ""
echo "[sweep] mode=$MODE"
echo "[sweep] total lines swept:     $TOTAL_SWEPT_LINES"
echo "[sweep] total lines preserved: $TOTAL_PRESERVED_LINES (substrate-citation)"

if [ "$MODE" = "diff" ] && [ -n "$DIFF_OUTPUT" ]; then
  echo ""
  echo "[sweep] DIFF — lines that WOULD be swept (apply mode would write):"
  echo "$DIFF_OUTPUT"
fi

# Verification step: post-sweep, no NON-substrate v1.49.650 should
# remain. Re-run the grep and check every match line satisfies the
# substrate pattern.
if [ "$MODE" = "apply" ]; then
  echo "[sweep] verifying zero NON-substrate residuals..."
  UNAUTHORIZED=""
  while IFS= read -r matchline || [ -n "$matchline" ]; do
    [ -z "$matchline" ] && continue
    # Format: "<path>:<line-num>:<content>"
    fp="${matchline%%:*}"
    if is_file_allowed "$fp"; then
      continue
    fi
    # Strip the "<path>:<line-num>:" prefix to get content.
    rest="${matchline#*:}"
    content="${rest#*:}"
    if ! is_substrate_line "$content"; then
      UNAUTHORIZED="${UNAUTHORIZED}${matchline}"$'\n'
    fi
  done < <(
    grep -rn -e "$OLD_DOT" -e "$OLD_DASH" "${SCAN_ROOTS[@]}" 2>/dev/null \
      --include='*.ts' --include='*.tsx' --include='*.rs' --include='*.mjs' \
      --include='*.sh' --include='*.toml' --include='*.md' --include='*.json' \
      || true
  )

  if [ -n "$UNAUTHORIZED" ]; then
    echo "[sweep] STILL HAS NON-substrate residuals:" >&2
    echo "$UNAUTHORIZED" >&2
    exit 1
  fi
  echo "[sweep] verified: zero non-substrate residuals"
fi

exit 0
