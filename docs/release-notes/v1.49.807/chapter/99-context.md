# v1.49.807 — Context

## Provenance

- **Source:** Audit retrospective lever S5 from `.planning/AUDIT-2026-05-26-core-functions-retrospective.md`.
- **Trigger:** v806 retrospective surfaced two concrete motivations: (a) STATE.md drift caught by v635 normalizer integration test at v806 open suggested a regression-detector gap at pre-tag-gate step 0.5; (b) PROJECT.md step 17 WARN persisted across 5 ships without escalation, suggesting WARN-only is insufficient for the patch-drift class.
- **Predecessor ship:** v1.49.806 (S6 Chokepoint Extension); shipped 2026-05-27 ~05:30 UTC.

## Position in audit-retrospective sweep

S5 is the 6th of 7 levers from the 2026-05-26 core-functions audit. Closure order:

| # | Lever | Type | Shipped at |
|---|---|---|---|
| S1 | Calibration ledger | Codify | v790 (#10417) |
| S3 | Meta-cadence | Codify | v805 (#10428) |
| S4 | Substrate opt-in paths | Codify | v805 (#10429) |
| S7 | Finer-grained counter-cadence | Codify | v805 (#10430) |
| S6 | Chokepoint extension | Tooling | v806 |
| **S5** | **PROJECT.md + STATE.md gates** | **Tooling** | **v807** |
| S2 | Adoption telemetry weekly report | Tooling | OPEN |

After v807: 1 open lever (S2) from the audit retrospective. The chain of audit-driven ships v790 → v805 → v806 → v807 represents systematic closure of every codify-class wedge plus 2 of the 3 tooling-class wedges, across ~17 ships.

## Why now

v806's retrospective named S5 as one of two highest-ROI follow-on candidates (alongside NASA 1.179 forward-cadence). The operator picked S5 + S2 + KNOWN_UNWIRED chip + T1.3 recon as a 4-ship chain, deferring NASA 1.179. v807 is the first ship of that chain.

The bounded-cadence rationale for closing S5 now rather than later:
- The STATE.md drift instance at v805→v806 demonstrated the detector gap was real, not theoretical.
- The PROJECT.md 5-version drift at v801→v806 demonstrated WARN-only was insufficient.
- Both gaps are 1-2-line bash edits — opportunity cost is near-zero against any other ship's setup overhead.
- Per #10415, escalated wedges close within 1-2 milestones. v806 was the alarm; v807 is the close.

## Engine state crossover

NASA degree sustains at **1.178** for the 25th consecutive ship. Counter-cadence count sustains at 5. The codify ⟂ consume ⟂ calibrate triangle (per #10428 meta-cadence) is balanced: codify just shipped at v805; consume is in steady chip-down mode via KNOWN_UNWIRED allowlists from v806; calibrate is wired and active (5 of 6 thresholds calibratable per the v801 calibration ledger ship).

## Predecessor handoff reference

See `.planning/HANDOFF-2026-05-27-v1.49.806-s6-chokepoint-extension-shipped.md` for the predecessor's TL;DR, lever-status table, and next-ship menu (from which the operator selected S5 + S2 + KNOWN_UNWIRED + T1.3).

## Forward observation: post-T14-reset STATE.md drift class

The v807 fix closes the regression detector for normalizer non-idempotency, but the underlying v805→v806 drift instance was caused by a different class: STATE.md is hand-rewritten as part of the post-ship "next-milestone reset" step in T14, AFTER pre-tag-gate has run. The post-reset STATE.md is never re-normalized. Drift surfaces at the next milestone's pre-tag-gate step 0.5 (which silently `--write`s it back to canonical form). A complete closure of this class would require running the normalizer at the END of T14's STATE.md reset step itself. Not in this ship's scope; flagged for next counter-cadence ship's discussion.
