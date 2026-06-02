---
title: "Context"
chapter: 99-context
version: v1.49.949
date: 2026-06-02
summary: "Where v1.49.949 sits in the larger arc."
tags: [context, cli, cadence, meta-cadence, verify-axis]
---

# v1.49.949 — Context

## Milestone metadata

- **Version:** v1.49.949
- **Type:** `feat(cli)` — cadence verify-axis hardening (NOT counter-cadence)
- **Predecessor:** v1.49.948 (fix M4 branches first-commit-wins double-win)
- **NASA degree:** 1.178 (unchanged — degree-non-advancing)
- **Counter-cadence count:** 24 (unchanged — a `feat`, like v946 did not increment it)

## Where this sits

- Item 2 of the operator-directed "1 2 3" batch from the post-v1.49.947 handoff: (1) fix the M4 double-win [v1.49.948], (2) harden the `cadence` verify heuristic [this ship], (3) add per-axis ships-since tracking [next].
- It directly follows up the v1.49.947 ship that built `skill-creator cadence`, whose retrospective named the verify axis as the weakest (string-presence heuristic) and whose first run surfaced the `suggestions.*` integration-coverage asymmetry.
- It is a step toward the handoff's stated aspiration — "a semantic substrate-to-caller-wire detector would let verify drive --check reliably" — without claiming to reach it: this ship hardens the heuristic's precision (dedicated-file detection) but explicitly defers the true wire detector.

## Files changed

- `src/cli/commands/cadence.ts` — `END_TO_END_TEST_RE` constant; pure `verifyVerdict(wired, endToEndTests)` helper + `ThresholdCoverage` type; `checkVerify(integrationDir)` rewritten to scan only dedicated `*-end-to-end.integration.test.ts` files and report `perThreshold` + `endToEndTests`; `integrationDir` option threaded through `CadenceReportOptions`/`buildCadenceReport`; module docstring verify description updated.
- `src/cli/commands/cadence.test.ts` — 9 new tests (the verify axis had none): `END_TO_END_TEST_RE` convention, `verifyVerdict` pure cases, the temp-dir dedicated-file restriction (mutation-proven), unreadable-dir -> manual, live-repo verdict.

## Old vs new, at a glance

| | v1.49.947 verify | v1.49.949 verify |
|---|---|---|
| Search surface | all `tests/integration/*.test.ts` (43 files) | dedicated `*-end-to-end.integration.test.ts` only (4 files) |
| Coverage rule | threshold string appears anywhere | threshold string appears in a dedicated end-to-end test |
| Incidental mention | counts as coverage (false positive) | does NOT count |
| Output | uncovered list | per-threshold `{covered, coveringTests[]}` + end-to-end file list |
| Live verdict | 3 suggestions.* uncovered | 3 suggestions.* uncovered (unchanged) |

## Test posture

- `npx tsc --noEmit` clean.
- `cadence.test.ts` 23/23 (14 existing + 9 new). Affected scope (`src/cli`, `src/bounded-learning`) 904/904.
- Mutation-proven: broadening the file filter back to all `.test.ts` makes an incidental mention count as coverage -> the restriction test fails (`expected true to be false`).
- Focused single-agent adversarial review: CLEAN (0 findings) — confirmed the regex, the verdict logic, the conservative failure paths, the intentional exclusion of non-end-to-end integration files, and that no threshold string is a substring of another.

## Engine state at close

- NASA degree 1.178 (unchanged).
- Counter-cadence count 24 (unchanged — a `feat`).
- Manifest: **151 lessons** (unchanged — hardens an existing tool; applies #10453 / #10427 / #10409; records a carried-forward candidate; promotes none).

## References

- The tool: `src/cli/commands/cadence.ts` (the verify axis + `verifyVerdict`).
- The discipline it checks: `docs/meta-cadence-discipline.md` (verify axis) + #10453 substrate->calibration end-to-end test pattern.
- The dedicated end-to-end tests it now keys on: `tests/integration/{token-budget-warn,token-budget-max,observation-retention,predictive-low-confidence}-end-to-end.integration.test.ts`.
- The ship that built the tool: v1.49.947 (counter-cadence #24).
