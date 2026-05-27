# v1.49.837 — Context

## Provenance

Second ship of the 4-ship sequence (publish-investigation → fallbackProvider wire → audit-inverse-check → ProcessContext chips) authorized at session start. v836 closed the publish-overwrite friction class; v837 closes the v835 scaffold's source-side gap.

## What this ship adds

```
src/bounded-learning/predictive-low-confidence-events.ts              [NEW: ~200 LOC]
src/bounded-learning/observation-sources.ts                           [MODIFIED: dispatch case + wired:true]
src/cli/commands/bounded-learning.ts                                  [MODIFIED: SUPPORTED_THRESHOLDS + record-event dispatch]
src/bounded-learning/__tests__/predictive-low-confidence-events.test.ts  [NEW: +13 tests]
src/bounded-learning/__tests__/observation-sources.test.ts            [MODIFIED: wired-flip test + JSONL-read tests]
src/cli/commands/bounded-learning.test.ts                             [MODIFIED: 5-threshold summary test]
docs/release-notes/v1.49.837/                                         [NEW: README + 4 chapters]
.planning/PROJECT.md                                                  [MODIFIED: pre-bump refresh]
```

## Recon trail (per #10422 ledger-driven work)

1. **Read v835's scaffold state.** `src/bounded-learning/observation-sources.ts:104-113` had the `predictive.low_confidence_threshold` case returning `wired: false`. `loadObservationsForThreshold` had an implicit fallthrough returning empty array for the same threshold. Both surfaces needed updating.
2. **Read v803's precedent (`token-budget-events.ts`).** Module shape: event type, kind enum, value mapper, observation lifter, append/read helpers, type guard. 186 LOC total. v803's tests in `src/bounded-learning/__tests__/token-budget-events.test.ts` are 157 LOC across 13 test cases.
3. **Trace the calibration math for polarity decision.** `calibration-loop.ts:130-141`: posResult rejects → direction = 'decrease'; negResult rejects → direction = 'increase'. Two-sided e-process at Bonferroni α/2. For the new threshold's polarity:
   - Threshold mechanic: `maxScore < lowConfidenceThreshold` triggers fallback. Higher threshold = more scores satisfy the condition = fires more often.
   - Operator outcome: `useful` (fallback was relevant) wants fallback to fire MORE → favor INCREASE the threshold → direction = 'increase' → value pattern must be negative → `useful → -1`.
   - INVERTED relative to v803's `responsive → +1`. Documented in JSDoc + test names.
4. **Identify production-caller gap.** `grep -rn "new ActivationSelector\|new Activation\b" src/ desktop/` returns 0 production matches (only tests). The "production fallbackProvider wire" portion of the handoff is structurally blocked. Scope-reduced ship to "wire the source, defer production caller."
5. **Plan minimal changes.** (a) Add new module mirroring v803. (b) Wire dispatch + flip in observation-sources.ts. (c) Add threshold to SUPPORTED_THRESHOLDS in CLI. (d) Dispatch `--record-event` by threshold; add `runRecordPredictiveEvent` branch. (e) Add tests for the new module. (f) Update existing tests for the wired flip + new SUPPORTED_THRESHOLDS length.
6. **Implement + per-step test.** Each step ran `npx vitest run src/bounded-learning/` between edits to catch regressions early. The CLI summary-test regression (`thresholds.toHaveLength(4)` → 5) was caught on first CLI test run.
7. **Verify build:** `npm run build` → clean.
8. **Sanity-check the imports.** New module exports the symbols the CLI needs (`appendPredictiveLowConfidenceEvent`, types). CLI imports directly from the module to avoid name-collision with v803's `eventKindToValue` etc. in the index.ts re-exports.

## Discipline-extension vs new-domain choice

