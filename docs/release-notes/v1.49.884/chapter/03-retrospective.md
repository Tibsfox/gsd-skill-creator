# v1.49.884 — Retrospective

## What worked

**Mirror-pattern execution.** The v837 `predictive-low-confidence-events.ts` was a clean template; the new `observation-retention-events.ts` differs only in event-kind names (`too_aggressive` / `too_lax` vs `useful` / `not_useful`) and the JSONL identifier strings. Polarity sign chosen to match token-budget shape (both control "fire frequency" via raise/lower) rather than predictive's inverted shape. The mirror discipline kept design churn near zero.

**Failing-test feedback was correct and minimal.** After the wired-status flip in `observation-sources.ts`, exactly one test failed (the `wired: false` assertion). One additional test was updated to add a positive read-path round-trip mirroring the existing predictive case. The summary-mode test in `bounded-learning.test.ts` needed `5 → 6` thresholds. Three test surface points touched, all in the same direction.

**Scope honesty.** The original v883-handoff "wiring these closes the verify-axis path" framing implied a 1-ship close. After exploration revealed the substrate-consumer build was missing (no production code reads `observation.retention_days` and acts on it), scope was pulled back to v837's pattern: read-side + CLI ships now, substrate auto-emit + integration test deferred. The verify-overdue scanner still shows UNWIRED — that's the honest signal that the wire is incomplete.

## What didn't work

**Initial scope ambiguity.** The handoff's "wiring these" wording obscured that EACH of the 2 UNWIRED thresholds requires 3 ships per #10439 (registration → CLI → substrate auto-emit). The scope was clear only after reading the verify-overdue scanner source + the existing wire patterns. Future handoffs for calibrate-axis work should explicitly state the 3-ship breakdown per threshold.

## Verdict on scope

Calibrate-axis investment via #10428 verify-axis. v884 spent one ship on the read-side half for ONE threshold; v886+ may complete the substrate auto-emit half OR pivot to other axes. The remaining UNWIRED threshold (`token_budget.max_percent`) is untouched this ship — it has the additional design question of how `max_percent` event semantics differ from `warn_at_percent`'s (which currently share the same JSONL file).

## Promotion-eligible candidates accumulated this ship

Nothing this ship — all design decisions reused existing established patterns (#10425 math-check, #10426 per-class registry, #10427 failure-mode contracts, #10439 CLI + substrate duality). The v837 mirror-pattern itself could be promoted to a discipline ("calibrate-axis read-side wire recipe") if a third instance lands (next UNWIRED threshold wire would qualify).

## Forward path

Per the v883 handoff's option ordering (operator-selected at session start):

1. **v885: LoaderContext chip-down opening** — first test of the v868-v882 wire-shape catalog playbook (#10444, #10445, #10447, #10448) on a third Tier-E chokepoint surface.
2. **v886: Counter-cadence cleanup-mission** — bundle accumulated below-threshold operational observations.

Substrate auto-emit for `observation.retention_days` is a candidate when a retention-sweep substrate consumer is built; not on the immediate critical path.
