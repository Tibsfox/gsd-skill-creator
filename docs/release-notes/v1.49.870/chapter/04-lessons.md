# v1.49.870 — Lessons

## Promoted to ESTABLISHED in this ship (0)

Chip ship. No new lesson promotions. Applies existing #10433 internal-helper pattern + #10427 swallow-catch re-throw discipline + #10444 size-ascending chip-pick.

## Sustained observations (no change this ship)

### #10433 — Internal-helper for ctx? threading

**Status:** SUSTAINED. v870 applies the pattern to a small-LOC file (177 LOC) where a pre-existing helper wraps N=7 spawn sites. The size-ascending heuristic (#10444) brought this file forward early in the cluster.

### #10444 — Size-ascending chip-pick reveals wire-shape diversity

**Status:** SUSTAINED. v870 is the first chip exercising this discipline under campaign-time enforcement. The smallest-LOC pick (177) exercised the internal-helper shape — not the hoist-at-top that #10444's catalog table predicts for the smallest band, because the file happens to already have a pre-existing helper. Minor refinement opportunity (carried below).

### #10427 — Failure-mode contracts (re-throw security denials)

**Status:** SUSTAINED. v870 applies the re-throw discipline at 4 swallow-everything catches in `version-manager.ts`. Standard pattern; no new variant emerged.

### #10428 — Counter-cadence/meta-cadence

**Status:** SUSTAINED. v870 is a codify-axis consumption ship (chips the KNOWN_UNWIRED ratchet ledger by one).

## Forward observations (below promotion threshold, 1 instance each)

### Shell-exec audit record represents the SHELL, not the logical command

**Surface ship:** v1.49.870.

When a file uses `exec(command)` (a shell-string exec), the audit record captures `op='exec' / target='sh' / argv=['-c', command]`. Operators reading the audit log see `sh` for shell-exec callers, distinct from `git`/`node`/etc. for spawn callers. The audit IS accurate (the shell IS what's spawned) but the operator may want logical-command annotation for cross-caller reporting.

**Below threshold (1 instance).** Carry as forward-observation. A 2nd shell-exec chip wire (e.g., a future chip on a file using `exec()` instead of `spawn()`) would inform whether to:
1. Add a `logical_command` field to the audit record.
2. Document the shell-exec target convention in #10427/#10433.
3. Recommend conversion of shell-exec callers to `execFile` or `spawn` where feasible.

### Size-ascending heuristic vs pre-existing helper bias

**Surface ship:** v1.49.870 (recon during wire authoring).

#10444's evidence catalog predicts:
- Small files (~70-200 LOC) → hoist-at-top
- Mid-size files (~200-400 LOC) → hoist-outside-Promise / closure-capture
- Larger files (~400-800 LOC) → internal-helper (#10433)

v870 at 177 LOC structurally matches small-file band, but the file ALREADY has an internal helper (`private async git()` wrapping 7 commands). The internal-helper shape applied at smaller LOC than #10444 predicts because the abstraction was already there.

The minor refinement candidate: **pre-existing helper bias** — when a small-to-mid LOC file already wraps the side-effecting op in a helper, the internal-helper shape applies regardless of file size. The "size band predicts shape" rule from #10444 is approximate; the more precise rule is "structural shape predicts wire shape" and file size is a proxy for structural shape.

Below threshold (1 instance). Carry as forward-observation. A 2nd small-file-with-helper chip would promote this to a refinement of #10444.

### Multi-method swallow-catch re-throw editorial overhead

**Surface ship:** v1.49.870 (chip authoring).

The version-manager has 4 service methods with swallow-everything catches that needed re-throw of `ProcessContextDenied` per #10427. Each catch needed: import `ProcessContextDenied`, add `if (err instanceof ProcessContextDenied) throw err` at the top of the catch block, add a comment explaining #10427.

The editorial overhead is non-trivial at the chip level (~4 minutes of consistent edits + an explanatory comment per catch). Below-threshold observation. A 2nd chip with N≥4 service methods needing re-throw would promote this to a refinement of #10427 — possibly suggesting a small helper like `rethrowSecurity(err)` or a `wrapResult(asyncFn)` pattern.
