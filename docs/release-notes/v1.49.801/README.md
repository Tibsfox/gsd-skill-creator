# v1.49.801 — T1.1 Ship 7: `/sc:status` Bounded-Learning Integration (Final Chained-Session Ship)

**Released:** 2026-05-27
**Type:** forward-cadence Tier 1 audit ship 7/4-7 — **T1.1 ARC CLOSED**
**Predecessor:** v1.49.800 — T1.1 Ship 6 (Bounded-Learning `--watch` Mode)
**Engine state:** UNCHANGED (NASA degree sustains at 1.178)
**Wedge:** T1.1 ship 7 — surface calibration state in `/sc:status` dashboard

## Summary

Final ship in the T1.1 calibration-loop arc, and the fifth/final ship in this chained-session run (v797 → v801). Adds:

1. `--summary` mode to `skill-creator bounded-learning` — emits one-JSON-shot summary of all wired thresholds + audit-log state + pending recommendations.
2. Step 5.5 in `/sc:status` (via `project-claude/commands/sc/status.md`) that consumes `--summary` output and renders a per-threshold dashboard alongside the existing skill-budget surface.

Operators now see calibration state at every `/sc:status` invocation — wired thresholds, last calibration tick per threshold, audit-log size, pending recommendations awaiting `--apply`.

Wall-clock: ~30-40 min — matched the v798 prediction for /sc:status integration.

## Deliverables

| Path | Change | Notes |
|---|---|---|
| `src/cli/commands/bounded-learning.ts` | MODIFIED | New `--summary` flag + `runSummary(args)` helper. Reads config + audit log, builds per-threshold summary (currentValue, observationSource, lastTick), derives pending recommendations from audit-log entries where direction != hold + applied == dry-run. Emits one JSON object. |
| `project-claude/commands/sc/status.md` | MODIFIED | Added Step 5.5 "Display bounded-learning calibration state": runs `npx skill-creator bounded-learning --summary` with 5s timeout (best-effort silent skip on failure); renders per-threshold table + audit-log entry count + pending-recommendation warning block when applicable. |
| `.claude/commands/sc/status.md` | MODIFIED (via install.cjs) | Installed copy of the project-claude source. |
| `src/cli/commands/bounded-learning.test.ts` | MODIFIED | +4 `--summary` tests: 4-threshold shape / empty-log baseline / lastTick + pending-recommendation after prior tick / missing-config tolerance. |
| `docs/release-notes/v1.49.801/` | NEW | 5-file chapter set. |

## What changed (behaviorally)

- `skill-creator bounded-learning --summary` emits a single JSON object summarizing all 4 wired thresholds, the audit log, and any pending recommendations. Useful for operator dashboards and the `/sc:status` integration.
- `/sc:status` now displays a "Bounded-Learning Calibration" section showing per-threshold current value, observation source (with `(unwired)` annotation for unwired classes), and last calibration tick (with relative-time annotation).
- When pending recommendations exist (dry-run results that haven't been `--apply`'d), `/sc:status` surfaces a warning block prompting the operator to review.
- Best-effort silent contract: if the `bounded-learning --summary` subprocess fails for any reason, `/sc:status` skips this section silently — never blocks the rest of the dashboard.

## What this ship is not

- Not a NASA degree advance.
- Not a counter-cadence ship.
- Not a new TypeScript module — `runSummary` is a function in the existing CLI command file.
- Not a wire of a new threshold or a new observation source — purely a consumer surface that aggregates v795-v800 state into a dashboard.

## Verification

- `npx vitest run src/bounded-learning/ src/cli/commands/bounded-learning.test.ts` → **136/136 PASS** (132 from v800 + 4 new --summary tests).
- `npm run build` → PASS.
- Smoke: `node dist/cli.js bounded-learning --summary` against live config emits expected 4-threshold JSON shape with all-null lastTick (no audit-log entries yet from operator-facing runs).
- project-claude install verified: `node project-claude/install.cjs` → 33 ok, 0 missing.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED). Counter-cadence count UNCHANGED at 5.

