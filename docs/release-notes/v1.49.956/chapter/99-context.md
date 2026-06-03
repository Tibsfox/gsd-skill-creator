---
title: "Context"
chapter: 99-context
version: v1.49.956
date: 2026-06-02
summary: "Where v1.49.956 sits in the larger arc."
tags: [context, cli, cadence, verify, ast, call-graph, inter-procedural]
---

# v1.49.956 — Context

## Milestone metadata

- **Version:** v1.49.956
- **Type:** `feat(cli)` — inter-procedural call-graph + N-level binding for the cadence verify detector
- **Predecessor:** v1.49.955 (AST/call-graph wire detector for the cadence verify axis, counter-cadence #26)
- **NASA degree:** 1.178 (unchanged — degree-non-advancing)
- **Counter-cadence count:** **26** (unchanged — forward `feat`, not a counter-cadence cleanup)

## Where this sits

- First ship after v1.49.955. The post-v1.49.955 handoff named "Full inter-procedural call-graph" as a forward candidate, distinct from "Counter-cadence #27" — so this is the normal forward `feat`, not the next counter-cadence.
- The verify-axis detector arc: **v947** (dedicated-file restriction) -> **v949** (end-to-end-file detection) -> **v953** (structural regex wire detection) -> **v955** (AST/call-graph, depth-1 caps) -> **v956** (full inter-procedural call-graph + N-level binding — this). Each ship's documented bound was the next ship's scope.

## How the scope was chosen

`skill-creator cadence --check` exits 0:

| Axis | Status | Why |
|---|---|---|
| codify | manual | 151 lessons; operator-tracked backlog |
| consume | not-overdue | 0 genuinely-unwired thresholds |
| calibrate | not-overdue | max 12 observations (< 20) |
| verify | not-overdue | all 7 wired thresholds wire |

Nothing machine-overdue -> scoped from a ledger: the handoff's forward-candidate list, which named "Full inter-procedural call-graph — lift the verify detector's one-hop / one-level binding caps."

## Files changed

- `src/cli/commands/cadence.ts` — `astWireFacts` rewritten: a per-function `FnInfo` collection (`collectFn`) + a monotone fixpoint over `(function, param index)` pairs replaces the single-index `wrapperParamIndex`; `resolveIdentifier` follows N-level `const`/`let` alias chains (`aliasBindings` map, `seen`-set cycle guard, per-hop `isParamInScope`). Two over-report guards: `eachOwnNode` (no descent into nested function bodies in `collectFn`) and a `bindingDeclCount` ambiguity drop (a redeclared binding name is unresolvable). Module + `astWireFacts` + `detectThresholdWire` + `verifyVerdict` docstrings updated. `regexWireFacts` / `computeWireFacts` / `loadTypeScript` unchanged.
- `src/cli/commands/cadence.test.ts` — 17 new tests across two describe blocks: full inter-procedural call-graph + N-level binding (depth-2/3 chains, combined hop+binding, cross-threshold accuracy, mutual-recursion + binding-cycle termination) and the v1.49.956 over-report guards (nested-callback param shadow, flat const-name collision, ambiguity-drop boundary).

## The detector arc (verify axis)

| Ship | Mechanism | Blind spot / bound it closed |
|---|---|---|
| v1.49.947 | `content.includes` over dedicated files | global substring scan -> dedicated files only |
| v1.49.949 | end-to-end-file detection | non-end-to-end files no longer count |
| v1.49.953 | regex: reader-call-literal + substrate-import | a bare mention no longer counts |
| v1.49.955 | AST: real call bound to imported reader + depth-1 dataflow/call-graph | comments/strings/aliases/namespaces/one-hop indirection |
| v1.49.956 (this) | inter-procedural fixpoint + N-level binding | one-hop / one-level caps; two nested/flat-scope over-reports |

## Termination note

Both new mechanisms are provably terminating: the call-graph fixpoint is monotone over the finite `(function x param index)` domain (it converges; mutual recursion with no reader call yields empty reach-sets), and `resolveIdentifier` carries a `seen` set that breaks alias cycles. Both properties are exercised by committed tests that pass by returning rather than hanging.

## Test posture

- `cadence.test.ts` **82/82** (17 new). `tsc` build clean. `cadence --check` exits 0; `cadence --axis verify` reports `not-overdue`, `uncovered: []`.
- Mutation-proven: fixpoint edge propagation, alias-chain recursion, per-hop `isParamInScope`, `eachOwnNode` non-descent, and the ambiguity drop each reap the right tests when reverted.
- Full suite 35783 green; no collateral (`cadence.js` imported only by `dispatch.ts` + its test).
- 3-lens adversarial review Workflow: 0 blockers, 0 majors; 2 minor over-report findings, both fixed in code.

## Engine state at close

- NASA degree 1.178 (unchanged).
- Counter-cadence count **26** (unchanged — forward `feat`; the operator classified this as a normal detector refinement, not a counter-cadence cleanup).
- Manifest: **151 lessons** (unchanged — applies #10450 / #10427 / #10461; refines the v1.49.955 "regex -> AST with fail-soft fallback" carried-forward candidate; promotes none).

## References

- The detector: `src/cli/commands/cadence.ts` (`astWireFacts`, `collectFn`, `resolveIdentifier`, `detectThresholdWire`).
- The arc predecessor: v1.49.955 (AST/call-graph detector; its scope note named this ship's caps).
- The drift guard: the "verify axis (live repo)" test (#10461).
- The disciplines: static-analysis-tool (#10450), failure-mode-contracts (#10427).
