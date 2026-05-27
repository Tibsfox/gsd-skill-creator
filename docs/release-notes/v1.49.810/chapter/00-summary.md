# v1.49.810 — T1.3 Option A: gnn-predictor Wired Into Copper Activation

**Released:** 2026-05-27
**Type:** substrate-consumer wire ship (T1.3 GAP-2 closure; no new substrate)
**Predecessor:** v1.49.809 — KNOWN_UNWIRED Chip 1: NpmRegistryAdapter
**Engine state:** UNCHANGED (NASA degree sustains at 1.178)
**Wedge:** wire `predictNextSkills` (predictive-skill-loader public surface) into `src/chipset/copper/activation.ts` so the College-of-Knowledge substrate becomes reachable from a real non-test `src/` caller. Closes GAP-2 in the audit-retrospective ledger at the minimum credible threshold.

## Summary

First T1.3 deliverable from the v807-810 chain. Adds an optional `onPredictions` hook to `ActivationContext` and invokes `predictNextSkills(currentSkill, {})` after a successful lite/full skill activation when the hook is set. Subscriber-gated: when `onPredictions` is unset, no predictor work runs; existing callers see zero behavior change. Combined with the predictive-skill-loader's own default-off opt-in flag, this is two safety layers — neither the wire nor the predictor does work unless both are explicitly enabled.

The choice of `src/chipset/copper/activation.ts` as the wire site respects the Gate G12 hard preservation invariant: `src/orchestration/` must remain byte-identical with the predictive-skill-loader flag off, and copper is not in orchestration. The byte-identical guard test (`orchestration-byte-identical.test.ts`) passes unchanged.

## Deliverables

| Path | Change | Notes |
|---|---|---|
| `src/chipset/copper/activation.ts` | MODIFIED | `ActivationContext.onPredictions?` added; `emitPredictions(currentSkill)` private helper called after successful skill activation (lite + full modes). Fire-and-forget; errors swallowed. Imports `predictNextSkills` from `../../predictive-skill-loader/index.js`. |
| `src/chipset/copper/activation.test.ts` | MODIFIED | +2 tests in `onPredictions hook (T1.3 substrate-consumer wire)` describe block. |
| `.planning/PROJECT.md` | MODIFIED | Pre-bump refresh: `Latest shipped release` v806 → v809 (clears step-17 drift gate at threshold). |

## Lessons applied (no new lesson IDs promoted this ship)

| Lesson | Application |
|---|---|
| #10412 (recon-first) | Read `src/chipset/copper/activation.ts` end-to-end, `src/predictive-skill-loader/index.ts` for the public API shape, and `src/predictive-skill-loader/gnn-predictor.ts` for the underlying contract BEFORE writing the wire. Recon surfaced: (a) the recon doc said `predictSkills(...)` but the actual function is `predictLinks(...)` with a higher-level wrapper `predictNextSkills`; (b) the predictive-skill-loader has a Gate G12 byte-identical invariant on `src/orchestration/` — wire must live outside orchestration; (c) the cleanest "subscriber-gated" shape is an optional `onPredictions` hook on the existing `ActivationContext`, not a new field on `ActivationResult`. |
| #10414 (chokepoint retrofit, optional ctx? pattern) | The hook is an optional `?` field on the existing context interface — zero call-site churn for callers that don't subscribe. |
| #10416 (lightest wire) | Resisted: adding a `predictions?: SkillPrediction[]` field to `ActivationResult` (pollutes every result for every caller); wiring all three Options A+B+C; building a per-activation prediction-cache. Chose: 1 hook field + 1 emit helper + 2 tests. |
| #10427 (failure-mode contracts) | The `emitPredictions` helper is observability-only (per the docstring), so the catch-and-swallow at its boundary is the correct failure mode (matches the existing async-mode fire-and-forget pattern in the file). Documented in the docstring. |

## What this ship is not

- Not a NASA degree advance. NASA sustains at 1.178.
- Not a wire of `ObservationBridge` or `RosettaEngine.translate()` — those are T1.3 Options B and C, deferred per the recon doc's recommendation.
- Not a default-on enablement. The predictive-skill-loader opt-in flag is still default-off; the `onPredictions` hook is still subscriber-gated. With both off, behavior is byte-identical for any existing caller.
- Not a change to `src/orchestration/` (would break Gate G12).

## Verification

- `npm run build` → PASS.
- `npx vitest run src/chipset/copper/activation.test.ts` → 17/17 PASS (15 existing + 2 new).
- `npx vitest run src/predictive-skill-loader/__tests__/orchestration-byte-identical.test.ts` → 8/8 PASS (Gate G12 preserved).
- `bash tools/pre-tag-gate.sh` → all 17 steps PASS. PROJECT.md drift = 0 after pre-bump refresh.
- Full suite at ship: 35,176 PASS / 45 skipped / 7 todo / 0 fail (counting the +2 wire tests as +8 once G12 + adoption-trends are counted, total 35,184).

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 28 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 5.

Manifest entries: **20 → 20** (UNCHANGED).
Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward: **8 → 8** (UNCHANGED).

## Migration progress

| Surface | At v809 | At v810 |
|---|---|---|
| GAP-2 (T1.3 college consumer) | recon complete | **Option A shipped (real src/ -> .college/ import chain)** |
| Egress `KNOWN_UNWIRED` | 15 | 15 (UNCHANGED) |
| Process `KNOWN_UNWIRED` | 38 | 38 (UNCHANGED) |

## Forward path

- **T1.3 Ship 2 = Option B** — `ObservationBridge` wire into `src/dashboard/`.
- **Batch chip 4 sibling registry adapters** — cargo, conda, pypi, rubygems (5-1-1 alternation per #10430).
- **First ProcessContext chip** — 38 callers untouched.
- **NASA 1.179** — 28 consecutive at 1.178; most visible open item.
