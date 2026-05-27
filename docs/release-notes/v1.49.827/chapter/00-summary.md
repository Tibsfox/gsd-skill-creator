# v1.49.827 — Batch Chip: dogfood Family ProcessContext

**Released:** 2026-05-27

## What shipped

3 src/ files wired with ProcessContext chokepoint via the internal-helper pattern (#10433) plus the hoist-out-of-try/catch refinement (#10427):

- `src/dogfood/extraction/extractor.ts` — `runPdftotext()` internal helper threaded; 1 callsite via `extractPdf`. Pure #10433 pattern (catch in caller re-throws). ~12 LOC delta.
- `src/dogfood/pydmd/install/health-check.ts` — DI-executor shape. Hoisted check inside `runHealthCheck` OUTSIDE the swallowing try/catch per #10427. 1 hoisted check. ~6 LOC delta.
- `src/dogfood/pydmd/install/venv-manager.ts` — DI-executor shape with 6 swallowing try/catches. 6 hoisted checks (1 per call site in createVenv) + 1 in cleanupVenv. ~26 LOC delta.

Plus 1 audit-test edit: `src/security/process-context-audit.test.ts` removes 3 entries from `KNOWN_UNWIRED`; replaces inline forward-note with a 3-line completion comment marking the dogfood family fully wired.

## Why this ship

First ship of the v827-833 chain. Second batch-chip ship after v825's `git/core` closure. Forward-tests Lesson #10433 (internal-helper pattern) for a 2nd time and surfaces a NEW pattern variant for files with dependency-injected executors + swallowing try/catches (DI-executor shape requires hoisted-check). The new shape may merit codification as a #10433 refinement after 1 more instance accrues.

## Surface delta

- 3 src/ files modified (~44 LOC total)
- 1 audit-test edit (3 KNOWN_UNWIRED entries removed)
- 0 new test files
- 0 new lesson candidates promoted (1 carried forward to next codify ship)

## Manifest state

| Field | Before | After |
|---|---|---|
| KNOWN_UNWIRED Process | 28 | 25 |
| KNOWN_UNWIRED Egress | 11 | 11 |
| dogfood family wired | 0 of 3 | 3 of 3 |
| Tests | 35,208+ | 35,208+ (+0 new) |

## Engine state

NASA degree at **1.178** (UNCHANGED — 45 consecutive ships at 1.178).
Counter-cadence count UNCHANGED at 6.
Wired calibratable thresholds: 5 of 6 (UNCHANGED).
Manifest entries: 22 (UNCHANGED — chip ship).
