# v1.49.837 — Retrospective

**Wall-clock:** ~50 min from v836 close to v837 release-notes draft. Mid-size ship; mirrors v803 with one design twist (polarity flip).

## What went as expected

- **v803's `token-budget-events.ts` shape transferred cleanly.** Event type, kind enum, `eventKindToValue`, `eventToObservation`, `eventsToObservations`, `appendX`, `readX`, type guard — all 8 surfaces mirrored exactly. Test shape mirrored 1:1 (13 tests parallel to v803's 13).
- **`observation-sources.ts` dispatch extended with one new case.** The existing v803 case for `token_budget.warn_at_percent` was the template; the new case for `predictive.low_confidence_threshold` slotted in next to it.
- **CLI extension via dispatch-by-threshold.** Existing `runRecordEvent` was hard-coded to token-budget. Refactored to dispatch on `--threshold` value (default token-budget, branch to new `runRecordPredictiveEvent` when threshold is predictive). Backward-compat preserved for existing v803 callers (no `--threshold` flag still hits token-budget branch).
- **The polarity decision was made consciously.** The instinct on first read was to copy v803's polarity (`useful → +1` like `responsive → +1`). The deliberate inversion came from tracing through the calibration math: positive value → posResult rejects → direction = decrease. For low_confidence_threshold, "useful" should favor INCREASE (more fallback firings). So value must be negative. Documented in JSDoc + test names.

## What I noticed

- **The "production fallbackProvider wire" handoff scope was overly optimistic.** The handoff said "Wire `RosettaConceptFallback` into production copper/selector construction paths." But grepping for `new ActivationSelector` or `new Activation` in production code returns ZERO matches outside tests. The v830-832 wire is interface-only; no production caller exists. Scope-reducing this ship to "wire the JSONL + dispatch + CLI, defer the production caller construction" was the right call.
- **`wired: true` is an architectural promise, not a data-flow guarantee.** With v837, the source is wired. Whether DATA flows depends on whether anyone (operator via CLI, integration tests, or a future production caller) populates the JSONL. This is the same shape as v803 — the wire shipped before automatic recording was bolted on. The /sc:status integration came later for v803; an analog future ship can do the same for v837.
- **The test for the wired-flip was the one I had to update most carefully.** The v835 test "classifies as unwired" was load-bearing semantically. Flipping to "classifies as wired" needed: (a) sourceId still matches, (b) wired is now true, (c) description matches the new wired framing. The description-match was the easy guard against a future regression (if someone reverts wired→false, the description-match also fails, surfacing the regression).
- **The `eventToObservation` decision field had a subtle polarity question.** Token-budget maps `responsive → 'accepted'` and `ignored → 'dismissed'`. For predictive: `useful → -1 → 'dismissed'` (since value > 0 → 'accepted')? OR `useful → 'accepted'` because it's the "positive" semantic outcome? Went with the polarity-following mapping (value > 0 → 'accepted') because the calibration loop only reads `value`; the `decision` string preserves schema-compat with the underlying `SuggestionDecision` union. The mapping is INVERTED relative to v803 in the same way the value is.
- **v836's publish.mjs preservation gate is exercised live this ship.** The v837 hand-authored chapters in `docs/release-notes/v1.49.837/chapter/` exist BEFORE chapter.mjs writes the auto-generated content to `.planning/roadmap/v1.49.837/`. At T14 step 9 (RH refresh + publish), the preservation gate should fire and report `PRESERVED v1.49.837/00-summary.md → github: destination opener non-derivable...` for each chapter. Watch the logs.

## What surprised me

