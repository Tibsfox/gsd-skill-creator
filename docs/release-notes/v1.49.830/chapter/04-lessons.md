# v1.49.830 — Lessons

## New lesson candidates (0)

No new lessons codified this ship. Framework ships rarely close enough novel ground to warrant new lessons; v830 reuses and reinforces existing patterns (cross-rootdir duck typing, two-layer subscriber gating, threshold threading through result objects). Codification eligibility tracked under "Tentative observations carried forward" below.

## Forward-test of existing lessons

### #10416 — Lightest wire

**Status:** RESPECTED. v830 adds a single optional field (`fallbackProvider?: ConceptFallbackProvider`) to `ActivationContext`. Existing callers that don't wire it pay zero cost — both at the type level (optional) and at runtime (two-layer subscriber gate). The threshold-threading change in `PredictionResult` is a required-field addition, but the only consumers are inside the same module + tests (no downstream import surface).

### #10426 — Second-instance threshold

**Status:** EXCEEDED for cross-rootdir wire (now 3 instances: v823 + v829 + v830). Codification deferred to v833 codify ship at chain close. Three-instance evidence is stronger than the two-instance threshold; the codification table can rely on richer typology.

### #10427 — Failure-mode contracts

**Status:** RESPECTED. The fallback path is OBSERVABILITY-only (the dispatch fires it; the return value is captured by tests but the dispatch itself ignores the result). Errors are swallowed at the same boundary as `onPredictions` errors via the shared catch block. Per #10427's silent-vs-loud test: the user's next decision does NOT depend on the fallback's output → it's an observability surface → silent failure is correct.

### #10428 — Meta-cadence

**Status:** calibrate-axis tick. `lowConfidenceThreshold` is the 6th wired calibratable threshold. The bounded-learning calibration loop now has 6 surfaces to schedule against. Whether to spend a future calibration tick on `lowConfidenceThreshold` specifically is a v833+ planning question — the threshold needs observation data first (operators need to wire `fallbackProvider` and collect activations).

### #10432 — KNOWN_UNWIRED ledger

**Status:** NOT EXERCISED. v830 is not a chokepoint chip; ledger entries unchanged at Process=22 / Egress=11.

### #10433 — Internal-helper pattern

**Status:** NOT EXERCISED. No `ctx?` parameter threading; no security-context call. The wire pattern v830 exercises is the cross-rootdir interface pattern (#10426 lineage), not the chokepoint-retrofit pattern (#10433 lineage).

### #10434 — Discipline coverage ratchet ledger

**Status:** UNCHANGED (UNCODIFIED count holds at 39, ceiling 41, buffer 2). v830 doesn't add a new discipline doc; existing discipline coverage holds.

## Tentative observations carried forward

| Observation | Instances | Notes |
|---|---|---|
| **Cross-rootdir wire pattern** (interface in rootdir A + impl in rootdir B, duck-typed) | 3 (v823 + v829 + v830) | EXCEEDED #10426 threshold. Codify at v833. |
| **`onPredictions` substrate-consumer wire pattern** | 2 (v810 + v826) | Eligible from prior handoff. Codify at v833. |
| **#10433 LOC-band-by-callsite-count refinement** | 3 (v825 + v827 + v828) | Eligible from prior chain. Codify at v833. |
| **Substrate-consumer hook PAIR pattern** (`onPredictions` + `fallbackProvider` co-located, both fire-and-forget, both subscriber-gated, two-layer skip) | 1 (v830) | Wait for 2nd. v832 selector wire will become 2nd if it follows the same shape. |
| **DI-executor + hoisted-check refinement of #10433** | 1 (v827) | Wait for 2nd. |
| **`'spawn'` op-tag at family scale** | 1 (v828) | Wait for 2nd. |
| **Verification-only ships (no src/ change, only tests/integration/ test)** | 1 (v829) | Wait for 2nd. v832 is a candidate if its delta is only the integration test + selector wire. |
| **Threading config-derived constants through result objects** (so hot-path callers pay one settings read instead of two) | 1 (v830) | Wait for 2nd. |

## Cadence observation

This ship is the FRAMEWORK half of a 3-ship arc. The framework-then-impl partition is a recurring shape: declare the contract first, satisfy it second, integrate third. v823→v829 was a 6-ship-apart instance of the same shape; v830→v831→v832 compresses it into 3 adjacent ships within a single arc.

If the v832 integration test + selector wire ship lands a 2nd instance of the substrate-consumer hook pair pattern, both `onPredictions` and `fallbackProvider` patterns become co-eligible for codification — potentially as a unified "subscriber-gated observability-only context-hook" discipline rather than two separate codifications.
