# v1.49.829 — Lessons

## New lesson candidates (0)

No new lesson candidates this ship. Cross-rootdir wire pattern was already at 1 instance (v823); v829 brings it to 2 instances (eligible for next codify ship).

## Forward-test of existing lessons

### #10416 — Lightest wire

**Status:** RESPECTED. v829 adds only a single test file at `tests/integration/`. Zero src/ or .college/ source code modified. The verification surface (an integration test) is the lightest wire that proves the v823 + v826 declarations function at runtime. Per the #10416 framework: "the lightest wire that flips the verification status."

### Cross-rootdir wire pattern (#10426 candidate)

**Status:** 2 INSTANCES — ELIGIBLE FOR CODIFICATION at next codify ship.

| Instance | Ship | Detail |
|---|---|---|
| 1st | v1.49.823 | `SkillActivationObserver` interface declared in src/dashboard; `ObservationBridge.onSkillActivate` structurally satisfies it in .college |
| 2nd | v1.49.829 | `tests/integration/` test instantiates both sides; pumps events across the rootdir boundary; proves the duck-type contract carries runtime payload |

The pattern in shape:
1. Define a duck-typed interface in rootdir A.
2. Implement a class in rootdir B that structurally satisfies the interface.
3. Verify the wire works by instantiating both in a `tests/integration/` (or similar boundary-crossing) location.

Naming suggestion for codification: "Duck-typed cross-rootdir interface wire pattern." Or: "tests/integration/ as the application-boundary wire location for cross-rootdir contracts."

## Tentative observations carried forward

- **DI-executor + hoisted-check refinement of #10433** (1 ship instance, v827). Wait for 2nd.
- **LOC-band-by-callsite-count refinement for #10433** (3 ship instances: v825 + v827 + v828). Eligible for next codify ship.
- **`onPredictions` substrate-consumer wire pattern** (2 instances: v810 + v826). Eligible from prior handoff.
- **Cross-rootdir wire pattern** (NOW 2 instances: v823 + v829). NEW eligibility this ship.
- **`'spawn'` op-tag at family scale** (1 ship instance, v828). Wait for 2nd.

Refinements eligible for next codify ship (v833 anticipated):
1. #10433 LOC-band table refinement
2. onPredictions wire pattern
3. Cross-rootdir wire pattern
4. DI-executor refinement (if 2nd instance accrues by then)

## Cadence observation

This is a "verification-only" ship — no new source code, only a test that proves an existing wire. The pattern is rare but valuable: it closes a gap between "declarations exist" and "wire is proven to function."

Per #10428 meta-cadence, this ship doesn't fit cleanly into codify/consume/calibrate. It's closer to "verify" — proving an existing wire works without adding new substrate or new callers. Future cadence may merit a 4th axis for verification-only ships if they recur.
