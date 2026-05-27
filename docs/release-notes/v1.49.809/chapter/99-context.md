# v1.49.809 — Context

## Provenance

- **Source:** v806 ship's `KNOWN_UNWIRED` allowlists (`src/security/egress-context-audit.test.ts`) + the v806 forward-path note ("KNOWN_UNWIRED migration cadence — 16 egress + 38 process callers tracked").
- **Trigger:** Ship 3 of the 4-ship chain (S5 → S2 → KNOWN_UNWIRED chip → T1.3 recon) selected by the operator at v806 handoff.
- **Predecessor ship:** v1.49.808 (S2 Adoption Telemetry Trend Report); shipped 2026-05-27 ~07:00 UTC.

## Position in the chain

| Ship | Wedge | Wall-clock | Status |
|---|---|---|---|
| 1 | S5 — Normalizer gate idempotency | ~40-50 min | v807 shipped |
| 2 | S2 — Adoption telemetry trend report | ~30-40 min | v808 shipped |
| 3 | **KNOWN_UNWIRED chip — NpmRegistryAdapter** | **~30-35 min** | **v809 shipped** |
| 4 | T1.3 College of Knowledge recon | ~20-30 min | pending |

Chain cumulative wall-clock at v809 close: ~100-125 min for 3 ships (~35-42 min per ship average).

## Why this chip

`NpmRegistryAdapter` was the first KNOWN_UNWIRED entry that:
- Has a sibling consumer pattern (5 registry adapters share one interface)
- Was a known load-bearing surface (the orchestrator's swallow catch was a latent #10427 bug)
- Was easy to migrate (single fetch call site, simple URL, no streaming or websocket complexity)

Wiring it first establishes the chip pattern for the 4 sibling adapters (cargo, conda, pypi, rubygems) AND surfaces the orchestrator-level swallow bug that affects ALL adapter callers, not just npm. The interface widening + orchestrator catch fix are one-time costs that pay back across future chips.

## Engine state crossover

NASA degree sustains at **1.178** for the 27th consecutive ship. Counter-cadence count sustains at 5.

The codify ⟂ consume ⟂ calibrate triangle (per #10428):
- **Codify:** all 4 audit codify-levers shipped at v805 (#10417/#10428/#10429/#10430).
- **Consume:** v809 is the FIRST explicit chip-down ship since the v806 chokepoint extension introduced the KNOWN_UNWIRED tracking. Begins the consume-side cadence.
- **Calibrate:** wired and active (5 of 6 thresholds calibratable; bounded-learning observation streams active).
- **Observe:** v808 added adoption-trends; v809 demonstrates the audit-test as a load-bearing observability surface via the docstring false-positive catch.

## Predecessor handoff reference

See `.planning/HANDOFF-2026-05-27-v1.49.806-s6-chokepoint-extension-shipped.md` for the chain origin: the KNOWN_UNWIRED tables, the 4-ship menu, and the natural 5-1-1 alternation framing per #10430.

## What this ship enables

- **Future batch-chip ships** can wire 4 sibling registry adapters in a single ~15-20 min ship (interface + orchestrator already done).
- **ProcessContext chip-down** can begin using the same playbook applied to the 38 process callers. v810+ could be the first ProcessContext chip.
- **Orchestrator-level denial-rethrow is now substrate** — any future ctx-wired call site within the AuditOrchestrator automatically inherits the correct failure-mode contract.

## Forward observation: orchestrator-level denial-rethrow coverage gap

The new orchestrator behavior (instanceof check + re-throw at audit-orchestrator.ts:116) has no direct test in the 5-test `audit-orchestrator.test.ts`. The npm.test.ts EgressContext integration tests cover the adapter-level wire; the orchestrator-level rethrow is exercised only transitively. Worth a dedicated orchestrator test if a future chip ship touches the orchestrator again. Flagged for forward observation, not scoped into this ship per #10416 lightest-wire.
