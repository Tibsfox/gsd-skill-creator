> Following v1.49.809 — _KNOWN_UNWIRED Chip 1: NpmRegistryAdapter_, v1.49.810 ships T1.3 Option A: the first real `src/ -> predictive-skill-loader -> .college/` import chain. Adds an optional subscriber-gated `onPredictions` hook to `PipelineActivationDispatch` so a successful skill activation can surface complementary-skill predictions to an observability subscriber. Closes GAP-2 in the substrate-to-consumer gap with the lightest viable wire.

# v1.49.810 — T1.3 Option A: gnn-predictor Wired Into Copper Activation

**Shipped:** 2026-05-27

First substantive T1.3 deliverable (GAP-2 closure). Wires the predictive-skill-loader's public surface (`predictNextSkills`) into `src/chipset/copper/activation.ts` behind a subscriber-gated `onPredictions` hook. The wire respects the Gate G12 byte-identical invariant (copper is not in `src/orchestration/`) and the predictive-skill-loader's default-off opt-in flag — two safety layers ensure zero observable behavior change for callers that do not set the hook.

## What shipped

- **MODIFIED** `src/chipset/copper/activation.ts` — `ActivationContext` gains `onPredictions?: (currentSkill, predictions) => void | Promise<void>`. After a successful lite/full skill activation, the dispatch fires-and-forgets `predictNextSkills(currentSkill, {})` and passes the result to the hook. Subscriber-gated: when `onPredictions` is unset, no predictor work runs. Hook errors are swallowed so prediction-side failures cannot break activation.
- **MODIFIED** `src/chipset/copper/activation.test.ts` — adds 2 tests in a new `onPredictions hook (T1.3 substrate-consumer wire)` describe block: hook invocation with empty predictions (flag default-off path) and activation success even when the hook throws (fire-and-forget contract).
- **MODIFIED** `.planning/PROJECT.md` — pre-bump refresh of `Latest shipped release` from v806 to v809 (clears step-17 drift, which was at threshold=3 per the v807-introduced cap and would have BLOCKED otherwise).

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| Copper activation | +2 | hook invocation + fire-and-forget error swallow |
| **Total added** | **+2** | 35,182 → 35,184 in the full suite |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 28 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 5.

Manifest entries: **20 → 20** (UNCHANGED — wire ship, not a new discipline).
Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward: **8 → 8** (UNCHANGED).

## Audit-retrospective gap status

| Gap | Status at v809 | Status at v810 |
|---|---|---|
| GAP-2 (T1.3 college consumer engine) | recon complete; substrate-to-consumer gap framed | **Option A shipped — real `src/` → predictive-skill-loader → `.college/` import chain established** |

T1.3 closure rationale: `predictNextSkills` invokes `loadCollegeGraph` (which reads `.college/departments/*/concepts/*.ts`) and `predictLinks` (the GNN over the College adjacency). The wire from `src/chipset/copper/activation.ts` → `src/predictive-skill-loader/` → `.college/` is now real (i.e., reachable from a non-test src/ caller). The audit's "consumer engine wired" framing is satisfied at the minimum credible threshold per the T1.3 recon doc.

## Forward path

- **T1.3 Ship 2 = Option B** — wire `ObservationBridge` into `src/dashboard/activity-tab-toggle.ts` `skill-activate` events. Activates the observation side of the integration bridges.
- **Batch chip 4 sibling registry adapters** — cargo, conda, pypi, rubygems. ~15-20 min.
- **First ProcessContext chip** — 38 callers untouched.
- **NASA 1.179** — 28 consecutive at 1.178.
