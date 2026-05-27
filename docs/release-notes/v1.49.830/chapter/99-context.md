# v1.49.830 — Context

## Provenance

This ship was selected as the first ship of the v830-832 arc per operator authorization to "Continue Option C arc (v830-832)" at session pickup. Predecessor handoff: `.planning/HANDOFF-2026-05-27-v1.49.827-829-chain-3-of-5-ships-shipped.md`.

The handoff said: "T1.3 Option C — RosettaCore confidence-bound fallback (~2-3 ships, v830-832). Closes the largest open branch of T1.3 GAP-2." Proposed partition:
- **v830 (Framework):** Declare `ConceptFallbackProvider` interface, add threshold, wire copper.
- **v831 (Implementation):** Add `RosettaConceptFallback` in `.college/integration/`.
- **v832 (Integration + 2nd-instance):** Add `tests/integration/` test + wire selector.

## What this ship adds

```
src/predictive-skill-loader/fallback.ts                              [NEW]
src/predictive-skill-loader/settings.ts                              [+lowConfidenceThreshold field]
src/predictive-skill-loader/index.ts                                 [+re-exports +PredictionResult field]
src/chipset/copper/activation.ts                                     [+fallbackProvider field +emitPredictions update]
src/chipset/copper/activation.test.ts                                [+4 tests]
src/predictive-skill-loader/__tests__/integration.test.ts            [4 inline config updates]
src/predictive-skill-loader/__tests__/orchestration-byte-identical.test.ts [1 inline config update]
```

## Recon trail (per #10422 ledger-driven work discipline)

1. **Verify the two production callers exist**: grep confirmed `predictNextSkills(currentSkill, {})` at `src/chipset/copper/activation.ts:254` and `src/orchestration/selector.ts:299`. Both ignore the returned scores (no consumer of confidence) — natural fallback trigger point.
2. **Verify RosettaCore + ConceptRegistry surfaces**: Read `.college/rosetta-core/engine.ts` (class is `RosettaCore`, NOT `RosettaEngine` per handoff prose). Read `.college/rosetta-core/concept-registry.ts` (methods: `search(query, domain?)` + `getAnalogies(id, targetDomain)` — NOT `getAnalogiesByDomain` per handoff prose). Corrected v831 plan in-place.
3. **Verify cross-rootdir pattern is real**: Read `tests/integration/college-observation-bridge-wire.integration.test.ts` (v829's wire) + `.college/integration/observation-bridge.ts` (v823's impl). Pattern is concrete: declare interface in src/, implement in .college/ via duck typing, verify via `tests/integration/`.
4. **Check for existing fallback surface**: grep `fallback|ConceptFallback|onLowConfidence|ConceptSuggestion` returned only unrelated false positives. Clean greenfield.
5. **Confirm `PredictNextSkillsWithMeta` is public**: yes — exported from `src/predictive-skill-loader/index.ts`. Can switch copper from `predictNextSkills` to the meta variant without adding a new export.
6. **Implement** in 5 files (1 NEW src, 3 MODIFIED src, 2 MODIFIED test). Switch copper to `predictNextSkillsWithMeta`. Add subscriber-gated fallback fire.
7. **Verify tests + build**: `npx vitest run --project root src/chipset/copper/activation.test.ts src/predictive-skill-loader/` → 60 PASS / 0 fail. `npm run build` → clean.

## Discipline-extension vs new-domain choice

This ship doesn't introduce a new discipline. It exercises the EXISTING cross-rootdir wire pattern (v823 → v829 → v830 = 3rd instance) and stays inside `src/predictive-skill-loader/` and `src/chipset/copper/` — both established surfaces. The new threshold (`lowConfidenceThreshold`) extends `PredictiveSkillLoaderConfig` rather than introducing a new settings block.

The 4 tentative observations carried forward to v833 codify ship are tracked in `04-lessons.md`. No discipline doc is created or modified this ship; existing #10416/#10426/#10427 frameworks all apply.

## What was deferred

- **`RosettaConceptFallback` implementation in `.college/integration/`** — v831 (next ship).
- **Selector wire as 2nd production caller** — v832.
- **`tests/integration/` end-to-end verification of the wire** — v832.
- **Bounded-learning calibration of `lowConfidenceThreshold`** — needs observation data first; future milestone after operators wire `fallbackProvider` in production.
- **Codification of cross-rootdir wire / onPredictions / #10433 LOC-band / hook-pair patterns** — v833 codify ship.

## Verification trail

| Step | Result |
|---|---|
| `npm run build` | PASS |
| `npx vitest run --project root src/chipset/copper/activation.test.ts src/predictive-skill-loader/` | 60 PASS / 0 fail (4 new fallback tests + 56 existing) |
| Pre-tag-gate (full) | expected 17/17 PASS (step 13 within-ceiling) |

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 (atomic directive state) + Lesson #10184 (single-step main FF) + Lesson #10197 (STORY-gate post-bump-version). Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- No deviations from the canonical sequence.
- First ship of v830-832 arc; expect similar wall-clock for v831 + v832 unless RosettaCore surface details require recon.

## Forward path

- **v831** — `RosettaConceptFallback` in `.college/integration/`. Uses `ConceptRegistry.search(currentSkill)` + `getAnalogies(id, targetDomain)` to find related concepts; calls `RosettaCore.translate` to render them. Tests in `.college/`.
- **v832** — `tests/integration/copper-rosetta-fallback-wire.integration.test.ts` + wire selector as 2nd production caller. Closes Option C arc.
- **v833** — Codify ship for 3-4 eligible patterns (depending on whether the hook-pair pattern accrues a 2nd instance at v832).

After v833, NASA 1.179 forward-cadence is the strong-default (49 consecutive ships at 1.178 expected by then).

## References

- Predecessor: v1.49.829 (`docs/release-notes/v1.49.829/`)
- v827-829 chain handoff: `.planning/HANDOFF-2026-05-27-v1.49.827-829-chain-3-of-5-ships-shipped.md`
- First-instance of cross-rootdir wire pattern: v1.49.823 (`docs/release-notes/v1.49.823/`)
- Second-instance verification: v1.49.829 (`docs/release-notes/v1.49.829/`)
- Substrate-consumer wire pattern (Option A): v1.49.810 (copper) + v1.49.826 (selector)
- `RosettaCore` engine: `.college/rosetta-core/engine.ts`
- `ConceptRegistry`: `.college/rosetta-core/concept-registry.ts`
- `ConceptFallbackProvider` (this ship): `src/predictive-skill-loader/fallback.ts`
