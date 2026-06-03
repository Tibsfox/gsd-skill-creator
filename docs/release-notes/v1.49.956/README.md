---
title: "v1.49.956 — inter-procedural call-graph + N-level binding for the cadence verify detector"
version: v1.49.956
date: 2026-06-02
summary: >
  Lift the v1.49.955 wire detector's two documented depth caps to full
  inter-procedural resolution. The cadence verify axis judges a wired
  calibratable threshold "covered" iff a dedicated *-end-to-end test wires
  substrate -> calibration; v1.49.955 parsed that wire with the TypeScript
  compiler but capped the call-graph at ONE wrapper hop and binding resolution
  at ONE level. This ship replaces the single-hop wrapperParamIndex with a
  monotone fixpoint over (local function, parameter index) pairs — resolving a
  wrapper chain of any depth (outer -> inner -> reader) — and generalizes
  binding resolution to N-level const/let alias chains (const b = a; const a =
  'lit') with a visited-set for cycle safety and an isParamInScope guard at
  every hop. The finite (function x param) domain makes the fixpoint terminate
  on any input, including mutual recursion. A 3-lens adversarial review
  (0 blockers, 0 majors) surfaced two minor over-report findings — a nested
  callback parameter shadowing the outer wrapper, and a function-local const
  shadowing a module-level const of the same name through the new alias map —
  and BOTH were closed in code (eachOwnNode stops collectFn descending into
  nested function bodies; a redeclared binding name is dropped as ambiguous),
  not documented away. The live verify verdict is byte-for-byte unchanged
  (not-overdue, 0 uncovered; all 5 real end-to-end files pass direct string
  literals, so the lift is robustness-only), so the "verify axis (live repo)"
  test stays the #10461 drift guard. 82 detector tests; five fixpoint/binding/
  guard mutations each reaped by the right tests; full suite 35783 green.
tags: [feat, cli, cadence, verify, ast, call-graph, inter-procedural, wire-detector, lesson-10450, lesson-10427]
---

# v1.49.956 — inter-procedural call-graph + N-level binding for the cadence verify detector

**Shipped:** 2026-06-02

One-line: the `cadence` verify axis now resolves a threshold's wire through a wrapper chain of ANY depth (a monotone call-graph fixpoint) and a `const`/`let` alias chain of ANY depth (cycle-safe), lifting the two depth caps the v1.49.955 AST detector documented — while two adversarial-review over-report findings are closed in code so the detector is strictly MORE precise than before.

## Why this ship

The post-v1.49.955 handoff listed "Full inter-procedural call-graph — lift the verify detector's one-hop / one-level binding caps if a real e2e test ever needs deeper resolution" as a forward candidate, and `astWireFacts` documented the bound in its own scope note: *"Inter-procedural resolution is capped at one hop (a wrapper calling another wrapper is not followed) and binding resolution at one level — both bounded on purpose."* This ship closes that bound. It is a robustness/precision refinement: none of the five real end-to-end files use a wrapper or a variable binding for the threshold (they all pass a direct string literal), so the live verdict cannot move — the value is a detector that no longer silently mis-handles a deeper shape a future test author could write.

## What shipped

