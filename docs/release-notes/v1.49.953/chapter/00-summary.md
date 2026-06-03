# v1.49.953 — Summary

## The ship

Item 3 of the post-v1.49.950 "1 2 3 and 4" batch: replace the `cadence` verify axis's string-presence heuristic with a true structural substrate-to-caller wire detector.

## What shipped

- **`detectThresholdWire(threshold, content)`** — a dedicated `*-end-to-end.integration.test.ts` file "wires" a threshold iff it exercises BOTH ends of the substrate -> calibration wire:
  - **caller end:** the threshold is a string-literal argument to a real `loadObservationsForThreshold(` call (regex with `\s*` for the multi-line call style; the threshold's `.`s escaped);
  - **substrate end:** the file imports a substrate/events module (`/-substrate|-events|suggestion-store/`).
- **`verifyVerdict` uses the detector** instead of `content.includes(threshold)`. A dedicated file that merely MENTIONS a threshold (e.g. in a comment) no longer counts.
- **Live verify axis verdict unchanged** (`not-overdue`, 0 uncovered) — all 7 wired thresholds across 5 dedicated end-to-end files structurally wire. The "verify axis (live repo)" test is now the live-tree drift guard (#10461).
- **9 new detector unit tests** + `verifyVerdict` tests migrated from string-presence to structural-wire synthetic content.

## Why it matters

The pre-v953 verify axis would mark a threshold "covered" if a dedicated file merely contained its string — a comment mention sufficed. The structural detector requires the test to actually call the calibration reader WITH the threshold AND import a substrate, a much stronger signal that the substrate -> calibration wire is exercised end-to-end.

## Scope note

Structural (regex import + call-with-literal), not full call-graph. The `SUBSTRATE_MODULE_RE` pattern is the one fragility; the live-tree drift guard forces it to track reality.

## Verification

- tsc clean; `cadence.test.ts` 44/44 (9 new detector tests); `cadence --axis verify` -> `not-overdue`, `uncovered: []`.
- Mutation-proven: reverting to `content.includes` fails the comment-only-mention guard; dropping the substrate conjunct fails the reader-call-without-substrate guard.
- Focused adversarial review: PASS, 0 blockers (NIT-1 unanchored caller regex fixed in-ship with a word-boundary lookbehind + test; NIT-2 informational).

## Engine state

NASA 1.178 (unchanged), counter-cadence **24** (unchanged — a `feat` hardening the verify detector, mirroring v1.49.949), manifest **151** (unchanged — applies #10461; promotes none). No `cadence_advances` tag (a detector hardening is not a coverage advance).
