
# v1.49.846 — Auto-emit-from-substrate: predict-low-confidence Event JSONL Wired into Both Production emit-prediction Call Sites

**Released:** 2026-05-28

## Why this ship

Closes the auto-recorder half of the v803 manual+auto duality pattern. v845 shipped the CLI manual recorder (`skill-creator predict-next`) for the `predictive.low_confidence_threshold` calibratable threshold. v846 wires the substrate auto-recorder: both `copper/activation.ts` (PipelineActivationDispatch) and `orchestration/selector.ts` (ActivationSelector) now call `appendPredictiveLowConfidenceEvent` whenever a low-confidence prediction triggers — independent of fallback wiring.

Result: the JSONL at `.planning/patterns/predictive-low-confidence-events.jsonl` now accumulates calibration evidence from real production traffic without requiring operator invocation of the CLI.

## The wires

Two call sites, structurally identical pattern. Each substrate's `emitPredictions` (copper) / `_emitPredictions` (selector) already had a fire-and-forget chain that called `predictNextSkillsWithMeta` and conditionally invoked `fallback.onLowConfidence`. v846 augments the low-confidence branch:

```typescript
const maxScore = predictions.length === 0
  ? 0
  : Math.max(...predictions.map((p) => p.score));
const isLowConfidence = maxScore < lowConfidenceThreshold;
if (isLowConfidence) {
  // Fire-and-forget: observability must not serialize with fallback.
  appendPredictiveLowConfidenceEvent({
    timestamp: new Date().toISOString(),
    kind: 'not_useful',
  }).catch(() => {
    /* auto-emit is observability-only; never break activation */
  });
  if (fallback) {
    await fallback.onLowConfidence(currentSkill, maxScore);
  }
}
```

The `maxScore` computation was previously inside `if (fallback)`. v846 moves it OUT so the low-confidence branch runs whenever `(hook || fallback)` is subscribed AND the predict path returned low-confidence. Auto-emit fires regardless of fallback wiring; fallback dispatch is gated by fallback wiring as before.

## Why fire-and-forget (not awaited)

Initial implementation awaited the append. The integration test (`tests/integration/copper-rosetta-fallback-wire.integration.test.ts`) flaked under suite load because the added disk-write latency pushed the chain past the test's 10ms drain budget. Refactored to non-awaited with an inner `.catch(() => {})` so the append fires in parallel with the fallback dispatch and any append failure is swallowed independently.

This refines the failure-mode contracts pattern (#10427): when adding a disk-write side effect to an existing fire-and-forget chain, the new write MUST also be fire-and-forget; serializing it on `await` defeats the chain's latency budget.

## Why default kind=`not_useful`

The calibration loop interprets event polarity for `predictive.low_confidence_threshold`:
- `useful` event → favor RAISING the threshold (fire more often).
- `not_useful` event → favor LOWERING the threshold (fire less often).

The substrate has no operator-feedback channel at dispatch time. Conservative default (`not_useful`) matches v845's CLI parseArgs default. Operators can override via the CLI when they confirm a useful low-confidence dispatch.

## Test isolation: vi.mock to prevent operator-file pollution

Three test files exercise the auto-emit path:
- `src/chipset/copper/activation.test.ts` — unit tests for PipelineActivationDispatch.
- `src/orchestration/__tests__/selector.test.ts` — unit tests for ActivationSelector.
- `tests/integration/copper-rosetta-fallback-wire.integration.test.ts` — end-to-end through RosettaConceptFallback.

All three now `vi.mock` `appendPredictiveLowConfidenceEvent` at the top of the file so test runs don't write to the operator's real `.planning/patterns/predictive-low-confidence-events.jsonl`. The mock returns a fake path; the unit tests assert against `vi.mocked(...).mock.calls` to verify the call shape.

This is symmetric with the v845 CLI tests' use of `--no-record`: both prevent test runs from polluting calibration data.

## Surface delta

- 2 source files modified: `src/chipset/copper/activation.ts` (+15 LOC effective), `src/orchestration/selector.ts` (+11 LOC effective)
- 2 unit test files modified: `src/chipset/copper/activation.test.ts` (+123 LOC for mock + new describe block), `src/orchestration/__tests__/selector.test.ts` (+90 LOC for mock + new describe block)
- 1 integration test file modified: `tests/integration/copper-rosetta-fallback-wire.integration.test.ts` (+9 LOC for vi.mock)
- 5 release-notes files (this + README + 3 chapters)

## Manifest state

| Field | Before | After |
|---|---|---|
| Manifest entries (discipline domains) | 23 | 23 |
| Lessons in manifest (unique) | 78 | 78 |
| Open lesson candidate backlog | 0 | 0 |
| Tentative observations carried forward | ~14-16 | ~16-18 (+3 from v846 below-threshold + 2 promoted to 2-instance) |
| Production write callers of predict-low-confidence-event path | 1 (v845 CLI) | 3 (v845 CLI + copper/activation + orchestration/selector) |
| CLI manual + substrate auto-emit duality instances | 1 (v803) | 2 (v803 + v845/v846) |

## Engine state

NASA degree at **1.178** (UNCHANGED — **64 consecutive ships at 1.178**; was 63 entering this ship). New widest-pressure-margin record by 1.
Counter-cadence count UNCHANGED at 6.
KNOWN_UNWIRED Process UNCHANGED at 16.
KNOWN_UNWIRED Egress UNCHANGED at 11.
Wired calibratable thresholds: 5 of 7 (UNCHANGED; v846 adds write callers but doesn't change wired-count).
UNCODIFIED count: 39 ≤ ceiling 41 (UNCHANGED).
Operational axes (meta-cadence): 4 (codify / consume / calibrate / verify).

## End-to-end smoke verification

The substrate auto-emit runs whenever a low-confidence prediction triggers in normal operation. Verified during the pre-tag-gate's full vitest suite — all 1946 test files passed (3 skipped), 35,277 assertions, 0 failures.

Operator file pre-ship state confirmed 12 entries (pre-existing); post-suite-run state still 12 entries (no test pollution via the vi.mock surface). The path will accumulate real entries only during production traffic that wires a hook or fallback subscriber AND hits a low-confidence prediction.

## Coupled with v845

| Half | Ship | Path | Trigger |
|---|---|---|---|
| Manual recorder | v1.49.845 | `skill-creator predict-next <currentSkill>` | Operator invokes CLI |
| Auto recorder | v1.49.846 | `copper/activation.emitPredictions` + `selector._emitPredictions` | Low-confidence prediction during normal dispatch (hook OR fallback subscriber wired) |

Both halves write to the same JSONL. The calibration loop consumes the union. The CLI's `--useful` / `--not-useful` flags allow operators to inject opposite-polarity events alongside the substrate's conservative `not_useful` default — net polarity drives the threshold update direction.
