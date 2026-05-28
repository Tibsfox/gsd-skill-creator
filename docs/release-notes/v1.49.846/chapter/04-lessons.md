
# v1.49.846 — Lessons

## Promoted to ESTABLISHED in this ship

None. v1.49.846 ships substrate wires that follow the v845 CLI pattern; promotion of any associated tentative observation is deferred to the next codify ship.

## New lesson candidates (3)

### CLI manual + substrate auto-emit duality (2-instance promotion eligible at next codify ship)

**Observation:** Calibration thresholds with a wired observation source typically need TWO production write callers — a CLI manual recorder and an automatic auto-emit from substrate. Ship the CLI first (operator-invocable, easy to verify), substrate auto-emit second (production-traffic auto-recorder). The pair provides both operator-attributed events (via CLI flags) and traffic-attributed events (via substrate default polarity).

**Why it matters:** Codifies the v803 pattern that v845/v846 just instantiated. Without this discipline, observation sources can sit half-wired — readable but unwritten — for many ships. The pair pattern bounds the manual+auto work to two ships and prevents observation-source bit-rot.

**Instances:** **2** (eligible threshold met):
- v803 token-budget wire — CLI shipped first; `/sc:status` integration added later as the auto-recorder.
- v845/v846 predict-low-confidence wire — CLI shipped v845; substrate auto-emit shipped v846 (this ship).

**Forward-test trigger:** any future calibratable-threshold wire that ships its observation source. The 2-ship pair should be planned alongside the source.

**Promotion path:** codify at next codify ship as #10428 refinement (operational-axis structure: "calibrate axis includes both manual and auto-emit write callers; complete only when both halves shipped").

### Production-caller scope-reduction via path-narrowing (2-instance promotion eligible at next codify ship)

**Observation:** When a forward-flag names specific wrapper classes (e.g. "wire ActivationSelector with fallbackProvider") but the underlying PATH the wrapper exercises can be called directly, the simpler scope is to call the path directly. The wrapper is an integration concern, not a path concern. Especially relevant when the wrapper itself has no production callers (substrate ahead of demand).

**Why it matters:** Avoids architectural over-reach. v845's CLI calls `predictNextSkillsWithMeta + appendPredictiveLowConfidenceEvent` directly without constructing ActivationSelector or PipelineActivationDispatch. v846's substrate auto-emit calls the same path via the existing `emitPredictions` methods — also a direct path call rather than a new wrapper. Both ships demonstrate path-narrowing as scope-reduction.

**Instances:** **2** (eligible threshold met):
- v845 — CLI calls `predictNextSkillsWithMeta + appendPredictiveLowConfidenceEvent` without instantiating any wrapper class.
- v846 — substrate auto-emit lives inside the existing `emitPredictions` chain, calling `appendPredictiveLowConfidenceEvent` directly without going through a wrapper or new abstraction.

**Forward-test trigger:** any future "production caller" task where the substrate's wrapper is incidental to the path being exercised.

**Promotion path:** codify at next codify ship as a refinement of the "path vs wrapper" distinction in architecture-retrofit patterns.

### Fire-and-forget over awaited for observability writes (1 instance; below threshold)

**Observation:** When adding a disk-write side effect to an existing fire-and-forget chain, the new write MUST also be fire-and-forget. Awaiting the write serializes it with the chain's load-bearing operations and bloats the chain's latency past timing budgets in callers (typically tests).

**Why it matters:** Caught by an integration-test flake in v846. Initial implementation awaited `appendPredictiveLowConfidenceEvent`; the disk-write inflated the chain past the test's 10ms drain budget under suite load. Refactored to non-awaited with an inner `.catch(() => {})`. The observability surface should run in parallel with load-bearing surfaces, not serialize on them.

**Instances:** 1 (v846).

**Forward-test trigger:** any future addition of a disk-write or network-write side effect to a Promise.resolve().then() chain.

**Promotion path:** wait for 2nd instance. Likely candidate for #10437 subscriber-gated observability pattern refinement: "observability surfaces inside subscriber-gated chains run in parallel, not serially, even when they involve I/O".

## Forward-test of existing lessons

### #10427 — Failure-mode contracts

