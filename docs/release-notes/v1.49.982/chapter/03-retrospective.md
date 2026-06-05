# v1.49.982 — Retrospective

## What went right

- **Recon-before-value-choice paid off again.** Before picking any band number, a read-only recon established the load-bearing truth: the band cannot be grounded from real data today (`retainedCount` was never recorded; drops are 1–13 vs a 1000 cap, so a utilization band could never fire `too_lax`). That reframed 5.2 from "tune a number" to "make the signal capable of being bidirectional" — and steered the operator away from a utilization metric that would have stayed effectively one-way.
- **The fix was structural, not cosmetic.** Replacing the hardcoded `kind` at the source (rather than patching the mapper) means the calibration loop now sees real polarity with no change to `eventToObservation`'s ±1 contract.
- **Defense-in-depth at the chokepoint.** Putting the bidirectional guard in `applyRecommendation` (not the CLI) covers the CLI, `--watch`, and any future scheduler in one spot, and it required only that both polarities be present — which also blocks a future all-`too_lax` degenerate corpus, not just today's all-`too_aggressive` one.

## What went well in process

- **The full gate caught a cross-suite miss.** An end-to-end integration test swept an empty corpus three times expecting three degenerate emits; under the new neutral-on-empty semantics it correctly produced one. The 20-step gate surfaced it before tag — the targeted suites alone had passed.
- **Adversarial review earned its keep at low severity.** Five findings, two refuted on the code's own redefined semantics, two confirmed and fixed in code (the guard now leaves a durable, distinct audit trail; the packed-edge test is self-discriminating). Nothing was explained away in prose.

## What to watch

- **Start-the-clock, not a working loop.** The substrate now CAN emit both polarities, but real bidirectional volume must accrue before any dry-run tick is meaningful. Re-audit once post-fix sweeps have produced both kinds; only then consider the single operator-gated dry-run, and `--apply` separately.
- **Band edges are a code const, not config.** `[0.5, 0.9]` is a documented default; promoting it to schema config is a clean follow-up once real volume justifies tuning.
- **The age-pressure `too_lax` is a policy-tightening signal, not a storage-bloat detector** — documented in code so it is not misread.
