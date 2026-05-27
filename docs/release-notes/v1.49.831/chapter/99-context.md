# v1.49.831 — Context

## Provenance

Second ship of the v830-832 Option C arc. Predecessor v830 closed the framework half (interface + threshold + copper wire); v831 closes the implementation half (concrete provider in .college/integration/). Operator authorization: same Option-C-arc authorization issued at session pickup.

## What this ship adds

```
.college/integration/rosetta-concept-fallback.ts          [NEW ~145 LOC]
.college/integration/rosetta-concept-fallback.test.ts     [NEW ~220 LOC, 9 tests]
```

No src/ files modified. No `.college/` files OTHER than the new ones touched.

## Recon trail (per #10422 ledger-driven work discipline)

1. **Confirm cross-rootdir boundary is strict**: grep `import.*from.*src/` inside .college/ returns only comment matches in `observation-bridge.ts` — no actual src imports. Duck-typing across the boundary is the established pattern, not an exception.
2. **Read RosettaCore + ConceptRegistry shapes**: `RosettaCore.translate(conceptId, TranslationContext): Promise<Translation>`; `ConceptRegistry.search(query, domain?): RosettaConcept[]`; `ConceptRegistry.get(id): RosettaConcept | undefined`; `ConceptRegistry.getAnalogies(id, targetDomain): RosettaConcept[]` (NOT `getAnalogiesByDomain` per handoff prose — corrected at v830 recon).
3. **Read `TranslationContext` shape**: `{ userExpertise: 'novice'|...|'expert'; currentDomain: string; recentPanels: PanelId[]; taskType: 'explain'|...|'explore'; ... }`. The provider needs sensible defaults so callers don't need to author a full context.
4. **Identify the "cross-domain analogy" filter**: rather than using `getAnalogies(id, targetDomain)` (which requires a target hint), inline-filter `concept.relationships` by `type === 'analogy'` AND `target.domain !== source.domain`. Returns analogies in ANY other domain. Simpler API for the substrate-consumer.
5. **Pick<T, K> narrowing for test ergonomics**: refactored constructor opts mid-flight when test mocks needed full RosettaCore + ConceptRegistry types. Narrowed handles let tests pass `{ translate: vi.fn(...) }` without a cast.
6. **Implement + test**: 1 src + 1 test file. 9 tests cover null cases, cross-domain filter, render success, fail-soft contract, maxSuggestions cap, and compile-time structural conformance to the cross-rootdir interface.
7. **Verify**: `npx vitest run .college/integration/rosetta-concept-fallback.test.ts` → 9 PASS. `npx vitest run .college/integration/` (full subdirectory) → 52 PASS / 0 fail. `npm run build` → clean.

## Discipline-extension vs new-domain choice

This ship reuses existing patterns (cross-rootdir duck typing from v823; fail-soft swallowing from #10427; structural-conformance test from v829). v831 doesn't introduce a new discipline doc; the THREE new candidate observations (Pick<T, K> handles, fail-soft fallback, local-interface redeclaration) all sit at 1 instance and require a 2nd instance before codification consideration.

## What was deferred

- **Selector wire as 2nd production caller** — v832 next.
- **`tests/integration/` end-to-end verification of the wire (copper ↔ RosettaConceptFallback)** — v832.
- **Production caller wiring `fallbackProvider`** — operator-controlled; v832 demonstrates the pattern.
- **Bounded-learning calibration of `lowConfidenceThreshold`** — needs production observation data first.
- **Codification of the 4 eligible patterns** — v833 codify ship at chain close.

## Verification trail

| Step | Result |
|---|---|
| `npm run build` | PASS |
| `npx vitest run .college/integration/rosetta-concept-fallback.test.ts` | 9 PASS / 0 fail |
| `npx vitest run .college/integration/` | 52 PASS / 0 fail (47 existing + 9 new) |
| Pre-tag-gate (full) | expected 17/17 PASS (step 13 within-ceiling) |

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 (atomic directive state) + Lesson #10184 (single-step main FF) + Lesson #10197 (STORY-gate post-bump-version). Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- No deviations from the canonical sequence.
- Second ship of v830-832 arc. v832 will need the same sequence one more time.

## Forward path

- **v832** — `tests/integration/copper-rosetta-fallback-wire.integration.test.ts` (mirrors v829's pattern) + wire `RosettaConceptFallback` into `src/orchestration/selector.ts` as 2nd production caller. Closes Option C arc.
- **v833** — Codify ship for 4 eligible patterns: cross-rootdir wire (4 inst.), `onPredictions` (2 inst.), #10433 LOC-band refinement (3 inst.), substrate-consumer hook pair (likely 2nd instance accrues at v832).

After v833, NASA 1.179 forward-cadence is the strong-default (50 consecutive ships at 1.178 expected by then).

## References

- Predecessor: v1.49.830 (`docs/release-notes/v1.49.830/`)
- v827-829 chain handoff: `.planning/HANDOFF-2026-05-27-v1.49.827-829-chain-3-of-5-ships-shipped.md`
- ConceptFallbackProvider contract: `src/predictive-skill-loader/fallback.ts` (v1.49.830)
- `RosettaCore` engine: `.college/rosetta-core/engine.ts`
- `ConceptRegistry`: `.college/rosetta-core/concept-registry.ts`
- This ship's impl: `.college/integration/rosetta-concept-fallback.ts`
- Cross-rootdir duck-typing precedent: v1.49.823 (`docs/release-notes/v1.49.823/`)
