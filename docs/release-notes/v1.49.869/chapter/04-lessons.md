# v1.49.869 — Lessons

## Promoted to ESTABLISHED in this ship (0)

This ship is the deterministic-gate half of the v868 codify-then-gate pair. The codify ship (v868) promoted #10444 + refined #10443. This ship operationalizes the #10443 refinement; no new lessons promoted.

## Sustained observations (no change this ship)

### #10443 — Inverse-audit: stale-entry detection (with continuous-verification mode refinement)

**Status:** SUSTAINED + operationalized. The v868-codified continuous-verification mode (refinement of #10443) is now a deterministic pre-tag-gate step (step 18/18). Operator-invoked → automatic transition complete.

### #10444 — Size-ascending chip-pick reveals wire-shape diversity

**Status:** SUSTAINED. The v870-881 chip cluster will be the next 12-instance exercise of this discipline; v869's gate ensures the cluster's chips can't introduce stale entries silently.

### #10428 — Counter-cadence/meta-cadence

**Status:** SUSTAINED. v869 is a wiring ship in the codify axis (operationalization of the v868 codification). Per the meta-cadence discipline, the codify-then-gate pair counts as 2 codify-axis ticks; the campaign's codify cadence is well within the 7-10 ship upper bound.

### #10432 — KNOWN_UNWIRED ratchet-ledger

**Status:** SUSTAINED. The new gate enforces the ratchet ledger's invariants at chip-time; the ledger itself is unchanged.

## Forward observations (below promotion threshold, 1 instance each)

### Codify-then-gate two-ship pair

**Surface ship:** v1.49.868 + v1.49.869.

When a codified discipline names an EXISTING tool (the v857 cross-audit tool, in this case), the natural shape is:
1. Codify the discipline doc in ship N (named patterns, evidence, anti-patterns).
2. Wire the gate in ship N+1 (pre-tag-gate step + meta-test).

The split lets each ship's surface stay lean: ship N is doc-only; ship N+1 is wiring-only. Both ships can be authored back-to-back in the same operator session without context-switching cost.

**Below threshold (1 instance).** Carry as forward-observation. A 2nd codify-then-gate pair in a future campaign would promote this to ESTABLISHED. Examples that could trigger the 2nd instance:
- A codify ship promoting the v882 verify-overdue scan tool's operational discipline → followed by a gate-wiring ship in a later campaign.
- Any future discipline that names an existing tool and warrants gate-time enforcement.

### Pre-tag-gate step-label refactor (carry-forward)

**Surface ship:** v1.49.869 (recon).

The X/N step labels in pre-tag-gate.sh have drifted across milestones (X/15, X/16, X/17, X/18). Labels are informational; gate logic is unaffected. Below-threshold (1 instance recon).

### Sanity-check assertion strengthening (carry-forward)

**Surface ship:** v1.49.869 (recon during meta-test authoring).

The cross-audit tool test at line 51 has a weak sanity check (`>0`). The v868 codify discipline calls for a strict count-match. Below-threshold (1 instance carryforward).
