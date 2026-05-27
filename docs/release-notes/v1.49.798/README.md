# v1.49.798 — T1.1 Ship 4: Wire `token_budget.warn_at_percent` + Per-Class Observation-Source Registry

**Released:** 2026-05-27
**Type:** forward-cadence Tier 1 audit ship 4/4-6 (NOT a NASA degree advance, NOT counter-cadence)
**Predecessor:** v1.49.797 — T1.1 Ship 3 (Wire `suggestions.auto_dismiss_after_days`)
**Engine state:** UNCHANGED (NASA degree sustains at 1.178)
**Wedge:** T1.1 ship 4 — extend wired thresholds 3 → 4; first non-suggestions threshold class; introduce per-class observation-source registry

## Summary

The first non-trivial ship in the T1.1 arc. Wires `token_budget.warn_at_percent` (the first member of a new threshold class) and introduces a per-threshold-class observation-source registry to handle the fact that operator decisions on surfaced suggestions do NOT carry information about token-budget calibration.

The registry pattern is the second-instance abstraction extraction. v795-797 had one class and one source (no abstraction needed); v798 has two classes and two sources (abstraction warranted). Per disciplines #10422 + #10423, extract at the second instance, not earlier.

Wall-clock: ~45-60 min — matched the v796 handoff prediction for this ship.

## Deliverables

| Path | Change | Notes |
|---|---|---|
| `src/bounded-learning/observation-sources.ts` | NEW | Per-threshold-class observation-source registry; `loadObservationsForThreshold(threshold, options)` dispatches by class prefix |
| `src/bounded-learning/index.ts` | MODIFIED | Re-export `loadObservationsForThreshold` + `observationSourceFor` + types |
| `src/bounded-learning/types.ts` | MODIFIED | Docstring refresh: 4 wired thresholds |
| `src/cli/commands/bounded-learning.ts` | MODIFIED | `SUPPORTED_THRESHOLDS` widens 3→4; CLI consumes the new loader; renderers surface observation-source metadata (`observationSource: { sourceId, wired, description }` in JSON output) |
| `src/bounded-learning/__tests__/calibration-loop.test.ts` | MODIFIED | +4 tests proving the primitive is threshold-agnostic for token_budget (decrease / increase / zero-observation hold / floor-clamp at 1) |
| `src/bounded-learning/__tests__/threshold-writer.test.ts` | MODIFIED | +1 test proving applyRecommendation writes `token_budget.warn_at_percent = 3` and preserves siblings across BOTH `token_budget.*` and `suggestions.*` classes |
| `src/bounded-learning/__tests__/observation-sources.test.ts` | NEW | 12 dedicated tests for the new registry: 6 `observationSourceFor` classification + 6 `loadObservationsForThreshold` dispatch + tolerance |
| `src/cli/commands/bounded-learning.test.ts` | MODIFIED | +3 tests for `--threshold token_budget.warn_at_percent` end-to-end (unwired source hold / `--apply` noop / suggestions thresholds still show wired source) |
| `docs/release-notes/v1.49.798/` | NEW | 5-file chapter set |

## What changed (behaviorally)

- `skill-creator bounded-learning --threshold token_budget.warn_at_percent` runs the calibration loop against the live `warn_at_percent` value (default 4). With no token-budget observation source captured today, the loop always returns `direction: hold` with `observations: 0` — an honest "wire exists, source not yet captured" baseline.
- JSON output now includes an `observationSource` field with `sourceId`, `wired` boolean, and human-readable `description`. Operators can see at a glance whether the calibration result is informed by real data or by an unwired stub.
- Text output surfaces the observation source as a labeled line; unwired sources show in yellow with `(NOT YET CAPTURED)` annotation.
- Help text lists all four supported thresholds.

## What this ship is not

- Not a NASA degree advance.
- Not a counter-cadence ship.
- Not a refactor in the negative sense — the registry extraction was deliberately deferred until the second class instance to satisfy lightest-wire discipline.
- Not the token-budget observation source itself — that's a separate future ship (would need to hook into the skill-load token-budget enforcer and log operator-response events).

## Verification

