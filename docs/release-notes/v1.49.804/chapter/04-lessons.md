# 04 — Lessons Learned: v1.49.804

## 0 lessons emitted; 0 promoted to ESTABLISHED; 1 tentative observation

v804 is a structurally well-grooved consumer-surface ship — every design choice came from a recently-ESTABLISHED discipline. No new candidate surfaces.

## Disciplines reinforced (no new IDs)

- **#10412 (Recon-first as default)** — 17th consecutive forward application. Read `audit-log.ts`, `token-budget-events.ts`, the v803 `runRecordEvent` handler, and the existing `runSummary` shape BEFORE writing any v804 code. Recon surfaced the full design: mode-flag dispatch, two-renderer split, reused argument-parsing primitives.
- **#10422 (Verdict-pattern surface separation)** — 14th forward application. Two renderers for two log shapes — kept separate because the entry types are genuinely different (AuditLogEntry vs TokenBudgetEvent).
- **#10423 (Lightest wire that satisfies the verdict)** — 14th forward application. Resisted top-level subcommand, unified entry type, pagination primitive, tail-follow mode. Chose: one mode flag + two renderers + three filter flags + zero new module.
- **#10424 (ESTABLISHED v794) — Adoption-refresh AFTER bump.** Applied. Eleventh consecutive ship under the active gate.
- **#10426 (ESTABLISHED v802) — APPLIED on a new axis.** The registry now has a 5th consumer; the `runQuery` dispatch is on `log` not `threshold`, so v804 composes alongside the registry rather than extending it.
- **#10427 (ESTABLISHED v802) — APPLIED.** Query surface is accessory / forensic; missing log returns empty count, not an error.

## Lessons-learned database state

- **Total lessons emitted to date:** 10427 (cumulative; UNCHANGED since v802 codification).
- **Lessons promoted this milestone:** 0.
- **Lesson candidates closed:** 0.
- **Open lesson candidate backlog:** 0 (UNCHANGED — drained at v802).
- **Manifest entries in `tools/render-claude-md/disciplines.json`:** 17 (UNCHANGED).
- **Manifest lessons:** 68 (UNCHANGED).
- **Tentative observations carried forward:** 4 (was 3; +1 from this ship — see below).

## Tentative observation: mode-flag pattern at 5 instances; 6th-mode refactor trigger imminent

`--watch` (v800), `--summary` (v801), `--record-event` (v803), `--query` (v804). Plus the default calibration tick. That's 5 modes inside `bounded-learning`. The v803 retrospective noted "if a 6th mode arrives, consider lifting all of them into subcommands."

v804 is the 5th mode flag (4 named + 1 default). The 6th-mode threshold is now imminent. A future ship that adds a 6th mode SHOULD evaluate: (a) keep flags inline and accept the larger help text; (b) lift to `bounded-learning <subcommand>` form.

This is a one-time refactor trigger, not a discipline rule. Carry forward as tentative observation; do not promote.

## Lessons applied at v1.49.804 (from v1.49.802-803 and earlier)

- **#10412** (recon-first) — applied. 17th consecutive.
- **#10422-#10423** (Verdict-pattern surface separation + lightest wire) — applied 14th time.
- **#10424** (Adoption-refresh AFTER bump) — applied at T14 step 11.
- **#10426** (newly ESTABLISHED v802) — APPLIED on a new axis (per-log dispatch composed alongside per-threshold registry).
- **#10427** (newly ESTABLISHED v802) — APPLIED (missing-log → empty count, not error).

## Open lessons watchlist (apply at next opportunity)

- **#10412** (recon-first) — apply at every session start.
- **#10422-#10423** (Verdict-pattern surface separation + lightest wire) — apply at every extension.
- **#10424** (Adoption-refresh AFTER bump) — gate is active.
- **#10425** — apply at every new bounded-learning math choice.
- **#10426** — apply at every SECOND class instance + every wired-vs-unwired split.
- **#10427** — apply at every accessory-vs-load-bearing surface choice.
- **(tentative) watch-loop tear-down race** — carry forward.
- **(tentative) chained-session architectural-tax break-even** — carry forward.
- **(tentative) registry-abstraction cross-chain payoff** — carry forward (supporting #10426).
- **(tentative NEW v804) 6th-mode-flag refactor trigger** — carry forward.

## Cross-discipline observation: consumer-surface ships are the cleanest

v804 touched ONE source file (`bounded-learning.ts`) and added one test block. Zero new modules. Zero edits to `src/bounded-learning/`. This is the cleanest possible ship shape — consumer-surface that compose under existing primitives.

The pattern: v798 paid an architectural tax (registry extraction); v799/v800/v801/v803/v804 are five consumer ships that ride the tax. The lifetime payoff curve for the v798 tax is now at 5 consumer ships across two chained-session boundaries.

This is empirical evidence for Lesson #10426's strongest framing: the second-instance extraction's lifetime value is bounded only by how often the surface is touched. v804 touches the surface again; the tax remains paid; the ship completes faster.

## Forward backlog (post-v804)

| ID | Severity | Apply | Source | Status |
|---|---|---|---|---|
| (tentative) watch-loop tear-down race | NOTE | Long-running primitives MUST await in-flight callbacks during teardown. | v800 implementation | carry forward (1 instance) |
| (tentative) chained-session architectural-tax break-even | NOTE | Architectural-tax ship in multi-ship chain breaks even at 2nd consumer, net positive at 3rd. | v798→v799-801 observation | carry forward (1 chain) |
| (tentative) registry-abstraction cross-chain payoff | NOTE | Per-class registry abstraction's payoff window extends past the immediate post-extraction chain. | v798→v804 observation across 2 chains | carry forward (supporting #10426) |
| (tentative NEW v804) 6th-mode-flag refactor trigger | NOTE | When a CLI accumulates 6 mode flags, evaluate lifting to subcommand form. | v800-v804 trajectory | carry forward (1 trajectory) |

Open lesson-candidate backlog: **0** (UNCHANGED).
