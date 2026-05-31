# v1.49.923 — Lessons

No new manifest lesson codified this milestone. The discipline manifest holds at
24 domains / 149 lessons. One lesson candidate is recorded below for the next
codify-axis ship.

## Lesson candidate (deferred to codify cadence)

- **Staged matrix promotion: a push-triggered NON-BLOCKING matrix leg is the intermediate rung
  between a decoupled-nightly lane and a load-bearing one.** When promoting an unproven CI lane
  into the ship-blocking workflow, fold it in as a matrix leg with
  `continue-on-error: ${{ matrix.<dim> == '<new>' }}` + `fail-fast: false`. This buys per-push
  signal immediately (the lane runs on every push, red X visible) while the run-level conclusion
  — which the ship gate reads — stays unaffected, so an unproven lane cannot block a ship. The
  load-bearing flip (deleting `continue-on-error`) is deferred until N consecutive green pushes
  accumulate, and is a deliberate act the drift-guard forces to also update the test.
  Empirically-established supporting fact: **a job-level `continue-on-error` matrix leg that
  FAILS yields run-level conclusion `success`** (verified on real GitHub Actions) — UNLESS a
  `needs:[<job>]` downstream job consumes the deceptive per-leg success, in which case that
  downstream job can fail the run. This repo's `ci.yml` jobs are independent, so the masking is
  clean. Sibling of #10461 (gate-enforce-every-runnable-surface + drift-guard pairing — the
  `ci-matrix-parity.test.ts` guard is the enforcement layer) and #10428 (meta-cadence — staged
  rungs over a one-shot promotion). Home: ci-cd / static-analysis-tool-discipline.

## Reinforced (no new lesson ID)

- **Resolve a sourced blocker against ground truth, not authority (#10427 loud-vs-silent
  sibling).** The review's BLOCKER cited a blog + a community thread; both described the
  `needs:`-downstream case, not this one. An isolated empirical probe settled it in one run.
  Secondary sources set the hypothesis; the probe was the test.

- **Promote on a track record, not on a single green (#10428).** Zero scheduled nightlies + two
  manual greens after two reds is not "green-stable." The staged leg defers the load-bearing
  flip until the data exists, rather than making an unproven lane block ships.

- **A matrix makes step-parity structural (#10461).** Two-file parity needs a guard deriving
  and comparing command sets; one job over an OS matrix runs identical steps by construction,
  shrinking the drift surface to the matrix shape + the staging property.
