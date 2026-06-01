# v1.49.933 — Lessons

No new manifest lesson. This ship is an instance of an already-codified discipline:

- **#10438 (verify-axis)** — CF2b is a verify-axis carry-forward: prove the
  behaviour of a substrate (the MA-3 stochastic bridge) at its designed boundary
  with real data, rather than assume its preconditions hold. The audit closed the
  stated scope (preconditions verified safe) and the integration regression is the
  durable proof.

## Carried-forward observation candidate

- **A completeness-critic catches what dimension-lenses clear.** An audit that
  decomposes a surface into named dimensions (here: the three stated preconditions)
  can clear each dimension correctly and still miss a defect, because the defect
  lives *between* the dimensions — in this case a public, unvalidated input field
  (`importance`) that every lens assumed bounded. The load-bearing role was the
  critic explicitly tasked with the *opposite* job: find a precondition the lenses
  cleared, by constructing inputs to the real entry point and running them. Nine
  agents concluded "already-safe" (correctly, about the named preconditions); the
  tenth, hunting for false negatives, found the bug. Generalisation: any
  adversarial review of an "is this safe?" claim should include an agent whose
  success condition is finding what the others missed, not re-confirming the
  consensus. Candidate for promotion if a second instance recurs (sibling of the
  adversarial-verify and loop-until-dry patterns).

## Reinforced (carried-forward, not yet promoted)

- **`??` does not catch `NaN`.** `cand.importance ?? 0` lets a `NaN` through (`??`
  only guards `null`/`undefined`). When a value flows from a public, unvalidated
  field into arithmetic that feeds a comparator, `NaN` is the input to test —
  `Math.min`/`Math.max` propagate it, and `NaN` silently breaks sort comparators
  (`a - b` is `NaN`, so the array is left unordered with no error).

- **Sanitise non-finite values at the documented clamp site.** A function whose
  docstring promises a `[0,1]` result must honour it for *all* inputs, including
  `NaN` — `Math.max(0, Math.min(1, NaN))` is `NaN`, a clamp that bounds the range
  but not the value. The single clamp site is the correct, minimal place to absorb
  it; guarding downstream consumers instead would scatter the fix.

- **Attack the "it's already safe" prediction.** A handoff that predicts a no-op is
  a hypothesis, not a conclusion. The audit-first response — verify the prediction
  adversarially before acting on it — is what distinguished a doc-only close from a
  real defect closure here.
