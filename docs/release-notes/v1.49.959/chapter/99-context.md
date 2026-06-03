---
title: "Context"
chapter: 99-context
version: v1.49.959
date: 2026-06-03
summary: "Where v1.49.959 sits in the larger arc."
tags: [context, cadence, detector]
---

# v1.49.959 — Context

## Milestone metadata

- **Version:** v1.49.959
- **Type:** `feat(cli)` — param-return-through + parenthesized-literal detector lifts
- **Predecessor:** v1.49.958 (counter-cadence #27, release-notes scaffolding source eliminator)
- **NASA degree:** 1.178 (frozen hold)
- **Counter-cadence count:** 27 (unchanged — this is a normal forward feat)

## Where this sits

v959 is the fifth step of the verify-axis detector arc:
v953 (structural `detectThresholdWire`) -> v955 (regex->AST) -> v956 (N-hop
call-graph + N-level aliases) -> v957 (return-value dataflow) -> **v959**
(param-return-through + parenthesized literal). Each step closed the bound the
previous one documented; v959 closes the two bounds v957 named. It is
forward-candidate 2 of the operator's post-v958 "1 2 & 3" batch (shipped first;
the counter-cadence ships last).

## Files changed

- `src/cli/commands/cadence.ts` — `astWireFacts`: new `returnParams` map +
  classification + storage gate + ambiguity-drop wiring; unified
  `resolveCallReturn` divergence guard; `literalOf` and `resolveExpr` paren
  unwrap; file-header and inline doc comments updated.
- `src/cli/commands/cadence.test.ts` — flipped the param-return-through negative
  to positive; +18 tests in a dedicated v959 describe block (param-return-through
  positives + over-report guards + parenthesized literal/call); divergence-test
  comment updated.

## Engine state at close

- NASA degree 1.178. Counter-cadence 27. Manifest 151 lessons. No
  `cadence_advances` marker (robustness lift, not a coverage advance).
