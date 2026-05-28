# v1.49.870 — ProcessContext singleton chip: `src/learning/version-manager.ts`

**Released:** 2026-05-28

## Why this ship

First chip of Track 4 (Process singleton chips ×6). Size-ascending order per the v1.49.868-codified #10444 discipline picks the smallest LOC entry first: `src/learning/version-manager.ts` at 177 LOC. The new step 18/18 cross-audit gate (wired v869) runs at pre-tag-gate as automatic continuous-verification — no operator-invoked check this ship.

## What's in this ship

- **Wire shape:** internal-helper pattern (#10433) — single `ensureProcessAllowed` at the top of the private `git()` helper protects 7 call sites.
- **#10427 application:** re-throws `ProcessContextDenied` from 4 swallow-everything catches in service methods (getHistory/getVersionContent/rollback/compareVersions/getCurrentHash); preserves fault-tolerant semantics for non-security errors.
- **Test coverage:** 3 new test cases verifying default-permissive + audit threading + denial propagation; 14/14 total.

## What this ship is

- First chip of the size-ascending Process cluster.
- Internal-helper pattern application (DRY at the security boundary; 1 check protects 7 call sites).
- Cross-audit tool ran clean automatically as pre-tag-gate step 18/18.

## What this ship is not

- Not a NASA degree advance (still 1.178; now 88 consecutive ships).
- Not a counter-cadence ship.
- Not a new lesson promotion (#10433 applied; no new lesson codified).

## Engine state

NASA degree sustains at 1.178 (UNCHANGED — 88 consecutive ships).
Counter-cadence count UNCHANGED at 6.
Manifest entries 23 (UNCHANGED).
Lessons in manifest 85 (UNCHANGED).
KNOWN_UNWIRED Process: 6 → 5.
KNOWN_UNWIRED Egress UNCHANGED at 6.
Wired calibratable thresholds: 5 of 7 (UNCHANGED).
UNCODIFIED count: 39 ≤ ceiling 41 (UNCHANGED).
