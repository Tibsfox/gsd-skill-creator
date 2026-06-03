# v1.49.953 — Retrospective

## What went right

- **The detector was pinned against the real tree before it could regress it.** The hard constraint on a stricter coverage detector is that it must NOT reclassify any of the five already-covered dedicated end-to-end files as uncovered. The `SUBSTRATE_MODULE_RE` pattern and the `loadObservationsForThreshold(`-with-literal regex were both checked against the actual call style and import paths of all five real files (including the multi-line `loadObservationsForThreshold(\n  'threshold',` style the token-budget and predictive tests use, which `\s*` spans). The "verify axis (live repo)" test — which asserts all wired thresholds covered against the real `tests/integration/` dir — is the live-tree drift guard that makes a future regression fail loudly.

- **A pure detector function kept the new logic mutation-testable.** `detectThresholdWire(threshold, content)` is pure (string in, boolean out), so each of its two conjuncts has its own mutation-proven test: reverting to `content.includes` fails the comment-only-mention test, and dropping the substrate-import conjunct fails the reader-call-without-substrate test. The two failure modes are independently pinned.

- **The verdict did not change, only the evidence required for it.** The live verify axis was `not-overdue` before and after — but for a stronger reason. Before, a threshold was "covered" if its string appeared anywhere in a dedicated file (a comment sufficed); after, the test must actually pass the threshold to the calibration reader AND import a substrate. The ship hardens the *meaning* of "covered" without moving the verdict, which is exactly right: the coverage was real, the detection was weak.

- **The honest-marker discipline held again.** This ship hardens the verify DETECTOR, not the verify COVERAGE (coverage is unchanged at 0 uncovered). So it is NOT a verify-axis advance and self-tags no `cadence_advances`, exactly as v1.49.949 (the prior detector-hardening ship) did. Only v1.49.951 (which closed a real coverage gap) earned `cadence_advances: [verify]`.

## What went well in process

- **The synthetic test content was migrated, not deleted.** The pre-v953 `verifyVerdict` tests used string-presence synthetic content (`'exercises observation.retention_days'`). Rather than drop them, they were rewritten with structural-wire content via a `wiredContent(threshold)` helper, and a complementary `mentionContent(threshold)` helper feeds the new "mention does not wire" assertions. The test suite's intent (coverage logic is testable with synthetic entries) was preserved while its fixtures became realistic.

## What to watch

- **`SUBSTRATE_MODULE_RE` is the detector's one fragility.** It matches `-substrate`, `-events`, and `suggestion-store` import paths — the three naming schemes the five real substrates use. A future calibratable threshold whose substrate module is named outside that set would fail the substrate-end check and (wrongly) show its threshold as uncovered. The live-tree drift guard catches this at the introducing ship: the author extends the pattern (#10461). The pattern tracks reality because the guard forces it to.

- **Structural, not call-graph.** The detector is regex-based (import presence + call-with-literal), not a TypeScript AST/call-graph analysis. It can be fooled by pathological constructions (e.g. a `loadObservationsForThreshold('T'` inside a string literal or a dead code path), but those do not occur in the disciplined #10453 end-to-end tests, and a full call-graph detector would be disproportionate. The scope was chosen deliberately and documented.
