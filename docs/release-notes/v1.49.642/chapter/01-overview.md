# 01 — Overview: v1.49.642 Housekeeping Cluster #9

## Why this milestone exists

v1.49.641 shipped at `2c937f684` closing CF-11 (retired via §1.4 re-framing review) and CF-12 (codified Lesson #10199 W0 gate as `scripts/closure-verify-cf.mjs`). Its carry-forward chapter routed 2 items to Cluster #9:

- **CF-13 (LOW, decision-deferred):** forward-cadence engine resumption — STS-7 Sally Ride / Challenger NASA degree candidate
- **CF-14 (LOW, discretionary):** per-CF probe spec format

User direction for v1.49.642: take on CF-14. CF-13 continues to be decision-deferred.

The cluster's natural shape: **extend the automation arc**. Lesson #10199 had reached "executable tool" at v1.49.641 C2. CF-14 adds the next abstraction layer — per-CF spec auto-dispatch — pushing the tool from "operator picks probe per invocation" to "CF carries spec; operator runs auto".

## What "done" looked like at mission entry

The C0 W0 plan was:

1. Quick §1.3 design-intent validation of CF-14 (fresh CF; §1.4 re-framing not applicable for non-multi-cluster CFs)
2. C1: extend `scripts/closure-verify-cf.mjs` with `auto <CF-id>` subcommand that reads YAML probe specs from `.planning/cf-probes/`
3. C1 tests: extend the existing 9-test suite with auto-dispatch coverage
4. Authorial example: probe specs for CF-13 + CF-14 (self-referential)
5. Doc updates: MISSION-PACKAGE-DISCIPLINE.md §1.7 + cf-closure-verification-templates.md
6. Meta-test + release-notes + ship

## What "done" actually looked like at mission exit

### CF-14: auto subcommand + 2 example specs

`probeAuto` was added to the PROBES map alongside the 5 existing probe types. The function:

1. Resolves `.planning/cf-probes/<CF-id>.yaml` (case-insensitive)
2. Parses YAML via the existing `yaml` direct dep (added at v1.49.640 C1 hidden-transitive recovery)
3. Validates 4 required fields: `cf_id`, `probe_type`, `probe_args`, `routing_rules`
4. Reconstructs argv for the configured probe based on probe_type
5. Dispatches to the existing probe function
6. After the probe writes its record, reads the actual STATUS from the record (not just exit code)
7. Maps STATUS via routing_rules and prints the suggested action

Two example specs landed at `.planning/cf-probes/` (gitignored):
- `cf-13.yaml` — file-snapshot probe; documents the inverted routing_rules for "decision-file-presence" CFs
- `cf-14.yaml` — self-referential file-snapshot probe; documents another inversion ("feature presence = retire")

Both demonstrate the schema and the routing-semantics inversion patterns that operators need to understand when authoring probe specs.

### Mid-execution refinement: STATUS read from record file

The first probeAuto implementation mapped exit-code 0/1 to outcomes (`resolved-upstream` / `still-real`). Testing CF-14's own probe spec revealed this was wrong for file-snapshot, which has 3 possible statuses but always exits 0 in success paths.

Fix: probeAuto now reads the actual `**STATUS:** \`<status>\`` line from the record file the probe just wrote. This makes routing_rules dispatch accurate for all probe types regardless of their exit-code semantics.

### Tests: 9 → 14 invariants

The closure-verify-cf test suite gained 5 new auto-probe tests:
- Missing spec file produces helpful template stderr
- Required-field validation catches malformed specs
- Dispatch to file-snapshot via spec works end-to-end
- Invalid probe_type rejected
- `auto` as probe_type rejected (prevents recursion)

All 14 pass in <5s.

### CF-13: deferred again

No operator decision on CF-13 routing this cluster. CF-13 carries forward to Cluster #10 as CF-15, unchanged. Counter-cadence chain extends to 10.

## Scope-change disclosure

One small mid-execution refinement: the exit-code-to-outcome mapping in probeAuto was insufficient for file-snapshot's 3 statuses; switched to reading STATUS from the record file. Caught by the CF-14 self-test probe (apply-to-self of the apply-to-self mechanism, recursively). ~5min recovery.

This is exactly what apply-to-self testing surfaces — bugs in the discipline that wouldn't be visible until applied to real cases.

## Why this shape (counter-cadence; tight scope)

v1.49.642 is the smallest housekeeping cluster yet:
- 1 CF closed (CF-14)
- 1 CF deferred (CF-13)
- ~90 LOC script extension + 5 tests + small doc edits
- 3 commits before T14
- ~1h wall-clock

The cluster's value is the AUTOMATION ARC EXTENSION, not raw surface area. Lesson #10199 now has:
- Source incident (v1.49.634-638 chain)
- Lesson at retro (v1.49.639)
- Discipline doc (v1.49.640 C2)
- Executable tool (v1.49.641 C2)
- Per-CF spec auto-dispatch (v1.49.642 C1)

5 abstraction transitions across 4 clusters. The discipline has reached its natural automation endpoint.

## Activation profile (actual vs spec)

| Phase | Spec mode | Actual |
|---|---|---|
| W0 (§1.3 design validation) | ~3k | ~2k |
| W1A (C1 — auto subcommand) | ~15-25k | ~20k (including the mid-execution STATUS-read fix) |
| W3 (ship) | ~30-40k | ~20k (this chapter set; smaller than v1.49.641's) |
| Total | ~50-80k | ~42k (well below band) |

Wall-clock: ~1h actual vs spec's anticipated ~1.5-2h. Tight, focused cluster.

## Forward implications

After v1.49.642 ships:

- Per-CF probe spec format available for any future CF
- Operators can populate `.planning/cf-probes/` at any cluster's W0 to reduce future cognitive load
- CF-13 carries forward as CF-15; remains the only carry-forward item
- Cluster #10 inventory shrinks to 1 CF — closest to "carry-forward bankruptcy" since v1.49.585
- Lesson #10199 reaches automation completion (5-transition lifecycle complete)
- Counter-cadence chain at 10
- STORY-gate auto-fire validated for 5th consecutive ship
- Post-ship refresh absorption pattern validated for 4th consecutive cluster
