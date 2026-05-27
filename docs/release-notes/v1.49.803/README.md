# v1.49.803 — Real Token-Budget Observation Source

**Released:** 2026-05-27
**Type:** forward-cadence audit ship (post-T1.1 backlog drain)
**Predecessor:** v1.49.802 — Codification Ship (promote #10425 + #10426 + #10427)
**Engine state:** UNCHANGED (NASA degree sustains at 1.178)
**Wedge:** close the v798 unwired stub for `token_budget.warn_at_percent`.

## Summary

Closes the unwired-stub gap from T1.1 ship 4 (v1.49.798). The
`token_budget.warn_at_percent` threshold now has a real observation source
backed by an append-only JSONL log at
`.planning/patterns/token-budget-events.jsonl`. A new `--record-event` CLI
mode appends `responsive` or `ignored` events; the `/sc:status` skill
prompt invokes the CLI when it emits (or follows up on) a token-budget
warn line.

5 of 6 calibratable thresholds now wired. Remaining unwired:
`token_budget.max_percent` and `observation.retention_days`.

## Deliverables

| Path | Change | Notes |
|---|---|---|
| `src/bounded-learning/token-budget-events.ts` | NEW | `TokenBudgetEvent` + `TokenBudgetEventKind` types; `eventKindToValue` + `eventToObservation` + `eventsToObservations` mappers; `appendTokenBudgetEvent` + `readTokenBudgetEvents` JSONL I/O. Mirror of the suggestions-mapper + audit-log pattern; failure contract per Lesson #10427 (ESTABLISHED v802). |
| `src/bounded-learning/observation-sources.ts` | MODIFIED | `observationSourceFor('token_budget.warn_at_percent')` now returns `wired: true`. `loadObservationsForThreshold` dispatches to `readTokenBudgetEvents` for the wired token-budget threshold. New `tokenBudgetEventsPath?` option on `ObservationLoaderOptions`. |
| `src/bounded-learning/index.ts` | MODIFIED | Export the new module. |
| `src/cli/commands/bounded-learning.ts` | MODIFIED | New `--record-event` mode with `--kind responsive\|ignored` (+ optional `--usage-percent`, `--warn-at-percent`, `--reason`). New `--token-budget-events <path>` flag (default `.planning/patterns/token-budget-events.jsonl`). `runCalibrationTick` now passes `tokenBudgetEventsPath` into `loadObservationsForThreshold`. |
| `src/bounded-learning/__tests__/token-budget-events.test.ts` | NEW | 12 tests covering mapper + JSONL I/O + tolerance for malformed lines + unknown-kind rejection. |
| `src/bounded-learning/__tests__/observation-sources.test.ts` | MODIFIED | Updated v798 token_budget assertions; +3 new tests covering the wired path (reading events, missing file fallback, unwired-sibling check). |
| `src/bounded-learning/__tests__/audit-log.test.ts` | MODIFIED | Split the v798 token_budget assertion into wired (`warn_at_percent`) and still-unwired (`max_percent`) variants. |
| `src/cli/commands/bounded-learning.test.ts` | MODIFIED | +5 tests covering `--record-event` (missing-kind, invalid-kind, happy-path responsive, happy-path ignored with all options, end-to-end calibration consuming recorded events). Updated v798 + v801 assertions to reflect wired status. |
| `project-claude/commands/sc/status.md` | MODIFIED | Added Step 4.6 "Record token-budget calibration event": instructs Claude to invoke `--record-event` on the responsive/ignored decision rule. |
| `.claude/commands/sc/status.md` | MODIFIED (via install.cjs) | Installed copy of the project-claude source. |
| `docs/release-notes/v1.49.803/` | NEW | 5-file chapter set. |

## What changed (behaviorally)

- `skill-creator bounded-learning --threshold token_budget.warn_at_percent` now reads from `.planning/patterns/token-budget-events.jsonl` (was: returned 0 observations always). With recorded events, the calibration loop produces real `direction` / `proposedValue` output for the token-budget warn threshold.
- `skill-creator bounded-learning --record-event --kind <responsive|ignored>` appends one JSON line to the events file. Best-effort silent on filesystem failures.
- `/sc:status` now records a token-budget calibration event on every invocation that crosses the warn threshold (or follows up on a previous warn). The event flow is best-effort silent and never blocks the rest of the status dashboard.
- `observationSourceFor('token_budget.warn_at_percent')` reports `wired: true` (was: `false`). All consumer surfaces (`--summary`, audit log entries, /sc:status Step 5.5 table) reflect this.

## What this ship is not

- Not a NASA degree advance. NASA sustains at 1.178.
- Not a counter-cadence ship.
- Not a wire for `token_budget.max_percent` — that threshold remains unwired (no clear signal source; the warn threshold is the actionable one).
- Not an `observation.retention_days` wire — that threshold remains unwired.
- Not a new CLI subcommand at the top level — `--record-event` is a mode flag inside `bounded-learning` (matches the `--summary` / `--watch` pattern).

## Verification

- `npx vitest run src/bounded-learning/ src/cli/commands/bounded-learning.test.ts` → **157/157 PASS** (was 136 at v802 close; +21 added).
- `npm run build` → PASS.
- Smoke: `node dist/cli.js bounded-learning --record-event --kind responsive --token-budget-events /tmp/smoke.jsonl --json` → emits `{"recorded":true,...}` and creates the JSONL file with the recorded event.
- project-claude install verified: `node project-claude/install.cjs` → 33 ok, 0 missing.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED). Counter-cadence count UNCHANGED at 5.

