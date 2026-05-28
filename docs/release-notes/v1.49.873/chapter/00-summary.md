# v1.49.873 — ProcessContext singleton chip: `src/git/gates/pre-flight.ts`

**Released:** 2026-05-28

## Why this ship

Track 4 chip #4. Size-ascending picks pre-flight.ts (363 LOC) after v872's pic2html (311 LOC). Wires the module-level `exec()` helper to take `ctx?` as a third parameter; threads ctx through 5 functions (`exec`, `isClean`, `buildDiffSummary`, `preFlightMerge`, `preFlightPR`). Single ensureProcessAllowed protects ~12 spawn sites; 11 swallow-everything catches updated to re-throw ProcessContextDenied per #10427.

## What's in this ship

- Wire shape: module-internal-helper (variant of #10433).
- #10427 application: 11 re-throws across both exported functions + buildDiffSummary helper. Largest single-ship application yet.
- Test coverage: 4 new cases verifying ctx threading + denial propagation in both preflight functions.

## Engine state

NASA degree 1.178 (UNCHANGED — 91 consecutive ships).
Counter-cadence count 6 (UNCHANGED).
Manifest entries 23 (UNCHANGED). Lessons 85 (UNCHANGED).
KNOWN_UNWIRED Process: 3 → 2. Egress: 6 (UNCHANGED).
Wired calibratable thresholds: 5 of 7 (UNCHANGED).
UNCODIFIED 39 ≤ 41 (UNCHANGED).
