# v1.49.933 — Summary

## The ship

CF2b (v929 carry-forward 2(b)) was a verify-axis task: confirm three preconditions
of the MA-3 stochastic selector bridge — non-empty scores, finite/non-negative
temperature, and sorted decisions — and decide whether they need type-level guards.

An adversarial, audit-first investigation answered both halves:

1. **The three named preconditions are already safe.** Empty scores are
   triple-guarded; non-finite/non-positive temperature is absorbed into a
   deterministic argmax (or a legitimate uniform), never thrown; sorted-ness is
   guaranteed by the selector's unconditional sort and is irrelevant to
   value-driven sampling. The original "add guards" plan was unsound — a
   throw-on-NaN guard would break the existing sanitize-not-throw contract that
   `softmax.test.ts` pins. CF2b's preconditions need **no new guards**.

2. **The audit surfaced a real, separate bug.** A `NaN` on the public, unvalidated
   `Candidate.importance` field produced a `NaN` composite score that defeated the
   desc-by-score ranking sort, silently mis-seating the poisoned candidate at
   position 0 — a wrong winner, with no throw, on *both* the deterministic
   `ActivationSelector.select()` path and the stochastic bridge. It is an M5 scorer
   defect, surfaced via the "sorted decisions" precondition.

## The fix

One line at the single existing clamp site (`importanceScore` in
`src/memory/scorer.ts`): coerce a `NaN` gamma to `0`, so it can never propagate
into the ranking score. `±Infinity` behaviour is unchanged. This corrects both
selection paths at the source — no guard is added to the stochastic surface itself.

Paired with a unit test (NaN gamma → 0, finite `scoreEntry`), an end-to-end
regression at the `selectBranchVariant` boundary (NaN importance → correct argmax,
both paths, no NaN leak), and a doc note recording the bridge's verified
precondition / absorb-to-deterministic contract.

## Why audit-first mattered

The bug was invisible to nine independent agents reasoning about the *named*
preconditions; only the completeness-critic — tasked with the opposite job, hunting
for a precondition the others *cleared* — found it, by testing a public field the
others assumed bounded. Pass-rate and dimension-by-dimension review would both have
missed it. The audit's value was the false-negative hunt, not the checklist.

## Scope discipline

One-line production fix in the M5 scorer, one unit test, one integration
regression, one doc-comment. No new substrate, no new manifest lesson. Counter-cadence
unchanged at 20; NASA degree unchanged at 1.178. Fourth shipped item of the v929
carry-forward campaign.
