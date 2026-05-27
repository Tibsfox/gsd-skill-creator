# v1.49.803 — Context

## What this ship is

v1.49.803 closes the v798 unwired-stub gap by wiring a real observation source for `token_budget.warn_at_percent`:

- NEW module `src/bounded-learning/token-budget-events.ts` — `TokenBudgetEvent` + JSONL append/read primitives.
- MODIFIED `src/bounded-learning/observation-sources.ts` — `token_budget.warn_at_percent` flips to `wired: true`.
- MODIFIED `src/cli/commands/bounded-learning.ts` — new `--record-event --kind responsive|ignored` mode + new `--token-budget-events <path>` flag.
- MODIFIED `project-claude/commands/sc/status.md` — new Step 4.6 instructs Claude to invoke `--record-event` on the responsive/ignored decision rule.
- +21 tests across 4 test files. 157/157 PASS in the bounded-learning + CLI scope (was 136 at v801; 136 + 0 at v802 codification; 157 at v803 close).

5 of 6 calibratable thresholds now wired.

## What this ship is not

- Not a NASA degree advance. NASA sustains at 1.178.
- Not a counter-cadence ship.
- Not a wire for `token_budget.max_percent` or `observation.retention_days` — both remain unwired.
- Not a new top-level CLI subcommand — `--record-event` is a mode flag (matches `--summary` / `--watch` pattern).

## Predecessors (chained-session pickup)

- v1.49.802 — Codification ship (promote #10425 + #10426 + #10427).
- v1.49.801 — T1.1 ship 7: /sc:status integration (T1.1 ARC CLOSED).
- v1.49.798 — T1.1 ship 4: token_budget + per-class registry (introduced the unwired stub closed by v803).
- v1.49.795 — T1.1 ship 1: primitive + CLI + writer.

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 + #10184 + #10197 + #10424. Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:

- The v794-installed `checkOverwriteGuard` fires again. Tenth consecutive ship under the gate.
- Step 2.6 (citation-debt auto-update) is N/A (no V-flag emit/close/state blocks).
- Adoption-baseline diff: expected no namespace status changes (bounded-learning already `living`; the new token-budget-events.ts module is wired into the existing observation-sources surface).
- **Self-mod note (v803-specific):** edited `project-claude/commands/sc/status.md` (the SOURCE) and ran `node project-claude/install.cjs` (which has `SC_INSTALL_CALLER=project-claude` env baked in) to sync to `.claude/`. No direct `.claude/` edits required.
- **Chained-session note:** v803 is the immediate continuation of the operator's "codification + token-budget source" two-ship choice from the v801 handoff menu. Total session wall-clock estimate: v802 (~30-40 min) + v803 (~50-55 min) ≈ 80-95 min.

## Audit-2026-05-26+ streak status

v803 is the 19th ship in the AUDIT-2026-05-26+ series. Cadence sub-bifurcation (unchanged at v803):

- New-vertical / new-module ships: 30-90 min.
- Same-class extensions: 15-30 min.
- Cross-class extensions: 45-60 min.
- New-module consuming established abstractions: 30-50 min. **← v803 lands here.**
- Long-running-mode + refactor: 40-50 min.
- Consumer surface integrations (no new module): 30-40 min.
- Codification ships: 30-45 min.
- NASA degree advances: 60-90 min (separate cadence pattern).

Net delivery across audit streak (v785-v803, 19 ships):

- 1 normalizer.
- 3 adoption-telemetry surfaces.
- 6 shelfware verdicts.
- 1 NASA degree advance.
- 11 ESTABLISHED lessons (8 at v784 + 1 inline at v794 + 7 at v790 + 3 at v802 = 19; correction: 8+1+7+3 = 19, not 11 — let me recount: v784 promoted 8 (#10409-#10416), v794 inline 1 (#10424), v790 promoted 7 (#10417-#10423), v802 promoted 3 (#10425-#10427) = 19 ESTABLISHED lessons promoted in the audit streak).
- 3 tentative observations carried forward (watch-loop tear-down race; chained-session architectural-tax break-even; **NEW v803 registry-abstraction cross-chain payoff**).
- 1 deterministic gate.
- 1 new T1.1 vertical + 6 T1.1 extensions + 1 codification + 1 follow-on wire-up.
- T1.1 ARC CLOSED at v801; backlog drained at v802; first post-codification ship at v803.

## Forward path (post-v803)

- **NASA 1.179 forward-cadence** — INTERSTELLAR-BOUNDARY axis obs#3.
- **T1.3 — College of Knowledge consumer engine** (3-5 ships).
- **Audit-log query subcommand** — `bounded-learning log --last N --since <ts>`.
- **Strengthening Levers S3/S4/S6/S7.**

## Why this ship matters

v798 introduced the cross-class registry with the explicit intent that a future ship would wire the token-budget source. v803 fulfills that intent. The registry abstraction was the architectural-tax payment at v798; v799-v801 paid back the tax via 3 consumer-side validations; v803 pays back the tax a 4th time across a chained-session boundary.

The pattern is now: the v798 architectural tax has paid for itself 4× over, and each subsequent ship that touches `observation-sources.ts` continues to ride the same abstraction. This is the empirical case for Lesson #10426 in its strongest form — the second-instance extraction's lifetime value is bounded only by how often the surface is touched.
