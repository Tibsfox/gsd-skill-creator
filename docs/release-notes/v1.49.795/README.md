# v1.49.795 — T1.1 Ship 1: Bounded-Learning Calibration Loop

**Released:** 2026-05-26
**Type:** forward-cadence Tier 1 audit ship 1/4-6 (NOT a NASA degree advance, NOT counter-cadence)
**Predecessor:** v1.49.794 — Deterministic Gate for #10424 (adoption-refresh overwrite guard)
**Engine state:** UNCHANGED (NASA degree sustains at 1.178)
**Wedge:** T1.1 ship 1 — primitive + CLI + suggestions reader + threshold writer

## Summary

Wires the bounded-learning calibration loop to the `src/anytime-valid/` e-process. A new top-level CLI (`skill-creator bounded-learning` / `bl`) reads operator accept/dismiss decisions from `.planning/patterns/suggestions.json`, maps them to `[-1, 1]` observations, feeds them through two one-sided e-processes at Bonferroni α/2 each, and emits a `CalibrationRecommendation` proposing a single-step adjustment to `suggestions.min_occurrences` when the rejection threshold is crossed. With `--apply`, the recommendation is atomically written back to `.planning/skill-creator.json` (gated against concurrent edits).

This is ship 1 of 4-6 in the T1.1 audit-roadmap arc. Ship 1 lands the primitive + the complete read/compute/write surface for `suggestions.min_occurrences`. Subsequent ships extend to the remaining members of `CalibratableThreshold` (`suggestions.cooldown_days`, `auto_dismiss_after_days`, `token_budget.warn_at_percent`, `max_percent`, `observation.retention_days`) and add cross-threshold coordination once real acceptance data accumulates.

## Design choice: two one-sided e-processes, not one two-sided

Operator decisions are binary (accept = +1, dismiss = −1). The two-sided likelihood-ratio e-process `cosh(λx) · exp(−λ²/2)` cannot grow above 1 on observations strictly at `|x|=1`: for any `λ > 0`, `cosh(λ) · exp(−λ²/2) ≤ 1` with equality only at `λ=0`. A two-sided martingale is therefore insensitive to unanimous-direction binary sequences — exactly the regime the calibration loop operates in.

Instead the loop runs two one-sided e-processes in parallel: one fed the observations as-is (tests accept-skew → recommend DECREASE), one fed the sign-flipped observations (tests dismiss-skew → recommend INCREASE). Each runs at α/2 so the union rejection rate is bounded by α (Bonferroni). The directional rejection that fires (or neither) drives the recommendation. Trip point at α = 0.05 and λ = 0.5: ~10 unanimous accepts produce evidence ≈ 41.1 > 40 (= 1/0.025), tripping the positive side.

## Deliverables

| Path | Status | Notes |
|---|---|---|
| `src/bounded-learning/types.ts` | NEW | Shared types: `SuggestionDecision`, `CalibratableThreshold`, `AdjustmentDirection`, `CalibrationObservation`, `CalibrationRecommendation`, `CalibrationLoopConfig` |
| `src/bounded-learning/suggestions-mapper.ts` | NEW | `normalizeDecision`, `decisionToValue` (+1/−1/0), `entryToObservation`, `entriesToObservations` (filters neutral) |
| `src/bounded-learning/calibration-loop.ts` | NEW | `runCalibrationLoop` — two one-sided e-processes at Bonferroni α/2; single-step adjustment with floor=1 |
| `src/bounded-learning/threshold-writer.ts` | NEW | `applyRecommendation` with dry-run / `--apply` gate + concurrent-edit detection + atomic rename-from-tmpfile write |
| `src/bounded-learning/index.ts` | NEW | Public API exports |
| `src/bounded-learning/__tests__/{suggestions-mapper, calibration-loop, threshold-writer}.test.ts` | NEW | 29 unit tests (9 + 8 + 12) |
| `src/cli/commands/bounded-learning.ts` | NEW | `skill-creator bounded-learning` / `bl` CLI; three-tier output (text/quiet/JSON); `--threshold`, `--alpha`, `--lambda`, `--suggestions`, `--config`, `--apply` flags |
| `src/cli/commands/bounded-learning.test.ts` | NEW | 17 CLI tests (args, happy paths, --apply gate, malformed input) |
| `src/cli/dispatch.ts` | MODIFIED | +5 lines: import + dispatcher entry |
| `src/cli/help.ts` | MODIFIED | +1 line: help row |
| `.planning/PROJECT.md` | MODIFIED | Active milestone + Latest shipped release + Last updated advanced |

