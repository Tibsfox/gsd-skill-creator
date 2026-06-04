# v1.49.965 — Retrospective

## What went right

- **Two-layer closure done properly.** The baseline froze precisely because the
  prior state had only a tool (`adoption-refresh`) and no enforcement. This ship
  shipped BOTH halves — a deterministic per-ship refresh step (source eliminator)
  and a freshness detector gate — rather than just one. Either alone would have
  re-rotted.
- **Forward-progress, not exact-match.** The gate tolerates a configurable
  ship-drift window (default 30) instead of demanding a fresh baseline every ship,
  avoiding per-ship churn while still catching a multi-ship freeze.
- **The detector is a testable tool, not inline bash.** Putting the freshness
  logic in `adoption-baseline-freshness.mjs` gave the audit-required negative
  fixture a clean unit-test home and kept the gate step a thin wrapper.

## What went well in process

- **Adversarial Workflow self-review earned its cost.** Three read-only reviewers
  plus a verify pass found 3 real BLOCKERs the author missed — a cross-release-line
  baseline reporting FRESH, an exit-code 22 collision with `tools-node-test`
  (hidden by a `tail`-truncated grep), and `adoption-refresh` missing from the
  canonical T14 sequence. All were fixed in code before commit, not documented away.
- **Drift-guard discipline held.** The new step legitimately tripped the v961
  count-pinning meta-test; the fix followed the repo's single-count-owner
  convention (new ship owns the count, prior owner goes count-agnostic) rather than
  silencing the guard.

## What to watch

- **WARN-only is deliberate but soft.** The detector does not block by default
  (#10463 staged). The per-ship T14 step 2.7 is what actually keeps the baseline
  fresh; promotion of the gate to BLOCKER is a future ship once the cadence is
  proven.
- **First-ship WARN is expected.** This ship's own pre-tag-gate runs pre-bump
  against the v801 freeze, so step 20 WARNs once; step 2.7 then writes the v965
  baseline and the next ship is FRESH.
- **Denominator normalization deferred.** The gate's printed step denominators
  (`/15`…/`20`) remain inconsistent; full normalization + a step-count parity test
  is the planned Ship 0.2.
