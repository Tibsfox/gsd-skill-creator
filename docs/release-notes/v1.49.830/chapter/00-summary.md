# v1.49.830 — T1.3 Option C Framework (ConceptFallbackProvider Interface + Threshold + Copper Wire)

**Released:** 2026-05-27

## What shipped

1 NEW src file + 5 modified src/test files implementing the FRAMEWORK half of T1.3 Option C:

- `src/predictive-skill-loader/fallback.ts` — declares `ConceptFallbackProvider` and `ConceptSuggestion` (cross-rootdir duck-typed interface; no `.college/` type imports).
- `src/predictive-skill-loader/settings.ts` — `PredictiveSkillLoaderConfig` gains `lowConfidenceThreshold: number` (default `0.30`).
- `src/predictive-skill-loader/index.ts` — re-exports the new types; `PredictionResult` carries `lowConfidenceThreshold` so callers don't pay a second settings read on the hot path.
- `src/chipset/copper/activation.ts` — `ActivationContext` gains `fallbackProvider?: ConceptFallbackProvider`; `emitPredictions` fires `onLowConfidence(currentSkill, maxScore)` when `maxScore < lowConfidenceThreshold`.
- `src/chipset/copper/activation.test.ts` — 4 new tests covering fallback-only, both-hooks, neither-wired, and throwing-fallback.
- 2 test files updated for the new required config field.

## Why this ship

T1.3 Option C closes the largest open branch of T1.3 GAP-2 (per v829 handoff). Splitting Option C into framework (v830) + impl (v831) + integration (v832) follows the duck-typed cross-rootdir wire pattern already established at v823/v829 — declare the contract in src/, satisfy it from .college/ at the next ship.

## Surface delta

- 1 NEW src file (~45 LOC)
- 5 MODIFIED files (~310 LOC across src + test)
- 4 new tests
- 0 .college/ files modified
- 0 chokepoint chips

## Manifest state

| Field | Before | After |
|---|---|---|
| KNOWN_UNWIRED Process | 22 | 22 (UNCHANGED — framework ship, not a chokepoint chip) |
| Cross-rootdir wire pattern instances | 2 (v823 + v829) | 3 (v823 + v829 + v830 framework) |
| Wired calibratable thresholds | 5 of 6 | 6 of 6 (`lowConfidenceThreshold` registered) |
| T1.3 GAP-2 branches closed | 4 of 5 | 5 of 7 (Option C splits into 3 sub-branches; framework closed) |
| Tests | 35,213+ | 35,217+ (+4 net) |

## Engine state

NASA degree at **1.178** (UNCHANGED — 48 consecutive ships at 1.178).
Counter-cadence count UNCHANGED at 6.
Wired calibratable thresholds: 5 of 6 → **6 of 6** (NEW: `lowConfidenceThreshold` registered via settings).
Manifest entries: 22 (UNCHANGED — framework ship; codification deferred to v833).

Substrate-consumer hook PAIR pattern (`onPredictions` + `fallbackProvider` co-located on the same context, both fire-and-forget, both subscriber-gated) is a NEW tentative observation at 1 instance.
