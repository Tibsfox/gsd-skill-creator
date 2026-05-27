# v1.49.810 — Context

## Provenance

- **Source:** T1.3 recon doc at `.planning/T1.3-RECON-2026-05-27.md`, written as Ship 4 of the v807-809 chain. Recon recommended Option A as the smallest credible GAP-2 closure.
- **Trigger:** Ship 1 of the v810-814 chain (T1.3 Option A → batch registry chip → ProcessContext chip → STATE.md drift closure → codification audit) selected by the operator at v809 handoff.
- **Predecessor ship:** v1.49.809 (KNOWN_UNWIRED Chip 1: NpmRegistryAdapter); shipped 2026-05-27 ~07:55 UTC.

## Position in the chain

| Ship | Wedge | Wall-clock | Status |
|---|---|---|---|
| 1 | **T1.3 Option A — gnn-predictor wire into copper activation** | **~30-40 min** | **v810 shipped** |
| 2 | Batch chip 4 sibling registry adapters | ~15-20 min | pending |
| 3 | First ProcessContext chip | ~30-40 min | pending |
| 4 | Post-T14-reset STATE.md drift closure | ~30-45 min | pending |
| 5 | Codification audit + tentative-observation promotion | ~30-60 min | pending |

Chain cumulative wall-clock at v810 close: ~30-40 min (1 of 5 ships).

## Why this wire (T1.3 Option A)

The T1.3 recon doc framed three options for the College-of-Knowledge consumer-engine GAP-2 closure:
- **Option A** — wire `predictSkills()` (actually `predictNextSkills`) into an existing skill-activation call site. Smallest, observability-only.
- **Option B** — wire `ObservationBridge` into skill-activate events. Medium, requires event-schema alignment.
- **Option C** — wire `RosettaEngine.translate()` as confidence-bounded fallback. Largest, new decision logic.

Option A was the recon's recommendation as Ship 1 because:
1. It establishes a real `src/` → predictive-skill-loader → `.college/` import chain (the audit's minimum credible threshold for "consumer engine wired").
2. It costs ~1 ship with no new decision logic, threshold tuning, or schema reconciliation.
3. It builds on the most-developed branch (the predictive-skill-loader has a public `predictNextSkills` surface already designed for wiring).
4. It does not preclude Options B/C — those become independent follow-on ships once Option A satisfies the audit ledger.

## Engine state crossover

NASA degree sustains at **1.178** for the 28th consecutive ship. Counter-cadence count sustains at 5.

The codify ⟂ consume ⟂ calibrate triangle (per #10428):
- **Codify:** all 4 audit codify-levers shipped at v805 (#10417/#10428/#10429/#10430).
- **Consume:** v809 was the first chip-down ship (egress KNOWN_UNWIRED 16 → 15); v810 is the first T1.3 substrate-consumer wire (GAP-2 → CLOSED at minimum threshold). Consume-side cadence continues.
- **Calibrate:** wired and active (5 of 6 thresholds calibratable; bounded-learning observation streams active).
- **Observe:** v808 added adoption-trends; v810 establishes a reachable observability hook for skill-activation predictions.

## Predecessor handoff reference

See `.planning/HANDOFF-2026-05-27-v1.49.807-808-809-s5-s2-chip-chain-shipped.md` for the chain origin: the v807-809 ship summaries, the closed-audit-retrospective ledger, and the operator's v810-814 chain selection.

T1.3 recon doc: `.planning/T1.3-RECON-2026-05-27.md` (working-tree only).

## What this ship enables

- **T1.3 ledger entry promotes to GAP-2 → CLOSED.** The audit retrospective can cite a real `src/` → `.college/` import chain.
- **Future T1.3 ships (Option B, Option C) become independent.** They no longer require Option A as a precondition.
- **Future Copper-chipset observability work** can wire `onPredictions` into dashboard/activity-tab surfaces without modifying `activation.ts` again.
- **The predictive-skill-loader public surface is now actively consumed** beyond its own tests. Future evolution of `predictNextSkills` has a non-test caller to maintain compatibility with.

## Gate G12 byte-identical preservation

The wire site is `src/chipset/copper/activation.ts`, which is outside `src/orchestration/`. The Gate G12 invariant (orchestration byte-identical with the predictive-skill-loader flag off) is satisfied by location. The `orchestration-byte-identical.test.ts` enforcement test passes unchanged (8/8 PASS).

Two-layer default-off contract:
1. `ActivationContext.onPredictions` unset → no predictor work runs (subscriber gate).
2. `onPredictions` set but `gsd-skill-creator.upstream-intelligence.predictive-skill-loader.enabled` flag off → `predictNextSkills` returns `[]` immediately and reads no files (predictor's own opt-in contract).

Both layers default to OFF. Behavior change for any existing caller is byte-identical.

## Forward observation: predictor invocation cost at scale

When BOTH layers are turned on, every successful lite/full skill activation invokes `predictNextSkills` which calls `loadCollegeGraph` (file IO over ~48 concepts across 8 departments) + `buildLinkFormationModel` + `predictLinks`. No caching layer between activations.

For an opt-in consumer that wires the hook + flag, this means:
- File IO on every activation (mitigatable by hoisting the model build outside the hook in the consumer).
- GNN message-passing on every activation (mitigatable by per-activation memoization at the consumer side).

Not in this ship's scope per #10416 lightest-wire. Flagged for forward observation when the first opt-in production consumer lands.
