---
name: gsd-preflight
description: Validates GSD artifacts before running workflows to prevent mid-execution failures. Activates when user mentions 'validate', 'check artifacts', 'preflight', 'GSD health', or before running GSD commands.
---

# GSD Artifact Validator

Pre-flight validation of GSD artifacts (STATE.md, ROADMAP.md, config.json, etc.) to catch malformation and drift before workflows fail mid-execution.

## When to Use

Activate when:
- User is about to run a GSD workflow command
- User asks to "check if GSD is healthy"
- User mentions validation or preflight checks
- User reports GSD workflow failures

## What This Skill Does

Validates `.planning/` artifacts against expected templates and catches:
- Missing required sections
- Out-of-sync state (STATE.md vs ROADMAP.md)
- Malformed YAML frontmatter
- Invalid phase numbering
- Orphaned files
- Incomplete executions (PLAN without SUMMARY)

## Validation Checklist

### 1. Core Artifact Validation

#### PROJECT.md
```yaml
Required Sections:
  - "## What This Is"
  - "## Requirements"
  - "## Constraints"
  - "## Key Decisions"

Checks:
  - [ ] All sections present
  - [ ] Key Decisions table has columns: Decision, Rationale, Outcome
  - [ ] Requirements categorized: Validated, Active, Out of Scope
  - [ ] No empty required sections
```

#### ROADMAP.md
```yaml
Required Sections:
  - "## Phases"
  - Phase entries with Goal, Deliverables, Success Criteria

Checks:
  - [ ] Phase numbers are sequential (1, 2, 3, not 1, 3, 5)
  - [ ] Each phase has Goal, Deliverables, Success Criteria
  - [ ] Phase status indicators present (⏳, ✓, →)
  - [ ] No duplicate phase numbers
  - [ ] Phase directories exist for all phases
```

#### STATE.md
```yaml
Required Sections:
  - "## Project Reference"
  - "## Current Position"
  - "## Shipped Milestones" (optional if v1.0)
  - "## Session Continuity"

Checks:
  - [ ] Current Position phase matches ROADMAP.md status
  - [ ] Progress bar shows reasonable completion %
  - [ ] Last activity date is recent
  - [ ] No contradictions with ROADMAP.md
```

#### config.json
```yaml
Schema:
  {
    "mode": "yolo" | "interactive",
    "model_profile": "quality" | "balanced" | "budget",
    "depth": "quick" | "standard" | "thorough",
    "research": boolean,
    "commit_docs": boolean
  }

Checks:
  - [ ] Valid JSON syntax
  - [ ] All enum values are valid
  - [ ] No extra/unknown fields
  - [ ] Reasonable defaults if fields missing
```

### 2. Cross-Artifact Consistency

#### STATE.md ↔ ROADMAP.md Sync
```yaml
Checks:
  - [ ] STATE.md "Current Position" phase exists in ROADMAP.md
  - [ ] Phases marked complete in STATE match ROADMAP status
  - [ ] STATE.md progress % aligns with ROADMAP completion
  - [ ] STATE.md milestone list matches ROADMAP history
```

#### Phase Directories ↔ ROADMAP.md
```yaml
Checks:
  - [ ] Every ROADMAP phase has a directory: .planning/phases/NN-name/
  - [ ] No orphaned phase directories (not in ROADMAP)
  - [ ] Directory names match ROADMAP phase names
  - [ ] Phase number padding is consistent (01, 02, not 1, 2)
```

#### Plans ↔ Summaries
```yaml
For each completed phase:
  Checks:
    - [ ] Every NN-NN-PLAN.md has matching NN-NN-SUMMARY.md
    - [ ] Plans marked complete in STATE have summaries
    - [ ] No incomplete execution (PLAN exists, SUMMARY missing)
```

### 3. File Structure Validation

#### Required Structure
```
.planning/
├── PROJECT.md          ✓ Required
├── ROADMAP.md          ✓ Required (unless pre-v1.0)
├── STATE.md            ✓ Required
├── config.json         ✓ Required
├── REQUIREMENTS.md     ⚠ Required for active milestones
│
├── phases/
│   └── NN-name/
│       ├── NN-CONTEXT.md      ⚠ Optional (discuss-phase)
│       ├── NN-RESEARCH.md     ⚠ Optional (research-phase)
│       ├── NN-NN-PLAN.md      ✓ Required when phase planned
│       └── NN-NN-SUMMARY.md   ✓ Required when plan complete
│
└── milestones/
    └── vX.Y-ROADMAP.md   ⚠ Present when milestones archived
```

