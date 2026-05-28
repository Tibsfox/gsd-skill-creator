# v1.49.871 — ProcessContext singleton chip: `src/git/workflows/contribute.ts`

**Released:** 2026-05-28

## Why this ship

Track 4 chip #2. Size-ascending pick after v870's version-manager (177 LOC). Wires `src/git/workflows/contribute.ts` (183 LOC) via the closure-capture pattern — refactors the module-level `exec()` helper into a closure inside `contribute()` that captures `ctx?` from the outer scope.

## What's in this ship

- **Wire shape:** closure-capture pattern (#10433 internal-helper via closure variant per #10444 catalog).
- **#10427 application:** re-throws `ProcessContextDenied` from 4 swallow-everything catches (sync recovery / merge wrap / push wrap / gh-availability wrap).
- **Test coverage:** 3 new test cases verifying default-permissive + audit threading + denial propagation; 10/10 total.

## Engine state

NASA degree 1.178 (UNCHANGED — 89 consecutive ships).
Counter-cadence count 6 (UNCHANGED).
Manifest entries 23 (UNCHANGED). Lessons 85 (UNCHANGED).
KNOWN_UNWIRED Process: 5 → 4. Egress: 6 (UNCHANGED).
Wired calibratable thresholds: 5 of 7 (UNCHANGED).
UNCODIFIED 39 ≤ 41 (UNCHANGED).
