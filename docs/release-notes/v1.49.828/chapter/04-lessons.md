# v1.49.828 — Lessons

## New lesson candidates (0)

No new lesson candidates this ship. Third consecutive batch-chip ship; pattern is mechanical.

## Forward-test of existing lessons

### #10433 — Internal-helper pattern for `ctx?` threading

**Status:** CALIBRATED for low-end. All 3 files in this ship cluster at ~10 LOC. The prediction band's low end (~14 LOC, anchored on v820 branch-manager with 10 callsites) was too high for 1-callsite spawn-based helpers. The refinement table being carried forward:

| Callsite count | Helper present | Predicted LOC |
|---|---|---|
| 1-2 | yes | ~8-12 |
| 5-10 | yes | ~14-18 |
| 10-15 | yes | ~18-22 |
| 15+ | yes | ~22-26 |

Now at 3 ships of evidence (v825 + v827 + v828). Move to "ready for next codify ship".

### #10427 — Failure-mode contracts (load-bearing chokepoint denials)

**Status:** LOAD-BEARING (multiple consecutive applications). All 3 files in this ship required the hoist-out-of-try/catch pattern because each Promise constructor's inner try/catch wraps spawn errors into `NetlistRenderError`. Without #10427, the natural pattern would have been "put the check inside the try" — which would have transformed `ProcessContextDenied` into `NetlistRenderError(stage='netlistsvg', spawnError=...)`. The hoist preserves the original error class for callers that catch on `ProcessContextDenied`.

Cumulative evidence this chain: 3 ships × 1-6 hoists per ship = ~14 hoists total demonstrating #10427's value.

### #10432 — KNOWN_UNWIRED ledger discipline

**Status:** REAFFIRMED (5th consecutive batch-chip instance). KNOWN_UNWIRED Process: 25 → 22. Block-comment consolidation applied (replace forward-note with 4-line completion comment).

## Tentative observations carried forward

- **LOC-band-by-callsite-count refinement for #10433** (NOW AT 3 INSTANCES). Eligible for codification at next codify ship per #10426 threshold.
- **DI-executor + hoisted-check refinement of #10433** (1 instance, v827). Wait for 2nd.
- **`onPredictions` substrate-consumer wire pattern** (2 instances per v826: copper + selector). Eligible from prior handoff.
- **Cross-rootdir wire pattern** (1 strong instance per v823). Wait for 2nd.
- **`'spawn'` op-tag at family scale** (1 ship instance, v828). Wait for 2nd ship if novel.

Refinements eligible for next codify ship: #10433 LOC-band table + onPredictions wire pattern.

## Cadence observation

This is the 3rd consecutive consume-axis ship in the v827-833 chain. Per #10428, consume-axis ships cluster naturally when KNOWN_UNWIRED entries are batched by family. Cadence floor for codify is 7-10 ships; last was v824 (now 4 ships ago — still within forward-cadence range).

Family-batch consume ships at ~25 min wall-clock are now reliable. The v827-833 chain's remaining 4 ships are mixed (T1.3 wires + codify), so the consume-axis run pauses here.
