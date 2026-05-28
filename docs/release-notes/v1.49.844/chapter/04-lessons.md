
# v1.49.844 — Lessons

## Promoted to ESTABLISHED in this ship

None. v1.49.844 is a canonical-doc decision ship — it gives the verification/integration-only ships observation its home, but the numbered-lesson promotion remains deferred to the next codify ship per #10426.

## New lesson candidates (2; below threshold)

### Canonical-doc-decision ship pattern

**Observation:** Some lessons need their canonical-doc structure decided BEFORE they can be codified — the canonical-doc home is a prerequisite for the numbered-lesson promotion, not a side-effect. v844 is the first ship of this shape: a canonical-doc decision that closes one of the "where does this live" gaps without promoting a numbered lesson. Future codify ships can then promote the observation as a numbered lesson once the home is decided.

**Why it matters:** Distinguishes two codification rhythms. Single-step: small observation, obvious home, codify in one ship (the v824 + v840 codify pattern). Two-step: observation needs structural-decision-then-codification (the v840 → v844 pattern for verification/integration). Naming this rhythm helps future operators recognize when a codification candidate is structurally blocked vs. promotion-ready.

**Instances:** 1 (v1.49.844 — verify-axis canonical-doc decision).

**Forward-test trigger:** any future deferred-candidate that has 2+ instances + viable canonical-doc home AND the home decision is operator-bounded (multiple-valid-options). Examples in current backlog: bidirectional enforcement completeness has the same shape (could go under #10436 OR as a standalone gate-direction-symmetry discipline; decision pending 3rd instance).

**Promotion path:** wait for 2nd instance — could codify with the bidirectional enforcement completeness ship (whenever 3rd instance arrives) if both are decided together.

### Verify-axis self-applicability (v843 mesh family example)

**Observation:** The verify axis added in this ship's discipline doc applies to substrate-with-non-test-callers-but-no-integration-test. v843's mesh family (mesh-worktree.ts + proxy-committer.ts) has unit tests with injected mocks but no integration test that exercises the default-executor path against real git. Per the verify-overdue trigger (≥10 ships since first non-test caller), the mesh family will become a verify candidate within ~10 forward ships.

**Why it matters:** First application of the just-codified verify axis check to existing substrate. Surfaces an immediate verify-ship candidate. Also demonstrates that the verify axis's overdue trigger is operationally observable from existing primitives (grep test files + git log).

**Instances:** 1 forward-flag (v844 noting v843's mesh family).

**Forward-test trigger:** count ships since v843; if ≥10 pass and no integration test added, this becomes a verify-ship candidate.

**Promotion path:** if the verify axis itself gets promoted to a numbered lesson at the next codify ship, this self-applicability becomes a documented application of the discipline rather than a separate lesson.

## Forward-test of existing lessons

### #10427 — Failure-mode contracts

**Status:** NOT EXERCISED. No try/catch shape changes.

### #10428 — Meta-cadence

**Status:** EXTENDED. The 3-axis structure (codify/consume/calibrate) is now 4-axis (verify added). The cadence-overdue check + forward-shadow CLI sections also extended. #10428 itself unchanged; its canonical-doc surface gained a 4th member.

### #10433 — Internal-helper / threaded-options pattern

**Status:** NOT EXERCISED. No chokepoint work.

### #10434 — Ratchet-ledger pattern

**Status:** NOT EXERCISED. KNOWN_UNWIRED counts unchanged.

### #10435 — Cross-rootdir wire pattern

**Status:** REFERENCED. The verify axis's 2-instance evidence base (v829 + v832) is the cross-rootdir wire pattern's test coverage. The two disciplines are complementary: #10435 codifies the wire pattern itself; verify axis codifies the rhythm of writing the integration test that exercises it.

### #10436 — Two-layer closure (file-overwrite drift sub-class)

**Status:** REINFORCED at T14 publish step. The v836 preservation gate fired correctly on this ship's chapter writes.

### #10437 — Subscriber-gated observability-only context-hook pattern

**Status:** NOT EXERCISED.

## Tentative observations carried forward (consolidated)

### Eligible for next codify ship

| Observation | Instances | Notes |
|---|---|---|
| Verify axis | 2 (v829 + v832) | Canonical-doc home set THIS SHIP. Numbered-lesson promotion eligible at next codify ship (with 3rd instance OR explicit operator decision). |
| DI-executor + tokenized-argv wire shape | 3 (v825 + v843×2) | Eligible at next codify ship as #10433 refinement. |
| Re-throw ProcessContextDenied from CLI swallow-catch | 2 (v820 + v842) | Eligible at next codify ship as #10427 refinement. |
| Bidirectional enforcement completeness | 1-2 (v838 + v836) | DEFERRED v840 — classification ambiguous. |

### Below threshold

| Observation | Source | Notes |
|---|---|---|
| Canonical-doc-decision ship pattern | v844 (THIS SHIP) | 1 instance; wait for 2nd. |
| Verify-axis self-applicability (v843 mesh) | v844 (THIS SHIP) | 1 forward-flag instance; becomes verify-ship candidate after 10 ships. |
| Recent-vs-baseline-recent comparison pattern | v841 | 1 instance. |
| Drift-check noise as scoring-system feedback loop | v841 | 1 instance. |
| Codify-ship-as-recon-consolidator pattern | v840 | 1 instance. |
| Deferral-by-classification-ambiguity | v840 | 1 instance. |
| Auto-run-on-import as bootstrap-time tax | v836 | 1 instance. |
| Polarity convention for inverted-mechanic thresholds | v837 | 1 instance. |
| Other single-instance observations | various | various. |

## Cadence observation

v844 is the 4th ship of the new operational-debt cluster:

| Ship | Wall-clock | Scope | Notes |
|---|---|---|---|
| v1.49.841 | ~40 min | Quality-drift recalibration | Single tooling file; new chip release_type |
| v1.49.842 | ~20 min | Terminal family batch chip | 3 wires; Process: -3 |
| v1.49.843 | ~15 min | Mesh family batch chip | 2 wires; Process: -2; DI-executor at 3-instance threshold |
| v1.49.844 | ~15 min | Verify axis canonical-doc home | 4th meta-cadence axis added; numbered-lesson deferred |

Cluster cumulative: ~90 min wall-clock, 8 source-file wires (or no wires for v841/v844), 5 KNOWN_UNWIRED entries removed (Process: 21 → 16), 1 new release_type, 1 new operational axis. v845 is the next ship: production caller of predict path (substantive feature).

The cluster shape is broader than typical chip-runs: 2 chip ships + 1 tooling ship + 1 doc-structure ship. Demonstrates the operator-bounded "work through" instruction can produce heterogeneous-shape clusters that close multiple deferred-candidates in one sitting.
