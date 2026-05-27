> Following v1.49.802 — _Codification Ship: Promote #10425 + #10426 + #10427_, v1.49.803 closes the v798 unwired-stub gap: `token_budget.warn_at_percent` now has a real observation source backed by append-only JSONL operator-response telemetry.

# v1.49.803 — Real Token-Budget Observation Source

**Shipped:** 2026-05-27

Wires the fifth of six calibratable thresholds. Adds a new module
(`src/bounded-learning/token-budget-events.ts`), a new CLI mode
(`--record-event`), and a Step 4.6 in `/sc:status` that invokes the CLI
when a warn line is emitted.

## What shipped

- **`src/bounded-learning/token-budget-events.ts`** — NEW module. `TokenBudgetEvent` + `TokenBudgetEventKind` types; mapper functions; append-only JSONL writer + tolerant reader.
- **`src/bounded-learning/observation-sources.ts`** — `observationSourceFor('token_budget.warn_at_percent')` flips to `wired: true`; `loadObservationsForThreshold` dispatches to the new mapper.
- **`src/cli/commands/bounded-learning.ts`** — New `--record-event --kind responsive|ignored` mode; new `--token-budget-events <path>` flag; ` runCalibrationTick` passes the events path into the loader.
- **`project-claude/commands/sc/status.md`** — New Step 4.6 instructs Claude to invoke `--record-event` on the responsive/ignored decision rule. Synced to `.claude/` via `install.cjs`.
- **+21 tests** across token-budget-events.test.ts (NEW, 12 tests) + observation-sources.test.ts (+3) + bounded-learning.test.ts (+5) + audit-log.test.ts (+1).

Test count: **157/157 PASS** in the bounded-learning + CLI test surface (was 136 at v801; +21 this ship).

## Through-line

The v798 cross-class registry extraction predicted exactly this shape of follow-on ship: introduce a new wired source for a class that previously had only a stub. Per Lesson #10426 (newly ESTABLISHED at v802), the registry abstraction made the wire-up a localized change rather than a cross-cutting refactor. The new module composes cleanly: `loadObservationsForThreshold` gained one branch, the loader options gained one field, and every existing consumer (audit-log, --summary, --watch, /sc:status Step 5.5) inherits the new behavior without touching their own code.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED). Counter-cadence count UNCHANGED at 5.

## Calibratable threshold wire status (post-v803)

5 of 6 wired:

- `suggestions.min_occurrences` (v795)
- `suggestions.cooldown_days` (v796)
- `suggestions.auto_dismiss_after_days` (v797)
- `token_budget.warn_at_percent` (**v803** — this ship)
- `token_budget.warn_at_percent`'s source: `.planning/patterns/token-budget-events.jsonl` (append-only operator-outcome log)

Remaining unwired: `token_budget.max_percent`, `observation.retention_days`. Both can stay unwired indefinitely — no clear actionable signal source today.

## Forward path

- **NASA 1.179 forward-cadence** — INTERSTELLAR-BOUNDARY axis obs#3.
- **T1.3 — College of Knowledge consumer engine** (3-5 ships).
- **Audit-log query subcommand** — `bounded-learning log --last N`.

---
**Prev:** [v1.49.802](../v1.49.802/00-summary.md)
