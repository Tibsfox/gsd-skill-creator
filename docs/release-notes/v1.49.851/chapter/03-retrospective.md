# v1.49.851 — Retrospective

**Wall-clock:** ~13 min from v850 ship close to v851 ship close. Matches v850's ~12 min — the chip-ship template has reached its floor.

## What went as expected

- **v849 pattern transferred byte-equivalent.** Hoist-at-top, single-call-site, forensic-silent fall-through. The argv vector tokenization happens once (in the `ensureProcessAllowed` call) regardless of whether the actual `execSync` uses a shell-string or argv-array.
- **No-existing-tests scenario handled cleanly.** Created a narrow new test file (`tests/skill/version-backfill.test.ts`) targeting just the wire — 3 cases (deny, allow, backward-compat). The wire-test is the security-enforcement boundary; pre-existing surface tests would be a separate ship's scope.
- **PROJECT.md drift hand-edit kept pace.** Pre-edited PROJECT.md to v851 BEFORE pre-tag-gate so the 3-patch tolerance gate stays green.

## What I noticed

- **Argv-vector-passes-to-audit-even-when-execSync-uses-shell-string is a useful telemetry pattern.** The `execSync('git log ...')` invocation builds a shell command string with `JSON.stringify(path)`; the chokepoint accepts the argv vector `['log', '-1', '--format=%ai', '--', path]` for audit visibility. The two representations diverge intentionally — the shell string is what actually runs, the argv vector is what gets recorded for downstream telemetry. Both forms communicate the same operation but at different layers.
- **The chip template's per-file LOC cost is dominated by audit-test comment + release-notes prose, not source.** Source change: 7 LOC. Audit-test comment: 7 LOC. Test file: 56 LOC. Release notes (5 files): ~250 lines of prose. Per-ship release-notes-to-source LOC ratio: ~30x. This is normal for chip ships and reinforces the v850 observation about scaffolding potential.
- **v849 + v850 + v851 all use the same `CapturingProcessAuditSink` import + `ProcessContextDenied` + `ProcessContext` triplet.** A possible shared test-helper module could DRY this — but the import itself is 4 lines, so the win would be marginal.

## What surprised me

- **No surprises this ship.** The pattern is fully mechanical. All three chip ships (v849, v850, v851) have followed the same recon → wire → test → pre-tag-gate → T14 sequence with no significant deviations.

## Risk that didn't materialize

- **No audit-test regression.** 2051 PASS.
- **No backward-compat break.** Test case (c) verifies `gitLastModifiedDate(path)` (no ctx) still works.
- **No PROJECT.md drift gate trip.** Pre-edited.

## Carried forward (post-v851)

NEW this ship: 0 below-threshold observations. (The chip pattern has now stabilized; the meta-observation about chip-ship wall-clock floor remains at 1 instance.)

Below-threshold observations from prior ships UNCHANGED:
- Chip-release-notes scaffolding script (v850, 1 instance) — NOT promoted; v851's similar wall-clock cost would arguably be 2nd instance, but the ~13 min cost is fast enough that scaffolding's value is decreasing, not increasing. Defer codification.
- Other v836-v850 observations UNCHANGED.

## Eligible for next codify ship: 0
