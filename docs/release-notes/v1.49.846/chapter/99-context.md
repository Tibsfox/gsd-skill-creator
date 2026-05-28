
# v1.49.846 — Context

## Provenance

Auto-recorder half of the v803 manual+auto duality pattern. Closes the next-session candidate #2 from the v841–845 cluster handoff: "Auto-emit-from-substrate wire — copper/activation.ts `emitPredictions` and orchestration/selector.ts `_emitPredictions` need to call `appendPredictiveLowConfidenceEvent` when fallback fires."

The v845 CLI was the manual half. v846 is the substrate auto-recorder half. Together they complete the read+manual+auto trio for the `predictive.low_confidence_threshold` calibratable threshold (which had its read-side wired at v837).

## What this ship adds

```
src/chipset/copper/activation.ts                                  [MODIFIED: +15 LOC effective — import + wire]
src/chipset/copper/activation.test.ts                             [MODIFIED: +123 LOC — vi.mock + new describe block (+4 assertions)]
src/orchestration/selector.ts                                     [MODIFIED: +11 LOC effective — import + wire]
src/orchestration/__tests__/selector.test.ts                      [MODIFIED: +90 LOC — vi.mock + new describe block (+4 assertions)]
tests/integration/copper-rosetta-fallback-wire.integration.test.ts [MODIFIED: +9 LOC — vi.mock at top of file]
docs/release-notes/v1.49.846/                                     [NEW: README + 4 chapters]
.planning/PROJECT.md                                              [MODIFIED: pre-bump refresh]
```

## Recon trail

1. **Read predecessor handoff** (`.planning/HANDOFF-2026-05-27-v1.49.841-845-operational-debt-cluster-closed.md`). Next-session candidate #2 named exactly this work.
2. **AskUser for next-ship direction** — operator picked "Auto-emit-from-substrate wire".
3. **Inspect both call sites:** `src/chipset/copper/activation.ts:276-300` and `src/orchestration/selector.ts:314-338`. Both have structurally-identical fire-and-forget chains.
4. **Inspect the appender API:** `src/bounded-learning/predictive-low-confidence-events.ts:178` — `appendPredictiveLowConfidenceEvent(event, options?)` is a best-effort silent surface per #10427; default path is `<cwd>/.planning/patterns/predictive-low-confidence-events.jsonl`.
5. **AskUser for architectural decisions:** (1) auto-emit gating (always-fire vs fallback-only vs explicit flag); (2) event-kind default (`not_useful` vs `useful` vs configurable). Operator picked always-fire + `not_useful`.
6. **Implement copper wire** — top-of-file import + move maxScore out of `if (fallback)` + add awaited `appendPredictiveLowConfidenceEvent` call.
7. **Implement selector wire** — mirror of copper.
8. **Add unit-test coverage:** vi.mock at top of both test files + new describe block per file with 4 assertions each.
9. **First-run gotcha:** operator's `.planning/patterns/predictive-low-confidence-events.jsonl` file is real calibration data. Test runs would pollute it. Solution: vi.mock surface guarantees no disk writes during tests.
10. **Build + targeted test run** — all 44 unit-test assertions pass. Operator file unchanged.
11. **Pre-tag-gate** — failed at integration-test step. `tests/integration/copper-rosetta-fallback-wire.integration.test.ts` flaked: `engine.translate` called 0 times instead of 1. Two issues:
    - **Pollution:** test wrote 2 events to operator's real file before failing.
    - **Flake:** awaited append serialized the chain past the test's 10ms drain budget.
12. **Refactor copper + selector to fire-and-forget** — removed `await` on append; added inner `.catch(() => {})`. Fallback dispatch now runs in parallel with append.
13. **Add vi.mock to the integration test** — symmetric with the unit-test mocks.
14. **Restore operator file** — `head -12` truncation to remove the 2 polluting test events.
15. **Re-run pre-tag-gate** — all 17 checks PASS, all 35,277 test assertions pass.
16. **End-to-end smoke** — already covered by the integration test (which now mocks the appender but verifies the chain shape).
17. **Author release notes** — 5 files (README + 4 chapters).

## Wire decisions in detail

### Why always-fire (not fallback-gated)

The maxScore + low-confidence comparison was inside `if (fallback)` before v846. Three reasons to move it OUT:

1. **Auto-emit is observability.** A low-confidence prediction is a true event whether or not anything acts on the fallback. The calibration loop should see it either way.
2. **`onPredictions`-only deployments still benefit.** Some deployments wire only the hook (telemetry, no fallback). They should still feed calibration evidence.
3. **Symmetric with v845 CLI.** The CLI has no fallback — it calls the predict path and records on low-confidence. The substrate should follow the same rule.

The outer subscriber gate (`if (!hook && !fallback) return`) is preserved. No-subscriber call sites pay zero cost.

### Why default kind=`not_useful`

Polarity convention (from `src/bounded-learning/predictive-low-confidence-events.ts`):
- `useful` event → -1 → favor RAISING the threshold (fire MORE often).
- `not_useful` event → +1 → favor LOWERING the threshold (fire LESS often).

Substrate auto-emit has no operator-feedback channel at dispatch time. Conservative default mirrors v845's CLI parseArgs default. The CLI's `--useful` flag remains the way to inject opposite-polarity events when operators confirm usefulness.

