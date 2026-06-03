---
title: "v1.49.957 — return-value dataflow for the cadence verify wire detector"
version: v1.49.957
date: 2026-06-02
summary: >
  Close the last bound the v1.49.956 detector documented: a reader call whose
  threshold argument is a call to a local function returning a string literal.
  The cadence verify axis judges a wired calibratable threshold "covered" iff a
  dedicated *-end-to-end test wires substrate -> calibration; v1.49.955-956
  parsed that wire through literals, N-level alias chains, and N-hop wrapper
  forwarding, but a reader call taking a function's RETURN value
  (loadObservationsForThreshold(getThreshold())) was explicitly not resolved.
  This ship resolves it: collectFn records each local function's return
  expressions and resolveCallReturn folds a call to a single unconditional
  literal return, composing with the wrapper fixpoint and alias chains and
  through a const t = getThreshold() binding. A 4-lens adversarial review (9
  agents, 0 blockers) surfaced two over-report findings -- a destructured
  parameter that defeated the param-in-scope guard (also a latent v1.49.956
  hole), and an implicit-undefined / bare-return path silently excluded from the
  divergence check -- and BOTH were closed in code (binding-pattern-aware
  isParamInScope; an unconditional-expression-return requirement), not
  documented away. The live verify verdict is byte-for-byte unchanged
  (not-overdue, 0 uncovered, 7 wired; all five real end-to-end files pass direct
  string literals, so the lift is robustness-only), so the "verify axis (live
  repo)" test stays the #10461 drift guard. 109 detector tests (+27); eight
  fixpoint/return/guard mutations each reaped by the right tests; full suite
  green.
tags: [feat, cli, cadence, verify, ast, return-value, dataflow, wire-detector, lesson-10450, lesson-10427, lesson-10461]
---

# v1.49.957 — return-value dataflow for the cadence verify wire detector

**Shipped:** 2026-06-02

One-line: the `cadence` verify axis now resolves a threshold whose value reaches the reader through a function's RETURN value (`loadObservationsForThreshold(getThreshold())`), closing the last bound the v1.49.956 detector documented -- while two adversarial-review over-report findings are fixed in code so the detector is strictly MORE precise than before.

## Why this ship

The post-v1.49.956 handoff named "Return-value dataflow in the verify detector" as a forward candidate, and `astWireFacts` documented the exact bound in its own scope note: *"Return-value dataflow is not followed. A reader call taking a function's return value (`load(getThreshold(), ...)`) is not resolved -- a different mechanism than the two named caps, absent from real files."* This ship closes that bound. Like every prior step in the arc, it is a robustness/precision refinement: none of the five real end-to-end files route the threshold through a function return (they all pass a direct string literal), so the live verdict cannot move -- the value is a detector that no longer silently mis-handles a deeper shape a future test author could write.

## What shipped

