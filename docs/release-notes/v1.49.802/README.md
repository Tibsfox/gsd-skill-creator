# v1.49.802 — Codification Ship: Promote #10425 + #10426 + #10427 to ESTABLISHED

**Released:** 2026-05-27
**Type:** counter-cadence codification ship (drains T1.1 lesson-candidate backlog)
**Predecessor:** v1.49.801 — T1.1 Ship 7 (`/sc:status` Bounded-Learning Integration; T1.1 ARC CLOSED)
**Engine state:** UNCHANGED (NASA degree sustains at 1.178; counter-cadence count UNCHANGED at 5 — codification is not itself counter-cadence)
**Wedge:** drain the 3 lesson-candidate backlog accumulated across T1.1 (v795 + v798 + v799-801) into ESTABLISHED disciplines.

## Summary

Promotes the three MEDIUM-severity lesson candidates from the T1.1 chained-session arc to ESTABLISHED status:

- **#10425** (v795 design) — Two-sided likelihood-ratio e-processes on bounded binary observations are insensitive to unanimous direction. Use Bonferroni-combined one-sided primitives instead.
- **#10426** (v798 architectural-choice) — Extract per-class registries at the SECOND class instance, not the third. Validated three times consumer-side during v799-v801.
- **#10427** (v799-801 three-instance) — Forensic/dashboard/observability surfaces fail silently; load-bearing surfaces fail loudly.

Adds two new operative disciplines (Bounded-learning calibration; Failure-mode contracts) and extends an existing one (Architecture-retrofit patterns with #10426). Each candidate gets a backing canonical doc.

## Deliverables

| Path | Change | Notes |
|---|---|---|
| `docs/bounded-learning-calibration-discipline.md` | NEW | Anchors #10425; future bounded-learning ships add lessons here. Documents the math-check-before-test-fixture convention, the two-sided / one-sided e-process trap, and cross-references the per-class registry extraction rule. |
| `docs/architecture-retrofit-patterns.md` | MODIFIED | Adds the "Cross-class registry extraction at the SECOND class instance" section (Lesson #10426). Updates lesson references and anti-pattern summary. |
| `docs/failure-mode-contracts.md` | NEW | Anchors #10427. Documents the load-bearing-vs-accessory test, the contract documentation convention (explicit marker + paired test), and the three v799-801 reference implementations. |
| `tools/render-claude-md/disciplines.json` | MODIFIED | Adds two new domain entries (Bounded-learning calibration; Failure-mode contracts); extends Architecture-retrofit patterns with #10426; updates `codified_at_milestone` strings. |
| `CLAUDE.md` | REGENERATED | `npm run render:claude-md` produces the updated operative-disciplines table. 15 → 17 domains; 65 → 68 lesson refs. |
| `docs/release-notes/v1.49.802/` | NEW | 5-file chapter set. |
| `docs/release-notes/STORY.md` | APPENDED | Per T14 step 2.5. |

## What changed (behaviorally)

Nothing behavioral changes in the codebase. This is a discipline-coverage ship: it documents and codifies three lessons that were already candidate-validated during the v795-v801 chain.

## What this ship is not

- Not a NASA degree advance.
- Not a counter-cadence ship (counter-cadence ships convert social-rule debt into deterministic gates; this ship promotes lesson candidates to ESTABLISHED documentation — different mechanism).
- Not new code in `src/`.
- Not new tests — the lessons being codified were already validated by the v795-v801 test growth (+59 tests across that arc).
- Not a wire of an unwired threshold — `token_budget.warn_at_percent` remains unwired; that's the v803 ship's wedge.

## Verification

- `npm run render:claude-md` → "CLAUDE.md updated." 17 disciplines + 68 lesson refs visible.
- `tools/pre-tag-gate.sh` (T14 step 1) → expected 17/17 PASS with the standard STORY-drift WARN.
- No `src/` changes → existing test suite unaffected.

## Engine state

NASA degree sustains at **1.178**. Counter-cadence count UNCHANGED at 5.

## Discipline-coverage status post-ship

- Manifest entries: **15 → 17** (+2: Bounded-learning calibration, Failure-mode contracts)
- Manifest lessons: **65 → 68** (+3: #10425, #10426, #10427)
- Open lesson candidate backlog: **3 → 0** (drained)
- Tentative observations carried forward: 2 (watch-loop tear-down race; chained-session architectural-tax break-even) — promotion pending a second-instance forward-shadow OR a future codification ship.

## Forward path

- **v1.49.803 — Real token-budget observation source.** Wire the unwired `token_budget.warn_at_percent` observation source. Operator-chosen as the immediate next ship in this chained session.
- **T1.3 — College of Knowledge consumer engine** (3-5 ships).
- **NASA 1.179 forward-cadence** — INTERSTELLAR-BOUNDARY axis obs#3.
- **Audit-log query/report subcommand** — `bounded-learning log` with `--last N`, `--since <ts>`.
- **Strengthening Levers S3/S4/S6/S7.**

## Why codify now (vs at the next-next ship)

The T1.1 chained-session retrospective accumulated three independently-validated candidates in a single arc:

- #10426 had three consumer-side validations within the arc itself (v799 audit log, v800 watch loop, v801 summary) — the empirical evidence is unusually strong for a single-arc candidate.
- #10427 had three instance validations within the arc (v799-801) — again unusually strong for a single arc.
- #10425 had been candidate since v795 (six ships) without a forward-shadow second instance arriving — codification is the right promotion path per the standard precedent (v784 promoted 8 candidates with similar single-instance-but-long-aged evidence).

Aggregate evidence quality at session close meets the bar from v784 and v790 codification ships (5-8 candidates with mixed multi-instance and single-instance evidence). Closing the backlog now means the v802 codification narrative is coherent with the T1.1 arc retrospective (same chain produced the lessons and the codification).

## Discipline applications during this ship

- **#10412 (Recon-first as default)** — 15th consecutive forward application since v784 codification. ~5 min of recon on the existing disciplines.json structure + v784/v790 codification-ship release notes surfaced the natural 3-cluster grouping (1 extension + 2 new domains).
- **#10422 (Verdict-pattern surface separation)** — 12th forward application. Per-discipline doc separation kept the failure-mode-contracts surface independent of the architecture-retrofit-patterns surface, even though both touch retrofit patterns.
- **#10423 (Lightest wire that satisfies the verdict)** — 12th forward application. Resisted: a single mega-doc covering all three lessons; a separate "T1.1 lessons" umbrella; folding #10425 into Static-analysis tool authoring as the technically-lightest wire. Each rejected because the lessons are about *different* domains and the umbrella would have to be unwound.
- **#10424 (Adoption-refresh after bump-version)** — applied: T14 step 11 ordering correctly places adoption-refresh after bump-version. Ninth consecutive ship under the gate.
- **#10426 (newly promoted)** — applied implicitly: each new discipline is a new module-equivalent surface, and the per-class registry of disciplines.json already implements the second-instance abstraction extraction (v784 extracted at the 3rd class — Mission-package + Test + Ship-pipeline — but at the *codification-ship* level, this is the first ship where a candidate from the *same* codification chain validates the rule it promotes).
