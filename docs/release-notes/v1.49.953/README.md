---
title: "v1.49.953 — structural substrate-to-caller wire detector for the cadence verify axis"
version: v1.49.953
date: 2026-06-02
summary: >
  Item 3 of the post-v1.49.950 "1 2 3 and 4" batch: replace the cadence verify
  axis's string-presence heuristic with a true structural substrate-to-caller
  wire detector. Through v1.49.947/949/950 the verify axis judged a wired
  calibratable threshold "covered" iff a dedicated *-end-to-end integration test
  file CONTAINED the threshold string (content.includes) — which an incidental
  comment mention satisfied. This ship adds detectThresholdWire(threshold,
  content): a dedicated end-to-end file now "wires" a threshold iff it exercises
  BOTH ends of the substrate -> calibration wire — the threshold appears as a
  string-literal argument to a real loadObservationsForThreshold( call (the
  calibration read / caller end, allowing the multi-line call style) AND the
  file imports a substrate/events module (the write end, matched by
  /-substrate|-events|suggestion-store/). verifyVerdict uses the detector instead
  of content.includes. The live verify axis stays not-overdue (all 7 wired
  thresholds across the 5 dedicated end-to-end files structurally wire), so the
  "verify axis (live repo)" test is now the live-tree drift guard (#10461) that
  the bounded-learning verify coverage genuinely wires. 9 new detector tests +
  updated verifyVerdict tests; both detector conjuncts (caller-call + substrate-
  import) are mutation-proven. Completes the meta-cadence verify-axis hardening
  arc (v947 dedicated-file restriction -> v949 end-to-end-file detection -> v953
  structural wiring).
tags: [feat, cli, cadence, verify, wire-detector, lesson-10461]
---

# v1.49.953 — structural substrate-to-caller wire detector for the cadence verify axis

**Shipped:** 2026-06-02

One-line: the `cadence` verify axis now judges a calibratable threshold "covered" by STRUCTURALLY detecting the substrate -> calibration wire (a `loadObservationsForThreshold(threshold-literal)` call AND a substrate-module import in a dedicated end-to-end test), replacing the string-presence heuristic an incidental comment mention could satisfy.

## Why this ship

Item 3 of the operator-directed "1 2 3 and 4" batch, and the last named follow-up on the verify axis. v1.49.947/949/950 built the verify axis on `content.includes(threshold)` over dedicated `*-end-to-end.integration.test.ts` files — restricting to dedicated files (v949) but still string-presence: a file that merely *mentions* a threshold in a comment counted as coverage. The handoff named "a true substrate-to-caller wire detector" as the replacement.

## What shipped

- **`detectThresholdWire(threshold, content)`** — a dedicated end-to-end file "wires" a threshold iff it exercises BOTH ends of the substrate -> calibration wire:
  - **CALLER end:** the threshold appears as a string-literal argument to a real `loadObservationsForThreshold(` call — regex `loadObservationsForThreshold\(\s*['"]<escaped threshold>['"]`, where `\s*` spans the multi-line call style (`loadObservationsForThreshold(\n  'threshold',`) some tests use, and the threshold's `.`s are regex-escaped.
  - **SUBSTRATE end:** the file imports a substrate/events module — `SUBSTRATE_MODULE_RE = /from ... (?:-substrate|-events|suggestion-store) .../`. All five dedicated end-to-end tests import their substrate from a path matching one of these.
- **`verifyVerdict` uses the detector** instead of `content.includes(threshold)`. A dedicated file that only mentions a threshold no longer counts; the threshold must be passed to the real calibration reader AND a substrate imported.
- **The live verify axis is unchanged in verdict** (still `not-overdue`, 0 uncovered): all 7 wired thresholds across the 5 dedicated end-to-end files structurally wire. The "verify axis (live repo)" test is now the live-tree drift guard (#10461) that the wires genuinely exist — a future end-to-end test that mentions-without-wiring, or a substrate with a naming scheme outside `SUBSTRATE_MODULE_RE`, fails it loudly.
- **9 new `detectThresholdWire` unit tests** (comment-only mention rejected, reader-call-without-substrate rejected, substrate-without-reader-call rejected, multi-line call detected, wrong-threshold rejected, suggestion-store/-events specifiers accepted) + the `verifyVerdict` tests updated from synthetic string-presence content to synthetic structural-wire content.

## Scope note

This is a structural (regex import + call-with-literal) detector, not a full TypeScript call-graph analysis — a deliberate, robust middle ground. The `SUBSTRATE_MODULE_RE` pattern is the one fragility (a future substrate naming scheme outside it would falsely fail); the live-tree drift guard forces the pattern to track reality (#10461). A full AST/call-graph wire detector remains a possible future refinement.

## Verification

- `npx tsc --noEmit` clean.
- `cadence.test.ts` 44/44 (9 new detector tests); `cadence --axis verify` confirms `not-overdue`, `uncovered: []`.
- Mutation-proven: reverting the detector to `content.includes` reaps the comment-only-mention guard; dropping the substrate-import conjunct reaps the reader-call-without-substrate guard.
- Focused single-agent adversarial review: PASS, 0 blockers (NIT-1 unanchored caller regex fixed in-ship with a word-boundary lookbehind + test; NIT-2 informational).

## Engine state

NASA 1.178 (unchanged), counter-cadence **24** (unchanged — a `feat` hardening the verify detector, mirroring v1.49.949; not a counter-cadence ship), manifest **151** (unchanged — applies #10461; promotes no lesson). No `cadence_advances` tag: hardening the verify DETECTOR is not a verify-axis COVERAGE advance (coverage is unchanged), exactly as v1.49.949 self-tagged nothing.
