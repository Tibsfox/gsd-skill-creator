# v1.49.811 — Context

## Provenance

- **Source:** v806 chokepoint extension's `EgressContext.KNOWN_UNWIRED` allowlist, with v809 npm wire as the established pattern template.
- **Trigger:** Ship 2 of the v810-814 chain (T1.3 Option A → batch registry chip → ProcessContext chip → STATE.md drift closure → codification audit) selected by the operator at v809 handoff.
- **Predecessor ship:** v1.49.810 (T1.3 Option A: gnn-predictor Wired Into Copper Activation); shipped 2026-05-27 ~08:30 UTC.

## Position in the chain

| Ship | Wedge | Wall-clock | Status |
|---|---|---|---|
| 1 | T1.3 Option A — gnn-predictor wire into copper activation | ~30-35 min | v810 shipped |
| 2 | **Batch chip 4 sibling registry adapters** | **~20-25 min** | **v811 shipped** |
| 3 | First ProcessContext chip | ~30-40 min | pending |
| 4 | Post-T14-reset STATE.md drift closure | ~30-45 min | pending |
| 5 | Codification audit + tentative-observation promotion | ~30-60 min | pending |

Chain cumulative wall-clock at v811 close: ~50-60 min (2 of 5 ships).

## Why this batch

v809 wired the first registry adapter (npm) and did the load-bearing infrastructure work: widening the `RegistryAdapter` interface to admit `ctx?`, threading `ctx` through `AuditOrchestrator`, and fixing the latent `EgressContextDenied` swallow at `audit-orchestrator.ts:116` via `instanceof` re-throw. With that infrastructure in place, the 4 remaining sibling registry adapters became candidates for mechanical batch chipping — no interface or orchestrator work needed, just per-adapter wires + per-adapter tests.

The 4 adapters all import the same `RegistryAdapter` interface, all use `fetch(url)` against an HTTPS registry endpoint, and all have a similar shape (`null on 404, throw on other errors`). The only variance:
- **cargo** adds a `User-Agent` header (doesn't affect the wire)
- **conda** has a 2-channel form (conda-forge + bioconda) via a shared `tryChannel` helper (ensure threaded into the helper)
- **pypi** does more response-body parsing for `isDeprecated` (doesn't affect the wire)
- **rubygems** is the simplest

The variance is contained inside each adapter's `fetchHealth` body; the ctx-wire shape is uniform.

## Engine state crossover

NASA degree sustains at **1.178** for the 29th consecutive ship. Counter-cadence count sustains at 5.

The codify ⟂ consume ⟂ calibrate triangle (per #10428):
- **Codify:** all 4 audit codify-levers shipped at v805 (#10417/#10428/#10429/#10430).
- **Consume:** v809 was the first chip; v810 was T1.3 GAP-2 substrate-consumer wire; v811 is the second chip (batch). Consume cadence is now well-paced.
- **Calibrate:** wired and active (5 of 6 thresholds calibratable).
- **Observe:** adoption-trends (v808), audit-test KNOWN_UNWIRED ledger (v806+v809+v811), conda per-channel audit records (v811).

## Predecessor handoff reference

See `.planning/HANDOFF-2026-05-27-v1.49.807-808-809-s5-s2-chip-chain-shipped.md` for the chain origin: the chip-down menu, the v806 KNOWN_UNWIRED tables, and the 5-1-1 alternation framing per #10430.

## What this ship enables

- **Egress KNOWN_UNWIRED is now 11 (was 15).** Drains ~27% of the egress backlog in one ship.
- **The post-infrastructure chip cadence is now demonstrated.** Future post-infrastructure batches can be planned at ~5 min per mechanical adapter.
- **All 5 registry adapters are wired uniformly.** Future registry additions inherit the wire shape automatically.

## Migration progress (cumulative through v811)

| Surface | At v806 (chokepoint introduction) | At v811 (this ship) | Δ |
|---|---|---|---|
| Egress `KNOWN_UNWIRED` | 16 | **11** | **−5 over 2 chip ships** |
| Process `KNOWN_UNWIRED` | 38 | 38 | 0 (untouched) |

## Forward observation: shared test-helper extraction at 5 instances

The 5 adapter test files now have nearly-identical `EgressContext integration` describe blocks. The shape is:

```ts
describe('EgressContext integration', () => {
  it('throws EgressContextDenied when ctx restricts the registry URL', async () => { /* denial */ });
  it('records an audit entry when ctx allows the URL', async () => { /* audit */ });
});
```

Per #10426, cross-class registry extraction triggers at the 2nd-3rd instance. The test variance (conda has 2 channels → 2 audit records, others have 1) means a shared helper would need a per-adapter shape override (audit record count + URL regex). Net: borderline. Re-evaluate at a 6th adapter; if no 6th adapter ever lands, the 5-copy shape is acceptable per #10416. Flagged as forward observation, not scoped into this ship.

## Forward observation: orchestrator-level denial-rethrow coverage gap

Still open (carried forward from v809 close). The orchestrator's `instanceof EgressContextDenied` re-throw at `audit-orchestrator.ts:116` has no direct test in `audit-orchestrator.test.ts` — only transitive coverage via the now-5 adapter EgressContext integration tests. Worth a dedicated test if a future chip touches the orchestrator again.
