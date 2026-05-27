# v1.49.832 — T1.3 Option C Integration (Selector 2nd-Caller Wire + tests/integration/ Cross-Rootdir Verification)

**Released:** 2026-05-27

## What shipped

CLOSES the T1.3 Option C arc with 2 deliverables:

1. **Selector 2nd-caller wire**: `src/orchestration/selector.ts` mirrors copper's v830 fallbackProvider field + emitPredictions extension. Brings the `fallbackProvider` substrate-consumer pattern to 2 instances (#10426 codification-eligible).
2. **End-to-end integration test**: `tests/integration/copper-rosetta-fallback-wire.integration.test.ts` instantiates a real `RosettaConceptFallback` + thin `RosettaCore` spy, passes them through copper, and verifies the cross-rootdir flow fires end-to-end (4 tests).

## Why this ship

v830 declared the contract; v831 implemented it; v832 PROVES they work together at runtime AND adds the 2nd production caller so the pattern is no longer a single-instance anomaly. Mirrors the v829 application-boundary verification pattern.

## Surface delta

- 1 MODIFIED src file (selector.ts, ~35 LOC)
- 1 MODIFIED test file (selector.test.ts, ~115 LOC for 4 new tests)
- 1 NEW integration test file (~190 LOC, 4 tests)
- 8 new tests
- 0 chokepoint chips

## Manifest state

| Field | Before | After |
|---|---|---|
| KNOWN_UNWIRED Process | 22 | 22 (UNCHANGED — integration ship) |
| Cross-rootdir wire pattern instances | 4 (v823 + v829 + v830 + v831) | 5 (+ v832 integration) |
| Substrate-consumer hook PAIR pattern instances | 1 (v830 copper) | 2 (+ v832 selector). NEW eligibility. |
| Wired calibratable thresholds | 6 of 6 | 6 of 6 (UNCHANGED) |
| T1.3 GAP-2 branches closed | 6 of 7 | **7 of 7 — ALL CLOSED** |
| Tests | 35,227+ | 35,235+ (+8 net) |

## Engine state

NASA degree at **1.178** (UNCHANGED — **50 consecutive ships at 1.178**, widest pressure margin yet).
Counter-cadence count UNCHANGED at 6.
Wired calibratable thresholds: 6 of 6 (UNCHANGED).
Manifest entries: 22 (UNCHANGED — codification deferred to v833).

T1.3 GAP-2 fully closed. Option C arc fully closed.