- **N-hop call graph (fixpoint).** `collectFn` records, per local function, the parameter indices it forwards DIRECTLY to the reader's threshold arg (the base case) and its forwarding edges to other local functions (`{arg position -> this fn's param index}`). A monotone fixpoint then propagates: a function reaches the reader via param `pi` if it forwards `pi` directly, OR forwards `pi` into an arg position of another reader-reaching function. The domain (functions x param indices) is finite, so the loop converges on any graph — mutual recursion with no reader call resolves to empty sets rather than hanging. This replaces the v1.49.955 single-index `wrapperParamIndex`.

- **N-level binding chains.** `resolveIdentifier` follows `const`/`let` alias chains of arbitrary depth (`const c = b; const b = a; const a = 'lit'`), with a `seen` set that breaks reference cycles (`const a = b; const b = a`) and an `isParamInScope` guard applied at EVERY hop (an alias that resolves to a function parameter is not followed — the threshold flows in at the call site). This replaces the v1.49.955 one-level lookup.

- **Two over-report guards (review findings, both closed in code).**
  - **`eachOwnNode` (finding #1).** `collectFn` now walks each function with a traversal that does NOT descend into nested function/arrow/method bodies, so an identifier inside a nested callback is attributed to the nested function's scope, not mistaken for the outer function's same-named parameter. (This over-report pre-existed in v1.49.955's `wrapperParamIndex`; the new edge graph would have extended it to the multi-hop case — closing it keeps the lift from widening a false-positive class.)
  - **Ambiguity drop (finding #2).** The new flat `aliasBindings` map is keyed by name with no lexical scoping. A name declared as a literal/alias binding more than once in the file (`const x` at two scopes) is now dropped as AMBIGUOUS, so a function-local `const` cannot shadow a module-level one into a false wire. Resolution stays conservative (an unresolved arg is simply not wired), matching the regex fallback's behavior.

- **Unchanged.** `regexWireFacts`, `computeWireFacts`, and the lazy `loadTypeScript()` are byte-unchanged; the verify axis remains ADVISORY and FAIL-SOFT (#10427). `detectThresholdWire` / `detectThresholdWireWith` keep their signatures.

## Scope note (the v955 caps closed; new bounds)

The v1.49.955 caps (one wrapper hop, one binding level) are lifted. The remaining bounds are documented in `astWireFacts` and acceptable for an advisory gate, all erring toward NOT wiring (the conservative direction for a coverage gate):

- **Name-based, not fully lexically-scoped.** Resolution keys on identifier names. Three guards keep flat scope from over-reporting (nested-body non-descent, redeclared-name ambiguity drop, per-hop `isParamInScope`); the residual — a single name declared once but read across genuinely distinct lexical scopes — is contrived, absent from every real test, and no worse than the regex.
- **Forms.** Wrapper detection spans free `function` declarations and `const`-bound arrow/function expressions (the forms every test uses); class methods remain out of scope (no real e2e test is class-based).
- **Return-value dataflow is not followed.** A reader call taking a function's return value (`load(getThreshold(), ...)`) is not resolved — a different mechanism than the two named caps, absent from real files.

## Verification

- `tsc` build clean (the fixpoint + traversal typecheck). `cadence.test.ts` **82/82** (65 prior + 17 new: depth-2/3 wrapper chains, 2/3-level alias chains, combined hop+binding, mutual-recursion + binding-cycle termination, and the two over-report guards — each lift case pairs the AST verdict against the regex verdict it corrects).
- **Live verdict byte-identical:** `cadence --axis verify --json` -> `not-overdue`, `uncovered: []`, all 7 covered; `cadence --check` exits 0.
- **Five mutations, each reaped by the right tests:** disable fixpoint edge propagation (6 N-hop tests fail), disable alias-chain recursion (5 N-level tests fail), disable the per-hop `isParamInScope` guard (2 over-report tests fail), revert `eachOwnNode` -> `eachNode` (2 finding-#1 tests fail), disable the ambiguity drop (2 finding-#2 tests fail).
- **Full suite 35783 green**, 0 failures. No collateral (only `cadence.ts` behavior changed; it is imported by `dispatch.ts` + its test).
- **3-lens adversarial review Workflow** (fixpoint-correctness | termination/cycles | over-report/false-positive | equivalence/fallback/docs): 0 blockers, 0 majors, 2 minor findings — both closed in code with mutation-proven regression tests rather than documented as residuals.

## Engine state

NASA 1.178 (unchanged), counter-cadence **26** (unchanged — a forward `feat` detector refinement, like v1.49.949/953; not a counter-cadence cleanup), manifest **151** (unchanged — applies #10450 / #10427 / #10461; the v1.49.955 "regex -> AST with fail-soft fallback" carried-forward candidate is unaffected). No `cadence_advances` tag: deepening the verify DETECTOR is not a verify-axis COVERAGE advance (coverage is unchanged), exactly as v1.49.949/953/955 self-tagged nothing.
