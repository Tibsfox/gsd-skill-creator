# v1.49.931 — Summary

## The ship

v1.49.927 wired the MA-3 stochastic bridge into the M5 `ActivationSelector`: an
opt-in `stochastic` option that, when enabled AND `inBranchContext: true`, promotes
a softmax-sampled candidate to the top of the ranked set. But the `inBranchContext`
gate (CF-MA3-03, the ME-3 safety gate) means a **live** activation — which always
passes `inBranchContext: false` — never triggers the promotion. The only caller
that exercised the true branch was the unit test. The path was production code with
no production caller.

v1.49.931 supplies that caller. `selectBranchVariant()` (new M4 primitive) chooses
among candidate branch-skill variants by running the selector with
`inBranchContext: true` and a seeded RNG. An M4 branch/exploration frame is exactly
where in-branch stochasticity belongs: exploration is the place you *want* to
occasionally try a non-top variant, and a branch is isolated from the live trunk.
`explore()` consumes the primitive as an optional, default-off step.

## Why this is a sound wire (not a forced one)

The v1.49.929 lesson was that a wire should not be forced where no sound site
exists. Here the site is sound by construction:

- The selector's stochastic promotion is *gated* on being in a branch context.
- A live session cannot legitimately set that flag (ME-3).
- `selectBranchVariant()` IS an M4 branch frame, so setting `inBranchContext: true`
  is correct — it is not a workaround, it is the gate's intended consumer.

So this closes the consume-axis gap for the v927 substrate: the stochastic path now
has a real production caller, and the default activation path remains byte-identical
(SC-MA3-01) because `explore()` only invokes the selector when `variantSelection` is
explicitly supplied.

## Scope discipline

One new ~190-line M4 primitive, a small backward-compatible extension to
`explore()`, a barrel export, and a 7-case integration test against a real
selector. No change to the selector itself, no new substrate, no new threshold, no
new manifest lesson. Counter-cadence unchanged at 20; NASA degree unchanged at
1.178.
