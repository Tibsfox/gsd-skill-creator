---
title: "v1.49.949 — harden the cadence verify axis (dedicated end-to-end test detection)"
version: v1.49.949
date: 2026-06-02
summary: >
  Item 2 of the post-v1.49.947 "1 2 3" batch: harden the `skill-creator cadence`
  verify axis. It previously concatenated EVERY tests/integration/*.test.ts file and
  did a global substring search for each calibratable threshold's string — so an
  incidental mention of a threshold string in any unrelated integration test counted
  as "integration coverage" (false-positive-prone). It now restricts coverage
  detection to the DEDICATED *-end-to-end.integration.test.ts files (the #10453
  substrate->calibration closing-move convention): a wired threshold is covered iff
  one of those dedicated tests references its string. The verdict on the live repo is
  unchanged (the 3 suggestions.* thresholds still lack a dedicated end-to-end test;
  the 4 token_budget/observation/predictive thresholds are covered), but the mechanism
  is now precise and reports a per-threshold breakdown naming the covering test file.
  A pure verifyVerdict() helper (mirroring calibrateVerdict) makes the logic
  unit-testable, and the verify axis gets its first test coverage (9 new tests).
tags: [feat, cli, cadence, meta-cadence, verify-axis, lesson-10453]
---

# v1.49.949 — harden the cadence verify axis (dedicated end-to-end test detection)

**Shipped:** 2026-06-02

One-line: the `cadence` verify heuristic now keys on the dedicated `*-end-to-end.integration.test.ts` convention instead of a global substring scan over all 43 integration tests, so an incidental threshold mention can no longer count as coverage — and it reports which dedicated test covers each threshold.

## Why this ship

Item 2 of the operator-directed "1 2 3" batch from the post-v1.49.947 handoff. The v1.49.947 ship that built `skill-creator cadence` flagged its own verify axis as the weakest: a best-effort heuristic doing threshold-string presence across every `tests/integration/` file. Its first run surfaced a real asymmetry — the 4 later thresholds have dedicated `*-end-to-end` integration tests, the 3 original `suggestions.*` thresholds do not — but the detection mechanism was imprecise: any incidental mention of a threshold string in an unrelated integration test would have counted as coverage.

## The weakness

The old `checkVerify` concatenated all `tests/integration/*.test.ts` (43 files) and tested `content.includes(threshold)` per wired threshold. That is false-negative-proof but **false-positive-prone**: a threshold string appearing in a config-loading test, a comment, or an unrelated suite's fixture would mark the threshold "covered" even though no substrate->calibration end-to-end test exists. The heuristic conflated "the string appears somewhere" with "there is a dedicated end-to-end calibration test".

## The hardening

Restrict coverage detection to the **dedicated `*-end-to-end.integration.test.ts` files** — the #10453 substrate->calibration closing-move convention that the 4 covered thresholds already follow:

- `END_TO_END_TEST_RE = /-end-to-end\.integration\.test\.ts$/` selects only the dedicated end-to-end tests. A wired threshold is "covered" iff one of THOSE references its string. An incidental mention in any other integration file no longer counts.
- A pure `verifyVerdict(wired, endToEndTests)` helper (mirroring the existing `calibrateVerdict`) holds the coverage logic, so it is unit-testable with synthetic file entries — independent of the on-disk dir.
- `checkVerify(integrationDir)` takes a directory override (threaded through `buildCadenceReport`'s options, like the calibrate axis's `suggestionsPath`), so the dedicated-file restriction is testable against a temp dir.
- The report `data` now carries a per-threshold breakdown (`perThreshold: { threshold, covered, coveringTests[] }`) and the list of dedicated `endToEndTests`, so the verdict is actionable (it names the covering test, or the gap).

It remains a heuristic (filename-convention + string-presence within dedicated files, not import/call-graph wire detection); a true substrate-to-caller wire detector is named as future work in the module docstring.

## Behavior on the live repo

Unchanged verdict, precise mechanism: the 4 dedicated end-to-end tests (`token-budget-warn`, `token-budget-max`, `observation-retention`, `predictive-low-confidence`) each reference their threshold (6-11 times); the 3 `suggestions.*` thresholds appear in **zero** integration files. So the axis still reports `candidate` with the same 3 uncovered thresholds — but now it cannot be fooled by an incidental mention, and it names the covering test for each of the 4.

## Verification

- `npx tsc --noEmit` clean.
- `cadence.test.ts` 23/23 (14 existing + 9 new — the verify axis had **zero** tests before this ship): `verifyVerdict` pure-function cases, the `END_TO_END_TEST_RE` convention, the temp-dir dedicated-file restriction, the unreadable-dir -> manual path, and the live-repo verdict.
- **Mutation-proven:** broadening the file filter back to all `.test.ts` files makes an incidental mention in a non-end-to-end file count as coverage, failing the restriction test (`expected true to be false`).
- Affected scope (`src/cli`, `src/bounded-learning`) **904/904**.
- Focused adversarial review (see chapters for verdict).

## Engine state

NASA degree **1.178** (unchanged). **Counter-cadence #24** (unchanged — this is a `feat`, not a counter-cadence cleanup). Manifest **151** (unchanged — hardens an existing tool; promotes no lesson; records a carried-forward candidate).
