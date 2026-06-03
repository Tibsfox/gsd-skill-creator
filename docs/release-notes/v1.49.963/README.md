---
title: "v1.49.963 — verify-detector paren-param + nested-self-call bounds"
version: v1.49.963
date: 2026-06-03
summary: >
  Robustness-only verify-detector lift: closes the two bounds v1.49.959
  documented as remaining in astWireFacts — parenthesized-param forwarding
  (collect-side) and the nested self-call load(id(id('x'))). The live
  cadence --check verdict is byte-identical; this hardens the AST detector
  against contrived shapes absent from every real e2e file.
tags: [feat, cli, cadence, verify-detector, robustness]
---

# v1.49.963 — verify-detector paren-param + nested-self-call bounds

**Shipped:** 2026-06-03

One-line: `astWireFacts` now resolves parenthesized-param forwards and nested
self-calls, closing the last two bounds v1.49.959 left documented.

## Why this ship

The v1.49.955 to v1.49.959 arc hardened the cadence verify-detector
(`astWireFacts`) from a regex into a TypeScript-compiler dataflow analysis.
v1.49.959 closed parenthesized-*literal* resolution and basic
param-return-through but explicitly documented two remaining bounds: a wrapper
forwarding a *parenthesized* param (`load((t))`) and a nested self-call
(`load(id(id('x')))`). This ship — one of the carried non-blocking residuals —
closes both. Both are robustness-only: no real end-to-end file uses these
shapes (real files pass direct string literals), so the live verdict cannot
move. Scoping was empirical (the actual under-report was confirmed by running
`astWireFacts` directly), and the parenthesized residual turned out to span
four collect-site attribution points plus two binding-initializer sites — more
than the handoff's single-site description.

## What shipped

- **Parenthesized-param forwarding (collect-side).** A new `unwrapParens`
  helper strips grouping parens before the param-forwarding `ts.isIdentifier`
  checks at the four `collectFn` attribution sites (reader-arg, inter-function
  edge, `return (t)`, and the `(t) => (t)` arrow body) and at the alias and
  call binding-initializer sites (`const a = (b)`, `const a = (getT())`).
  v1.49.959 unwrapped parens only on the *resolution* side; these are the
  *attribution* sites the same node kind must reach.
- **Nested self-call (`load(id(id('x')))`).** `resolveCallReturn`'s argument
  loop now resolves the substituted call-site argument under `seen` minus the
  current callee name. A call's arguments are finite, caller-scope sub-nodes —
  never the body-recursion cycle the `seen` guard exists to break — so the
  nested self-call resolves, while a genuine cycle that re-enters through an
  argument still terminates. Cloning `seen` (rather than using a fresh set) is
  load-bearing for that termination.
- **Residual 1(a) (block-shadow) investigated, no code change.** A
  function-local block shadowing a same-named param was found already
  conservative: a param-return resolves via the call-site arg (never the flat
  binding maps), so the module const is never leaked.

## Verification

- 146 cadence tests green, including the flipped v1.49.959 bound test and the
  new v1.49.963 describe block; all 8 new positive tests proven non-vacuous
  (the parent commit returns `false` for each).
- Every fix point mutation-proven (revert the line, a targeted test goes red);
  the termination guard is pinned by asserting `astWireFacts` directly does not
  throw (a fresh-set mutant stack-overflows).
- `npm run build` (tsc) clean; live `node dist/cli.js cadence --check` exit 0,
  verify axis clean — byte-identical, confirming the #10461 live-repo invariant.
- Three-lens adversarial review (130+ empirically-probed inputs): 0
  over-reports, 0 hangs. The binding-initializer symmetry was closed in
  response to a review completeness nit.

## Engine state

- NASA degree: 1.178 (frozen hold; unchanged).
- Counter-cadence count: 29 (unchanged — this is a normal forward feat).
- Manifest lessons: 151 (unchanged — applies #10450 / #10427 / #10461; no new
  lesson promoted).
- cadence_advances: none (robustness-only; no coverage advance).