#### Orphan Detection
```yaml
Orphaned files to flag:
  - CONTEXT.md for non-existent phase
  - RESEARCH.md for non-existent phase
  - PLAN.md with wrong phase number
  - SUMMARY.md without matching PLAN
  - Phase directories not in ROADMAP
```

### 4. Git Integration Checks

#### Commit History Validation
```yaml
Checks:
  - [ ] .planning/ directory is tracked by git
  - [ ] Recent commits exist for completed plans
  - [ ] Commit messages reference plan numbers
  - [ ] No uncommitted changes in STATE.md (indicates interrupted work)
```

## Severity Levels

Categorize issues by severity:

| Level | Definition | Action Required |
|-------|------------|-----------------|
| **BLOCKER** | Will cause workflow failure | Must fix before running GSD command |
| **WARNING** | May cause issues or confusion | Should fix, but not critical |
| **INFO** | Informational, not a problem | No action needed, just FYI |

### BLOCKER Examples
- STATE.md missing "Current Position" section
- ROADMAP.md has duplicate phase numbers
- config.json invalid JSON syntax
- Phase marked complete but missing SUMMARY files
- Current phase in STATE doesn't exist in ROADMAP

### WARNING Examples
- STATE.md phase number doesn't match ROADMAP status
- Orphaned CONTEXT.md file
- Progress bar % seems off
- Old timestamp in STATE.md (>7 days)
- Phase directory name doesn't match ROADMAP exactly

### INFO Examples
- .planning/ directory size
- Number of phases/plans
- Last milestone completion date
- Config settings summary

## Validation Report Format

```markdown
# GSD Preflight Check Results

**Status:** PASS | FAIL
**Checked:** YYYY-MM-DD HH:MM
**Project:** [project name from PROJECT.md]

---

## Summary

- ✓ X checks passed
- ⚠ Y warnings
- ✗ Z blockers

**Overall Assessment:** [HEALTHY | NEEDS ATTENTION | BROKEN]

---

## Blockers (Must Fix)

### ✗ STATE.md phase mismatch
**Issue:** STATE.md says "Phase: 3 of 5" but ROADMAP.md shows Phase 2 incomplete

**Impact:** Planning and execution workflows will fail

**Fix:**
```bash
# Run progress to sync STATE.md
/gsd:progress
```

---

## Warnings (Should Fix)

### ⚠ Orphaned CONTEXT.md
**Issue:** File `.planning/phases/04-api/04-CONTEXT.md` exists but Phase 4 not in ROADMAP.md

**Impact:** May cause confusion during phase navigation

**Fix:**
```bash
# Remove orphaned file
rm .planning/phases/04-api/04-CONTEXT.md
```

---

## Info (FYI)

- Project has 35 phases across 6 milestones
- Last milestone: v1.5 (completed 2026-02-07)
- Current phase: 35 of 35 (all complete)
- .planning/ size: 2.3 MB

---

## Suggested Next Steps

[Based on current state, suggest what to do next]

**If healthy:**
- Ready for /gsd:new-milestone to start next version

**If needs attention:**
- Fix warnings before starting new work
- Run /gsd:progress to update STATE.md

**If broken:**
- Fix blockers before running any GSD workflows
- May need manual STATE.md editing
```

## Common Issues & Fixes

### Issue: STATE.md out of sync with ROADMAP.md

**Symptoms:**
- STATE.md "Current Position" references non-existent phase
- Progress % doesn't match completed phases

**Diagnosis:**
```bash
# Compare STATE.md Current Position with ROADMAP.md status
grep "Phase:" .planning/STATE.md
grep "→" .planning/ROADMAP.md  # Current phase marker
```

**Fix:**
```bash
# Let GSD sync automatically
/gsd:progress
```

---

### Issue: Missing SUMMARY.md for completed plan

**Symptoms:**
- `.planning/phases/NN-name/NN-NN-PLAN.md` exists
- No matching `NN-NN-SUMMARY.md`
- Plan marked complete in STATE.md

**Diagnosis:**
```bash
# Find plans without summaries
for plan in .planning/phases/*/*-PLAN.md; do
  summary="${plan/PLAN/SUMMARY}"
  [ ! -f "$summary" ] && echo "Missing: $summary"
done
```

**Fix:**
Either the plan wasn't completed (should remove from STATE.md) or the summary wasn't written (bug).

```bash
# Option 1: Mark as incomplete in STATE.md
# Edit STATE.md and remove from completed plans

# Option 2: Execute the plan properly
/gsd:execute-plan <phase>-<plan>
```

---

### Issue: Duplicate phase numbers in ROADMAP.md

