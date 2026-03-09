# v1.49.29 — Retrospective-Driven Process Hardening

**Shipped:** 2026-03-09
**Commits:** 5
**Files:** 134 changed | **Insertions:** ~2,700 | **Deletions:** ~620
**Source:** Systematic analysis of 28 v1.49 release retrospectives — 7 gaps, 3 contradictions, 4 improvement axes

## Summary

Resolves the 7 highest-impact gaps identified by mining 28 v1.49 release retrospectives. This is a pure hardening release: no new features, no new PNW research. Every deliverable addresses a validated gap (GAP-1 through GAP-7) or resolves an identified contradiction (C1-C3).

The release delivers four improvement axes: test infrastructure hardening, browser architecture unification (all PNW browsers now share identical architecture), cross-platform shell script hardening (140 scripts scanned, 0 errors), and process tightening (wave commit markers, LOC tracking, speculative infra inventory, API doc generation). Additionally, every release note in the project's history (71 total) now has structured retrospective sections.

## Key Features

### 1. Historical Retrospective Backfill (71 release notes)

Every release note from v1.0 through v1.49.19 now contains:
- **What Worked** — specific engineering decisions that proved sound
- **What Could Be Better** — honest assessment of scope, timing, and architectural trade-offs
- **Lessons Learned** — numbered insights distilled from each release

Transforms the release notes directory from a changelog into a searchable decision journal.

### 2. BCM & SHE Component Architecture (GAP-2)

Building Construction Mastery and Smart Home & DIY Electronics browsers extracted from monolithic `index.html` into the component pattern used by all other PNW browsers:
- **`style.css`** — extracted all inline styles (~185 lines each)
- **`page.html`** — markdown content renderer with TOC support
- **`mission.html`** — mission context and methodology page
- **`index.html`** — reduced to shell loader (~30 lines)
- **`series.js`** — BCM and SHE registered in the PNW series navigation

All PNW browsers now use identical architecture — no exception lists.

### 3. Shell Script POSIX Hardening (GAP-4)

Systematic shellcheck pass across all 140 non-fixture shell scripts:
- **8 hook scripts** — 3 fixed, 5 already clean
- **18 core scripts** — 7 fixed
- **115+ infra/skills scripts** — 12 fixes (redirect bugs, truncation bugs, glob issues)
- All fixes syntactic only — zero behavioral changes

### 4. Test Density Framework (GAP-1, C1)

New testing infrastructure for milestone verification:
- **`scripts/check-test-density.sh`** — measures test LOC vs deliverable LOC ratio, reports PASS/FAIL against 2.5% floor
- **`docs/testing/test-categories.md`** — defines 4 test categories (Unit, Integration, Visual, Platform)
- **`docs/testing/bash-compat-checklist.md`** — Bash 3.2 compatibility reference for macOS support
- **`docs/testing/macos-smoke-test.md`** — manual verification checklist for cross-platform validation

### 5. Wave Commit Marker Hook (GAP-3)

Both `validate-commit.sh` hooks now validate wave commit marker format when present:
- Validates `Wave <number>: <description>` format
- Checks sequential wave numbering
- Warning mode — logs but does not block (upgrade to blocking after clean operation)
- Normal commits without wave markers pass unchanged

### 6. LOC Tracking (GAP-5, C2)

New "LOC per Release" section in STATE.md:
- Pre-populated with v1.49.22 through v1.49.29 data
- Releases exceeding 15K LOC flagged for review
- Makes codebase growth visible and measurable

### 7. Speculative Infrastructure Inventory (GAP-6)

New `infra/SPECULATIVE-INVENTORY.md` catalogs 28 infrastructure files across 7 categories that are designed but not production-validated:
- VM backends, platform abstractions, PXE/kickstart templates, Minecraft world specs, runbooks, knowledge pack pipelines, monitoring/alerting
- Each category documents validation status and the build phase that will exercise it

### 8. TypeScript API Doc Generation (GAP-7)

Automated API documentation from TypeScript source types:
- **`typedoc.json`** — configured for `src/` with test/fixture exclusions
- **`docs:api`** — new npm script (`npx typedoc`)
- **`docs/api/`** — gitignored generated output
- Verified: typedoc produces output with 0 errors

## Verification

13/13 success criteria PASS:

| # | Criterion | Result |
|---|-----------|--------|
| SC-1 | All PNW browsers use page.html | PASS (11/11 — includes FFA + TIBS added post-spec) |
| SC-2 | BCM browser functional | PASS |
| SC-3 | SHE browser functional | PASS |
| SC-4 | Shell lint clean | PASS (140 scripts, 0 errors) |
| SC-5 | Hook POSIX compliance | PASS |
| SC-6 | Test density tooling exists | PASS |
| SC-7 | Test categories documented | PASS |
| SC-8 | Wave commit marker hook | PASS (warning mode) |
| SC-9 | LOC tracking in STATE.md | PASS |
| SC-10 | Speculative infra labeled | PASS (inventory file) |
| SC-11 | API doc generation | PASS |
| SC-12 | Bash 3.2 checklist | PASS |
| SC-13 | macOS smoke test documented | PASS |

Safety-critical: S1 (existing test suite unaffected) PASS, S2 (wave hook allows normal commits) PASS.

## Retrospective

### What Worked
- **Retrospective-driven sequencing is now a proven pattern.** This entire release was generated by mining prior retrospectives. The BCM/SHE extraction was flagged in v1.49.28, and the full gap analysis yielded 7 actionable items — all resolved in a single release.
- **4-wave structure with parallel tracks.** Waves 1A (browser) and 1B (shell hardening) ran in parallel. Wave 2 (process tightening) built on both. Clean dependency graph, no wasted work.
- **Shellcheck pragmas as documentation.** Each pragma documents WHY the warning is suppressed, turning lint output into living documentation rather than noise.
- **Lightweight speculative inventory over heavy labeling.** Rather than touching 40 individual files with NOT VALIDATED headers, a single inventory document catalogs everything with context. Less churn, same information.
- **Session handoff works across context boundaries.** Wave 2 was completed in a new session after picking up from a detailed HANDOFF.md — zero rework, immediate productivity.

### What Could Be Better
- **The retrospective backfill is necessarily speculative for early releases.** v1.0 through ~v1.20 retrospectives are written from artifact analysis, not from lived session context.
- **Wave commit marker validation is limited by message extraction.** The hook parses -m flag content which doesn't preserve newlines from heredoc-style commits. Warning mode is appropriate until extraction improves.
- **Test density checker only covers TypeScript.** Shell script tests, Python tests, and PNW browser verification checklists are not counted. Future versions should support polyglot test counting.

## Lessons Learned

1. **Architecture unification compounds.** Every future browser enhancement now applies to all PNW projects instead of most. The cost of extraction is paid once; the benefit accrues on every subsequent feature.
2. **Retrospectives are infrastructure, not ceremony.** The 71-file backfill created a queryable knowledge base. Mining it produced 7 actionable gaps — proof that the investment pays forward.
3. **Warning mode is the right default for new hooks.** One release of clean operation before upgrading to blocking prevents the hook from becoming a development blocker during its stabilization period.
4. **Speculative infrastructure is not technical debt.** The inventory makes clear that design-ahead specifications follow the project's "cartography not construction" principle — they're ready for their build phases, not abandoned.
5. **LOC visibility prevents silent growth.** A 15K flag threshold is generous, but having ANY threshold means large releases trigger conscious review rather than sliding past unnoticed.
