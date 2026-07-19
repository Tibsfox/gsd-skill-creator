# v1.49.1129 — Retrospective

## What went right

- **Authoring and refinement were run as two distinct campaigns.** The first
  pass optimized for coverage (219 concepts across three barrels); a separate,
  source-grounded review pass restored the fidelity the first pass paraphrased
  away. Treating them as one job would have produced neither the breadth nor the
  accuracy.
- **The grounded review scaled without truncating.** A 25-reviewer +
  1-synthesis workflow studied all 219 concepts against their sources and emitted
  structured findings; the orchestrator aggregated them deterministically and
  wrote the review doc itself, avoiding the single-agent 219-row truncation trap.
- **No fabrication survived the anchor pass.** Web-verifying the 8 uncached
  anchors deleted 2 invented claims rather than dressing them up, and agents
  logged ~50 unverified claims instead of guessing.

## What went well in process

- **Six waves, each centrally gated and atomically committed.** Every wave built
  per-concept packets, fanned out description-only edits, gated with `tsc` +
  `vitest .college`, and committed once — keeping the tree green across all six
  with no `.planning` files staged and no co-author trailers.
- **The cross-link wave used propose → apply → reconcile.** Because resolution
  tests build their resolvable-id set from a manual subset, the pipeline
  auto-patched 11 test registries and a reconcile step swept the ones the first
  coverage map missed.

## What to watch

- **The June frontier is exhausted for AI.** Two deep digs returned zero new T1
  concepts; the next College campaign is the July-2026 arXiv wave, not more June
  scanning.
- **The Claude-backed LLM cores are wired but lightly exercised.** Distill
  naming / claim extraction / enrichment ship opt-in and tested at the seam;
  real-corpus runs are the next validation.
- **Cross-link safety stays registry-coupled** until resolution tests derive
  resolvable ids from the barrels directly rather than from a hand-imported
  subset.
