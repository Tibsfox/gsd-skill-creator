# v1.49.934 — Lessons

No new manifest lesson. This ship is three instances of an already-codified discipline:

- **#10438 (verify-axis)** — a substrate with callers-but-no-integration-test (or, as
  here, no callers at all) is overdue for a `tests/integration/` proof driven at its
  designed boundary with real data. Temperature, Langevin, and eligibility each had
  thorough unit coverage of their internal math but no proof that the boundary value
  composes with the real consumer or sits on the real data path. The three tests close
  that gap; per the v929 corollary, for a substrate awaiting a consumer the integration
  test *is* the consume-axis closure.

## Reinforced (carried-forward, not yet promoted)

- **Recon-then-probe before authoring a boundary fixture.** The v931 red CI was a
  wrong-shape fixture authored from an assumed type. The durable counter is to read the
  module's real exported signatures AND its existing unit-test helpers, then run a
  throwaway probe that imports the real module and confirms the fixture shape and the
  discriminating values — before writing the test. All three CF3 tests passed on first
  run because every value was observed from real output first.

- **A verify-axis test must be mutation-proven, not just green.** Pass-rate is blind to a
  vacuous test. Identify, per assertion, the one-line source mutation that should flip it
  red, and (at least once per ship) actually apply one and watch the expected subset go
  red — reverting with `git checkout`, never a hand-undo. A green verify-axis suite whose
  teeth are unverified is a forensic surface masquerading as a load-bearing one.

- **Batch homogeneous, low-risk, test-only proofs into one ship.** Three cohesive
  #10438 instances with zero production change carry no risk-isolation benefit from
  separate milestones; batching them is one CI run and one release-notes set for the same
  coverage. Reserve separate ships for changes with independent blast radius.

## Carried-forward observation candidate

- **Boundary proofs surface the next consume-axis ship.** Writing the integration test
  forces naming the exact consumer the substrate was built to feed (MD-4 → MA-3 softmax /
  MD-3 noise scale; MA-1 → MA-2 TD-error weighting). Those un-wired edges — proven to
  compose here but not yet wired in production — are the explicit backlog for a future
  consume ship. The verify-axis test is both the proof-of-readiness and the regression
  guard the eventual wiring will lean on.
