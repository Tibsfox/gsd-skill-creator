
# v1.49.841 — Retrospective

**Wall-clock:** ~40 min from v840 handoff read to release-notes draft. Faster than expected — the v840 forward-flag had pre-identified the three design options + their relative merits, so the design phase collapsed to "pick option 2 + flesh out the recent-vs-recent comparison detail".

## What went as expected

- **The v840 forward-flag was directly actionable.** Three options were stated explicitly with effort estimates. Operator picked option 2 (per-type baselines). No re-derivation needed.
- **Per-type baselines required minimal schema work.** Adding `current.by_type.{historical,recent}` as nested objects in the JSON baseline file was a single-line schema change. The migration path (warn + prompt for `--update-baseline`) is the same pattern used by other gitignored cache files in `.planning/release-cache/`.
- **Chip-class regex caught all expected ships on first pass.** 23 ships reclassified — exactly the post-v802 operational-debt cadence + one outlier (v664 cc-1 staged-deck scaffold). No surprise misclassifications.
- **`\bChip\b` word-boundary correctly excluded "Chipset".** Verified by manual scan of v19 Gastown Chipset Integration (score 99, type stayed `feature`). The Codify being title-case correctly excluded prose-style degree titles.
- **Entrypoint guard pattern was straightforward.** `fileURLToPath(import.meta.url) === argv[1]` is the standard Node ESM main-module check. No fancy library needed.

## What I noticed

- **The recent-vs-baseline-recent comparison is novel and worth flagging.** The conventional drift-check pattern compares current to baseline state once captured. v841's change captures the baseline's recent-N snapshot at calibration time so "recent drift" means "change-since-calibration". This is closer to intent (regression detection) but introduces a subtlety: the baseline must be periodically re-captured or "recent" stops being recent. Flagged in forward-observations; operator-bounded for now.
- **The remaining `recent_all_F` warning is genuine signal.** Recent feature-type ships are smaller-scope than historical feature work — that's a real cadence shift. The drift-watcher is doing what it should: pointing to a pattern the operator may want to act on. Not a false positive; just an informational reminder. v841 doesn't try to suppress this.
- **23 chip ships against a 442-degree baseline is a small sample.** Per-type alert thresholds may need re-tuning as the chip ship count grows. The `per_type_min_samples: 3` default is conservative — fires only after 3 recent chips. Once the chip baseline has more history (say 50+ ships), tighter thresholds could be considered.
- **The chip regex is keyword-list-based, not structural.** A new chip-class marker (e.g. "Ratchet Close", "Sweep Forward") would need regex extension. This is the same trade-off as the cleanup-mission detector (which uses three signal patterns rather than a single regex). Acceptable; tracked as forward observation.

## What surprised me

- **The fix collapsed to 3 structural changes once the design was picked.** Pre-design I expected ~5-7 distinct edits. Actual: chip-type classification + per-type aggregation + recent-vs-recent comparison. The minimal-surface design held.
- **The drift-check signal went from 4 alerts to 1 with no thresholds touched.** Per-type baselines did the heavy lifting. The remaining warning is the only genuine signal in the original 4 (the other 3 were structural false positives).
- **Auto-detection of chip ships caught 1 historical outlier.** v664 cc-1 staged-deck scaffold (score 75) — borderline between feature and chip. Classified as chip because "Scaffold" matched the regex. Score 75 is C-grade, not the typical chip-class F-grade (38.6 avg). The chip baseline will need careful interpretation if chip ships shift toward higher-scoring "scaffold infrastructure" work.
- **The DB had 883 releases to reclassify; took ~3s end-to-end.** Postgres + per-row UPDATE is fast at this scale. No need for batched updates.

## Risk that didn't materialize

- **No build failure on the entrypoint-guard change.** `import.meta.url` is universally supported in Node 18+; the codebase is on Node 20+.
- **No test regression.** Full suite at v841 close: 35,261 passed (was 35,259 at v840 close — +2 likely from the 2 vitest-scoped new test files; the 16 chip-classification tests live outside vitest scope per the established pattern at `tools/release-history/__tests__/`).
- **No discipline-coverage regression.** v841 doesn't introduce or close any lesson; UNCODIFIED holds at 39 ≤ ceiling 41.
- **No KNOWN_UNWIRED allowlist regression.** v841 doesn't touch ProcessContext / EgressContext / LoaderContext call sites; the allowlists hold at 21 / 11 / pre-existing.

## Carried forward (post-v841)

NEW this ship (2 observations below threshold):

- **Recent-vs-baseline-recent comparison as regression-detection pattern.** v841 introduces the pattern for the drift-check. Could generalize to other state-monitoring tools where "compare to baseline state" is the convention but "compare to baseline RECENT" is the intent. Wait for 2nd instance.
- **Drift-check noise as scoring-system feedback loop.** False-positive alerts train the operator to ignore alerts. v841 closes one specific source. Future patterns of "informational alert that fires on every refresh" should be treated as a missing-discrimination signal. Wait for 2nd.

Inherited from v840 (unchanged):

- Codify-ship-as-recon-consolidator pattern (1 instance).
- Deferral-by-classification-ambiguity (1 instance).
- Verification/integration-only ships axis (2 instances; DEFERRED; eligible for next codify).
- Bidirectional enforcement completeness (1-2 instances; DEFERRED; classification ambiguous).
- Auto-run-on-import as bootstrap-time tax (1 instance).
- Polarity convention for inverted-mechanic thresholds (1 instance).
- #10433 LOC-band-by-callsite-count refinement (4 instances; sustained ESTABLISHED).

## Process retrospective

- **Forward-flag-to-fix latency was 1 ship.** v840 closed the codify-ship cluster + flagged the drift-check issue. v841 closed the drift-check issue. This is the fastest forward-flag-to-fix cycle in recent operational-debt history (typically 5-10 ships).
- **Design-decision-via-AskUser was load-bearing.** The user chose option 2 (per-type baselines + new chip type). Without that decision, I might have implemented option 3 (suppress) as the lowest-risk path — losing real signal. The operator's choice preserved more discipline than a unilateral pick would have.
- **The v840 retrospective's "three options" framing made the decision tractable.** Future forward-flags should follow this shape: state the observation + state 2-3 viable resolutions + state effort estimates. The operator-bounded decision becomes a one-question pick instead of a multi-round discussion.
- **Per-type baselines unblock a future `task` sub-type.** If the recent_all_F warning keeps firing on T-prefix/S-prefix ships, a future ship can add `task` to classify-types.mjs with the same pattern v841 established. The chip-type infrastructure is generalizable.
