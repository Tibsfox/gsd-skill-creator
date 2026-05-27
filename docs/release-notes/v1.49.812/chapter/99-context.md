# v1.49.812 — Context

## Provenance

- **Source:** v806 chokepoint extension's `ProcessContext.KNOWN_UNWIRED` allowlist (`src/security/process-context-audit.test.ts`, 38 grandfathered callers).
- **Trigger:** Ship 3 of the v810-814 chain (T1.3 Option A → batch registry chip → ProcessContext chip → STATE.md drift closure → codification audit) selected by the operator at v809 handoff.
- **Predecessor ship:** v1.49.811 (Batch Chip: cargo + conda + pypi + rubygems Registry Adapters); shipped 2026-05-27 ~09:00 UTC.

## Position in the chain

| Ship | Wedge | Wall-clock | Status |
|---|---|---|---|
| 1 | T1.3 Option A — gnn-predictor wire into copper activation | ~30-35 min | v810 shipped |
| 2 | Batch chip 4 sibling registry adapters | ~20-25 min | v811 shipped |
| 3 | **First ProcessContext chip** | **~25-30 min** | **v812 shipped** |
| 4 | Post-T14-reset STATE.md drift closure | ~30-45 min | pending |
| 5 | Codification audit + tentative-observation promotion | ~30-60 min | pending |

Chain cumulative wall-clock at v812 close: ~75-90 min (3 of 5 ships).

## Why this chip

`intelligence/analyzer/git.ts` was chosen as the first ProcessContext chip because:
- Single execFile site (cleanest demonstration of the pattern)
- Self-contained "best-effort observability" surface — returns null on any failure, perfect setting for the #10427 hoist-and-instanceof pattern
- Existing swallow-everything `catch {}` block — exactly the failure-mode-contract bug v809 caught at osv-client, here in a controllable greenfield setting
- 114 LOC, focused
- Only one src/ caller (`intelligence/analyzer/core.ts:120`) and it passes no ctx — wire is backward-compatible by default

Picking a clean candidate for the first chip in a new chokepoint family establishes the pattern; future ProcessContext chips can follow this template (the same way npm.ts is the template for the 4 sibling registry adapters wired at v811).

## Engine state crossover

NASA degree sustains at **1.178** for the 30th consecutive ship. Counter-cadence count sustains at 5.

The codify ⟂ consume ⟂ calibrate triangle (per #10428):
- **Codify:** all 4 audit codify-levers shipped at v805 (#10417/#10428/#10429/#10430).
- **Consume:** v809 first EgressContext chip (npm); v810 T1.3 GAP-2 substrate-consumer wire; v811 batch EgressContext chip (4 adapters); v812 first ProcessContext chip. Consume cadence has been intensive across this chain — 4 of 5 ships in v810-814 are consume-class.
- **Calibrate:** wired and active (5 of 6 thresholds calibratable).
- **Observe:** adoption-trends (v808), audit-test KNOWN_UNWIRED ledger (v806+v809+v811+v812), git-metadata-via-ProcessContext (this ship).

## Predecessor handoff reference

See `.planning/HANDOFF-2026-05-27-v1.49.807-808-809-s5-s2-chip-chain-shipped.md` for the chain origin: the v806 KNOWN_UNWIRED tables (16 egress + 38 process), the 4-ship menu, and the 5-1-1 alternation framing per #10430.

## What this ship enables

- **Process `KNOWN_UNWIRED` 38 → 37.** First entry off the process backlog.
- **Cross-chokepoint pattern transfer validated.** v809 EgressContext template → v812 ProcessContext template with one symbol substitution. Sibling chokepoints share a common shape (v806 design intent).
- **Family-batch ProcessContext chips become candidates** — once the first chip in a family is done, the v811 batch pattern applies. Natural next batches: aminet (5 files), git/core (4 files), scribe/netlist-renderer (3 files), terminal (2 files).

## Migration progress (cumulative through v812)

| Surface | At v806 (chokepoint introduction) | At v812 (this ship) | Δ |
|---|---|---|---|
| Egress `KNOWN_UNWIRED` | 16 | 11 | −5 (2 chip ships: v809 + v811) |
| Process `KNOWN_UNWIRED` | 38 | **37** | **−1 (1 chip ship: v812)** |

## Forward observation: PROJECT.md drift at threshold

PROJECT.md "Latest shipped release" was set to v809 at the v810 pre-bump. After v811+v812 ships, drift is now 2 patches (within threshold=3). The next ship (v813) without a PROJECT.md refresh would push to drift=3 (at threshold); v814 would BLOCK at step 17. Bundle a PROJECT.md refresh into v813 or v814's pre-bump update.

## Forward observation: instanceof check pattern at 2 instances

`instanceof ProcessContextDenied` (this ship) joins `instanceof EgressContextDenied` (v809 orchestrator) as the second instance of "re-throw security-denial in a swallow catch" code. Per #10426 (cross-class registry extraction at 2nd-3rd instance), this is borderline. If a 3rd instance lands, extract a shared `reThrowSecurityDenials(err)` helper. For now, the 2-line pattern is below the abstraction threshold per #10416.
