# v1.49.876 — Lessons

## Promoted to ESTABLISHED in this ship (0)

Chip ship. Applies existing #10433 (Egress version of internal-helper hoist) + #10427 (1 re-throw) + #10444 (two-site hoisted-check shape from v867 precedent).

## Sustained observations

### #10444 — Two-site hoisted-check shape

**Status:** SUSTAINED. v876 applies the v867 fork-finder pattern: two fetch sites in the file → two hoists. Confirms the shape works across Egress files with the same structure.

### #10427 — Failure-mode contracts (re-throw security denials)

**Status:** SUSTAINED. v876 applies 1 re-throw in fetchPackage's mirror-aggregation catch + 1 hoist-outside-try-catch in fetchReadme (the alternative to re-throw for surfaces with non-fatal fallbacks).

### #10428 — Counter-cadence/meta-cadence

**Status:** SUSTAINED. v876 is the 9th codify-axis ship since v868; cadence well within bounds.

## Carry-forward candidates (PROMOTION-ELIGIBLE)

- **Spawn-site count as primary predictor** (refinement of #10444) — 2 instances from Track 4 (v872 + v875).
- **#10427 multi-catch helper** — 5 instances from Track 4. v876 adds a 6th implicit instance via the hoist-outside-try pattern.
