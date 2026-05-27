# v1.49.826 — Context

## Provenance

Third (and final) ship of the v824-826 chain. Operator selected items 2/3/4 from the v823 handoff:

- Item 2 (Codify ship) → v824 ✓
- Item 3 (git/core 3-file batch) → v825 ✓
- Item 4 (T1.3 Ship 3 = Option A) → v826 (this ship; pivoted per recon)

## Recon pivot

Item 4's framing said "Option A (gnn-predictor wire into a skill-activation call site; not yet shipped)" — but recon surfaced that Option A's COPPER wire was already shipped at v1.49.810. Same-day, 16 ships earlier.

The recon trail:
1. Read v823 handoff item #4.
2. Located `src/predictive-skill-loader/gnn-predictor.ts` + `src/chipset/copper/activation.ts`.
3. Found `predictNextSkills` already imported in copper/activation.ts; `onPredictions` hook already in `ActivationContext`; `emitPredictions` already wired at lite/full activation paths.
4. `git log --oneline -- src/chipset/copper/activation.ts` → first match: "v1.49.810 T1.3 Option A gnn-predictor wire into copper activation."
5. v810 release-notes confirmed Option A was shipped.
6. The v823 handoff item #4 framing was inaccurate.

The pivot: interpret item #4 as the SPIRIT of the recommendation — wire another production caller of the onPredictions pattern. Picked `src/orchestration/selector.ts` ActivationSelector (the M5 production skill selector) as the target. This is structurally analogous to copper/activation.ts but is in a production code path with actual external callers.

## What this ship wires

| Field | Value |
|---|---|
| File | `src/orchestration/selector.ts` |
| Class | `ActivationSelector` |
| Field added | `SelectorOptions.onPredictions?: (currentSkill, predictions) => void \| Promise<void>` |
| Trigger | Each activated decision in `select()` (after trace writes) |
| Hook semantics | Subscriber-gated; fire-and-forget; errors swallowed |
| Inner call | `predictNextSkills(currentSkill, {})` (default-off flag → empty predictions) |
| Tests added | 3 (invocation, subscriber-gate, fire-and-forget swallow) |
| LOC delta | ~30 src + ~50 test |

## Discipline-extension vs new-domain choice

This ship DOES NOT extend any discipline manifest entry. It DOES apply an existing wire pattern (onPredictions) to a new caller. The pattern is now at 2 instances:

| Instance | Ship | Caller | Hook surface |
|---|---|---|---|
| 1 | v1.49.810 | `src/chipset/copper/activation.ts` PipelineActivationDispatch | `ActivationContext.onPredictions` |
| 2 | v1.49.826 | `src/orchestration/selector.ts` ActivationSelector | `SelectorOptions.onPredictions` |

Per #10426 (cross-class registry extraction at SECOND class instance), the pattern is now at the codification threshold. A future codify ship can promote this to a discipline doc. Candidate doc location: `docs/observation-hook-discipline.md` or extend `docs/architecture-retrofit-patterns.md` with a new sub-pattern.

The naming question is open for the codify ship:
- "Subscriber-gated observation hook pattern"
- "onPredictions wire pattern"
- "Substrate-consumer subscriber pattern"

The pattern body — subscriber-gated default-off + fire-and-forget + error-swallow + inner-call-to-substrate — is invariant across both instances.

## What was deferred

- **Codification of onPredictions pattern** — defer to a future codify ship per the v824-826 chain rhythm (~7-10 ships per codify ship per #10428). Next codify ship would naturally include this + possibly cross-rootdir wire pattern if a 2nd instance accumulates.
- **T1.3 application-boundary wire** — instantiate ObservationBridge at the application boundary (item 5 in v823 handoff). Different branch of T1.3 closure; not done this ship.
- **T1.3 Option C** — RosettaEngine.translate() confidence-bound fallback (largest closure, ~2-3 ships). Not done this ship.
- **NASA 1.179** — 44 consecutive ships at 1.178 after this chain; pressure continues to build. Now THE most visible open item by an even wider margin.

## Verification trail

| Step | Result |
|---|---|
| `npm run build` | PASS |
| `npx vitest run src/orchestration/__tests__/selector.test.ts` | 11 PASS (was 8; +3 new) |
| `npx vitest run src/orchestration/ src/predictive-skill-loader/ src/chipset/copper/` | 36 files / 383 tests PASS |
| Pre-tag-gate (full) | expected 17/17 PASS (step 13 within-ceiling 39 ≤ 41 PASS) |

## Forward path

Chain CLOSED at v1.49.826. Next operator decisions return to the post-chain forward-path list (see README).

## References

- Predecessor: v1.49.825 (`docs/release-notes/v1.49.825/`)
- v823 handoff (with the now-known-inaccurate item #4 framing): `.planning/HANDOFF-2026-05-27-v1.49.816-823-chain-8-ships-shipped.md`
- v810 Option A original ship: `docs/release-notes/v1.49.810/`
- T1.3 recon: `.planning/T1.3-RECON-2026-05-27.md`
- v823 ObservationBridge wire (Option B closure): `docs/release-notes/v1.49.823/`
