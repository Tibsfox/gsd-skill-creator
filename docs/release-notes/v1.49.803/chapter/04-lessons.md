# 04 — Lessons Learned: v1.49.803

## 0 lessons emitted; 0 promoted to ESTABLISHED; 1 tentative observation

v803 is a structurally well-grooved ship — every design choice came from a recently-ESTABLISHED discipline. No new candidate surfaces from a ship that already had its disciplines in place.

## Disciplines reinforced (no new IDs)

- **#10412 (Recon-first as default)** — 16th consecutive forward application. Read the existing audit-log + suggestions-mapper modules + v798 retro BEFORE writing any v803 code. Recon surfaced the registry shape, the JSONL pattern, and the mode-flag CLI convention.
- **#10422 (Verdict-pattern surface separation)** — 13th forward application. New module separate from existing siblings; CLI mode flag separate from the runCalibrationTick context; skill prompt Step 4.6 separate from Step 5.5.
- **#10423 (Lightest wire that satisfies the verdict)** — 13th forward application. Rejected: top-level CLI subcommand, separate observability surface, warn-outcome resolver module. Chose: mode flag + JSONL log + decision-rule in skill prompt.
- **#10424 (ESTABLISHED v794) — Adoption-refresh AFTER bump.** Applied. Tenth consecutive ship under the active gate.
- **#10426 (newly ESTABLISHED v802) — APPLIED to a wired-vs-unwired distinction within a single class.** The first wired-vs-unwired split inside a class (`token_budget.warn_at_percent` wired; `token_budget.max_percent` unwired). The registry's per-threshold dispatch supported this without restructuring.
- **#10427 (newly ESTABLISHED v802) — APPLIED three times.** (a) `appendTokenBudgetEvent` caller-side swallow, (b) `readTokenBudgetEvents` tolerant-reader, (c) `/sc:status` Step 4.6 best-effort silent CLI invocation. Each contract paired with at least one test assertion exercising the failure path.

## Lessons-learned database state

- **Total lessons emitted to date:** 10427 (cumulative; UNCHANGED since v802 codification).
- **Lessons promoted this milestone:** 0.
- **Lesson candidates closed:** 0.
- **Open lesson candidate backlog:** 0 (UNCHANGED — drained at v802).
- **Manifest entries in `tools/render-claude-md/disciplines.json`:** 17 (UNCHANGED).
- **Manifest lessons:** 68 (UNCHANGED).
- **Tentative observations carried forward:** 3 (was 2; +1 from this ship — see below).

## Tentative observation: registry-abstraction payoff across chained-session boundary

The v798 registry extraction has now paid off across 4 consumer ships:

- v799 audit log (within the v797-v801 chained session)
- v800 watch loop (within the chain)
- v801 summary (within the chain)
- **v803 token-budget-events wire (one ship AFTER a codification ship, two ships AFTER the chain closed)**

The break-even point predicted by Lesson #10426 (2nd consumer = break-even; 3rd consumer = net positive) is empirically validated. v803 adds a 4th consumer across a chained-session boundary, suggesting the payoff window extends beyond the immediate post-extraction chain.

This is supporting evidence for #10426 — not a new candidate, since the rule itself was just promoted at v802. But the cross-chain payoff is a generalization worth flagging:

> Lesson #10426's empirical evidence is "extract at the SECOND instance, net positive at the 3rd consumer." The cross-chain payoff suggests the payoff window is NOT bounded by the chained session that surfaced the extraction. Future codification ships should consider strengthening the lesson with this multi-chain framing.

Carry forward as supporting evidence at the next codification ship; do not promote to a new candidate.

## Lessons applied at v1.49.803 (from v1.49.795-802 and earlier)

- **#10412** (recon-first) — applied. 16th consecutive.
- **#10422-#10423** (Verdict-pattern surface separation + lightest wire) — applied 13th time.
- **#10424** (Adoption-refresh AFTER bump) — applied at T14 step 11.
- **#10425** (newly ESTABLISHED v802) — APPLIED. The token-budget event mapper deliberately uses the same +1/-1 mapping as suggestions-mapper, sidestepping any new e-process design choice. The math is constrained by the existing primitive (which uses one-sided e-processes per #10425's recommendation).
- **#10426** (newly ESTABLISHED v802) — APPLIED. First wired-vs-unwired distinction within a class; registry handles it without restructuring.
- **#10427** (newly ESTABLISHED v802) — APPLIED three times (see above).

## Open lessons watchlist (apply at next opportunity)

- **#10412** (recon-first) — apply at every session start.
- **#10422-#10423** (Verdict-pattern surface separation + lightest wire) — apply at every extension.
- **#10424** (Adoption-refresh AFTER bump) — gate is active.
- **#10425** — apply at every new bounded-learning math choice.
- **#10426** — apply at every SECOND class instance + every wired-vs-unwired split.
- **#10427** — apply at every accessory-vs-load-bearing surface choice.
- **(tentative) watch-loop tear-down race** — carry forward.
- **(tentative) chained-session architectural-tax break-even** — carry forward.
- **(tentative) registry-abstraction cross-chain payoff (NEW v803)** — carry forward; supporting evidence for #10426.

## Cross-discipline observation: the post-codification ship is well-grooved

v802 promoted three lessons (#10425 + #10426 + #10427). v803 applied all three in its first 50-55 min wall-clock — same session, immediately downstream. This is the highest-density-of-application pattern observed in the audit streak: every newly-ESTABLISHED lesson found a real application within one ship of its codification.

The pattern is not coincidence. v803's wedge (real token-budget observation source) was the natural next ship after T1.1 closed; the candidates that v802 promoted came from the same T1.1 arc. So v803 was the first ship to operate UNDER the newly-codified disciplines, and every choice point intersected with one of them.

This is meta-evidence for #10415 (deferred-maintenance escalation, ESTABLISHED v784) — closing the candidate backlog BEFORE the next forward-cadence ship means the next ship operates under the codified discipline rather than under candidate-uncertainty. Codify at the right moment (5-8 candidates accumulated, fresh evidence) and the codification immediately compounds.

## Forward backlog (post-v803)

| ID | Severity | Apply | Source | Status |
|---|---|---|---|---|
| (tentative) watch-loop tear-down race | NOTE | Long-running primitives MUST await in-flight callbacks during teardown. | v800 implementation | carry forward (1 instance) |
| (tentative) chained-session architectural-tax break-even | NOTE | Architectural-tax ship in multi-ship chain breaks even at 2nd consumer, net positive at 3rd. | v798→v799-801 observation | carry forward (1 chain) |
| (tentative) registry-abstraction cross-chain payoff | NOTE | Per-class registry abstraction's payoff window extends past the immediate post-extraction chain. | v798→v803 observation across 2 chains | carry forward (supporting #10426) |

Open lesson-candidate backlog: **0** (DRAINED at v802; v803 does not emit new candidates).