## What changed (behaviorally)

- New CLI surface: `skill-creator bounded-learning [--apply] [options]` / `skill-creator bl [...]`.
- New advisory loop: reads `.planning/patterns/suggestions.json`, runs anytime-valid calibration, reports recommendation.
- New writer surface: with `--apply`, atomically updates `.planning/skill-creator.json` (concurrent-edit refusal).
- `src/bounded-learning/` namespace flips from `test-only` to `living` on adoption-scan (1 CLI importer).

## What this ship is not

- Not a NASA degree advance.
- Not a counter-cadence ship.
- Not a shelfware verdict ship — `src/bounded-learning/` was already `living` via the two-gate sub-namespace; this ship adds a peer module within the namespace.

## Verification

- `npx vitest run src/bounded-learning/ src/cli/commands/bounded-learning.test.ts` → 68/68 PASS (29 primitive + 17 CLI + 22 pre-existing in two-gate / citation-pin).
- `npm run build` → PASS (TypeScript strict).
- `node dist/cli.js bounded-learning --json` → real-world smoke test against the actual `.planning/skill-creator.json`: `direction: hold`, `observations: 0`, `applied: noop` (no suggestions data yet, as expected).
- `bash tools/pre-tag-gate.sh` → 17/17 PASS.
- `node tools/adoption-scan.mjs --json` → `bounded-learning` status: `living`, 1 CLI importer.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED). Counter-cadence count UNCHANGED at 5. v795 is forward-cadence audit-driven.

## Audit roadmap status

| Item | Status |
|---|---|
| T1.4 — PROJECT.md GAP table refresh | Delivered at v785 |
| S5 — PROJECT.md normalizer | Delivered at v785 |
| T1.2 series — adoption telemetry + cluster verdicts (6/6) | Delivered v786-v793 |
| Path A meta — Codification of v785-v789 lesson cluster | Delivered at v790 |
| Path E — #10424 deterministic gate + ESTABLISHED promotion | Delivered at v794 |
| **T1.1 ship 1 — Bounded-learning calibration loop primitive + CLI + writer** | **Delivered at v795 (this ship)** |
| T1.1 ships 2-6 — Real-data wiring + multi-threshold + cross-threshold coordination | OPEN |
| T1.3 — College of Knowledge consumer engine | OPEN — 3-5 ships |
| S3 — Codify the meta-cadence | OPEN |
| S4 — Public surface separation | OPEN |
| S6 — Self-evidence loop for security disciplines | OPEN |
| S7 — Counter-cadence cadence | OPEN |

## Forward path: T1.1 ship 2

Once `.planning/patterns/suggestions.json` accumulates real acceptance data via `/sc:suggest`, the loop produces directional recommendations. Ship 2 candidates:

- Wire a second threshold (`suggestions.cooldown_days` or `token_budget.warn_at_percent`).
- Add an audit-log surface that records every loop run + outcome for after-the-fact calibration accountability.
- Add a `--watch` mode that re-runs the loop on suggestions.json changes (cross-session calibration).
- Surface the recommendation in `/sc:status` output so operators see calibration state at session start.

## Lesson-backlog state

| Phase | Open candidates |
|---|---|
| v794 close | 0 |
| **v795 close** | **0** (or 1 if a new candidate emerges from this ship's retro) |
