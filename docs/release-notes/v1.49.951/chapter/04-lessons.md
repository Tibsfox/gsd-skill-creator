# v1.49.951 — Lessons

No new manifest lesson is promoted this ship (manifest stays **151**). This `test` ship applies three existing lessons.

## Applied (existing lessons)

- **#10438 — verify axis (substrate-with-callers-but-no-integration-test).** The verify operational axis budgets ~10 ships per substrate that has callers but no integration test. The three `suggestions.*` thresholds were the longest-outstanding instance — wired since v1.49.795-797 with no canonical end-to-end test. This ship closes that gap, the last one in the bounded-learning loop.

- **#10453 — substrate -> calibration end-to-end test pattern.** The canonical closing-move shape: temp dir setup, substrate write, calibration-loop read, polarity assertion (single + multi-event with net-sum), missing-file tolerance, malformed-line tolerance. This ship instantiates the pattern for a substrate that is NOT a `runX()` fire-and-forget emitter but a synchronous `SuggestionStore` write — so the documented `setTimeout(50ms)` fire-and-forget wait (#10454) is correctly omitted (the store's `Promise` is awaited to completion). The order-independent count + net-polarity assertion (not sequence) is preserved.

- **#10461 — gate-enforce-every-runnable-surface (honest marker).** The v1.49.950 `cadence_advances` reader gains a genuine verify producer here. Tagging the README `cadence_advances: [verify]` is honest because this ship truly advances the verify axis. The discipline is symmetric across the batch: v1.49.950 self-tagged nothing (advanced no axis); this ship tags `[verify]` (advanced the verify axis).

## Carried-forward candidate (observed, not promoted)

- **A substrate with no `runX()` emitter still has a verify wire — through its store.** The four later calibratable thresholds established the "substrate `runX()` -> fire-and-forget JSONL emit -> calibration read" shape. The `suggestions.*` class shows the pre-substrate variant: the write side is a STORE (`SuggestionStore.transition`) whose persisted state IS the observation source, with no per-event emit. The end-to-end test shape is the same (write via the real store, read via the real loader, assert polarity) minus the fire-and-forget wait. **One instance** of "store-as-substrate" within the verify-pattern family. Promote if a second store-backed (non-`runX`) calibratable threshold gets the same treatment.

## Process note

- **Let the gate scope the work.** The exact scope of this ship — which thresholds, how many — was read directly off `cadence --axis verify --json` (`uncovered: [3 thresholds]`), not inferred. The closing verification was the same command reporting `uncovered: []`. A surface built to name work is also the cheapest acceptance check that the work is complete.
