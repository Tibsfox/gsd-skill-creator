# v1.49.920 — Lessons

No new manifest lesson codified this milestone. The discipline manifest holds at
24 domains / 149 lessons. One lesson candidate is recorded below for the next
codify-axis ship.

## Lesson candidate (deferred to codify cadence)

- **A CI lane added to a single workflow inherits that workflow's run-level
  conclusion — so it is load-bearing for any gate that reads that conclusion.**
  GitHub aggregates every job's result into one run-level `conclusion`, and the
  pre-tag-gate ci-gate reads exactly that field (never per-job). Appending a
  `macos-latest` matrix job to `ci.yml` would therefore have made a flaky/slow
  10×-billed runner block — or, with `continue-on-error`, *delay* (run stays
  `status != completed`) — every future ship. The decoupling discipline: stand
  the new lane up as a **separate workflow with no `push` trigger** (so it never
  enters the gate's dev-tip match), prove it green-stable on a nightly cadence,
  then fold it into the gated matrix as a deliberate follow-on. Sibling of
  failure-mode-contracts #10427 (load-bearing vs accessory surfaces) and the
  shelfware lightest-wire discipline #10422 (the lightest wire that delivers the
  signal without taking on the heavy coupling). A second, narrower observation
  rides along: a run-selection gate that takes `.[0]` of `gh run list --branch X`
  silently assumes exactly one workflow produces runs at a given SHA — adding a
  second push-triggered workflow breaks that assumption.

## Reinforced (no new lesson ID)

- **Gate-enforce-every-runnable-surface + drift-guard pairing (#10461).** The new
  runnable surface (the macOS workflow) ships paired with a drift-guard
  (`ci-macos-parity.test.ts`) that derives its expectation from `ci.yml` and fails
  on either parity drift (Linux gains a command the macOS lane lacks) or decoupling
  drift (a `push:` trigger is added). The guard runs in the gated + CI suite, so it
  cannot itself silently rot — Layer 1 (enforced) + Layer 2 (the source-derived
  check is the drift-guard).

- **Read/scope before building (ledger-driven-work #10409, #10410).** Per-surface
  recon against the live CI config — not the audit's "add a matrix job" framing —
  overturned the design: the matrix shape was the wrong shape because of a gate-
  coupling property invisible from the one-line audit estimate. The recon *is* the
  design input.

- **Gate-not-vigilance (counter-cadence discipline).** The decoupling is encoded in
  the workflow's triggers (a structural property), not in a prose reminder to "keep
  macOS from blocking ships." Convert the offending rule into a structural guarantee,
  not a re-emphasized convention.

- **Honest verification posture (failure-mode-contracts #10427).** A capability claim
  ("macOS CI passes") must be proven or stated as unproven — never asserted off a
  read. Since a CI workflow's first real run is necessarily on GitHub, the lane ships
  with `workflow_dispatch` wired so the green proof is one command away post-push, and
  the release notes state plainly that pre-push verification is structural only.
