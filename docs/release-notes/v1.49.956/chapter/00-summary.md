# v1.49.956 — Summary

## The ship

Lift the v1.49.955 wire detector's two documented depth caps to full inter-procedural resolution. The `cadence` verify axis decides a wired calibratable threshold is "covered" iff a dedicated `*-end-to-end` test wires substrate -> calibration; v1.49.955 parsed that wire with the TypeScript compiler but capped the call-graph at ONE wrapper hop and binding resolution at ONE level. This ship closes both caps — and closes two adversarial-review over-report findings in code along the way.

## How it was scoped

`skill-creator cadence --check` exits **0** (no axis machine-overdue), so this was scoped from a ledger — the post-v1.49.955 handoff's forward-candidate list, which named "Full inter-procedural call-graph — lift the verify detector's one-hop / one-level binding caps." `astWireFacts` documented the same bound in its own scope note. A normal forward `feat` (not counter-cadence).

## What shipped

- **N-hop call graph.** A monotone fixpoint over `(local function, parameter index)` pairs replaces the single-index `wrapperParamIndex`. A function reaches the reader via param `pi` if it forwards `pi` directly to the reader's threshold arg, OR forwards `pi` into an arg position of another reader-reaching function. Finite domain -> terminates on any graph, including mutual recursion (resolves to empty sets, never hangs). Resolves wrapper chains of any depth.
- **N-level binding.** `resolveIdentifier` follows `const`/`let` alias chains of any depth, with a `seen` set for cycle safety and an `isParamInScope` guard at every hop.
- **Two over-report guards (review findings, closed in code).** `eachOwnNode` stops `collectFn` descending into nested function bodies (a nested callback param can no longer be mistaken for the outer wrapper's same-named param — finding #1). A binding name declared more than once in the file is dropped as ambiguous (a function-local `const` can no longer shadow a module-level one into a false wire — finding #2, a NEW surface from the alias map). Both match the conservative regex.

## The invariant

The live verify verdict is byte-for-byte unchanged — `not-overdue`, 0 uncovered, all 7 wired thresholds covered. All five real end-to-end files pass direct string literals, so the lift is robustness-only; the "verify axis (live repo)" test stays the #10461 drift guard.

## Verification

- `cadence.test.ts` **82/82** (17 new); `tsc` clean; `cadence --check` exits 0; full suite 35783 green.
- Five mutations (fixpoint propagation, alias recursion, per-hop param guard, `eachOwnNode`, ambiguity drop) each reaped by the right tests.
- 3-lens adversarial review: 0 blockers, 0 majors; 2 minor findings, both fixed in code with mutation-proven regressions.

## Engine state

NASA 1.178 (unchanged), counter-cadence **26** (unchanged — forward `feat`, not a cleanup), manifest **151** (unchanged — applies #10450 / #10427 / #10461; promotes no lesson). No `cadence_advances` tag.
