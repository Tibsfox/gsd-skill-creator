# tsc --noEmit Pre-Commit Hook — Component Specification

**Date:** 2026-03-09
**Milestone:** Retro-Driven Improvements
**Model Assignment:** Sonnet
**Dependencies:** None
**Target File:** `.claude/hooks/build-check.sh`

---

## Problem

The `tsc --noEmit` type check currently runs only on `git push` (via the `build-check.sh` PreToolUse hook). In v1.49.27, 285 tests passed but two `z.record(z.unknown())` Zod v4 incompatibilities slipped through to the push stage because they were committed without type checking. The retrospective explicitly states: "future waves should run `tsc --noEmit` as part of pre-commit, not just pre-push."

## Current State

**File:** `.claude/hooks/build-check.sh`

```bash
#!/usr/bin/env bash
# Pre-push build check — runs tsc --noEmit before allowing git push
set -euo pipefail

TOOL_INPUT="$TOOL_INPUT"
CMD=$(echo "$TOOL_INPUT" | jq -r '.command // empty' 2>/dev/null)

if [[ "$CMD" =~ ^git[[:space:]]+push ]]; then
  TSC_OUTPUT=$(npx tsc --noEmit 2>&1)
  TSC_EXIT=$?
  if [ $TSC_EXIT -ne 0 ]; then
    echo "BLOCK: TypeScript errors found. Fix before pushing."
    echo "$TSC_OUTPUT" | head -10
    TOTAL=$(echo "$TSC_OUTPUT" | grep -c "error TS" || true)
    echo "($TOTAL total errors)"
    exit 2
  fi
fi
```

This only triggers on `git push`. Commits pass through unchecked.

## Solution

Extend the pattern match to also trigger on `git commit`:

```bash
if [[ "$CMD" =~ ^git[[:space:]]+(push|commit) ]]; then
```

With one critical guard: **skip the type check if no `.ts` or `.tsx` files are staged.** This prevents blocking docs-only, markdown, YAML, or Python commits with an irrelevant TypeScript check.

### Modified Hook Logic

```bash
#!/usr/bin/env bash
# Pre-push/pre-commit build check — runs tsc --noEmit before git push or commit
set -euo pipefail

TOOL_INPUT="$TOOL_INPUT"
CMD=$(echo "$TOOL_INPUT" | jq -r '.command // empty' 2>/dev/null)

if [[ "$CMD" =~ ^git[[:space:]]+(push|commit) ]]; then
  # For commits: only check if TypeScript files are staged
  if [[ "$CMD" =~ ^git[[:space:]]+commit ]]; then
    STAGED_TS=$(git diff --cached --name-only --diff-filter=ACMR -- '*.ts' '*.tsx' 2>/dev/null | head -1)
    if [ -z "$STAGED_TS" ]; then
      exit 0  # No TS files staged, skip check
    fi
  fi

  TSC_OUTPUT=$(npx tsc --noEmit 2>&1)
  TSC_EXIT=$?
  if [ $TSC_EXIT -ne 0 ]; then
    echo "BLOCK: TypeScript errors found. Fix before $(echo "$CMD" | awk '{print $2}')."
    echo "$TSC_OUTPUT" | head -10
    TOTAL=$(echo "$TSC_OUTPUT" | grep -c "error TS" || true)
    echo "($TOTAL total errors)"
    exit 2
  fi
fi
```

### Key Design Decisions

1. **Staged-file guard for commits.** The `git diff --cached` check ensures non-TS commits aren't slowed down. Push still checks unconditionally (the entire codebase must be clean before pushing).
2. **Same error display.** First 10 errors + total count. Consistent with existing UX.
3. **Same exit code.** `exit 2` blocks the tool use. Unchanged behavior.
4. **No new files.** Single edit to existing hook.

## Acceptance Criteria

1. `git commit` with staged `.ts` files triggers `tsc --noEmit` and blocks on errors
2. `git commit` with only non-TS files (`.md`, `.yaml`, `.py`, `.sh`) skips the type check
3. `git push` continues to trigger `tsc --noEmit` unconditionally (existing behavior preserved)
4. Error output format matches existing push-time format
5. Hook exits cleanly (exit 0) when no TS files are staged

## Risk Assessment

**Low risk.** This is a 10-line edit to an existing hook. The staged-file guard ensures no false positives on non-TS commits. The push check remains unchanged as a safety net.

**Performance:** `tsc --noEmit` takes ~3-5 seconds on this codebase. Acceptable for commit-time gating. The `git diff --cached` check adds negligible overhead.

---

*Component spec for Retro-Driven Improvements milestone. Self-contained — no external references needed for implementation.*