## Audit roadmap status — T1.1 ARC CLOSED

| Item | Status |
|---|---|
| T1.1 ship 1 (primitive) | v795 |
| T1.1 ship 2 (cooldown_days) | v796 |
| T1.1 ship 3 (auto_dismiss_after_days) | v797 |
| T1.1 ship 4 (token_budget + registry) | v798 |
| T1.1 ship 5 (audit log) | v799 |
| T1.1 ship 6 (--watch mode) | v800 |
| **T1.1 ship 7 (/sc:status integration)** | **v801 (this ship — T1.1 ARC CLOSED)** |

T1.1 was originally scoped as a 4-6 ship arc. Final count: 7 ships (v795-v801). The +1 was the cross-class observation-source registry extraction at v798, which the original scope didn't anticipate.

## Forward path (post-T1.1)

- **T1.3 — College of Knowledge consumer engine** (3-5 ships). Major remaining Tier 1 item.
- **S3 — Codify the meta-cadence.**
- **S4 — Public surface separation.**
- **S6 — Self-evidence loop for security disciplines.**
- **S7 — Counter-cadence cadence.**
- **NASA 1.179 forward-cadence** — INTERSTELLAR-BOUNDARY axis obs#3 continuation.
- **Real token-budget observation source** — wire the source for `token_budget.*` thresholds.
- **Audit-log query/report subcommand** — `bounded-learning log` for `--last N`, `--since <timestamp>`, etc.

## Lesson candidates emitted during chained session (final summary)

This 5-ship chained session produced:

| Ship | Candidate | Status at session close |
|---|---|---|
| v795 (predecessor) | #10425 — two-sided-on-binary insensitivity (MEDIUM) | unchanged |
| v798 | #10426 — second-instance abstraction extraction for cross-class registries (MEDIUM) | unchanged candidate |
| v800 | (tentative) watch-loop tear-down race | observation noted; not promoted |
| v797, v799, v801 | none | — |

Lesson backlog at session close: **2 candidates** (#10425 + #10426) + 1 tentative observation. #10426 was validated by two consumer-side applications in this session (v799 audit-log + v800 runCalibrationTick extraction).

## Five-ship chained-session retrospective

This session was the user's first "all" response to a 5-candidate ship menu. Operator framing: "5 sequential ships, lightest-wire discipline."

| Ship | Wedge | Wall-clock | Notes |
|---|---|---|---|
| v797 | suggestions.auto_dismiss_after_days | ~15-20 min | Same-class extension, chained-session warmth |
| v798 | token_budget.warn_at_percent + registry | ~45-60 min | Cross-class + new module, architectural tax |
| v799 | Audit log (new module) | ~30-40 min | New module consuming v798 registry |
| v800 | --watch mode (new module + refactor) | ~40-50 min | Refactor + long-running primitive + tear-down race fix |
| v801 | /sc:status integration | ~30-40 min | --summary flag + project-claude/ skill edit |

Total chained-session wall-clock: ~3-3.5h. Within the operator's original 3-4.5h estimate.

**Pattern observed:** The architectural payoff predicted at v795 ("complete vertical for ONE threshold + threshold-agnostic primitive") compounded across all 5 ships. Every new module after v798 consumed the per-class registry verbatim. The watch loop, audit log, and summary all use the same `observationSourceFor` lookup; the audit log + watch loop both invoke `runCalibrationTick` (extracted at v800).

If this 5-ship pattern recurs (operator says "all" to a similar menu), the empirical wall-clock cadence is now:
- Same-class extension (chained): ~15-25 min
- New-module + cross-class wedge: ~45-60 min
- New-module consuming established abstractions: ~30-40 min
- Refactor + new-module + long-running primitive: ~40-50 min
- /sc:status-style integration: ~30-40 min
