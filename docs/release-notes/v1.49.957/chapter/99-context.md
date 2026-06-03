---
title: "Context"
chapter: 99-context
version: v1.49.957
date: 2026-06-02
summary: "Where v1.49.957 sits in the larger arc."
tags: [context, cli, cadence, verify, ast, return-value, dataflow]
---

# v1.49.957 — Context

## Milestone metadata

- **Version:** v1.49.957
- **Type:** `feat(cli)` — return-value dataflow for the cadence verify wire detector
- **Predecessor:** v1.49.956 (inter-procedural call-graph + N-level binding for the cadence verify detector)
- **NASA degree:** 1.178 (unchanged — degree-non-advancing)
- **Counter-cadence count:** **26** (unchanged — forward `feat`, not a counter-cadence cleanup)

## Where this sits

- First ship after v1.49.956. The post-v1.49.956 handoff named "Return-value dataflow in the verify detector" as a forward candidate, distinct from "Counter-cadence #27" — so this is the normal forward `feat`.
- The verify-axis detector arc: **v947** (dedicated-file restriction) -> **v949** (end-to-end-file detection) -> **v953** (structural regex wire detection) -> **v955** (AST/call-graph, depth-1 caps) -> **v956** (full inter-procedural call-graph + N-level binding) -> **v957** (return-value dataflow — this). Each ship's documented bound was the next ship's scope.

## How the scope was chosen

`skill-creator cadence --check` exits 0:

| Axis | Status | Why |
|---|---|---|
| codify | manual | 151 lessons; operator-tracked backlog |
| consume | not-overdue | 0 genuinely-unwired thresholds |
| calibrate | not-overdue | max 12 observations (< 20) |
| verify | not-overdue | all 7 wired thresholds wire |

Nothing machine-overdue -> scoped from a ledger: the handoff's forward-candidate list, which named "Return-value dataflow," and `astWireFacts`'s own scope note recording the same bound.

## Files changed

- `src/cli/commands/cadence.ts` — `astWireFacts` extended: `collectFn` now collects each local function's return expressions (own-scope; arrow concise body is the return), stored only when the function unconditionally returns an expression; new `resolveCallReturn` folds a call to a single literal return; `resolveExpr` dispatches literal / identifier / call; `resolveIdentifier` follows a `const NAME = call()` binding via `callBindings`. Two over-report fixes: `isParamInScope` recurses object/array binding patterns (`bindingNameBinds`), and the binding/function declaration counters were merged into one shared `bindingDeclCount` so an ambiguous name is dropped from every map. Module + `astWireFacts` + `resolveCallReturn` + `detectThresholdWire` docstrings updated. `regexWireFacts` / `computeWireFacts` / `loadTypeScript` unchanged.
- `src/cli/commands/cadence.test.ts` — 27 new tests across two describe blocks: return-value dataflow (direct literal return, arrow, as-const, return-of-local-const, call-binding, wrapper composition, N-level return chain, cross-threshold accuracy, param-return-through, divergence, any-unresolvable-path, redeclared-name, method-call, cycle) and the v957 review-fix over-report guards (object/array/renamed/nested destructured-param returns, the latent v956 direct-call hole, implicit fall-through, bare return, arrow-block fall-through, the merged ambiguity counter, plus two not-over-broad boundary tests).

## The detector arc (verify axis)

| Ship | Mechanism | Blind spot / bound it closed |
|---|---|---|
| v1.49.947 | `content.includes` over dedicated files | global substring scan -> dedicated files only |
| v1.49.949 | end-to-end-file detection | non-end-to-end files no longer count |
| v1.49.953 | regex: reader-call-literal + substrate-import | a bare mention no longer counts |
| v1.49.955 | AST: real call bound to imported reader + depth-1 dataflow/call-graph | comments/strings/aliases/namespaces/one-hop indirection |
| v1.49.956 | inter-procedural fixpoint + N-level binding | one-hop / one-level caps; two nested/flat-scope over-reports |
| v1.49.957 (this) | return-value dataflow | a reader call taking a function's return value; two over-reports (destructured param, implicit-undefined return) |

## Termination note

Return-value resolution is provably terminating: `resolveCallReturn` carries the same `seen` set as the alias resolver (shared, threaded across binding/alias/return guards), and adds each callee name before recursing, so any re-entry on a name short-circuits to undefined. Return cycles (`function a(){ return b(); } function b(){ return a(); }`) are exercised by a committed test that passes by returning rather than hanging.

## Test posture

- `cadence.test.ts` **109/109** (27 new). `tsc` build clean. `cadence --check` exits 0; `cadence --axis verify` reports `not-overdue`, `uncovered: []`.
- Mutation-proven: eight mutations (call-expression dispatch, divergence guard, unresolvable-return guard, call-binding resolution, binding-pattern param guard, implicit-fall-through detection, bare-return detection, merged-counter return drop) each reap the right tests when reverted.
- Full suite green (35245 passed); no collateral (`cadence.js` imported only by `dispatch.ts` + its test).
- 4-lens adversarial review Workflow (9 agents): 0 blockers; two over-report findings (1 major, 1 minor), both fixed in code.

## Engine state at close

- NASA degree 1.178 (unchanged).
- Counter-cadence count **26** (unchanged — forward `feat`; a detector refinement, not a counter-cadence cleanup).
- Manifest: **151 lessons** (unchanged — applies #10450 / #10427 / #10461; adds a second instance to the v1.49.955 carried-forward candidate's lift sub-observation; promotes none).

## References

- The detector: `src/cli/commands/cadence.ts` (`astWireFacts`, `collectFn`, `resolveCallReturn`, `resolveExpr`, `resolveIdentifier`, `isParamInScope`, `detectThresholdWire`).
- The arc predecessor: v1.49.956 (inter-procedural call-graph; its scope note named this ship's bound).
- The drift guard: the "verify axis (live repo)" test (#10461).
- The disciplines: static-analysis-tool (#10450), failure-mode-contracts (#10427), gate-enforce-every-runnable-surface (#10461).