**Symptoms:**
- Two phases with same number (e.g., two "Phase 3")

**Diagnosis:**
```bash
# Extract phase numbers
grep "^### Phase [0-9]" .planning/ROADMAP.md | sort | uniq -d
```

**Fix:**
Manually edit ROADMAP.md to renumber phases sequentially.

---

### Issue: Invalid config.json

**Symptoms:**
- GSD workflows fail with JSON parse errors

**Diagnosis:**
```bash
# Validate JSON syntax
node -e "require('./.planning/config.json')"
```

**Fix:**
```bash
# Common fix: trailing comma in JSON
# Edit config.json and remove trailing commas
```

---

### Issue: Orphaned phase directory

**Symptoms:**
- Directory exists: `.planning/phases/05-search/`
- Phase 5 not in ROADMAP.md

**Diagnosis:**
```bash
# List phase directories
ls -1d .planning/phases/*/ | cut -d'/' -f3

# Compare to ROADMAP phases
grep "^### Phase" .planning/ROADMAP.md
```

**Fix:**
```bash
# Option 1: Add phase to ROADMAP.md if it should exist
# Edit ROADMAP.md

# Option 2: Remove orphaned directory if phase was removed
rm -rf .planning/phases/05-search/
```

## Automated Checks Script

Provide a quick validation script:

```bash
#!/bin/bash
# gsd-preflight.sh - Quick GSD artifact validation

echo "🔍 GSD Preflight Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━"

BLOCKERS=0
WARNINGS=0

# Check required files
for file in PROJECT.md STATE.md config.json; do
  if [ ! -f ".planning/$file" ]; then
    echo "✗ BLOCKER: Missing .planning/$file"
    ((BLOCKERS++))
  else
    echo "✓ Found $file"
  fi
done

# Check STATE.md sections
if ! grep -q "## Current Position" .planning/STATE.md 2>/dev/null; then
  echo "✗ BLOCKER: STATE.md missing 'Current Position' section"
  ((BLOCKERS++))
fi

# Check config.json syntax
if ! node -e "require('./.planning/config.json')" 2>/dev/null; then
  echo "✗ BLOCKER: config.json invalid JSON"
  ((BLOCKERS++))
fi

# Check for plans without summaries
for plan in .planning/phases/*/*-PLAN.md 2>/dev/null; do
  summary="${plan/PLAN/SUMMARY}"
  if [ ! -f "$summary" ]; then
    echo "⚠ WARNING: Missing summary for $plan"
    ((WARNINGS++))
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary: $BLOCKERS blockers, $WARNINGS warnings"

if [ $BLOCKERS -gt 0 ]; then
  echo "Status: ✗ BROKEN - Fix blockers before running GSD"
  exit 1
elif [ $WARNINGS -gt 0 ]; then
  echo "Status: ⚠ NEEDS ATTENTION - Review warnings"
  exit 0
else
  echo "Status: ✓ HEALTHY - Ready for GSD workflows"
  exit 0
fi
```

## Integration with GSD

This skill **complements** GSD by:
- Catching artifact drift before workflows fail
- Preventing wasted context from mid-execution failures
- Validating manual edits to .planning/ files
- Providing early warning of consistency issues

It **does not replace** GSD:
- No workflow logic is modified
- GSD workflows are still responsible for creating artifacts
- This is purely validation, not execution

## Usage Patterns

### Before Running GSD Workflows
```
User: "I want to plan phase 3"
Assistant: [Activates gsd-preflight skill]
  Runs preflight checks...
  ✓ All checks passed

  Ready to run /gsd:plan-phase 3
```

### After Manual Edits
```
User: "I edited ROADMAP.md to add a new phase"
Assistant: [Activates gsd-preflight skill]
  Validating ROADMAP.md changes...
  ⚠ Phase directory for Phase 6 doesn't exist yet

  Suggestion: GSD will create it when you run /gsd:plan-phase 6
```

### Debugging Failed Workflows
```
User: "GSD failed when I tried to execute phase 2"
Assistant: [Activates gsd-preflight skill]
  Running diagnostic checks...
  ✗ BLOCKER: Plan 02-03 marked complete but missing SUMMARY.md

  This is why execution failed. Fix: ...
```

## Tips for Effective Validation

1. **Run before major workflows** - Especially before execute-phase or audit-milestone
2. **Check after manual edits** - Validate whenever you edit .planning/ files manually
3. **Regular health checks** - Run periodically to catch drift
4. **Automate in CI** - Add preflight checks to git pre-commit hooks
5. **Trust but verify** - GSD is robust, but manual edits can introduce issues
