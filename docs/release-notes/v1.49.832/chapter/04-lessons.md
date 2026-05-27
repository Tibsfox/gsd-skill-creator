# v1.49.832 — Lessons

## New lesson candidates (0)

No new lessons codified this ship. The Option C arc as a whole produced 4 codification-eligible patterns (3 from this arc + 1 carried over); all are deferred to the v833 codify ship.

## Forward-test of existing lessons

### #10416 — Lightest wire

**Status:** RESPECTED. v832's selector wire is a 1-line mirror of copper's v830 wire (`fallbackProvider?: ConceptFallbackProvider` field + `if (!hook && !fallback) return;` two-layer gate + fallback fire-and-forget call). The substantive new content is the integration test (~190 LOC) which proves the wire functions at runtime; the src/ delta is minimal.

### #10426 — Second-instance threshold

**Status:** NEW eligibility this ship for the **substrate-consumer hook PAIR pattern** (now 2 instances: v830 copper + v832 selector). EXCEEDED 4× over for **cross-rootdir wire pattern** (now 5 instances: v823 + v829 + v830 + v831 + v832). v833 codify ship will draw on:
- 5 cross-rootdir wire instances spanning 2 contract families (SkillActivationObserver + ConceptFallbackProvider) and 4 integration shapes (declaration, verification, framework, implementation).
- 2 substrate-consumer hook pair instances (both fire-and-forget, both two-layer subscriber-gated, both observability-only).

### #10427 — Failure-mode contracts

**Status:** RESPECTED. The selector's `_emitPredictions` catch block swallows BOTH onPredictions errors AND fallback errors — they're both observability-only surfaces (per #10427's silent-vs-loud test). The caller (selector consumer code) doesn't depend on either's output, so silent failure is correct. Mirrors the v830 copper pattern exactly.

### #10428 — Meta-cadence

**Status:** verify-axis observation. v829 + v832 are both "integration ship with small src/ delta + substantial test infrastructure" — neither is consume (chokepoint), codify (lesson), nor calibrate (threshold). If a 4th operational axis is named ("verify" / "integrate"), this would be its 2-instance evidence base. Tracked as observation; codification decision belongs to v833.

The codify-axis is now **8 ships ago** (last was v824, current is v832). Still within the 7-10 ship floor but at the upper bound — v833 reset is timely.

### #10432 — KNOWN_UNWIRED ledger

**Status:** NOT EXERCISED. v832 is not a chokepoint chip; ledger unchanged at Process=22 / Egress=11.

### #10433 — Internal-helper pattern

**Status:** NOT EXERCISED. v832 doesn't touch a security context call.

### #10434 — Discipline coverage ratchet

**Status:** UNCHANGED (UNCODIFIED 39, ceiling 41, buffer 2). v832 doesn't add a new discipline doc; v833 codify ship is the natural codification window.

## Tentative observations carried forward

| Observation | Instances | Status |
|---|---|---|
| **Cross-rootdir wire pattern** | 5 (v823 + v829 + v830 + v831 + v832) | EXCEEDED #10426 threshold 4× over. **PRIMARY codify candidate at v833.** |
| **Substrate-consumer hook PAIR pattern** (`onPredictions` + `fallbackProvider` co-located) | **2 (v830 copper + v832 selector)** | **NEW eligibility this ship.** Codify at v833. |
| **Verification/integration-only ships** (small src/ delta + substantial test infrastructure) | 2 (v829 + v832) | NEW eligibility this ship. Codify candidate at v833. |
| **`onPredictions` substrate-consumer wire pattern** | 2 (v810 + v826) | Eligible since prior chain. Codify at v833. |
| **#10433 LOC-band-by-callsite-count refinement** | 3 (v825 + v827 + v828) | Eligible since prior chain. Codify at v833. |
| **`Pick<T, K>` structural handle narrowing for cross-rootdir consumers** | 1 (v831) | Wait for 2nd. |
| **Fail-soft fallback pattern** | 1 (v831) | Wait for 2nd. |
| **Cross-rootdir local-interface redeclaration discipline** | 1 (v831) | Wait for 2nd. |
| **DI-executor + hoisted-check refinement of #10433** | 1 (v827) | Wait for 2nd. |
| **`'spawn'` op-tag at family scale** | 1 (v828) | Wait for 2nd. |
| **Threading config-derived constants through result objects** | 1 (v830) | Wait for 2nd. |

The Option C arc accrued THREE new eligible patterns: substrate-consumer hook pair (2 inst.), cross-rootdir wire (5 inst., further reinforcement), and verification/integration ships (2 inst.). v833's codify scope is large but the evidence is rich.

## Cadence observation

The Option C arc represents an unusual cluster of pattern reinforcement: ONE source feature (low-confidence fallback) produced FOUR observable patterns across three ships — framework decisions in v830 (cross-rootdir, threshold-in-result), implementation decisions in v831 (Pick handles, fail-soft, local redeclaration), integration decisions in v832 (2nd-caller mirror, application-boundary test). Counter-cadence pattern: a single-feature arc that produces multiple cross-cutting observations.

This is the second occurrence of this dynamic — the v810/v823/v826 + v829 sequence ALSO produced multiple observations from a single feature family (the substrate-consumer wire). The pattern "single feature arc → multiple cross-cutting observations → codify cluster" may itself be a #10428 cadence pattern worth codifying once a 3rd instance arrives.
