# v1.49.829 — T1.3 Application-Boundary Wire (Cross-Rootdir Integration Test)

**Released:** 2026-05-27

## What shipped

1 NEW test file at `tests/integration/college-observation-bridge-wire.integration.test.ts` (~110 LOC, 5 tests):

- Compile-time + runtime duck-type check that `ObservationBridge` satisfies `SkillActivationObserver`.
- Happy-path routing of `skill-activate` SessionEvents through `translateSessionEvent` into `ObservationBridge`.
- Negative coverage: non-skill-activate events do NOT route into the bridge.
- End-to-end batch conversion: bridge events → `SessionObservation` via `toSessionObservation()`.
- Listener observability: bridge listeners receive routed events.

Tests live in `tests/integration/` — outside both rootdirs (src/ + .college/) — and verify the cross-rootdir wire works at runtime.

## Why this ship

v823 declared the `SkillActivationObserver` interface in src/dashboard and made `ObservationBridge` in .college structurally satisfy it. v826 added a 2nd production caller of the related onPredictions pattern. But neither side was ever instantiated together — the rootdir boundary blocked the verification. v829 closes that branch by adding a `tests/integration/` test that proves the wire functions end-to-end.

## Surface delta

- 1 NEW test file (~110 LOC)
- 0 src/ files modified
- 0 .college/ files modified
- 5 new tests

## Manifest state

| Field | Before | After |
|---|---|---|
| KNOWN_UNWIRED Process | 22 | 22 (UNCHANGED — not a chokepoint chip) |
| Cross-rootdir wire pattern instances | 1 (v823 interface declaration) | 2 (v823 + v829 verified) |
| T1.3 GAP-2 branches closed | 3 of 5 | 4 of 5 |
| Tests | 35,208+ | 35,213+ (+5 net) |

## Engine state

NASA degree at **1.178** (UNCHANGED — 47 consecutive ships at 1.178).
Counter-cadence count UNCHANGED at 6.
Wired calibratable thresholds: 5 of 6 (UNCHANGED).
Manifest entries: 22 (UNCHANGED).

Cross-rootdir wire pattern now at 2 instances per #10426 — eligible for codification at next codify ship (v833).
