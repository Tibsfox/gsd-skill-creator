# Upstream Sync Engine — Component Specification

**Milestone:** NASA Mission Series
**Wave:** 2 | **Track:** B
**Model Assignment:** Sonnet
**Estimated Tokens:** ~15K
**Dependencies:** Component #1 (Branch Infrastructure), Component #4 (Release Cadence Engine)
**Produces:** `scripts/nasa/nasa-sync-main.sh`, merge strategy documentation, conflict resolution guide

---

## Objective

Build the engine that synchronizes the nasa branch with main after every release. Active development on main is ongoing — the nasa branch must stay current without losing its own work. Done means: after each `nasa-v1.X` release, `scripts/nasa/nasa-sync-main.sh` merges main cleanly or documents conflicts with resolution steps.

## Context

The gsd-skill-creator main branch receives active development throughout the NASA series. The nasa branch must periodically absorb these changes. The sync happens after each release (not before, to avoid mid-mission instability). Merge conflicts are expected and must be resolved and documented — they are not failures.

The sync engine respects GSD's staging discipline: main changes are merged into nasa, not the reverse. The nasa branch's accumulated knowledge merges back to main only after the catalog is complete (or at defined integration checkpoints).

## Technical Specification

### Sync Script

```bash
#!/bin/bash
# scripts/nasa/nasa-sync-main.sh
# Syncs nasa branch with latest main after a release
# Usage: scripts/nasa/nasa-sync-main.sh

set -euo pipefail

BRANCH=$(git rev-parse --abbrev-ref HEAD)
[ "$BRANCH" = "nasa" ] || { echo "ERROR: Not on nasa branch"; exit 1; }

echo "=== Syncing nasa branch with main ==="

# Fetch latest main
git fetch origin main

# Check for conflicts before merging
MERGE_BASE=$(git merge-base HEAD origin/main)
DIFF_FILES=$(git diff --name-only "$MERGE_BASE" origin/main)
echo "Files changed on main since last sync:"
echo "$DIFF_FILES"

# Attempt merge
if git merge origin/main --no-edit; then
  echo "=== Sync complete: clean merge ==="
  echo "clean" > .planning/nasa/last-sync-status.txt
else
  echo "=== Sync has conflicts — resolve manually ==="
  git diff --name-only --diff-filter=U > .planning/nasa/sync-conflicts.txt
  echo "conflicts" > .planning/nasa/last-sync-status.txt
  echo "Conflicting files:"
  cat .planning/nasa/sync-conflicts.txt
  echo ""
  echo "Resolve conflicts, then:"
  echo "  git add -A"
  echo "  git commit -m 'nasa: resolve sync conflicts with main'"
fi
```

### Merge Strategy

- **Default:** `git merge origin/main --no-edit` (fast-forward if possible, merge commit otherwise)
- **Conflict resolution priority:** nasa branch content takes precedence for files in `docs/nasa/`, `skills/nasa/`, `chipsets/nasa/`. Main branch content takes precedence for framework files (`src/`, `package.json`, etc.)
- **Documentation:** Every sync records status (clean/conflicts) in `.planning/nasa/last-sync-status.txt`. Conflicts documented in next release's retrospective.

### Behavioral Requirements

- Sync executes only on nasa branch (script validates)
- Sync runs after release tag, never during pipeline execution
- Clean merges proceed automatically
- Conflicted merges halt for manual resolution (never auto-resolve)
- Every sync outcome documented (clean or conflict count)
- Conflict resolution becomes a retrospective lesson if it reveals architectural tension

## Implementation Steps

1. Write `scripts/nasa/nasa-sync-main.sh` with full merge and conflict detection
2. Write merge strategy documentation (which files get which priority)
3. Write conflict resolution guide (step-by-step for common conflict patterns)
4. Create sync status tracking (`.planning/nasa/last-sync-status.txt`)
5. Test: create divergent commits on main and nasa; run sync; verify behavior

## Test Cases

| Test ID | Input | Expected Output | Pass Condition |
|---------|-------|-----------------|----------------|
| SE-01 | No changes on main since last sync | Clean merge (fast-forward) | Status: clean |
| SE-02 | Non-conflicting changes on main | Clean merge (merge commit) | Status: clean; all changes present |
| SE-03 | Conflicting changes in types/ | Merge halted; conflicts listed | Status: conflicts; conflict file list present |
| SE-04 | Run from main branch | Script fails | Exit code 1; error message |
| SE-05 | Post-conflict resolution | Commit with resolution message | Clean state; conflicts.txt cleared |

## Verification Gate

- [ ] Sync script merges cleanly when no conflicts exist
- [ ] Sync script correctly identifies and lists conflicts
- [ ] Sync status tracked in `.planning/nasa/last-sync-status.txt`
- [ ] Conflict resolution guide covers common patterns (shared types changes, dependency updates, config changes)
- [ ] Script only runs on nasa branch

## Safety Boundaries

No domain-specific safety boundaries. (Sync is a mechanical operation; content safety is handled by Safety Warden.)
