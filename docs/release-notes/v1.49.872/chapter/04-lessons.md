# v1.49.872 — Lessons

## Promoted to ESTABLISHED in this ship (0)

Chip ship. Applies existing #10444 (size-ascending chip-pick + hoist-at-top wire shape for single-spawn-site) + #10433 (security check at the spawn site). No new lesson promotions.

## Sustained observations (no change this ship)

### #10444 — Size-ascending chip-pick reveals wire-shape diversity

**Status:** SUSTAINED. v872 at 311 LOC chose hoist-at-top (single spawn site) rather than the mid-band predictions (hoist-outside-Promise or closure-capture). The catalog's LOC-band heuristic is approximate; spawn-site count is the more precise predictor.

### #10433 — Internal-helper / hoist-at-top (security check at spawn site)

**Status:** SUSTAINED. v872 applies the simplest variant (hoist-at-top for N=1 spawn site) — no helper extraction needed because there's only one spawn to protect.

### #10427 — Failure-mode contracts

**Status:** NOT EXERCISED THIS SHIP. The pic2html wire has no swallow-everything catch around the spawn (the try/finally only handles tmpfile cleanup, which runs after the spawn completes). ProcessContextDenied propagates naturally without re-throw.

### #10428 — Counter-cadence/meta-cadence

**Status:** SUSTAINED. v872 is the 5th ship of the campaign and 3rd chip in Track 4 — codify-axis consumption continues.

## Forward observations (below promotion threshold, 1 instance each)

### Audit-fidelity: extract inline shell-script literals to a local const

**Surface ship:** v1.49.872 (pythonScript const extraction).

When a file has an inline string literal passed to execSync/spawn AND the literal needs to be referenced separately by the hoist's argv parameter, refactor the literal into a local const so both references share one source. Otherwise future edits can silently drift between what the audit records and what actually runs.

**Below threshold (1 instance).** Carry as forward-observation. A 2nd chip with an inline shell-script literal needing the same extraction would promote this to a refinement of #10444 — "audit-fidelity: extract inline literals to a const if hoist + spawn reference them separately".

### Wire-shape selection by spawn-site count, not LOC band

**Surface ship:** v1.49.872 (recon during shape selection).

#10444 catalog uses LOC bands as the primary predictor, but spawn-site count is the more precise axis. A small-LOC file with N=5 spawn sites wants internal-helper; a large-LOC file with N=1 wants hoist-at-top. LOC is correlated with site count but not deterministic.

**Below threshold (1 instance).** A 2nd chip surfacing the same LOC-vs-spawn-count mismatch would promote this to a refinement of #10444.

### Fake-PNG fixture pattern for single-spawn wire tests

**Surface ship:** v1.49.872 (test file authoring).

When a wire test needs to exercise a spawn-site check but doesn't need real data, create a fake file with the correct extension (e.g., 4 bytes named `fake.png`). The wire check fires synchronously before the spawn — the fact that the spawn would fail on the fake data never matters.

**Below threshold (1 instance).** Carry as forward-observation. A 2nd chip using the same fake-fixture pattern (e.g., fake.jpg / fake.bin) would promote this to a refinement of the test-authoring discipline.

### Codify-eligible candidates carried forward from v871 (PROMOTION-ELIGIBLE at next codify)

- **Multi-method swallow-catch re-throw editorial overhead (#10427 refinement)** — 2 instances now: v870 (5-method version-manager) + v871 (4-method contribute). v872 didn't exercise this pattern (no swallow catches). Still promotion-eligible.
- **Closure-capture vs internal-helper-method are same pattern (#10444 refinement)** — 1 instance from v871. v872 didn't add a 2nd instance.
