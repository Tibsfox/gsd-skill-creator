
# v1.49.845 — Lessons

## Promoted to ESTABLISHED in this ship

None. v1.49.845 ships a production-wire CLI command following established patterns.

## New lesson candidates (2; below threshold)

### CLI-as-production-caller pattern (sibling of #10428's CLI/auto-recorder duality)

**Observation:** When a substrate observation source is wired ahead of demand (no source-level production callers), a CLI command can be the first production caller. The CLI exercises the path through operator intervention; an auto-recorder via substrate hooks comes later. The pair (CLI + auto-recorder) becomes the steady-state shape.

**Why it matters:** Documents an architectural decoupling — observation source readiness is independent of source caller existence. v837 wired the source; v845 wires the CLI; future ship wires the auto-recorder. Three discrete ships for what could naively be one "wire the whole thing" task; the decoupling preserves per-ship discipline.

**Instances:** 1-2 (depending on whether v803 token-budget wire counts as precedent):
- v803 token-budget wire + CLI (the precedent; CLI shipped first, /sc:status auto-recorder added later).
- v845 predict-next CLI (this ship; auto-recorder TBD).

**Forward-test trigger:** any future calibratable-threshold wire that ships its observation source ahead of production callers.

**Promotion path:** if the auto-emit-from-substrate ship lands and the (CLI + auto-recorder) pair is observable, codify the pattern as #10428's CLI/auto-recorder duality sub-section in the next codify ship.

### Production-caller scope-reduction via path-narrowing

**Observation:** When a forward-flag names specific wrapper classes (e.g. "wire ActivationSelector with fallbackProvider") but the underlying PATH the wrapper exercises can be called directly without the wrapper, the simpler scope is to call the path directly. The wrapper is an integration concern, not a path concern. Especially relevant when the wrapper itself has no production callers (substrate ahead of demand).

**Why it matters:** Avoids architectural over-reach. v845 could have built a fake production caller of ActivationSelector that constructs a synthetic context just to exercise the wire. Instead, the CLI calls `predictNextSkillsWithMeta + appendPredictiveLowConfidenceEvent` directly — the same path, smaller surface, no synthetic wrapper.

**Instances:** 1 (v845).

**Forward-test trigger:** any future "production caller" task where the substrate's wrapper is incidental to the path being exercised.

**Promotion path:** wait for 2nd instance.

## Forward-test of existing lessons

### #10427 — Failure-mode contracts

**Status:** REINFORCED. The CLI's predict + record both surface errors in JSON output (operator-debuggable) but don't throw. Argument parsing (load-bearing for the operator's command) fails loudly with exit 1. Predict failure (forensic — operator wants to know but action can still proceed) is silent in stdout but visible in JSON. Event-record failure (best-effort — JSONL append is observability only) is silent in stdout but visible in JSON. The contract is preserved across the three failure modes.

### #10428 — Meta-cadence

**Status:** EXTENDED indirectly. The CLI-as-production-caller pattern is a sibling of #10428's existing operational axes; if promoted at next codify ship, would refine the calibrate-axis section's discussion of "what counts as the data source for a wired threshold".

### #10433 — Internal-helper pattern

**Status:** NOT EXERCISED. CLI is a thin wrapper, not a chokepoint wire.

### #10434 — Ratchet-ledger pattern

**Status:** NOT EXERCISED. KNOWN_UNWIRED counts unchanged.

### #10435 — Cross-rootdir wire pattern

**Status:** NOT EXERCISED. Single-rootdir (src/).

### #10436 — Two-layer closure

**Status:** REINFORCED at T14 publish step. v836 preservation gate fires on this ship's chapters.

### #10437 — Subscriber-gated observability-only context-hook pattern

**Status:** NOT EXERCISED.

## Tentative observations carried forward (consolidated)

### Eligible for next codify ship (3 candidates)

| Observation | Instances | Notes |
|---|---|---|
| Verify axis (numbered lesson) | 2 (v829 + v832) | Canonical-doc home set at v844. Awaiting promotion. |
| DI-executor + tokenized-argv wire shape | 3 (v825 + v843×2) | #10433 refinement. |
| Re-throw ProcessContextDenied from CLI swallow-catch | 2 (v820 + v842) | #10427 refinement. |
| Bidirectional enforcement completeness | 1-2 (v838 + v836) | DEFERRED v840 — classification ambiguous. |

### Below threshold

| Observation | Source | Notes |
|---|---|---|
| CLI-as-production-caller pattern | v845 (+ v803 precedent) | 1-2 instances; wait for 2nd if v803 doesn't count. |
| Production-caller scope-reduction via path-narrowing | v845 (THIS SHIP) | 1 instance; wait for 2nd. |
| Canonical-doc-decision ship pattern | v844 | 1 instance. |
| Verify-axis self-applicability (v843 mesh) | v844 forward-flag | 1 forward-flag. |
| Recent-vs-baseline-recent comparison pattern | v841 | 1 instance. |
| Drift-check noise as scoring-system feedback loop | v841 | 1 instance. |
| Codify-ship-as-recon-consolidator pattern | v840 | 1 instance. |
| Deferral-by-classification-ambiguity | v840 | 1 instance. |
| Auto-run-on-import as bootstrap-time tax | v836 | 1 instance. |
| Polarity convention for inverted-mechanic thresholds | v837 | 1 instance. |
| Other single-instance observations | various | various. |

## Cadence observation — operational-debt cluster CLOSED

v845 is the 5th and final ship of the new operational-debt cluster:

| Ship | Wall-clock | Type | Notes |
|---|---|---|---|
| v1.49.841 | ~40 min | Tooling | Quality-drift recalibration; `chip` release_type added |
| v1.49.842 | ~20 min | Batch chip | Terminal family (3 wires); Process: -3 |
| v1.49.843 | ~15 min | Batch chip | Mesh family (2 wires); Process: -2; DI-executor at 3-instance threshold |
| v1.49.844 | ~15 min | Doc-structure | Verify-axis canonical-doc home; numbered-lesson deferred |
| v1.49.845 | ~30 min | Production wire | predict-next CLI command (this ship) |

Cluster cumulative: ~2 hours wall-clock for 5 ships, closing 4 v840-deferred items (quality-drift recalibration, terminal family chip, mesh family chip, verify-axis canonical-doc) + 1 closing of the v837 production-caller forward-flag (this ship). The 5th remaining v840 item (NASA 1.179 forward-cadence) is the strong-default for next session.

The cluster shape is broader than typical operational-debt clusters: 1 tooling + 2 chips + 1 doc-structure + 1 production-wire = 5 distinct ship-types. Demonstrates that "work through the list" can produce heterogeneous-shape clusters across multiple operational types.