- **Return-value resolution.** `collectFn` now records, per local function, the expressions it can RETURN (own-scope only -- nested function returns belong to the nested function; an arrow's concise body is its return). `resolveCallReturn` folds a call `f(...)` to the single string literal `f` returns when every collected return resolves to the SAME literal. It composes for free with the existing machinery: a direct reader call `load(getThreshold())`, a wrapper called with a return value `outer(getThreshold())`, an N-level return chain (`a` returns `b()`, `b` returns the literal), and a `const t = getThreshold()` binding read at the call all resolve.

- **Conservative by construction.** Call ARGUMENTS are ignored: a param-independent literal return resolves from the body alone, while a function returning one of its parameters yields nothing (the value depends on the call site -- the param-return-through case is the next documented bound). Divergent literal returns, or any unresolvable return path, drop the whole call to "not wired." A shared `seen` set (threaded across the binding, alias, and return guards) breaks return cycles.

- **Two over-report guards (4-lens review findings, both closed in code).**
  - **Destructured-parameter guard (finding #1, MAJOR).** `isParamInScope` recursed only IDENTIFIER params, so a destructured parameter (`{ t }`, `[t]`, `{ a: t }`, nested) was not recognized as locally bound and resolved against a module-level const sharing the inner name -- over-reporting a wire for a call-site-supplied value. `isParamInScope` now recurses object/array binding patterns. This also closed the SAME latent hole on the v1.49.956 wrapper/direct-call path (a pre-existing bug the review surfaced).
  - **Unconditional-return requirement (finding #2, MINOR).** A bare `return;` or an implicit `undefined` fall-through is a completion path that does NOT return the literal, yet only expression-returns were collected, so a helper that did not unconditionally return the literal still resolved to it. `collectFn` now records a function's returns only when it unconditionally returns an expression on every path -- matching the explicit-divergence contract the detector already enforced.
  - **Merged ambiguity counter.** One shared declaration counter now covers bindings AND bodied functions, so a name that is ambiguous as a binding and/or a function (declared across scopes) is dropped from every resolution map (extends the v1.49.956 binding ambiguity drop; closes a review nit).

- **Unchanged.** `regexWireFacts`, `computeWireFacts`, and the lazy `loadTypeScript()` are byte-unchanged; the verify axis remains ADVISORY and FAIL-SOFT (#10427). `detectThresholdWire` / `detectThresholdWireWith` keep their signatures.

## Scope note (the v956 bound closed; new bounds)

The v1.49.956 return-value bound is lifted. The remaining bounds are documented in `astWireFacts` and acceptable for an advisory gate, all erring toward NOT wiring (the conservative direction for a coverage gate):

- **Param-return-through is not followed.** A function that RETURNS one of its parameters (`function id(t){ return t; }`, then `load(id('x'))`) is not resolved -- the returned value depends on the call site, which would need a return-reaches extension of the fixpoint. Absent from every real file; named as the next forward-shadow.
- **Name-based, not fully lexically-scoped.** Resolution keys on identifier names; the guards (binding-pattern param-in-scope, redeclared-name ambiguity drop, nested-body non-descent) close the cases that matter, but a single name declared once and read across genuinely distinct lexical scopes can still mis-resolve -- contrived, absent from real tests, no worse than the regex.
- **Parenthesized literals** (`return ('lit')`) are not unwrapped (a pre-existing `literalOf` gap shared by the v955/v956 literal path); a safe under-report. Class methods remain out of scope.

## Verification

- `tsc` build clean. `cadence.test.ts` **109/109** (82 prior + 27 new: 16 return-value resolution cases -- direct literal return, arrow, as-const, return-of-local-const, call-binding, wrapper composition, N-level return chain, divergence, param-return-through, redeclared-name, method-call, cycle -- and 11 over-report guards across the two review findings + the merged counter).
- **Live verdict byte-identical:** `cadence --axis verify --json` -> `not-overdue`, `uncovered: []`, all 7 covered; `cadence --check` exits 0.
- **Eight mutations, each reaped by the right tests:** disable the call-expression dispatch (11 fail), the divergence guard (1), the unresolvable-return guard (1), the call-binding resolution (1), the binding-pattern param guard (5), the implicit-fall-through detection (2), the bare-return detection (1), the merged-counter return drop (2).
- **Full suite green** (35245 passed), 0 failures. No collateral (only `cadence.ts` behavior changed; imported by `dispatch.ts` + its test).
- **4-lens adversarial review Workflow** (over-report/precision | feature-correctness/under-report | termination/recursion | equivalence/docs): 9 agents, 0 blockers, 0 majors among the auto-confirmed -- two over-report findings (1 major, 1 minor), both closed in code with mutation-proven regression tests rather than documented as residuals.

## Engine state

NASA 1.178 (unchanged), counter-cadence **26** (unchanged -- a forward `feat` detector refinement, like v1.49.949/953/955/956; not a counter-cadence cleanup), manifest **151** (unchanged -- applies #10450 / #10427 / #10461; the v1.49.955 "regex -> AST with fail-soft fallback" carried-forward candidate is unaffected). No `cadence_advances` tag: deepening the verify DETECTOR is not a verify-axis COVERAGE advance (coverage is unchanged at 7/7), exactly as v1.49.949/953/955/956 self-tagged nothing.