- `npx vitest run src/bounded-learning/ src/cli/commands/bounded-learning.test.ts` → **106/106 PASS** (86 from v797 + 20 new: 4 calibration-loop + 1 threshold-writer + 3 CLI + 12 observation-sources).
- `npm run build` → PASS (TypeScript strict).
- `node dist/cli.js bounded-learning --threshold token_budget.warn_at_percent --json` → smoke test: `currentValue: 4`, `direction: hold`, `observations: 0`, `observationSource.wired: false`, `applied: noop` — the architectural-choice surface is visible in JSON output.
- `node dist/cli.js bounded-learning --help` → all four thresholds listed under `Supported:`.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED). Counter-cadence count UNCHANGED at 5.

## Architectural choice rationale

The v796 handoff predicted token_budget would force an architectural choice: "may force an architectural choice about whether `entriesToObservations` is the right signal source for token-budget calibration." Three options were considered:

- **(A) Lightest wire — reuse suggestions source.** Wire token_budget against suggestions data. Technically possible because the e-process is signal-agnostic. Rejected: semantically dishonest — operator accept/dismiss decisions on suggestions tell us nothing about token-budget appropriateness.
- **(B) Build a real token-budget observation source.** Hook into the skill-load token-budget enforcer; log operator response to warn events. Rejected as a v798 surface: would be a sub-ship of its own (~45-60 min for the enforcer hook alone), pushes wall-clock to 90+ min.
- **(C) Per-class observation-source registry + unwired stub for token_budget.** Add `observation-sources.ts`; suggestions classes get the existing source, token_budget classes get an empty source, the calibration loop honestly returns "hold (no data)" for unwired classes. Selected. ~45-60 min wall-clock.

The registry pattern is the right-sized abstraction extraction. v795-797 had one class and one source (no abstraction). v798 has two classes and two sources (abstraction warranted). v799+ extensions can add new sources to the registry without touching the CLI surface.

## Audit roadmap status

| Item | Status |
|---|---|
| T1.1 ship 1 — Bounded-learning calibration loop primitive + CLI + writer | Delivered at v795 |
| T1.1 ship 2 — Wire suggestions.cooldown_days | Delivered at v796 |
| T1.1 ship 3 — Wire suggestions.auto_dismiss_after_days | Delivered at v797 |
| **T1.1 ship 4 — Wire token_budget.warn_at_percent + per-class registry** | **Delivered at v798 (this ship)** |
| T1.1 ships 5-6 — Audit log + --watch + /sc:status | OPEN |
| T1.3 — College of Knowledge consumer engine | OPEN — 3-5 ships |
| S3 — Codify the meta-cadence | OPEN |
| S4 — Public surface separation | OPEN |
| S6 — Self-evidence loop for security disciplines | OPEN |
| S7 — Counter-cadence cadence | OPEN |

## Forward path: T1.1 ships 5-7 (chained session continues)

- **v799 — Audit log.** Append-only `.planning/patterns/bounded-learning-log.jsonl` per loop run. Closes the no-history gap.
- **v800 — `--watch` mode.** Re-run loop on `suggestions.json` changes.
- **v801 — `/sc:status` integration.** Operator sees calibration state at session start.

Outside this chained session:

- A real token-budget observation source (hook into skill-load enforcer; log operator-response events to a new `.planning/patterns/token-budget-events.jsonl`). This is a separate ~45-60 min ship.

## Lesson-backlog state

| Phase | Open candidates |
|---|---|
| v795 close | 1 (#10425) |
| v796 close | 1 (#10425 — unchanged) |
| v797 close | 1 (#10425 — unchanged) |
| **v798 close** | **2** (#10425 — unchanged; **#10426 candidate** NEW — see lessons chapter) |

## New lesson candidate emitted (#10426)

**#10426 candidate (MEDIUM)** — Second-instance abstraction extraction for cross-class registries. When a primitive accumulates instances across multiple classes (here: threshold classes with different observation sources), extract the per-class registry at the SECOND class instance, not the third. v798 extracted at 2nd class (suggestions → suggestions + token_budget); deferring to the 3rd would have meant token_budget ships using the wrong source as a temporary measure, baking semantic confusion into the documentation. The 2nd instance is the discipline-correct extraction point.