**Status:** REINFORCED + REFINED. The auto-emit's inner `.catch(() => {})` is the explicit observability-only marker. The outer `.catch` at the Promise.resolve chain's end is the existing load-bearing-failure absorber. Two-level catch matches the #10427 prescription of distinct catch layers for distinct surface classes. The refinement that emerged this ship — "observability writes should be fire-and-forget, not awaited" — is a concrete elaboration of the principle.

### #10437 — Subscriber-gated observability-only context-hook pattern

**Status:** EXTENDED. The auto-emit fires inside the existing subscriber gate (`if (!hook && !fallback) return`); no new gate added. The PAIR co-location pattern (#10437) is preserved — both the existing fallback-dispatch AND the new auto-emit share the same outer catch and the same subscriber gate.

### #10428 — Meta-cadence

**Status:** READY FOR REFINEMENT. The CLI/auto-recorder duality (now 2 instances) would naturally extend the calibrate axis section's discussion of "what counts as a complete wire for a calibratable threshold". Pending codify ship.

### #10426 — Architecture retrofit patterns

**Status:** REINFORCED. v846's wire follows the second-instance threshold — copper/activation was the first emit-prediction site (v810), selector was the second (v832). The auto-emit wire pattern now also has 2 instances (copper + selector at v846), confirming the pattern shape is stable across both call sites.

### #10433 — Internal-helper pattern

**Status:** NOT EXERCISED. Both wires touch the existing inline chain; no internal helpers added.

### #10434 — Ratchet-ledger pattern

**Status:** NOT EXERCISED. KNOWN_UNWIRED counts unchanged.

### #10435 — Cross-rootdir wire pattern

**Status:** NOT EXERCISED. Single-rootdir (src/).

### #10436 — Two-layer closure

**Status:** REINFORCED at T14 publish step. v836 preservation gate fires on this ship's chapters (10th time now).

## Tentative observations carried forward (consolidated)

### Eligible for next codify ship (5 candidates — v846 promoted 2 to eligibility)

| Observation | Instances | Notes |
|---|---|---|
| Verify axis (numbered lesson) | 2 (v829 + v832) | Canonical-doc home set at v844. Awaiting promotion. |
| DI-executor + tokenized-argv wire shape | 3 (v825 + v843×2) | #10433 refinement. |
| Re-throw ProcessContextDenied from CLI swallow-catch | 2 (v820 + v842) | #10427 refinement. |
| **CLI manual + substrate auto-emit duality** | **2 (v803 + v845/v846)** | **#10428 refinement; NEW eligible at v846.** |
| **Production-caller scope-reduction via path-narrowing** | **2 (v845 + v846)** | **NEW eligible at v846.** |
| Bidirectional enforcement completeness | 1-2 (v838 + v836) | DEFERRED v840 — classification ambiguous. |

### Below threshold

| Observation | Source | Notes |
|---|---|---|
| Fire-and-forget over awaited for observability writes | v846 (THIS SHIP) | 1 instance; wait for 2nd. |
| Canonical-doc-decision ship pattern | v844 | 1 instance. |
| Verify-axis self-applicability (v843 mesh) | v844 forward-flag | 1 forward-flag. |
| Recent-vs-baseline-recent comparison pattern | v841 | 1 instance. |
| Drift-check noise as scoring-system feedback loop | v841 | 1 instance. |
| Codify-ship-as-recon-consolidator pattern | v840 | 1 instance. |
| Deferral-by-classification-ambiguity | v840 | 1 instance. |
| Auto-run-on-import as bootstrap-time tax | v836 | 1 instance. |
| Polarity convention for inverted-mechanic thresholds | v837 | 1 instance. |
| Other single-instance observations | various | various. |

## Cadence observation — auto-emit closure across the v845/v846 pair

The v845/v846 pair completes the substrate auto-recorder gap that the v837 retro implicitly assumed had been closed (it hadn't):

| Ship | Half | What it added |
|---|---|---|
| v1.49.837 | Read-side wire | `predictive.low_confidence_threshold` observation source registered + read-side calibration loop hooked up. |
| v1.49.845 | CLI manual recorder | `skill-creator predict-next <currentSkill>` writes to JSONL with explicit `--useful` / `--not-useful` polarity. |
| v1.49.846 | Substrate auto recorder (THIS SHIP) | copper/activation + selector emit_predictions auto-record with default `not_useful` polarity. |

Cumulative: 3 ships to fully wire a calibratable threshold from observation source to both write callers. The CLI/auto-recorder duality lesson (eligible candidate above) generalizes this 3-ship pattern.
