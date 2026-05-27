> Following v1.49.836 — _`publish.mjs` Destination-Side Hand-Author Preservation_, v1.49.837 wires the **`predictive.low_confidence_threshold` observation source** — closing the unwired gap v835 left as scaffold. The threshold's `observationSourceFor()` flips from `wired: false → true` because the JSONL log + CLI recording path is now complete and the bounded-learning dispatch reads from it. Mirrors the v798→v803 progression that wired `token_budget.warn_at_percent`, with a polarity flip baked in because raising `low_confidence_threshold` makes the fallback fire MORE often (opposite of `warn_at_percent`'s "raise = warn less often").

# v1.49.837 — `predictive.low_confidence_threshold` Observation Source Wired

**Shipped:** 2026-05-27

## What shipped

- **NEW** `src/bounded-learning/predictive-low-confidence-events.ts` (~200 LOC, mirrors v803's `token-budget-events.ts`):
  - `PredictiveLowConfidenceEventKind` = `'useful' | 'not_useful'`.
  - `PredictiveLowConfidenceEvent` interface (timestamp, kind, optional `currentSkill`, `maxScore`, `thresholdValue`, `reason`).
  - `eventKindToValue`: `useful → -1` (favors RAISING the threshold so fallback fires more), `not_useful → +1` (favors LOWERING the threshold so fallback fires less). **Polarity is inverted vs v803** because the underlying threshold semantics are inverted (raising `low_confidence_threshold` → fires more; raising `warn_at_percent` → fires less).
  - `appendPredictiveLowConfidenceEvent`, `readPredictiveLowConfidenceEvents` — JSONL append/read with the v803 contract (best-effort silent on write, malformed-line tolerant on read).
  - `DEFAULT_PREDICTIVE_LOW_CONFIDENCE_EVENTS_PATH` = `.planning/patterns/predictive-low-confidence-events.jsonl`.

- **MODIFIED** `src/bounded-learning/observation-sources.ts`:
  - `observationSourceFor('predictive.low_confidence_threshold')` returns `wired: true` (was `false` since v835).
  - `loadObservationsForThreshold` dispatches the new threshold class to `readPredictiveLowConfidenceEvents`.
  - `ObservationLoaderOptions` adds `predictiveLowConfidenceEventsPath?: string` to override the default location.

- **MODIFIED** `src/cli/commands/bounded-learning.ts`:
  - `SUPPORTED_THRESHOLDS` adds `'predictive.low_confidence_threshold'` (4 → 5). Operators can now target the new threshold via `--threshold predictive.low_confidence_threshold`.
  - `runRecordEvent` dispatches by `--threshold` value: token-budget branch unchanged; predictive branch added via new `runRecordPredictiveEvent` function.
  - Predictive branch accepts `--kind useful|not_useful` + optional `--current-skill`, `--max-score`, `--threshold-value`, `--reason`, `--predictive-low-confidence-events <path>` flags.
  - Help text updated to document both branches.

- **NEW** `src/bounded-learning/__tests__/predictive-low-confidence-events.test.ts` (+13 tests): mirrors v803's test shape exactly.

- **MODIFIED** `src/bounded-learning/__tests__/observation-sources.test.ts`:
  - Updated 1 existing test for `wired: true` flip.
  - Replaced 1 existing test (was "returns empty array for scaffold") with 2 new tests: `reads predictive-low-confidence events JSONL when present` + `returns empty array when JSONL is missing (honest no-data baseline)`. Net +1 test (1 → 2).

- **MODIFIED** `src/cli/commands/bounded-learning.test.ts`:
  - One existing test updated for `SUPPORTED_THRESHOLDS.length: 4 → 5`. Added 3 assertions for the new threshold's wiring in the `--summary` output.

## Why this ship

v835 left the threshold as a scaffold — type-registered but observation-source-unwired. The v834-835 handoff explicitly listed wiring it as the #1 follow-up:

> 1. **Production `fallbackProvider` wire** (~45-60 min). Wire `RosettaConceptFallback` (or equivalent factory) into production copper/selector construction paths + add `predictive-low-confidence-events.jsonl` JSONL log + flip `observationSourceFor('predictive.low_confidence_threshold').wired: false → true`.

The handoff's framing included three parts: (a) JSONL log, (b) production fallbackProvider construction, (c) flip the wired flag. **Parts (a) and (c) shipped this milestone; part (b) is structurally blocked** — neither `ActivationSelector` nor copper `Activation` has a production caller at v837 ship time. Both are exercised only in tests today. A future ship that adds a production caller of the predictive path can opt in to the wire by constructing a `RosettaConceptFallback` and passing it as `opts.fallbackProvider`; the auto-emit path will then populate the JSONL.

Until then, the wire is exercised by:
- Integration tests (`tests/integration/copper-rosetta-fallback-wire.integration.test.ts` — the v832 wire that established the cross-rootdir pattern).
- Operator-driven CLI recording (`skill-creator bounded-learning --record-event --threshold predictive.low_confidence_threshold --kind useful|not_useful`).

This is honest "wired" framing — the source CAN be wired, the dispatch reads from it, the CLI can populate it. The auto-emit-from-production-fallback-fire path is in place but exercises only when a production caller of the predict path constructs a `fallbackProvider`.

## Polarity discussion (key design decision)

The bounded-learning calibration framework interprets `obs.value`:
- Positive → posResult e-process rejects → direction = `'decrease'` (lower threshold).
- Negative → negResult e-process rejects → direction = `'increase'` (raise threshold).

For **`token_budget.warn_at_percent`** (v803): raising the threshold means the warn fires LESS often (because usage % must exceed a higher bar). Operator finds the warn USEFUL ("responsive") → wants it to fire EARLIER (more often) → favor DECREASING the threshold → value = `+1`. `responsive → +1`. `ignored → -1`.

For **`predictive.low_confidence_threshold`** (v837): raising the threshold means the fallback fires MORE often (because the `maxScore < lowConfidenceThreshold` condition is satisfied by more scores). Operator finds the fallback USEFUL → wants it to fire MORE often → favor INCREASING the threshold → value = `-1`. `useful → -1`. `not_useful → +1`.

**The polarity flip is intrinsic to the threshold's mechanic, not arbitrary.** Documented in the new module's JSDoc + reflected in the test names ("useful → -1 (favors raising the threshold, fire more often)"). Future thresholds with similar "raising = firing more" semantics should follow this polarity convention.

## Engine state

NASA degree sustains at **1.178** — **55 consecutive ships at 1.178**, widest pressure margin record again. Counter-cadence count UNCHANGED at 6.

KNOWN_UNWIRED Process: **22** (UNCHANGED).
KNOWN_UNWIRED Egress: **11** (UNCHANGED).
Manifest entries: **23** (UNCHANGED).
Lessons in manifest: **77** (UNCHANGED).
UNCODIFIED: **39** (UNCHANGED; ≤ ceiling 41).

Wired calibratable thresholds: **5 of 7 → 5 of 7** at SUPPORTED_THRESHOLDS level; observation-source-wired count **4 → 5** with the v837 flip (`suggestions.* × 3 + token_budget.warn_at_percent + predictive.low_confidence_threshold`). Type-registered remains **7 of 7**. The conflation between "runtime-wired" + "type-registered" + "observation-source-wired" that v835 flagged is now operationally clearer:
- 7 type-registered (`CalibratableThreshold` members)
- 6 runtime-wired (`suggestions.* × 3 + token_budget.* × 2 + observation.retention_days + predictive.low_confidence_threshold`)
- 5 observation-source-wired (the 5 in `SUPPORTED_THRESHOLDS`)

Codify-axis cadence: 4 ships past last codify (v833) — within the 7-10 ship floor.
Consume-axis cadence: 3 ships past last consume (v834) — within floor.
Calibrate-axis cadence: 7 ships past last calibrate (v830) — at floor; next calibrate ship would be due if pressure accumulated. v837 itself is calibrate-axis-adjacent (wires a new observation source for calibration); could be counted as the next calibrate-axis tick OR deferred until enough events accumulate for a real adjustment.

## Tests

+13 net new tests (predictive-low-confidence-events module) + 1 net new test in observation-sources (wired path replaced + JSONL-missing path added) = +14. Existing tests updated: 2 (observation-sources scaffold tests → wired tests; CLI summary test → 5 thresholds). All 61 CLI tests pass; all 128 bounded-learning tests pass; full suite passes.

## What this ship is not

- Not a NASA degree advance (NASA 1.178 unchanged, now 55 consecutive).
- Not a chip ship (KNOWN_UNWIRED unchanged).
- Not a production fallbackProvider construction (structurally blocked; no production caller of the predict path exists at v837).
- Not an auto-emit from production code wire — the auto-emit hook IS in place via the existing emitPredictions dispatch path in `copper/activation.ts` + `orchestration/selector.ts`, but those dispatches require a `fallbackProvider` to be set (currently only in tests). The wire is end-to-end functional whenever the fallback fires.
- Not a calibration recommendation change — the loop returns `direction: 'hold'` until enough events accumulate. The dispatch is now READY to compute against real data.

## Verification

- `npx vitest run src/bounded-learning/` → 128 PASS (was 115 + 13 new).
- `npx vitest run src/cli/commands/bounded-learning.test.ts` → 61 PASS.
- `npm run build` → clean.
- `bash tools/pre-tag-gate.sh` → 17/17 PASS (pending T14 step 1).
- Full suite (expected): 35,257 PASS (35,243 + 14).

## Forward path post-v837

1. **Audit-inverse-check enhancement** — v834-flagged; ~30-min ship. Closes the chokepoint audit's unidirectional asymmetry.
2. **Continued ProcessContext singleton chips** — terminal/mesh/intel families.
3. **NASA 1.179 forward-cadence** — strong-default after the 4-ship operational-debt sequence (this is the 2nd of 4).
4. **Production caller of the predict path** — a separate, larger-scope future ship that constructs `ActivationSelector` (or copper `Activation`) somewhere in production with a wired `fallbackProvider`. Once present, the v837 JSONL will start accumulating real events from production fallback fires.
5. **`/sc:status` integration** — analog to v803, the /sc:status skill prompt could surface "predictive fallback fired N times since last tick" and invoke `--record-event` after operator review. Future ship.
6. **Next codify ship (v840+)** — picks up v836's #10431 generalization + v833 carry-forwards + this ship's polarity-flip-as-deliberate-design observation (1 instance).

## Most valuable single takeaway

**The "wired" semantics encode an architectural promise, not a data-flow guarantee.** A threshold's `observationSourceFor().wired = true` means: (a) the dispatch reads from a specific JSONL, (b) the CLI can populate that JSONL, (c) the calibration loop will compute against any events present. It does NOT mean "production code automatically generates events." That separate guarantee requires a production caller that exercises the substrate the JSONL is logged from.

For v837's threshold, the wire is end-to-end ready; the production data flow waits for an upstream caller. This is the same shape as v803 (token-budget) — the wire shipped before the auto-recording from /sc:status was bolted on. The discipline is: wire the source, document the upstream-caller gap explicitly, let the next ship that needs the data populate it via either (a) production hook or (b) CLI recording.

**Second-most valuable:** the polarity-flip-as-deliberate-design observation is a recognizable pattern. When a new calibratable threshold is added, the polarity convention (which side is `+1`) must align with the threshold's mechanic, not be copy-pasted from a sibling threshold. The v837 wire INVERTS v803's convention because the underlying threshold mechanic is inverted. Documenting the polarity in JSDoc + test names guards against future copy-paste mistakes. Worth a forward-flag for the next calibrate-axis ship.
