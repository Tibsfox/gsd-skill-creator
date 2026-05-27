# v1.49.825 — Batch Chip: `git/core` Family ProcessContext

**Released:** 2026-05-27

## What shipped

3 src/ files wired with ProcessContext chokepoint via the internal-helper pattern (#10433):

- `src/git/core/repo-manager.ts` — `exec()` helper threaded; 13 callsites pass `ctx?` through `installRepo` + `detectDefaultBranch`. ~22 LOC delta.
- `src/git/core/state-machine.ts` — `exec()` helper threaded; 7 callsites; 3 public functions (`detectState`, `assertState`, `assertClean`) and 1 internal helper (`parseRemotes`) gain `ctx?`. ~18 LOC delta.
- `src/git/core/sync-manager.ts` — `execGit()` helper threaded; 11 callsites; `sync()` + 3 internal helpers (`applyRebase`, `applyMerge`, `getConflictFiles`) gain `ctx?`. ~22 LOC delta.

Plus 1 audit-test edit: `src/security/process-context-audit.test.ts` removes 3 entries from `KNOWN_UNWIRED`; replaces v820's "remaining 3" comment with a 4-line completion comment noting the `git/core` family is fully wired.

## Why this ship

Second ship of the v824-826 chain. Forward-tests Lesson #10433 (internal-helper pattern) which was promoted to ESTABLISHED in v824 (predecessor). All 3 files match the pattern's prediction: helper-present + multiple callsites → ~14-20 LOC delta per file. Actual range: 18-22 LOC; #10433 prediction band holds within ~10%.

## Surface delta

- 3 src/ files modified (~62 LOC total)
- 1 audit-test edit (3 KNOWN_UNWIRED entries removed)
- 0 new test files
- 0 new lesson candidates

## Manifest state

| Field | Before | After |
|---|---|---|
| KNOWN_UNWIRED Process | 31 | 28 |
| KNOWN_UNWIRED Egress | 11 | 11 |
| `git/core` family wired | 1 of 4 | 4 of 4 |
| Tests | 35,205+ | 35,205+ (+0 new; 4,275 covered by this ship's verification) |

## Engine state

NASA degree at **1.178** (UNCHANGED — 43 consecutive ships at 1.178).
Counter-cadence count UNCHANGED at 6.
Wired calibratable thresholds: 5 of 6 (UNCHANGED).
Manifest entries: 22 (UNCHANGED — chip ship).
