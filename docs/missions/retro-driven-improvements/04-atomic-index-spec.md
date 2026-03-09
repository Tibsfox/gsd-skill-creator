# Atomic Master Index Updates — Component Specification

**Date:** 2026-03-09
**Milestone:** Retro-Driven Improvements
**Model Assignment:** Sonnet
**Dependencies:** Soft dependency on matrix filtering (01) — should be written after the final table structure is known
**Target Files:** New `www/PNW/index-check.sh`, modified `.claude/hooks/build-check.sh`

---

## Problem

In v1.49.25, AVI and MAM shipped without updating the cross-reference matrix, geographic coverage, or reading order tables in the PNW master index. This was caught manually in v1.49.26 and fixed retroactively. The v1.49.26 retrospective lesson: "Master index should be updated atomically with each new project."

The root cause is that nothing enforces the invariant: every project directory under `www/PNW/` must appear in all three index tables.

## Current State

The PNW master index (`www/PNW/index.html`) has three data tables that must stay synchronized:

1. **Cross-Reference Matrix** — 15 topic rows, 1 column per project
2. **Geographic Coverage Table** — organizing principles per project
3. **Reading Order Table** — suggested navigation sequence

When a new project is added (e.g., `www/PNW/BPS/`), all three tables must be updated. Currently this is manual and easy to forget.

## Solution

### 1. Verification Script: `index-check.sh`

A standalone bash script that verifies the PNW master index is complete:

```bash
#!/usr/bin/env bash
# Verify PNW master index includes all projects
set -euo pipefail

INDEX="www/PNW/index.html"
PNW_DIR="www/PNW"
ERRORS=0

# Discover all project directories (exclude files, hidden dirs)
PROJECTS=$(find "$PNW_DIR" -mindepth 1 -maxdepth 1 -type d \
  ! -name '.*' -printf '%f\n' | sort)

for proj in $PROJECTS; do
  PROJ_UPPER=$(echo "$proj" | tr '[:lower:]' '[:upper:]')

  # Check cross-reference matrix (th header)
  if ! grep -q ">${PROJ_UPPER}<" "$INDEX" 2>/dev/null; then
    echo "MISSING: $PROJ_UPPER not in cross-reference matrix"
    ERRORS=$((ERRORS + 1))
  fi

  # Check geographic coverage table
  if ! grep -qi "geographic.*coverage" "$INDEX" 2>/dev/null || \
     ! sed -n '/geographic.*coverage/I,/<\/table>/p' "$INDEX" | grep -q "$PROJ_UPPER"; then
    echo "MISSING: $PROJ_UPPER not in geographic coverage table"
    ERRORS=$((ERRORS + 1))
  fi

  # Check reading order table
  if ! grep -qi "reading.*order" "$INDEX" 2>/dev/null || \
     ! sed -n '/reading.*order/I,/<\/table>/p' "$INDEX" | grep -q "$PROJ_UPPER"; then
    echo "MISSING: $PROJ_UPPER not in reading order table"
    ERRORS=$((ERRORS + 1))
  fi
done

if [ $ERRORS -gt 0 ]; then
  echo ""
  echo "FAIL: $ERRORS missing entries in PNW master index"
  echo "Projects found: $(echo $PROJECTS | tr '\n' ' ')"
  exit 1
else
  echo "OK: All $(echo "$PROJECTS" | wc -l) projects present in all index tables"
  exit 0
fi
```

### 2. Hook Integration

Add an optional check to `build-check.sh` that runs `index-check.sh` when committing changes to `www/PNW/`:

```bash
# In build-check.sh, after the tsc check:
if [[ "$CMD" =~ ^git[[:space:]]+commit ]]; then
  STAGED_PNW=$(git diff --cached --name-only -- 'www/PNW/' 2>/dev/null | head -1)
  if [ -n "$STAGED_PNW" ] && [ -f "www/PNW/index-check.sh" ]; then
    CHECK_OUTPUT=$(bash www/PNW/index-check.sh 2>&1)
    CHECK_EXIT=$?
    if [ $CHECK_EXIT -ne 0 ]; then
      echo "WARNING: PNW index may be incomplete:"
      echo "$CHECK_OUTPUT"
      echo "(This is a warning, not a block. Update index.html if needed.)"
      # Note: exits 0, not 2 — warning only, does not block
    fi
  fi
fi
```

**Design decision:** This is a **warning**, not a blocker. The index check runs only when PNW files are staged, and prints a warning if projects are missing. It does not block the commit because:
- Mid-wave commits may legitimately have incomplete index updates
- The index is typically updated in the final wave
- Blocking would slow down the proven wave-based workflow

### 3. Standalone Usage

The script can also be run manually as a pre-release check:

```bash
bash www/PNW/index-check.sh
# OK: All 9 projects present in all index tables
```

This fits into the release notes checklist (already in MEMORY.md).

## Acceptance Criteria

1. `index-check.sh` correctly detects all project directories under `www/PNW/`
2. Reports missing entries per table (cross-reference, geographic, reading order)
3. Returns exit 0 when all projects are present, exit 1 when any are missing
4. Hook integration prints warning (not block) when PNW files are committed with incomplete index
5. Script works with current 9 projects and will work with 10+ without modification
6. No false positives on non-project directories (e.g., hidden dirs, files)

## Technical Notes

- The script uses simple grep against the HTML — not a proper HTML parser. This is intentional: the index structure is controlled and predictable, and a full parser would add unnecessary complexity.
- Project detection uses directory listing, not a hardcoded list. New projects are automatically detected.
- The script should be committed as executable (`chmod +x`).

---

*Component spec for Retro-Driven Improvements milestone. Self-contained — no external references needed for implementation.*
