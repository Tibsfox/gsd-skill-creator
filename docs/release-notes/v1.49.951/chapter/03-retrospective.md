# v1.49.951 — Retrospective

## What went right

- **The tool found its own gap, then the gap was closed.** The `cadence` verify axis — built across v1.49.947/949/950 — flagged exactly three uncovered thresholds. This ship closes precisely those three and confirms the flip (`candidate` -> `not-overdue`) by re-running the tool against the real `tests/integration/` directory. The gate-not-vigilance arc paid off on its first use: the surface named the work, the work was done, the surface verified it.

- **The test exercises the REAL substrate, not a mock.** Per #10438, the existing unit tests against mocks prove the wire's signature; an integration test against real collaborators proves its behavior. This test instantiates a real `SuggestionStore` over a temp patterns dir, performs real `.addCandidates()` -> `.transition()` writes to a real `suggestions.json`, and reads through the real `loadObservationsForThreshold` -> `loadSuggestionsFromFile` -> `entriesToObservations` chain. The on-disk JSON is the only thing connecting the two ends — nothing is stubbed.

- **The `suggestions.*` class's structural difference was respected, not forced into the sibling mold.** The four later thresholds each have a dedicated `runX()` substrate and a per-event JSONL; the natural shape there is "call `runX`, wait for the fire-and-forget emit, read the loop." The `suggestions.*` class has neither — its substrate is the `SuggestionStore` and its decisions are awaited-to-completion (not fire-and-forget). The test correctly omits the `setTimeout(50ms)` fire-and-forget wait (#10454) that the siblings need, because awaiting the store's `Promise` is sufficient. Copying the sibling pattern blindly would have added a meaningless wait.

- **One file, three thresholds, one source — but each threshold exercised explicitly.** Because all three thresholds share `suggestions.json`, three near-identical files would have been pure duplication. One file with an explicit `it()` per threshold (each passing its threshold as a literal argument to `loadObservationsForThreshold(`) keeps it DRY while ensuring both the v1.49.950 string-presence heuristic AND a future stricter literal-argument wire detector recognize all three thresholds as covered.

## What went well in process

- **The marker was earned, not assumed.** This ship genuinely advances the verify axis (it closes the coverage gap), so tagging the README `cadence_advances: [verify]` is honest — it is the first real verify producer for the v1.49.950 reader. This contrasts with v1.49.950, which correctly self-tagged nothing because it advanced no axis. The discipline ("tag iff the ship truly advances the axis") held in both directions across consecutive ships.

## What to watch

- **`predictive.low_confidence_threshold` is intentionally out of the verify count.** It has an end-to-end test (v856) but its observation source is `wired: false` (calibration scaffold only, awaiting production `fallbackProvider` deployment). The verify axis checks only WIRED thresholds, so predictive neither counts toward coverage nor is flagged as a gap. When predictive's source is wired in a future ship, its existing v856 test already covers it — no new verify gap will open.

- **Terminal-only filtering is a load-bearing semantic, now pinned.** `entriesToObservations` deliberately drops `pending` and `deferred` (neutral, no acceptance signal). The "pending/deferred -> zero observations" test pins this: a future refactor that accidentally counted neutral entries (e.g. mapping `deferred -> 0` but failing to filter it out, inflating the observation count) would fail this test. Without it, such a regression would silently dilute the e-process's evidence count.
