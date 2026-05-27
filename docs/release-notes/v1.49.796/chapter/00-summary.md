> Following v1.49.795 — _T1.1 Ship 1: Bounded-Learning Calibration Loop primitive + CLI + writer_, v1.49.796 ships as T1.1 ship 2 — Wire `suggestions.cooldown_days`: extends the calibration loop's wired threshold whitelist from one entry to two, proving the v795 scaffolding absorbs new thresholds cleanly.

# v1.49.796 — T1.1 Ship 2: Wire `suggestions.cooldown_days`

**Shipped:** 2026-05-27

The second ship in the T1.1 calibration-loop arc. v795 landed the complete read → compute → write vertical for ONE threshold (`suggestions.min_occurrences`); v796 widens the CLI's threshold whitelist to include `suggestions.cooldown_days` (live default 7) and proves the wire end-to-end with 9 new tests.

## What shipped

- **`src/cli/commands/bounded-learning.ts`** — `SUPPORTED_THRESHOLDS` extended from `['suggestions.min_occurrences']` to `['suggestions.min_occurrences', 'suggestions.cooldown_days']`. Module docstring refreshed to enumerate both wired thresholds and the per-threshold direction interpretation (`DECREASE` means re-surface sooner for `cooldown_days`, lower threshold for `min_occurrences`; `INCREASE` is symmetric).
- **`src/bounded-learning/types.ts`** + **`src/bounded-learning/index.ts`** — Docstring refresh; remove the "ship 1 wires only min_occurrences" claim.
- **`src/bounded-learning/__tests__/calibration-loop.test.ts`** — +4 tests in a new `runCalibrationLoop — suggestions.cooldown_days (v1.49.796)` describe block: decrease (`7 → 6`), increase (`7 → 8`), hold-at-insufficient-evidence, floor-clamp at 1.
- **`src/bounded-learning/__tests__/threshold-writer.test.ts`** — +1 test proving `applyRecommendation` writes `cooldown_days = 6` to disk with `min_occurrences` and `auto_dismiss_after_days` siblings preserved.
- **`src/cli/commands/bounded-learning.test.ts`** — +4 tests in a new `boundedLearningCommand — --threshold suggestions.cooldown_days (v1.49.796)` describe block, exercising the full CLI path with the new threshold.

Test count: **77/77 PASS** in the bounded-learning + CLI test surface (was 68 at v795 close; +9 this ship).

## Through-line

T1.1 is the calibration-loop arc — close the bounded-learning meta-loop where operator decisions feed back into the skill-creator's own thresholds. The v793 handoff named it the most ambitious Tier 1 remaining item at 4-6 ships. Ship 1 took ~75 min wall-clock (new vertical + math primitive). Ship 2 took ~30 min — matching the v795 retrospective's prediction that ships 2-6 land in 30-45 min each since the primitive + CLI scaffolding now exists.

The architectural payoff of ship 1's "complete vertical for ONE threshold + threshold-agnostic primitive" pattern is visible: the only code-surface that needed editing to wire a second threshold was a 4-line change to `SUPPORTED_THRESHOLDS`. Everything else was docstring refresh + test additions. No primitive change. No new CLI infrastructure. No schema change.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED). Counter-cadence count UNCHANGED at 5. v796 is forward-cadence audit-driven.

## Audit roadmap progress

| Item | Status |
|---|---|
| T1.4 — PROJECT.md GAP table refresh | Delivered at v785 |
| S5 — PROJECT.md normalizer | Delivered at v785 |
| T1.2 ship 1-6 — Adoption telemetry + cluster verdicts (6/6) | Delivered v786-v793 |
| Path A — NASA 1.178 IBEX | Delivered at v788 |
| Path A meta — Codification of v785-v789 lesson cluster | Delivered at v790 |
| Path E — #10424 deterministic gate + ESTABLISHED promotion | Delivered at v794 |
| T1.1 ship 1 — Bounded-learning calibration loop primitive + CLI + writer | Delivered at v795 |
| **T1.1 ship 2 — Wire suggestions.cooldown_days** | **Delivered at v796 (this ship)** |
| T1.1 ships 3-6 — Real-data wiring + remaining thresholds + cross-threshold coordination | OPEN |
| T1.3 — College of Knowledge consumer engine | OPEN — 3-5 ships |
| S3 — Codify the meta-cadence | OPEN |
| S4 — Public surface separation | OPEN |
| S6 — Self-evidence loop for security disciplines | OPEN |
| S7 — Counter-cadence cadence | OPEN |

## Real-world smoke test result

```
$ node dist/cli.js bounded-learning --threshold suggestions.cooldown_days --json
{
  "threshold": "suggestions.cooldown_days",
  "currentValue": 7,
  "proposedValue": null,
  "direction": "hold",
  "rejected": false,
  "evidence": 1,
  "rejectionThreshold": 40,
  "observations": 0,
  ...
  "reason": "No terminal accept/dismiss observations yet; threshold held at 7.
             Run `/sc:suggest` to accumulate acceptance data.",
  "applied": "noop"
}
```

The loop reads the live default (7) and produces a clean hold against zero-data input. Operator-facing surface ships with the same three-tier output (text / `--quiet` CSV / `--json`) as `min_occurrences`.

## Forward candidates

- **T1.1 ship 3:** wire a third threshold OR add the audit log surface OR add `--watch` mode OR surface in `/sc:status`. The third-threshold path has two natural sub-choices: `auto_dismiss_after_days` (stays in suggestions semantic stretch) or `token_budget.warn_at_percent` (different observation-source class — may force an architectural choice).
- **T1.1 ships 4-6:** extend to multi-threshold + cross-threshold coordination + (optional) real-data backfill from session retro entries.
- **NASA 1.179:** INTERSTELLAR-BOUNDARY axis obs#3 continuation.
- **T1.3:** College of Knowledge consumer engine.

---
**Prev:** [v1.49.795](../v1.49.795/00-summary.md) · _(current tip)_
