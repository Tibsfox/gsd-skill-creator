# v1.49.957 — Summary

## The ship

Close the last bound the v1.49.956 wire detector documented. The `cadence` verify axis decides a wired calibratable threshold is "covered" iff a dedicated `*-end-to-end` test wires substrate -> calibration; v1.49.955-956 parsed that wire through literals, N-level `const`/`let` alias chains, and an N-hop wrapper-param fixpoint, but a reader call taking a function's RETURN value was explicitly out of scope. This ship resolves it -- and closes two adversarial-review over-report findings in code along the way.

## How it was scoped

`skill-creator cadence --check` exits **0** (no axis machine-overdue), so this was scoped from a ledger -- the post-v1.49.956 handoff's forward-candidate list, which named "Return-value dataflow in the verify detector," and `astWireFacts`'s own scope note recording the same bound. A normal forward `feat` (not counter-cadence).

## What shipped

- **Return-value dataflow.** `collectFn` records each local function's return expressions; `resolveCallReturn` folds a call `f(...)` to the single literal `f` unconditionally returns. Resolves `load(getThreshold())`, `outer(getThreshold())`, N-level return chains, and the `const t = getThreshold()` binding -- composing with the wrapper fixpoint and alias chains.
- **Conservative by construction.** Call arguments are ignored (a function returning a parameter resolves to nothing -- the param-return-through case is the next bound); divergent or unresolvable return paths drop the call; a shared `seen` set breaks return cycles.
- **Two over-report guards (review findings, closed in code).** `isParamInScope` now recurses object/array binding patterns, so a destructured param no longer resolves against a colliding module const (also closed a latent v1.49.956 hole). A bare `return;` or an implicit `undefined` fall-through now drops the function from return resolution. One shared declaration counter drops a name ambiguous as a binding and/or a function.

## The invariant

The live verify verdict is byte-for-byte unchanged -- `not-overdue`, 0 uncovered, all 7 wired thresholds covered. All five real end-to-end files pass direct string literals, so the lift is robustness-only; the "verify axis (live repo)" test stays the #10461 drift guard.

## Verification

- `cadence.test.ts` **109/109** (27 new); `tsc` clean; `cadence --check` exits 0; full suite green (35245 passed).
- Eight mutations (call dispatch, divergence, unresolvable-return, call-binding, binding-pattern param guard, implicit fall-through, bare return, merged counter) each reaped by the right tests.
- 4-lens adversarial review (9 agents): 0 blockers; two over-report findings (1 major, 1 minor), both fixed in code with mutation-proven regressions.

## Engine state

NASA 1.178 (unchanged), counter-cadence **26** (unchanged -- forward `feat`, not a cleanup), manifest **151** (unchanged -- applies #10450 / #10427 / #10461; promotes no lesson). No `cadence_advances` tag.