**EXTENSION of existing `docs/bounded-learning-calibration-discipline.md`** (Lesson #10425, codified at v802). The v803 pattern (per-class observation source) was already established. v837 adds the 5th wired class following the same pattern, with the polarity-flip refinement.

No new discipline domain. UNCODIFIED ceiling at 39 ≤ 41 UNCHANGED.

## What was deferred

- **Production caller of the predict path** — structurally blocked. No `new ActivationSelector` or `new Activation` in production code at v837 ship time. Future ship.
- **Auto-emit `useful`/`not_useful` events from inside copper/selector fallback dispatch** — the auto-emit hook is structurally available (the dispatch path exists; `eventToObservation` is exported), but currently fires only in integration tests because no production caller constructs a `fallbackProvider`. The v803 analog for `/sc:status` auto-recording is a future enhancement.
- **`SUPPORTED_THRESHOLDS` operator-facing documentation update** — the CLI help text was updated; the README-level discovery (how operators learn about the new threshold) is implicit in the help output. Not worth a separate ship unless the threshold sees more usage.

## v836 validation in flight

This ship is the first end-to-end test of v836's publish.mjs destination-side preservation gate. The v837 hand-authored chapters at `docs/release-notes/v1.49.837/chapter/` exist BEFORE T14 step 9's `refresh.mjs` writes the auto-generated content to `.planning/roadmap/v1.49.837/`. Then `publish.mjs --execute` will fire the preservation gate for each chapter file. Expected log lines:

```
[publish] PRESERVED v1.49.837/00-summary.md → github: destination opener non-derivable; preserved as hand-authored
[publish] PRESERVED v1.49.837/03-retrospective.md → github: destination opener non-derivable; preserved as hand-authored
[publish] PRESERVED v1.49.837/04-lessons.md → github: destination opener non-derivable; preserved as hand-authored
[publish] PRESERVED v1.49.837/99-context.md → github: destination opener non-derivable; preserved as hand-authored
```

If chapters are clobbered, that's a v836 regression that needs investigation before the next ship.

## Verification trail

| Step | Result |
|---|---|
| `npx vitest run src/bounded-learning/` | 128 PASS (was 115; +13 new module tests + 1 net obs-sources change) |
| `npx vitest run src/cli/commands/bounded-learning.test.ts` | 61 PASS (1 test updated for 5 thresholds) |
| `npm run build` | PASS |
| `bash tools/pre-tag-gate.sh` | 17/17 PASS (pending T14 step 1) |
| Full suite (expected) | 35,257 PASS (35,243 + 14) |

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 + #10184 + #10197. Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- Source-side wire ship; observation source for the new threshold class.
- v836 preservation gate exercised live (first end-to-end test).
- Production caller construction deferred (structural blocker).

## Forward path post-v837

1. **Audit-inverse-check enhancement** — v834-flagged; ~30 min. Next ship in the 4-ship sequence.
2. **Continued ProcessContext singleton chips** — terminal/mesh/intel families. Ship #3 in sequence.
3. **NASA 1.179 forward-cadence** — strong-default after the 4-ship sequence completes.
4. **Production caller of the predict path** — future ship; would activate the v837 wire's auto-emit path.
5. **Next codify ship (v840+)** — picks up the v836 #10431 sub-pattern + v833 carry-forwards + v837's polarity-flip-as-deliberate-design observation (1 instance, waiting for 2nd).

## References

- Predecessor: v1.49.836 (`docs/release-notes/v1.49.836/`)
- Predecessor handoff: `.planning/HANDOFF-2026-05-27-v1.49.834-835-paired-arc-closed.md`
- Source-of-truth event module: `src/bounded-learning/predictive-low-confidence-events.ts`
- Source-of-truth source dispatch: `src/bounded-learning/observation-sources.ts:104-117`
- CLI subcommand: `src/cli/commands/bounded-learning.ts:584-689` (`runRecordPredictiveEvent`)
- v803 precedent: `chore(release): v1.49.803 — token-budget-events wire`
- v832 substrate (interface declaration): `src/predictive-skill-loader/fallback.ts`
- v830 runtime wire (threshold consumed by copper/selector): `chore(release): v1.49.830 t1.3 option c framework`
- Bounded-learning calibration discipline: `docs/bounded-learning-calibration-discipline.md` (Lesson #10425)
- Test coverage: `src/bounded-learning/__tests__/predictive-low-confidence-events.test.ts`