- **The `runRecordEvent` refactor was a 4-line dispatch addition, not a rewrite.** Initial estimate was 30 LOC for the dispatch + new branch. Actual: insert `if (thresholdValue === 'predictive...') return runRecordPredictiveEvent(...)` near the top of the function + add the new `runRecordPredictiveEvent` function (parallel structure). Backward-compat fell out for free (no `--threshold` → falls through to token-budget branch with original semantics).
- **The CLI summary test was the first regression I would have shipped.** `expect(out.thresholds).toHaveLength(4)` was the trip. Caught by the test suite running before commit. With 5 SUPPORTED_THRESHOLDS now, the assertion needed updating to 5 + an additional assertion checking the new threshold's wiring. Saved by per-ship vitest run discipline.
- **The v803 test file was the perfect template.** Copy-paste + sed-like rename (TokenBudget → PredictiveLowConfidence, responsive/ignored → useful/not_useful) gave 90% of the test file. The remaining 10% was adjusting the polarity assertions (`+1` → `-1` for useful) and the optional-field names (`usagePercent` → `currentSkill`).

## Risk that didn't materialize

- The `eventKindToValue` polarity flip might have produced wrong calibration directions — sanity-checked via the test `useful → -1` + tracing through `calibration-loop.ts` lines 134-141: posResult rejects when value pattern is positive → direction = `'decrease'`. So a stream of all-useful events (all -1) makes negResult reject → direction = `'increase'`. Threshold goes up → fallback fires more. Polarity is correct.
- The CLI `--threshold` flag might have conflicted with other modes — checked: `--summary` and `--query` short-circuit before `--threshold` parsing; `--record-event` now dispatches on `--threshold` BEFORE the kind parsing; the regular threshold-targeted calibration path uses `--threshold` AFTER the early-exit checks. No conflict.
- The new module might have introduced a name collision when re-exported from `index.ts` (since v803's module already exports `eventKindToValue` etc.) — sidestepped by NOT adding to the index.ts re-exports. CLI imports directly from the module file. Future consumers should follow this pattern (or alias on import).

## Carried forward

NEW this ship (1 instance, deferred per #10426):
- **Polarity flip as deliberate design decision for sibling thresholds in different mechanic classes** (1 instance: v803 vs v837). Token-budget and predictive both use the same calibration math but represent inverted threshold mechanics ("raise = fire less" vs "raise = fire more"). The polarity convention must align with the threshold's mechanic, not be copy-pasted from a sibling. Wait for 2nd instance before codifying as a class.

Inherited from v836 close (no change except instance-count promotion):
- **Two-layer closure generalization (#10431 sub-pattern)** — STILL 2 instances at v837 close (v813 STATE.md + v836 publish overwrite). v837 didn't add a 3rd instance.
- **Auto-run-on-import as a hidden bootstrap-time tax** — STILL 1 instance.

Inherited from v834-835 close (no change):
- Stale-entry cleanup chip pattern (1 instance: v834).
- Scaffold ship pattern (1 instance: v835).
- Paired "framework-predicted, recon-caught" ship arc (1 arc: v834+v835).
- Type-registered vs observation-source-wired vs runtime-wired (1 forward-flag).
- Audit-inverse-check enhancement (1 forward-flag).

Inherited from v833 close (no change):
- Substrate-consumer hook PAIR pattern (2 instances: v830 + v832).
- `onPredictions` substrate-consumer wire pattern (2 instances: v810 + v826).
- #10433 LOC-band-by-callsite-count refinement (3 instances).
- Verification/integration-only ships (2 instances).

## Process retrospective

- The 4-ship session (publish-investigation → fallbackProvider wire → audit-inverse-check → ProcessContext chips) is progressing on schedule. v836 closed in ~45min; v837 closed in ~50min. Cumulative ~95min for 2 of 4 ships.
- The handoff's #1 candidate (fallbackProvider wire) was scoped more ambitiously than the actual code state could support. Recon caught the scope mismatch early and the ship adjusted (delivered the source-side wire, deferred the production-caller construction). Honest framing in the release notes acknowledges the limit.
- v836's preservation gate working transparently in this ship is the first end-to-end validation of v836's fix. The chapters I hand-authored at v837 ship time will be preserved through publish in the T14 sequence. If anything regresses, the publish log will say "preserved" (good) or the chapters will get overwritten (regression).
