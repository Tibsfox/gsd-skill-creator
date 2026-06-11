# v1.49.1029 — Retrospective

## What went right

- **The evidence survived hostile scrutiny — after correction.** The promotion case was verified
  live three independent ways before any flip: the baseline chain recomputed from disk (64
  consecutive), the full 218-page trip-vocab corpus sweep (every risk page pre-regime, ≤ 1.160),
  and the release-notes participation count — which is where two independent measurements
  disagreed (51 hand-grep vs 59 reporter) and the disagreement located a real bug in the brand-new
  reporter. The promotion shipped on reconciled numbers (55/20), not on either wrong one.
- **The born-BLOCK step validated itself on its own ship.** Step 22's first enforcement run was
  this ship's own gate: the attestation written by the new helper after the first v2 review run
  passed the three checks live (ancestry + freshness + fields). Dogfooding the enforcement path on
  the ship that introduces it is the strongest possible first fixture.
- **Parallel-executor file ownership held.** A (tools/gate + vitest config) and B (gate script +
  attestation + docs) ran concurrently with zero collisions; the one shared file
  (docs/adversarial-ship-review.md) was sequenced — B's promotion section first, main-context v2
  sections after B landed.
- **The mislabeling guard generalized cleanly.** Both promoted steps BLOCK only on verdict exits;
  tool-malfunction exits stay WARN — the v983 trip-vocab distinction (a broken tool is not a
  content verdict) is now uniform across the promoted pair.

## What went well in process

- The ship-1/ship-2 QA pattern held for a third consecutive audit ship: design pass → bounded
  parallel executor dispatches → main-context integration → live-corpus cross-checks → full suite →
  dogfooded adversarial review → 22/22 gate.
- The readiness reporter was built to OUTLIVE the promotion: lifecycle markers flip its guidance to
  revert instructions, so it remains the auditable K-record and the revert guard rather than
  becoming stale advice (#10427).

## What to watch

1. **Step 22 friction on future ship classes.** NASA content ships must fold
   `write-attestation.mjs --mode content` into the T14 chain; a forgotten attestation now BLOCKs at
   the gate (by design). The fix line is printed by the gate itself; watch the first NASA ship
   under the new regime for runbook fit.
2. **The first organic step-20/21 BLOCK.** Promotion means the next stale baseline or trip-risk
   page stops a ship instead of warning. The bypass tokens are the emergency path; an organic BLOCK
   should be treated as the gate working, not as a regression.
3. **v2 judge behavior on noisy reviews.** The judge's aggressive false-positive rejection is
   prompt-driven; if a future review's fixNow list looks thin against raw confirmed counts, audit
   the judgeRejected list before trusting it (the fail-safe only covers a DEAD judge, not an
   over-lenient one).
