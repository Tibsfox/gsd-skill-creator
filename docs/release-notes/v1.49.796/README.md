# v1.49.796 — T1.1 Ship 2: Wire `suggestions.cooldown_days`

**Released:** 2026-05-27
**Type:** forward-cadence Tier 1 audit ship 2/4-6 (NOT a NASA degree advance, NOT counter-cadence)
**Predecessor:** v1.49.795 — T1.1 Ship 1 (bounded-learning calibration loop primitive + CLI + writer)
**Engine state:** UNCHANGED (NASA degree sustains at 1.178)
**Wedge:** T1.1 ship 2 — extend wired calibratable thresholds from 1 → 2

## Summary

Extends `skill-creator bounded-learning` to calibrate `suggestions.cooldown_days` (the second member of `CalibratableThreshold`). Architecture from ship 1 was threshold-agnostic at the primitive layer (`runCalibrationLoop`, `applyRecommendation`, `readThresholdValue`/`setThresholdValue` all work for any dotted-path threshold); the only hardcoded surface was the CLI's `SUPPORTED_THRESHOLDS` whitelist. This ship widens that whitelist, refreshes module docstrings, and adds tests proving the wire end-to-end against the live default value (`7`).

Wall-clock: ~30 min. Confirms the v795 retrospective's prediction that ships 2-6 land in 30-45 min each now that the primitive + CLI scaffolding exists.

## Deliverables

| Path | Change | Notes |
|---|---|---|
| `src/cli/commands/bounded-learning.ts` | MODIFIED | `SUPPORTED_THRESHOLDS` now `['suggestions.min_occurrences', 'suggestions.cooldown_days']`; module docstring + help text refreshed |
| `src/bounded-learning/types.ts` | MODIFIED | Docstring refresh: removes "ship 1 wires only min_occurrences" claim |
| `src/bounded-learning/index.ts` | MODIFIED | Docstring refresh: lists both wired thresholds |
| `src/bounded-learning/__tests__/calibration-loop.test.ts` | MODIFIED | +4 tests covering cooldown_days decrease / increase / hold / floor-clamp at current value 7 |
| `src/bounded-learning/__tests__/threshold-writer.test.ts` | MODIFIED | +1 test proving applyRecommendation writes `cooldown_days = 6` to disk and preserves siblings |
| `src/cli/commands/bounded-learning.test.ts` | MODIFIED | +4 tests exercising `--threshold suggestions.cooldown_days` end-to-end (hold / decrease / increase / `--apply`) |
| `docs/release-notes/v1.49.796/` | NEW | 5-file chapter set |

No new source modules, no new CLI commands, no schema changes — the scaffolding from v795 absorbed the extension cleanly.

## What changed (behaviorally)

- `skill-creator bounded-learning --threshold suggestions.cooldown_days` now runs the calibration loop against the live `cooldown_days` value (default 7).
- `--apply` writes the recommended value back atomically with concurrent-edit refusal, exactly as for `min_occurrences`.
- Help text lists both supported thresholds.

## What this ship is not

- Not a NASA degree advance.
- Not a counter-cadence ship.
- Not a new module or new CLI command. Pure extension within the v795 scaffolding.
- Not a shelfware verdict ship.

## Verification

- `npx vitest run src/bounded-learning/ src/cli/commands/bounded-learning.test.ts` → **77/77 PASS** (68 from v795 + 9 new).
- `npm run build` → PASS (TypeScript strict).
- `node dist/cli.js bounded-learning --threshold suggestions.cooldown_days --json` → smoke test against the actual `.planning/skill-creator.json`: `currentValue: 7`, `direction: hold`, `observations: 0`, `applied: noop` (no suggestions data yet, as expected).
- `node dist/cli.js bounded-learning --help` → both thresholds listed under `Supported:`.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED). Counter-cadence count UNCHANGED at 5. v796 is forward-cadence audit-driven.

## Audit roadmap status

| Item | Status |
|---|---|
| T1.4 — PROJECT.md GAP table refresh | Delivered at v785 |
| S5 — PROJECT.md normalizer | Delivered at v785 |
| T1.2 series — adoption telemetry + cluster verdicts (6/6) | Delivered v786-v793 |
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

## Forward path: T1.1 ship 3

Two natural ship-3 candidates remain after this ship:

- **Wire a third threshold.** `suggestions.auto_dismiss_after_days` (live default 30) or `token_budget.warn_at_percent` (live default 4). The first stays inside the suggestions semantic stretch; the second moves into a different observation-source class and may force an architectural choice about whether `entriesToObservations` is the right signal source for token-budget calibration.
- **Add the audit log.** Append-only `.planning/patterns/bounded-learning-log.jsonl` per loop run. Closes the "no run history" gap flagged in the v795 retro.

## Lesson-backlog state

| Phase | Open candidates |
|---|---|
| v795 close | 1 (#10425) |
| **v796 close** | **1** (#10425 — unchanged; v796 inherits the two-one-sided-Bonferroni primitive from v795 rather than independently re-applying it, so no second-instance forward-shadow this ship) |
