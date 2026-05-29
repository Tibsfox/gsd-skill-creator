# v1.49.891 — Retrospective

## What worked

**Existing `RetentionManager` was the right substrate building block.** The instinct to write a from-scratch retention sweep would have duplicated logic. Instead, `runObservationRetentionSweep` is a thin wrapper that bridges `observation.retention_days` (from skill-creator config) to `RetentionManager.maxAgeDays` (existing pruning machinery). ~110 LOC for the substrate consumer + 7 tests.

**Fire-and-forget contract pinned by an explicit test.** The test `'does not propagate auto-emit failures (fire-and-forget per #10437)'` passes a deliberately unwritable path to the eventsPath option, then asserts the substrate's return value is still valid. Without this test, a future refactor that propagates errors would silently break the contract.

**`setTimeout(50ms)` is the right test-side wait for fire-and-forget.** Initial attempt used `setImmediate(resolve)` to advance the event loop, but the auto-emit's `mkdir + appendFile` chain didn't settle in time. `setTimeout(50ms)` gives the OS time for real disk I/O. Worth documenting as a test-side pattern for fire-and-forget assertions.

## What didn't work

**The default-kind decision required scope-analysis the recipe didn't cover.** v837/v846 predictive defaulted to `not_useful` (mirrored the CLI default). v884 observation-retention has NO CLI default — the operator must pass `--kind`. So v891 had to pick its own default. Settled on `too_aggressive` (conservative bias toward keeping more data, since the sweep is the action operating without explicit operator approval). Documented the rationale inline. Future read-side wires that lack a CLI default should follow this pattern: pick the conservative bias, document the rationale, pin via test.

## Verdict on scope

Fifth and closing ship of the multi-ship session. ~25 min wall-clock for the substrate wire + tests. Lighter than the v884/v888 read-side ships because the existing RetentionManager carried the heavy lifting. The bridge pattern (`runObservationRetentionSweep` wraps `RetentionManager.prune` + `appendObservationRetentionEvent`) is generalizable to any future calibratable threshold whose substrate already exists.

## Promotion-eligible candidates accumulated this ship

1. **Substrate wrapper pattern for calibratable threshold + existing-substrate bridges** (1 instance v891). When the substrate (e.g., RetentionManager) already exists and just needs a calibratable-threshold bridge, write a thin `runX` function that:
   - Reads the threshold from the operator config shape.
   - Constructs the existing substrate with the threshold value.
   - Runs the substrate operation.
   - Auto-emits an observability event per #10437 with a documented default kind.
   Promotion-eligible if a 2nd instance lands (likely on `token_budget.max_percent` substrate auto-emit when that ships).
2. **Fire-and-forget test-side wait pattern (`setTimeout(50ms)`).** When asserting on a fire-and-forget Promise's I/O, use `setTimeout` not `setImmediate`. 1 instance v891; promotion-eligible at 2nd instance.

## Forward path

**Session-close.** The v887-v891 multi-ship session is complete. Next session resumes from one of:

- **NASA forward-cadence at 1.179** (operator-recommended; 109-ship pressure margin extends beyond the v884-v886 high-water mark).
- **Continue Loader chip-down (v892+)** — 12 entries remain; next smallest `dacp/bus/scanner.ts` 174 LOC.
- **Substrate auto-emit for `token_budget.max_percent`** — mirrors v891's pattern for the other UNWIRED-substrate threshold. Apply the substrate-wrapper pattern from #(candidate above).
- **Calibration-loop integration test** — exercises both read-side and substrate auto-emit for one full threshold loop. Closes the verify-axis trigger gap.
- **Counter-cadence ship** — codify the 3-instance #10451 STABLE promotion + v889/v890/v891 carry-forward candidates as new ESTABLISHED lessons.