### Why fire-and-forget (not awaited)

Initial implementation awaited the append. Under integration-test suite load, the disk-write inflated the chain past the test's 10ms drain budget. The fix:

```typescript
appendPredictiveLowConfidenceEvent({
  timestamp: new Date().toISOString(),
  kind: 'not_useful',
}).catch(() => {
  /* auto-emit is observability-only; never break activation */
});
```

The inner `.catch(() => {})` swallows append failures independently of the outer fallback-error catch. Both surfaces are observability per #10427; they should not serialize with each other or with the load-bearing prediction logic.

### Why vi.mock at test-file level

Three test files exercise the auto-emit path. All three now mock `appendPredictiveLowConfidenceEvent`:

```typescript
vi.mock('../../bounded-learning/predictive-low-confidence-events.js', () => ({
  appendPredictiveLowConfidenceEvent: vi.fn(async () => '/mock/path'),
}));
import { appendPredictiveLowConfidenceEvent } from '../../bounded-learning/predictive-low-confidence-events.js';
const appendSpy = vi.mocked(appendPredictiveLowConfidenceEvent);
```

Two reasons:
1. **Pollution prevention.** Tests must not write to operator's calibration file.
2. **Flake prevention.** Disk I/O latency in tests is non-deterministic under suite load.

This is symmetric with v845's CLI test pattern (`--no-record` flag prevents JSONL writes during tests).

## Verification trail

| Step | Result |
|---|---|
| `npm run build` | PASS |
| `npx vitest run src/chipset/copper/activation.test.ts src/orchestration/__tests__/selector.test.ts` | PASS (44 tests) |
| `npx vitest run tests/integration/copper-rosetta-fallback-wire.integration.test.ts` | PASS (4 tests) |
| `npm test` (full suite) | PASS (34,778 + 8 new = 34,786 assertions, 0 fail) |
| `bash tools/pre-tag-gate.sh` | PASS (17/17 steps) |
| Operator JSONL file state | UNCHANGED (12 entries pre + post; no pollution) |

## What was deferred

- **Verify axis numbered-lesson promotion.** Canonical-doc set at v844; promotion still pending the next codify ship.
- **Codification of v846's new tentative observations.** CLI/auto-recorder duality (2 instances) and production-caller path-narrowing (2 instances) are now eligible — deferred to the next codify ship per the established pattern.
- **Help-text expansion in `src/cli/help.ts`.** Should mention `predict-next` and other recent commands. Quick follow-on; ~15-30 min.
- **`predictive-low-confidence-events.jsonl` populating from production traffic.** v846 ships the wires; populating depends on deployments wiring a hook or fallback subscriber AND hitting low-confidence predictions. The wire is read+manual+auto complete; deployment activation is operator-bounded.

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 + #10184 + #10197. Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- Substrate-wire ship — 2 source files + 2 unit-test files + 1 integration-test file.
- No new lessons promoted; no manifest changes; no CLAUDE.md regen needed.
- v836 preservation gate continues to fire (10th time at v846's T14 publish step expected).
- Operator file (`.planning/patterns/predictive-low-confidence-events.jsonl`) is gitignored — not staged this ship.

## Forward path post-v846

1. **NASA 1.179 forward-cadence** — STRONG-DEFAULT (64 consecutive ships at 1.178 — new widest-pressure-margin record).
2. **Next codify ship (~v847-850)** — now has **5 eligible candidates** (v846 promoted two):
   - Verify axis numbered-lesson promotion.
   - DI-executor + tokenized-argv wire shape (3 instances).
   - Re-throw ProcessContextDenied from CLI swallow-catch (2 instances).
   - **CLI manual + substrate auto-emit duality (2 instances — NEW eligible at v846).**
   - **Production-caller scope-reduction via path-narrowing (2 instances — NEW eligible at v846).**
3. **Continued ProcessContext singleton chips** — ~14 remaining singletons.
4. **Help-text expansion in `src/cli/help.ts`** — surface predict-next and other recent CLI additions.

## References

- Predecessor: v1.49.845 (`docs/release-notes/v1.49.845/`)
- Predecessor handoff: `.planning/HANDOFF-2026-05-27-v1.49.841-845-operational-debt-cluster-closed.md`
- v837 read-side wire: `docs/release-notes/v1.49.837/README.md`
- v845 CLI manual-recorder wire: `docs/release-notes/v1.49.845/README.md`
- v803 precedent (CLI + auto-recorder duality): `src/cli/commands/bounded-learning.ts` + `src/cli/commands/sc-status.ts`
- Predict path: `src/predictive-skill-loader/index.ts` (`predictNextSkillsWithMeta`)
- Event-record path: `src/bounded-learning/predictive-low-confidence-events.ts` (`appendPredictiveLowConfidenceEvent`)
- Copper substrate site: `src/chipset/copper/activation.ts:276` (PipelineActivationDispatch.emitPredictions)
- Selector substrate site: `src/orchestration/selector.ts:314` (ActivationSelector._emitPredictions)
- Integration test: `tests/integration/copper-rosetta-fallback-wire.integration.test.ts`
- Failure-mode contracts: `docs/failure-mode-contracts.md` (#10427)
- Subscriber-gated observability pattern: `.planning/CLAUDE.md` lesson #10437 link
