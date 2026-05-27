# v1.49.832 — Context

## Provenance

Final ship of the v830-832 Option C arc. Predecessor v831 closed the implementation half (RosettaConceptFallback in .college/integration/); v832 closes the integration half (selector 2nd-caller wire + tests/integration/ verification). Operator authorization: same Option-C-arc authorization issued at session pickup.

## What this ship adds

```
src/orchestration/selector.ts                                           [+35 LOC]
src/orchestration/__tests__/selector.test.ts                            [+115 LOC, 4 new tests]
tests/integration/copper-rosetta-fallback-wire.integration.test.ts      [NEW ~190 LOC, 4 tests]
```

No .college/ files modified. No NEW src/ files (selector wire is a mirror, not a new module).

## Recon trail (per #10422 ledger-driven work discipline)

1. **Confirm Gate G12 byte-identical preservation:** Reread `src/predictive-skill-loader/__tests__/orchestration-byte-identical.test.ts`. Test hashes src/orchestration/ files at TEST runtime (beforeAll/afterAll) — selector.ts source-edits via git ship between test runs, so the byte-identical invariant holds. Verified: 8/8 G12 tests still PASS after the selector wire change.
2. **Confirm selector wire shape matches copper exactly:** Read `src/chipset/copper/activation.ts:241-280` (v830 `emitPredictions` post-fallback-extension) and `src/orchestration/selector.ts:280-310` (v826 `_emitPredictions`). Both have the identical `Promise.resolve().then(async () => { ... }).catch(() => {})` shape. Mirror the v830 extension at the selector boundary.
3. **Mirror the v830 changes:** (a) import switch `predictNextSkills` → `predictNextSkillsWithMeta` + `ConceptFallbackProvider` type. (b) Add `fallbackProvider?: ConceptFallbackProvider` to `SelectorOptions`. (c) Add private field + constructor assignment. (d) Replace `_emitPredictions` body with the v830 copper shape (two-layer subscriber gate + fallback fire). NO other selector.ts changes.
4. **Add selector unit tests:** Mirror the 4 copper fallback tests added at v830. Same describe-block shape; same recordingProvider helper pattern; assertions adapted to the multi-decision selector behavior (each ACTIVATED decision fires its own fallback).
5. **Add cross-rootdir integration test:** Mirror v829's `college-observation-bridge-wire.integration.test.ts` pattern (compile-time conformance check + happy-path routing + zero-side-effect + fail-soft). Test name: `copper-rosetta-fallback-wire.integration.test.ts` (matches `tests/**/*.integration.test.ts` include pattern for vitest's `integration` project).
6. **Verify:** `npx vitest run --project root src/orchestration/__tests__/selector.test.ts` → 15 PASS. `npx vitest run --project integration tests/integration/copper-rosetta-fallback-wire.integration.test.ts` → 4 PASS. `npm run build` → clean. Combined surface (75 tests across 7 files) all PASS.

## Discipline-extension vs new-domain choice

This ship reuses TWO well-established patterns:
1. **Substrate-consumer wire mirror** (v810 → v826 → v832: 3 ships of the same shape).
2. **Cross-rootdir integration test** (v829 → v832: 2 ships of the same shape).

Neither requires a new discipline doc. The patterns are codification-eligible at v833 — the 3-ship and 2-ship evidence sets respectively give the codify ship rich material to work from.

## What was deferred

- **Codification of the 4 eligible patterns** (cross-rootdir wire, substrate-consumer hook pair, onPredictions, #10433 LOC-band) — v833 codify ship.
- **Production caller wiring `fallbackProvider`** — operator-controlled; v832 demonstrates the wire works END-to-END but doesn't wire any production code to use it. Adoption is operator-driven.
- **Bounded-learning calibration of `lowConfidenceThreshold`** — needs production observation data first. Future milestone.
- **NASA 1.179 forward-cadence** — 50 consecutive ships at 1.178; widest pressure margin of any open item. Post-v833.

## Verification trail

| Step | Result |
|---|---|
| `npm run build` | PASS |
| `npx vitest run --project root src/orchestration/__tests__/selector.test.ts` | 15 PASS / 0 fail (4 new + 11 existing) |
| `npx vitest run --project integration tests/integration/copper-rosetta-fallback-wire.integration.test.ts` | 4 PASS / 0 fail |
| `npx vitest run --project root src/predictive-skill-loader/ src/chipset/copper/activation.test.ts src/orchestration/__tests__/selector.test.ts` | 75 PASS / 0 fail |
| Pre-tag-gate (full) | expected 17/17 PASS (step 13 within-ceiling) |

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 (atomic directive state) + Lesson #10184 (single-step main FF) + Lesson #10197 (STORY-gate post-bump-version). Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- No deviations from the canonical sequence.
- Third and final ship of v830-832 Option C arc. Chain closes after this ship.

## Forward path

- **v833** — Codify ship for the 4 eligible patterns accumulated through the chain.
- **NASA 1.179** — Strong-default post-v833 (50 consecutive ships at 1.178 is the widest open margin).
- **Continued ProcessContext singleton chips** — ~13 singletons remain in KNOWN_UNWIRED Process ledger.
- **T2.1 v1.50 unblock-or-archive decision** — operator-bounded; 0-N ships.

## References

- Predecessor: v1.49.831 (`docs/release-notes/v1.49.831/`)
- v827-829 chain handoff: `.planning/HANDOFF-2026-05-27-v1.49.827-829-chain-3-of-5-ships-shipped.md`
- ConceptFallbackProvider contract: `src/predictive-skill-loader/fallback.ts` (v1.49.830)
- RosettaConceptFallback impl: `.college/integration/rosetta-concept-fallback.ts` (v1.49.831)
- This ship: `src/orchestration/selector.ts` + `tests/integration/copper-rosetta-fallback-wire.integration.test.ts`
- Cross-rootdir wire precedents: v823, v829, v830, v831
- First production caller of fallbackProvider: copper at v1.49.830
- Second production caller of fallbackProvider: selector at v1.49.832 (this ship)
- Gate G12 byte-identical preservation: `src/predictive-skill-loader/__tests__/orchestration-byte-identical.test.ts`
