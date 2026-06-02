# v1.49.949 — Summary

## The ship

Item 2 of the post-v1.49.947 "1 2 3" batch: harden the `skill-creator cadence` verify axis, the weakest of the four axes the v1.49.947 ship built.

## The weakness

`checkVerify` concatenated all 43 `tests/integration/*.test.ts` files and tested `content.includes(threshold)` per wired threshold. False-negative-proof but **false-positive-prone**: an incidental mention of a threshold string in any unrelated integration test (a config test, a comment, a fixture) would count as "integration coverage", conflating "the string appears somewhere" with "there is a dedicated substrate->calibration end-to-end test".

## The hardening

Restrict coverage detection to the DEDICATED `*-end-to-end.integration.test.ts` files — the #10453 convention the 4 covered thresholds already follow:

- `END_TO_END_TEST_RE = /-end-to-end\.integration\.test\.ts$/` selects only the dedicated end-to-end tests; a wired threshold is covered iff one of THOSE references its string.
- Pure `verifyVerdict(wired, endToEndTests)` helper (mirrors `calibrateVerdict`) holds the logic, unit-testable with synthetic entries.
- `checkVerify(integrationDir)` takes a dir override (threaded through `buildCadenceReport`), so the restriction is testable against a temp dir.
- `data` now reports `perThreshold` (`{threshold, covered, coveringTests[]}`) + the `endToEndTests` list — actionable: it names the covering test or the gap.

Still a heuristic (filename-convention + string-presence within dedicated files); a true import/call-graph wire detector is named as future work.

## Live verdict (unchanged, precise)

The 4 dedicated end-to-end tests each reference their threshold; the 3 `suggestions.*` appear in zero integration files. Same `candidate` verdict, same 3 uncovered — but now incidental-mention-proof and naming the covering test for each of the 4.

## Verification

- tsc clean; `cadence.test.ts` 23/23 (14 existing + 9 new; the verify axis had ZERO tests before).
- Mutation-proven: broadening the filter back to all `.test.ts` makes an incidental mention count as coverage -> the restriction test fails.
- Affected scope (cli + bounded-learning) 904/904. Focused adversarial review (see 03/99).

## Engine state

NASA 1.178 (unchanged), counter-cadence **24** (unchanged — a `feat`), manifest **151** (unchanged — hardens an existing tool; promotes no lesson).
