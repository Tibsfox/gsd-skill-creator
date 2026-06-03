# v1.49.963 — Summary

## The ship

A robustness-only lift of the cadence verify-detector (`astWireFacts` in
`src/cli/commands/cadence.ts`). It closes the two bounds v1.49.959 documented as
remaining: parenthesized-param forwarding on the collect side, and the nested
self-call `load(id(id('x')))`. Because no real end-to-end file uses these
shapes, the live `cadence --check` verdict is byte-identical — this is detector
hardening, not a behavior change.

## What shipped

- A new `unwrapParens` helper strips grouping parens before the
  param-forwarding `ts.isIdentifier` checks at the four `collectFn` attribution
  sites (reader-arg, inter-function edge, `return (t)`, `(t) => (t)` arrow body)
  and at the alias and call binding-initializer sites (`const a = (b)`,
  `const a = (getT())`).
- `resolveCallReturn`'s argument loop resolves the substituted call-site
  argument under `seen` minus the current callee name, so a nested self-call
  resolves while a cycle re-entering through an argument still terminates
  (cloning `seen`, not a fresh set, is load-bearing for that termination).
- Residual 1(a) (a block shadowing a same-named param) was investigated and
  found already conservative — no code change.

## Verification

- 146 cadence tests green (flipped v1.49.959 bound test + new v1.49.963 block);
  the 8 new positive tests are non-vacuous against the parent commit.
- All fix points mutation-proven; the termination guard asserts `astWireFacts`
  directly does not throw (the fresh-set mutant stack-overflows).
- tsc build clean; live `cadence --check` exit 0 and byte-identical (#10461).
- Three-lens adversarial review (130+ probed inputs): 0 over-reports, 0 hangs.

## Engine state

- NASA degree 1.178 (frozen). Counter-cadence 29 (unchanged — normal forward
  feat). Manifest 151 lessons (unchanged). No cadence_advances.
