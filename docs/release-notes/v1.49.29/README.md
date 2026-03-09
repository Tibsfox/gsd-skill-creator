# v1.49.29 — Code Quality & Historical Retrospectives

**Shipped:** 2026-03-09
**Commits:** 4
**Files:** 129 changed | **Insertions:** 2,462 | **Deletions:** 619
**Source:** v1.49.28 retrospective follow-through + codebase hygiene pass

## Summary

Addresses the BCM/SHE architecture asymmetry flagged in v1.49.28's "What Could Be Better," adds retrospective sections to all 71 historical release notes (v1.0 through v1.49.x), applies shellcheck fixes across all 44 shell scripts in the project, and introduces a test density verification framework.

The retrospective backfill is significant: every release in the project's history now has structured "What Worked," "What Could Be Better," and "Lessons Learned" sections — creating a searchable knowledge base of 71 engineering retrospectives spanning the full v1.0–v1.49 arc.

## Key Features

### 1. Historical Retrospective Backfill (71 release notes)

Every release note from v1.0 through v1.49.19 now contains:
- **What Worked** — specific engineering decisions that proved sound
- **What Could Be Better** — honest assessment of scope, timing, and architectural trade-offs
- **Lessons Learned** — numbered insights distilled from each release

This transforms the release notes directory from a changelog into a searchable decision journal. Future retrospective-driven improvements (like v1.49.28 itself) can mine deeper history.

### 2. BCM & SHE Component Architecture (resolves v1.49.28 flag)

Building Construction Mastery and Smart Home & DIY Electronics browsers extracted from monolithic `index.html` into the component pattern used by the other 7 PNW browsers:
- **`style.css`** — extracted all inline styles (~185 lines each)
- **`page.html`** — markdown content renderer with TOC support
- **`mission.html`** — mission context and methodology page
- **`index.html`** — reduced to shell loader (~30 lines)
- **`series.js`** — BCM and SHE registered in the PNW series navigation

This eliminates the architecture asymmetry that blocked TOC/navigation enhancements from applying to BCM and SHE.

### 3. Shellcheck Fixes (44 scripts)

Systematic shellcheck pass across all shell scripts in `infra/`, `scripts/`, and `tests/`:
- **`SC2034` pragmas** — variables used by sourced libraries or in later pipeline phases
- **`SC2317` pragmas** — functions called indirectly (pass/warn/fail helpers)
- **Code pattern fixes** — `if command; then` replacing `command; if [ $? -eq 0 ]` anti-pattern
- **Test fixes** — backup/restore world tests and GSD stack tests cleaned up

### 4. Test Density Framework (5 files)

New testing infrastructure for milestone verification:
- **`scripts/check-test-density.sh`** — measures test LOC vs deliverable LOC ratio, reports PASS/FAIL against a configurable floor (default 2.5%)
- **`docs/testing/test-categories.md`** — defines 4 test categories (Unit, Integration, Visual, Platform) with targets and tooling
- **`docs/testing/bash-compat-checklist.md`** — Bash 3.2 compatibility reference for macOS support
- **`docs/testing/macos-smoke-test.md`** — manual verification checklist for cross-platform validation

## Retrospective

### What Worked
- **Retrospective-driven sequencing continues to pay off.** The BCM/SHE extraction was directly flagged in v1.49.28's "What Could Be Better" section. Closing it one release later proves the feedback loop works at short intervals — not just across 10-release mining passes.
- **Shellcheck pragmas are better than suppressing warnings.** Each pragma documents WHY the warning is suppressed (`# variables used by sourced libs`), turning lint output into documentation rather than noise.
- **Backfilling 71 retrospectives in one pass is efficient.** Doing them individually over 71 releases would have been impractical. The batch approach ensures consistent depth and format across the entire history.
- **Logical commit grouping.** Four commits, each self-contained: shell fixes, release notes, browser refactor, testing docs. Clean `git bisect` and clear `git log --oneline` narrative.

### What Could Be Better
- **The retrospective backfill is necessarily speculative for early releases.** v1.0 through ~v1.20 retrospectives are written from artifact analysis, not from lived session context. They're useful but less reliable than retrospectives written at ship time.
- **Test density checker only covers TypeScript.** The 2.5% floor and `*.test.ts`/`*.spec.ts` patterns don't account for shell script tests (`test-*.sh`), Python tests, or the PNW browser verification checklists. Future versions should support polyglot test counting.
- **No automated verification that BCM/SHE page.html actually loads.** The extraction was structural — the component files exist and the architecture matches — but there's no browser test confirming the markdown rendering works end-to-end.

## Lessons Learned

1. **Architecture unification compounds.** Every future browser enhancement now applies to 9/9 PNW projects instead of 7/9. The cost of extraction is paid once; the benefit accrues on every subsequent feature.
2. **Retrospectives are infrastructure, not ceremony.** The 71-file backfill created a queryable knowledge base. "What went wrong with associative arrays?" now has a searchable answer across the project's full history.
3. **Lint pragmas are documentation.** A `# shellcheck disable=SC2034 # variables used by sourced libs` comment tells the next developer more than a clean lint run with suppressed output.
4. **Test density floors prevent silent regression.** A 2.5% floor is low, but having ANY floor means "zero tests" is now a measurable failure, not just a vibes check.
