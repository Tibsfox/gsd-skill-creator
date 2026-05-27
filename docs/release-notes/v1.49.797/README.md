# v1.49.797 — T1.1 Ship 3: Wire `suggestions.auto_dismiss_after_days`

**Released:** 2026-05-27
**Type:** forward-cadence Tier 1 audit ship 3/4-6 (NOT a NASA degree advance, NOT counter-cadence)
**Predecessor:** v1.49.796 — T1.1 Ship 2 (Wire `suggestions.cooldown_days`)
**Engine state:** UNCHANGED (NASA degree sustains at 1.178)
**Wedge:** T1.1 ship 3 — extend wired calibratable thresholds from 2 → 3

## Summary

Extends `skill-creator bounded-learning` to calibrate `suggestions.auto_dismiss_after_days` (the third member of `CalibratableThreshold`). Pure extension within the v795 scaffolding and v796 extension pattern — `SUPPORTED_THRESHOLDS` widens from 2 to 3 entries; three module docstrings refresh; nine new tests cover the wire end-to-end against the live default value (`30`).

Wall-clock: ~15-20 min. Confirms the v796 prediction that extensions within the same observation-source class land in sub-30-min routine work; this ship beat the lower bound.

## Deliverables

| Path | Change | Notes |
|---|---|---|
| `src/cli/commands/bounded-learning.ts` | MODIFIED | `SUPPORTED_THRESHOLDS` widens 2→3; module docstring refresh enumerates third wired threshold |
| `src/bounded-learning/types.ts` | MODIFIED | `CalibratableThreshold` docstring refresh |
| `src/bounded-learning/index.ts` | MODIFIED | Module docstring refresh |
| `src/bounded-learning/__tests__/calibration-loop.test.ts` | MODIFIED | +4 tests covering auto_dismiss_after_days decrease / increase / hold / floor-clamp at current value 30 |
| `src/bounded-learning/__tests__/threshold-writer.test.ts` | MODIFIED | +1 test proving applyRecommendation writes `auto_dismiss_after_days = 29` to disk and preserves siblings |
| `src/cli/commands/bounded-learning.test.ts` | MODIFIED | +4 tests exercising `--threshold suggestions.auto_dismiss_after_days` end-to-end (hold / decrease / increase / `--apply`) |
| `docs/release-notes/v1.49.797/` | NEW | 5-file chapter set |

No new source modules, no new CLI commands, no schema changes. Identical surface-shape to v796.

## What changed (behaviorally)

- `skill-creator bounded-learning --threshold suggestions.auto_dismiss_after_days` now runs the calibration loop against the live `auto_dismiss_after_days` value (default 30).
- `--apply` writes the recommended value back atomically with concurrent-edit refusal, exactly as for `min_occurrences` and `cooldown_days`.
- Help text lists all three supported thresholds.
- For `auto_dismiss_after_days`: DECREASE means auto-dismiss pending suggestions sooner; INCREASE means keep them in the queue longer. (Semantic interpretation documented in CLI module docstring.)

## What this ship is not

- Not a NASA degree advance.
- Not a counter-cadence ship.
- Not a new module or new CLI command. Pure extension within the v795 scaffolding.
- Not a shelfware verdict ship.

## Verification

- `npx vitest run src/bounded-learning/ src/cli/commands/bounded-learning.test.ts` → **86/86 PASS** (77 from v796 + 9 new).
- `npm run build` → PASS (TypeScript strict).
- `node dist/cli.js bounded-learning --threshold suggestions.auto_dismiss_after_days --json` → smoke test against the actual `.planning/skill-creator.json`: `currentValue: 30`, `direction: hold`, `observations: 0`, `applied: noop` (no suggestions data yet, as expected).
- `node dist/cli.js bounded-learning --help` → all three thresholds listed under `Supported:`.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED). Counter-cadence count UNCHANGED at 5. v797 is forward-cadence audit-driven.

## Audit roadmap status

| Item | Status |
|---|---|
| T1.4 — PROJECT.md GAP table refresh | Delivered at v785 |
| S5 — PROJECT.md normalizer | Delivered at v785 |
| T1.2 series — adoption telemetry + cluster verdicts (6/6) | Delivered v786-v793 |
| Path E — #10424 deterministic gate + ESTABLISHED promotion | Delivered at v794 |
| T1.1 ship 1 — Bounded-learning calibration loop primitive + CLI + writer | Delivered at v795 |
| T1.1 ship 2 — Wire suggestions.cooldown_days | Delivered at v796 |
| **T1.1 ship 3 — Wire suggestions.auto_dismiss_after_days** | **Delivered at v797 (this ship)** |
| T1.1 ships 4-6 — token_budget thresholds + audit log + --watch + /sc:status integration | OPEN |
| T1.3 — College of Knowledge consumer engine | OPEN — 3-5 ships |
| S3 — Codify the meta-cadence | OPEN |
| S4 — Public surface separation | OPEN |
| S6 — Self-evidence loop for security disciplines | OPEN |
| S7 — Counter-cadence cadence | OPEN |

## Forward path: T1.1 ship 4

This 5-ship session continues with the operator's selected order:

- **v798 — Wire `token_budget.warn_at_percent`.** Moves into a different observation-source class. Likely forces an architectural choice about whether `entriesToObservations` is the right signal source for token-budget calibration.
- **v799 — Audit log.** Append-only `.planning/patterns/bounded-learning-log.jsonl` per loop run. Closes the no-history gap flagged in v795/v796/v797 retros.
- **v800 — `--watch` mode.** Re-run loop on `suggestions.json` changes.
- **v801 — `/sc:status` integration.** Operator sees calibration state at session start.

## Lesson-backlog state

| Phase | Open candidates |
|---|---|
| v795 close | 1 (#10425) |
| v796 close | 1 (#10425 — unchanged) |
| **v797 close** | **1** (#10425 — unchanged; v797 inherits the primitive identically to v796, no second-instance forward-shadow) |