## Calibratable threshold wire status (post-v803)

| Threshold | Wired at | Source |
|---|---|---|
| `suggestions.min_occurrences` | v795 | `suggestions.json` |
| `suggestions.cooldown_days` | v796 | `suggestions.json` |
| `suggestions.auto_dismiss_after_days` | v797 | `suggestions.json` |
| `token_budget.warn_at_percent` | **v803** | **`token-budget-events.jsonl`** |
| `token_budget.max_percent` | (still unwired) | — |
| `observation.retention_days` | (still unwired) | — |

5 of 6 wired. The remaining two have no clear actionable signal:
- `token_budget.max_percent` would need operator-observable consequences of crossing the hard cap (which currently has no enforcer surface).
- `observation.retention_days` would need observation-retention compaction event telemetry (no such surface yet).

Both can stay unwired indefinitely without harm — the per-class registry returns an empty observation array, and the calibration loop reports `direction: hold` honestly.

## Lessons applied

- **#10412 (Recon-first as default)** — 16th consecutive forward application. Reading `observation-sources.ts` + `audit-log.ts` + the v798 retro before writing any v803 code surfaced the registry-pattern verbatim. ~10 min recon → ~45-55 min build.
- **#10422 (Verdict-pattern surface separation)** — 13th forward application. The new `token-budget-events.ts` module is genuinely a new surface — separate from the suggestions-mapper, separate from the observation-sources registry. Each evolves independently.
- **#10423 (Lightest wire that satisfies the verdict)** — 13th forward application. Resisted: a new top-level CLI subcommand, a separate observability surface, a "warn → outcome resolver" module that paired warn + response events. The CLI mode flag + JSONL log + decision-rule in the skill prompt is the lightest wire that delivers operator-observable telemetry.
- **#10424 (Adoption-refresh AFTER bump)** — applied at T14 step 11. Tenth consecutive ship.
- **#10426 (newly ESTABLISHED v802) — APPLIED.** The per-class registry was extracted at the second class instance (v798); v803 is the first wired-vs-unwired distinction within a single class (token_budget.warn_at_percent wired; token_budget.max_percent unwired). The registry abstraction handled the divergence cleanly without restructuring.
- **#10427 (newly ESTABLISHED v802) — APPLIED.** Three best-effort silent contracts in v803: (a) `appendTokenBudgetEvent` callers swallow filesystem errors; (b) `readTokenBudgetEvents` tolerates malformed lines + skips unknown-kind entries; (c) `/sc:status` Step 4.6 instructs Claude to invoke `--record-event` with a 2-second timeout best-effort silent. All paired with at least one test assertion that exercises the failure path (per the documented contract convention).

## Forward path (post-v803)

- **NASA 1.179 forward-cadence** — INTERSTELLAR-BOUNDARY axis obs#3.
- **T1.3 — College of Knowledge consumer engine** (3-5 ships).
- **Audit-log query/report subcommand** — `bounded-learning log` with `--last N`, `--since <ts>`.
- **Strengthening Levers S3/S4/S6/S7.**
- Possible follow-on: `token_budget.max_percent` wire IF an enforcer surface materializes.
