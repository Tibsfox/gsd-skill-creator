---
title: "v1.49.959 — param-return-through + parenthesized-literal detector lifts"
version: v1.49.959
date: 2026-06-03
summary: >
  Closes the two precision bounds v1.49.957 left documented in the cadence
  verify-axis wire detector: a function returning one of its own parameters now
  resolves by substituting the call-site argument, and a parenthesized literal /
  identifier / call is unwrapped. Robustness-only — the live verify verdict is
  byte-identical.
tags: [cadence, verify-axis, detector, ast, robustness]
---

# v1.49.959 — param-return-through + parenthesized-literal detector lifts

**Shipped:** 2026-06-03

The cadence verify-axis wire detector (`astWireFacts`) now resolves two more
dataflow shapes that v1.49.957 documented as its remaining bounds.

## Why this ship

The meta-cadence verify axis decides whether each wired calibratable threshold
has a dedicated end-to-end test that *structurally* wires it — an imported
substrate module plus a real `loadObservationsForThreshold(<literal>)` call. The
AST detector has been progressively deepened (v955 regex->AST, v956 N-hop
call-graph, v957 return-value dataflow). v957 closed return-value resolution but
explicitly left two bounds open: a function that returns one of its own
parameters, and a parenthesized literal/call. This ship closes both. It is the
fourth step in the v953->v955->v956->v957->**v959** detector arc and was selected as
forward-candidate 2 from the post-v958 handoff.

## What shipped

- **Param-return-through.** A local function returning one of its own identifier
  params (`function id(t){ return t; }`) now resolves a call `id('x')` by
  substituting the matching argument at the call site. A new `returnParams` map
  records the own param indices returned directly; `resolveCallReturn` folds
  literal returns (`returnExprs`) and param-substituted returns (`returnParams`)
  under one divergence guard — every path must agree on the same literal or the
  call is not wired.
- **Parenthesized literal / identifier / call.** `literalOf` unwraps a
  `ParenthesizedExpression`, and `resolveExpr` unwraps it too so a parenthesized
  identifier or call reaches the resolution branches (`load(('x'))`,
  `load((getT()))`, `const t = ('x')`, `() => ('x')`, `return ('x')`).

## Verification

- 128 cadence tests pass (+18 over v957's 110); the new conjuncts are each
  mutation-proven, including the storage-gate over-report guard for the param
  path (a review-surfaced gap closed before ship).
- Live verify verdict byte-identical: `cadence --check` exits 0; all 7 wired
  thresholds remain not-overdue / covered. Real end-to-end files use direct
  literals, so neither new path can change `callsReaderWith` — confirmed pre/post.
- A 4-lens adversarial review (over-report, live-invariance, test-coverage,
  regression/fail-soft) returned zero blockers; its one MAJOR (a mutation
  survivor on the param storage gate) was fixed in the test suite.

## Engine state

- **NASA degree:** 1.178 (frozen hold; unchanged).
- **Counter-cadence:** 27 (this is a normal forward feat — count unchanged).
- **Manifest lessons:** 151 (applies #10450 / #10427 / #10461; no new lesson).
- **cadence_advances:** none (robustness lift, not a coverage advance — matches
  the v955 / v956 / v957 precedent).
